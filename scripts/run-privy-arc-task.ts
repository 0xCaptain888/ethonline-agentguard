import { PrivyClient } from "@privy-io/node";
import { Contract, Interface, JsonRpcProvider, Transaction, Wallet, ethers } from "ethers";
import { mkdir, writeFile } from "node:fs/promises";
import { queryGraphAgent } from "../src/ethonline/graph-agent.js";
import { evaluatePolicy } from "../src/policy-engine.js";

const explorer = "https://testnet.arcscan.app/tx/";
const escrowAbi = [
  "function registerAgent(bytes32 metadataHash)",
  "function setPolicy(uint256 maxValue,bool requireConfirmation)",
  "function setVerifier(address verifier)",
  "function createTask(address seller,bytes32 intentHash,bytes32 policyHash,uint256 value) returns (uint256)",
  "function submitResult(uint256 taskId,bytes32 resultHash)",
  "function verifyTaskBySignature(uint256 taskId,bool passed,bytes signature)",
  "event TaskCreated(uint256 indexed taskId,address indexed buyer,address indexed seller,uint256 value,bytes32 intentHash,bytes32 policyHash)",
];
const tokenAbi = [
  "function balanceOf(address) view returns (uint256)",
  "function allowance(address,address) view returns (uint256)",
  "function transfer(address,uint256) returns (bool)",
  "function approve(address,uint256) returns (bool)",
];

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function main() {
  const appId = required("PRIVY_APP_ID");
  const appSecret = required("PRIVY_APP_SECRET");
  const authorizationKey = required("PRIVY_AUTHORIZATION_PRIVATE_KEY");
  const policyId = required("PRIVY_POLICY_ID");
  const walletId = required("PRIVY_LIVE_WALLET_ID");
  const walletAddress = ethers.getAddress(required("PRIVY_LIVE_WALLET_ADDRESS"));
  const rpc = required("ARC_RPC_URL");
  const chainId = BigInt(required("ARC_CHAIN_ID"));
  const escrowAddress = ethers.getAddress(required("ARC_ESCROW_ADDRESS"));
  const tokenAddress = ethers.getAddress(required("ARC_USDC_ADDRESS"));
  const deployer = new Wallet(required("ARC_DEPLOYER_PRIVATE_KEY"), new JsonRpcProvider(rpc));
  const seller = new Wallet(required("ARC_SELLER_PRIVATE_KEY"), deployer.provider);
  const verifier = new Wallet(required("ARC_VERIFIER_PRIVATE_KEY"));
  const graphEndpoint = required("GRAPH_SUBGRAPH_URL");
  const provider = deployer.provider as JsonRpcProvider;
  const network = await provider.getNetwork();
  if (network.chainId !== chainId) throw new Error(`Arc chain mismatch: ${network.chainId}`);

  const privy = new PrivyClient({ appId, appSecret });
  const wallet = await privy.wallets().get(walletId);
  if (ethers.getAddress(wallet.address) !== walletAddress) throw new Error("Privy wallet address mismatch");
  if (!wallet.policy_ids.includes(policyId)) throw new Error("Privy policy is not attached to the live wallet");

  const escrowInterface = new Interface(escrowAbi);
  const tokenInterface = new Interface(tokenAbi);
  const token = new Contract(tokenAddress, tokenAbi, deployer);
  const transactions: Record<string, unknown> = {};
  const privyAuthorizations: Array<Record<string, unknown>> = [];

  const nativeMinimum = ethers.parseEther("0.03");
  const nativeBalance = await provider.getBalance(walletAddress);
  if (nativeBalance < nativeMinimum) {
    const tx = await deployer.sendTransaction({ to: walletAddress, value: ethers.parseEther("0.05") });
    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) throw new Error("Privy wallet gas funding failed");
    transactions.fundPrivyGas = { hash: tx.hash, blockNumber: receipt.blockNumber, explorer: `${explorer}${tx.hash}` };
  }
  const taskValue = 1_000_000n;
  const tokenMinimum = 2_000_000n;
  const tokenBalance = await token.balanceOf(walletAddress) as bigint;
  if (tokenBalance < tokenMinimum) {
    const tx = await token.transfer(walletAddress, tokenMinimum - tokenBalance);
    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) throw new Error("Privy wallet USDC funding failed");
    transactions.fundPrivyUsdc = { hash: tx.hash, blockNumber: receipt.blockNumber, explorer: `${explorer}${tx.hash}` };
  }

  async function privySignAndBroadcast(label: string, to: string, data: string) {
    const nonce = await provider.getTransactionCount(walletAddress, "pending");
    const gasEstimate = await provider.estimateGas({ from: walletAddress, to, data, value: 0n });
    const fee = await provider.getFeeData();
    const unsigned = {
      from: walletAddress,
      to,
      data,
      value: "0x0",
      nonce,
      chain_id: Number(chainId),
      gas_limit: ethers.toQuantity(gasEstimate * 120n / 100n),
      type: 2 as const,
      max_fee_per_gas: ethers.toQuantity(fee.maxFeePerGas ?? 1n),
      max_priority_fee_per_gas: ethers.toQuantity(fee.maxPriorityFeePerGas ?? 1n),
    };
    const signed = await privy.wallets().ethereum().signTransaction(walletId, {
      params: { transaction: unsigned },
      authorization_context: { authorization_private_keys: [authorizationKey] },
      idempotency_key: `ethonline-arc-${label}-${Date.now()}`,
    });
    const parsed = Transaction.from(signed.signed_transaction);
    if (parsed.from?.toLowerCase() !== walletAddress.toLowerCase()) throw new Error(`${label}: Privy signed with an unexpected sender`);
    const broadcast = await provider.broadcastTransaction(signed.signed_transaction);
    const receipt = await broadcast.wait();
    if (!receipt || receipt.status !== 1) throw new Error(`${label}: Arc transaction failed`);
    const proof = { hash: broadcast.hash, blockNumber: receipt.blockNumber, explorer: `${explorer}${broadcast.hash}` };
    transactions[label] = proof;
    privyAuthorizations.push({
      label,
      provider: "Privy",
      method: "eth_signTransaction",
      walletId,
      policyId,
      chainId: chainId.toString(),
      target: to,
      sender: parsed.from,
      transactionHash: broadcast.hash,
    });
    return receipt;
  }

  const graphQuery = `query PrivyBuyerTask($seller: Bytes!) {
    _meta { block { number hash } deployment hasIndexingErrors }
    tasks(first: 20, orderBy: updatedAt, orderDirection: desc, where: { seller: $seller }) {
      taskId state value createTx settlementTx
    }
  }`;
  const graphObservation = await queryGraphAgent(graphEndpoint, graphQuery, { seller: seller.address.toLowerCase() });
  const graphData = graphObservation.data as { _meta?: { hasIndexingErrors?: boolean }; tasks?: Array<{ state: string }> };
  const history = graphData.tasks ?? [];
  const verifiedCount = history.filter((task) => task.state === "VERIFIED").length;
  const verifiedRate = history.length === 0 ? 0 : verifiedCount / history.length;
  const riskScore = Math.round((1 - verifiedRate) * 100);
  const policy = evaluatePolicy({
    valueWei: taskValue,
    maxValueWei: 5_000_000n,
    dailySpentWei: 2_000_000n,
    dailyLimitWei: 10_000_000n,
    allowedSeller: history.length > 0 && verifiedRate >= 0.8,
    riskScore,
    maxRiskScore: 40,
    confirmationProvided: true,
    requireConfirmation: true,
  });
  if (graphData._meta?.hasIndexingErrors) throw new Error("The Graph reports indexing errors");
  if (policy.decision !== "ALLOW") throw new Error(`Graph-informed policy blocked: ${policy.reasons.join(",")}`);

  const metadataHash = ethers.id("TreasuryPlanner:Privy:Arc:v1");
  await privySignAndBroadcast("registerAgent", escrowAddress, escrowInterface.encodeFunctionData("registerAgent", [metadataHash]));
  await privySignAndBroadcast("setPolicy", escrowAddress, escrowInterface.encodeFunctionData("setPolicy", [5_000_000n, true]));
  await privySignAndBroadcast("setVerifier", escrowAddress, escrowInterface.encodeFunctionData("setVerifier", [verifier.address]));
  const allowance = await token.allowance(walletAddress, escrowAddress) as bigint;
  if (allowance < taskValue) {
    await privySignAndBroadcast("approve", tokenAddress, tokenInterface.encodeFunctionData("approve", [escrowAddress, taskValue]));
  }

  const intent = {
    task: "Privy-authorized YieldScout hire on Arc",
    buyerAgent: "TreasuryPlanner",
    sellerAgent: "YieldScout",
    buyerWallet: walletAddress,
    privyWalletId: walletId,
    privyPolicyId: policyId,
    valueUSDC: "1.000000",
    graphEvidenceHash: graphObservation.evidenceHash,
    graphHistoryCount: history.length,
    graphVerifiedRate: verifiedRate,
    policyDecisionHash: policy.decisionHash,
  };
  const intentHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(intent)));
  const createReceipt = await privySignAndBroadcast(
    "createTask",
    escrowAddress,
    escrowInterface.encodeFunctionData("createTask", [seller.address, intentHash, policy.policyHash, taskValue]),
  );
  const created = createReceipt.logs
    .map((log) => { try { return escrowInterface.parseLog(log); } catch { return null; } })
    .find((event) => event?.name === "TaskCreated");
  if (!created) throw new Error("TaskCreated event missing");
  const taskId = created.args.taskId as bigint;

  const sellerResult = {
    recommendation: "hire",
    taskId: taskId.toString(),
    seller: seller.address,
    graphEvidenceHash: graphObservation.evidenceHash,
    verifiedRate,
    riskScore,
    privyAuthorizedBuyer: walletAddress,
  };
  const resultHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(sellerResult)));
  const submitTx = await seller.sendTransaction({
    to: escrowAddress,
    data: escrowInterface.encodeFunctionData("submitResult", [taskId, resultHash]),
  });
  const submitReceipt = await submitTx.wait();
  if (!submitReceipt || submitReceipt.status !== 1) throw new Error("seller result submission failed");
  transactions.submitResult = { hash: submitTx.hash, blockNumber: submitReceipt.blockNumber, explorer: `${explorer}${submitTx.hash}` };

  const verification = {
    indexingHealthy: graphData._meta?.hasIndexingErrors === false,
    sellerHistoryPresent: history.length > 0,
    verifiedRateAccepted: verifiedRate >= 0.8,
    policyAllowed: policy.decision === "ALLOW",
    graphHashBound: sellerResult.graphEvidenceHash === graphObservation.evidenceHash,
    privyBuyerBound: sellerResult.privyAuthorizedBuyer.toLowerCase() === walletAddress.toLowerCase(),
    privyPolicyBound: wallet.policy_ids.includes(policyId),
  };
  const passed = Object.values(verification).every(Boolean);
  const digest = ethers.keccak256(ethers.solidityPacked(
    ["uint256", "address", "uint256", "bool", "bytes32"],
    [chainId, escrowAddress, taskId, passed, resultHash],
  ));
  const signature = await verifier.signMessage(ethers.getBytes(digest));
  const verifyTx = await deployer.sendTransaction({
    to: escrowAddress,
    data: escrowInterface.encodeFunctionData("verifyTaskBySignature", [taskId, passed, signature]),
  });
  const verifyReceipt = await verifyTx.wait();
  if (!verifyReceipt || verifyReceipt.status !== 1) throw new Error("independent verification failed");
  transactions.verifyAndRelease = { hash: verifyTx.hash, blockNumber: verifyReceipt.blockNumber, explorer: `${explorer}${verifyTx.hash}` };

  const authorizationPayload = {
    provider: "Privy",
    walletId,
    walletAddress,
    policyId,
    method: "eth_signTransaction",
    authorizedTransactions: privyAuthorizations,
  };
  const authorizationEvidenceHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(authorizationPayload)));
  const evidence = {
    evidenceVersion: "1",
    evidenceClass: "LIVE_TESTNET+LIVE_EXTERNAL_DATA+LIVE_PRIVY_AUTHORIZATION",
    network: "Arc Testnet",
    chainId: chainId.toString(),
    contract: escrowAddress,
    settlementToken: tokenAddress,
    buyer: walletAddress,
    seller: seller.address,
    verifier: verifier.address,
    taskId: taskId.toString(),
    state: passed ? "VERIFIED" : "FROZEN",
    value: taskValue.toString(),
    graphObservation,
    policy,
    intent,
    intentHash,
    sellerResult,
    resultHash,
    independentVerification: verification,
    privyAuthorization: { ...authorizationPayload, authorizationEvidenceHash },
    transactions,
    generatedAt: new Date().toISOString(),
  };
  const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(evidence)));
  await mkdir("evidence", { recursive: true });
  await writeFile("evidence/arc-testnet-privy-authorized-task.json", `${JSON.stringify({ ...evidence, evidenceHash }, null, 2)}\n`);
  console.log(JSON.stringify({
    state: evidence.state,
    taskId: taskId.toString(),
    privyWallet: walletAddress,
    privyPolicyId: policyId,
    authorizationEvidenceHash,
    graphEvidenceHash: graphObservation.evidenceHash,
    evidenceHash,
    transactions,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
