import { PrivyClient } from "@privy-io/node";
import { Contract, Interface, JsonRpcProvider, Transaction, Wallet, ethers } from "ethers";
import { mkdir, writeFile } from "node:fs/promises";

const explorer = "https://testnet.arcscan.app/tx/";
const escrowAbi = [
  "function createTask(address seller,bytes32 intentHash,bytes32 policyHash,uint256 value) returns (uint256)",
  "function blockTask(uint256 taskId,bytes32 reasonHash)",
  "function submitResult(uint256 taskId,bytes32 resultHash)",
  "function verifyTaskBySignature(uint256 taskId,bool passed,bytes signature)",
  "function tasks(uint256 taskId) view returns (address buyer,address seller,uint256 value,bytes32 intentHash,bytes32 policyHash,bytes32 resultHash,uint8 state)",
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
  const provider = new JsonRpcProvider(rpc);
  const deployer = new Wallet(required("ARC_DEPLOYER_PRIVATE_KEY"), provider);
  const seller = new Wallet(required("ARC_SELLER_PRIVATE_KEY"), provider);
  const verifier = new Wallet(required("ARC_VERIFIER_PRIVATE_KEY"));
  const network = await provider.getNetwork();
  if (network.chainId !== chainId) throw new Error(`Arc chain mismatch: ${network.chainId}`);

  const privy = new PrivyClient({ appId, appSecret });
  const wallet = await privy.wallets().get(walletId);
  if (ethers.getAddress(wallet.address) !== walletAddress) throw new Error("Privy wallet address mismatch");
  if (!wallet.policy_ids.includes(policyId)) throw new Error("Privy policy is not attached to the live wallet");

  const escrowInterface = new Interface(escrowAbi);
  const tokenInterface = new Interface(tokenAbi);
  const token = new Contract(tokenAddress, tokenAbi, deployer);
  const escrow = new Contract(escrowAddress, escrowAbi, provider);
  const transactions: Record<string, { hash: string; blockNumber: number; explorer: string }> = {};
  const privyAuthorizations: Array<Record<string, unknown>> = [];

  async function mined(label: string, transaction: Awaited<ReturnType<Wallet["sendTransaction"]>>) {
    const receipt = await transaction.wait();
    if (!receipt || receipt.status !== 1) throw new Error(`${label}: Arc transaction failed`);
    const proof = { hash: transaction.hash, blockNumber: receipt.blockNumber, explorer: `${explorer}${transaction.hash}` };
    transactions[label] = proof;
    return receipt;
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
      idempotency_key: `ethonline-arc-failure-${label}-${Date.now()}`,
    });
    const parsed = Transaction.from(signed.signed_transaction);
    if (parsed.from?.toLowerCase() !== walletAddress.toLowerCase()) throw new Error(`${label}: unexpected Privy sender`);
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

  const nativeMinimum = ethers.parseEther("0.012");
  if (await provider.getBalance(walletAddress) < nativeMinimum) {
    await mined("fundPrivyGas", await deployer.sendTransaction({ to: walletAddress, value: ethers.parseEther("0.025") }));
  }
  if (await provider.getBalance(seller.address) < ethers.parseEther("0.006")) {
    await mined("fundSellerGas", await deployer.sendTransaction({ to: seller.address, value: ethers.parseEther("0.012") }));
  }

  const taskValue = 250_000n;
  const requiredUsdc = taskValue * 2n;
  const tokenBalance = await token.balanceOf(walletAddress) as bigint;
  if (tokenBalance < requiredUsdc) {
    await mined("fundPrivyUsdc", await token.transfer(walletAddress, requiredUsdc - tokenBalance));
  }
  const allowance = await token.allowance(walletAddress, escrowAddress) as bigint;
  if (allowance < requiredUsdc) {
    await privySignAndBroadcast("approveFailureBudget", tokenAddress, tokenInterface.encodeFunctionData("approve", [escrowAddress, requiredUsdc]));
  }

  async function createTask(label: string, intent: Record<string, unknown>) {
    const intentHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(intent)));
    const policyHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({
      maxValueUSDC: "5.000000",
      requireConfirmation: true,
      failureEvidenceRun: true,
    })));
    const receipt = await privySignAndBroadcast(
      label,
      escrowAddress,
      escrowInterface.encodeFunctionData("createTask", [seller.address, intentHash, policyHash, taskValue]),
    );
    const created = receipt.logs
      .map((log) => { try { return escrowInterface.parseLog(log); } catch { return null; } })
      .find((event) => event?.name === "TaskCreated");
    if (!created) throw new Error(`${label}: TaskCreated event missing`);
    return { taskId: created.args.taskId as bigint, intent, intentHash, policyHash };
  }

  const blocked = await createTask("createBlockedTask", {
    task: "YieldScout execution reservation",
    expectedOutcome: "BLOCKED",
    reason: "Policy drift detected before seller execution",
    buyerAgent: "TreasuryPlanner",
    sellerAgent: "YieldScout",
    valueUSDC: "0.250000",
  });
  const blockedReasonHash = ethers.id("risk_threshold_exceeded_before_seller_execution");
  await privySignAndBroadcast(
    "blockTask",
    escrowAddress,
    escrowInterface.encodeFunctionData("blockTask", [blocked.taskId, blockedReasonHash]),
  );

  const frozen = await createTask("createFrozenTask", {
    task: "YieldScout execution with independent output verification",
    expectedOutcome: "FROZEN",
    reason: "Seller output intentionally fails the independent verifier fixture",
    buyerAgent: "TreasuryPlanner",
    sellerAgent: "YieldScout",
    valueUSDC: "0.250000",
  });
  const badResult = {
    taskId: frozen.taskId.toString(),
    seller: seller.address,
    recommendation: "unbounded-position",
    maximumExposureUSDC: null,
    verificationFixture: "missing required bounded-risk fields",
  };
  const badResultHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(badResult)));
  await mined("submitBadResult", await seller.sendTransaction({
    to: escrowAddress,
    data: escrowInterface.encodeFunctionData("submitResult", [frozen.taskId, badResultHash]),
  }));
  const digest = ethers.keccak256(ethers.solidityPacked(
    ["uint256", "address", "uint256", "bool", "bytes32"],
    [chainId, escrowAddress, frozen.taskId, false, badResultHash],
  ));
  const signature = await verifier.signMessage(ethers.getBytes(digest));
  await mined("verifyAndFreeze", await deployer.sendTransaction({
    to: escrowAddress,
    data: escrowInterface.encodeFunctionData("verifyTaskBySignature", [frozen.taskId, false, signature]),
  }));

  const blockedState = Number((await escrow.tasks(blocked.taskId)).state);
  const frozenState = Number((await escrow.tasks(frozen.taskId)).state);
  if (blockedState !== 3) throw new Error(`blocked task state mismatch: ${blockedState}`);
  if (frozenState !== 4) throw new Error(`frozen task state mismatch: ${frozenState}`);

  const authorizationPayload = { provider: "Privy", walletId, walletAddress, policyId, authorizedTransactions: privyAuthorizations };
  const authorizationEvidenceHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(authorizationPayload)));
  const evidence = {
    evidenceVersion: "1",
    evidenceClass: "LIVE_TESTNET+LIVE_PRIVY_AUTHORIZATION",
    network: "Arc Testnet",
    chainId: chainId.toString(),
    contract: escrowAddress,
    settlementToken: tokenAddress,
    buyer: walletAddress,
    seller: seller.address,
    verifier: verifier.address,
    valuePerTask: taskValue.toString(),
    outcomes: {
      BLOCKED: {
        taskId: blocked.taskId.toString(),
        state: "BLOCKED",
        semantics: "Escrow reservation cancelled and refunded before seller execution.",
        intent: blocked.intent,
        intentHash: blocked.intentHash,
        policyHash: blocked.policyHash,
        reasonHash: blockedReasonHash,
        createTransaction: transactions.createBlockedTask,
        outcomeTransaction: transactions.blockTask,
      },
      FROZEN: {
        taskId: frozen.taskId.toString(),
        state: "FROZEN",
        semantics: "Seller executed, independent verifier rejected the output, and funds remain isolated.",
        intent: frozen.intent,
        intentHash: frozen.intentHash,
        policyHash: frozen.policyHash,
        badResult,
        resultHash: badResultHash,
        createTransaction: transactions.createFrozenTask,
        submitTransaction: transactions.submitBadResult,
        outcomeTransaction: transactions.verifyAndFreeze,
      },
    },
    privyAuthorization: { ...authorizationPayload, authorizationEvidenceHash },
    transactions,
    generatedAt: new Date().toISOString(),
  };
  const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(evidence)));
  await mkdir("evidence", { recursive: true });
  await writeFile("evidence/arc-testnet-live-failure-outcomes.json", `${JSON.stringify({ ...evidence, evidenceHash }, null, 2)}\n`);
  console.log(JSON.stringify({
    status: "LIVE_BLOCKED_AND_FROZEN_CREATED",
    blockedTaskId: blocked.taskId.toString(),
    frozenTaskId: frozen.taskId.toString(),
    authorizationEvidenceHash,
    evidenceHash,
    transactions,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
