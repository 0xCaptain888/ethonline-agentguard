import { ethers } from "hardhat";
import { BaseContract, ContractRunner, Log, LogDescription, TransactionResponse, Wallet } from "ethers";
import { writeFile } from "node:fs/promises";
import { queryGraphAgent } from "../src/ethonline/graph-agent.ts";
import { evaluatePolicy } from "../src/policy-engine.ts";

const explorer = "https://testnet.arcscan.app/tx/";

type ArcEscrow = Omit<BaseContract, "connect"> & {
  connect(runner: ContractRunner | null): ArcEscrow;
  createTask(sellerAddress: string, intentHash: string, policyHash: string, value: bigint): Promise<TransactionResponse>;
  submitResult(taskId: bigint, resultHash: string): Promise<TransactionResponse>;
  verifyTaskBySignature(taskId: bigint, passed: boolean, signature: string): Promise<TransactionResponse>;
};

async function mined(tx: { hash: string; wait(): Promise<{ status: number | null; blockNumber: number } | null> }) {
  const receipt = await tx.wait();
  if (!receipt || receipt.status !== 1) throw new Error(`transaction failed: ${tx.hash}`);
  return { hash: tx.hash, blockNumber: receipt.blockNumber, explorer: `${explorer}${tx.hash}` };
}

async function main() {
  const endpoint = process.env.GRAPH_SUBGRAPH_URL ?? process.env.GRAPH_STUDIO_QUERY_URL;
  const escrowAddress = process.env.ARC_ESCROW_ADDRESS;
  const tokenAddress = process.env.ARC_USDC_ADDRESS;
  const sellerKey = process.env.ARC_SELLER_PRIVATE_KEY;
  const verifierKey = process.env.ARC_VERIFIER_PRIVATE_KEY;
  if (!endpoint || !escrowAddress || !tokenAddress || !sellerKey || !verifierKey) throw new Error("Graph-driven Arc configuration is incomplete");
  const [buyer] = await ethers.getSigners();
  if (!buyer) throw new Error("ARC_DEPLOYER_PRIVATE_KEY is required");
  const seller = new Wallet(sellerKey, ethers.provider);
  const verifier = new Wallet(verifierKey);
  const query = `query YieldScoutSellerHistory($seller: Bytes!) {
    _meta { block { number hash } deployment hasIndexingErrors }
    protocolStats(id: "global") { tasks verified blocked frozen totalEscrowed totalReleased totalRefunded updatedAt }
    tasks(first: 20, orderBy: updatedAt, orderDirection: desc, where: { seller: $seller }) {
      taskId state value policyHash resultHash createdAt updatedAt createTx settlementTx
    }
  }`;
  const graphObservation = await queryGraphAgent(endpoint, query, { seller: seller.address.toLowerCase() });
  const graphData = graphObservation.data as {
    _meta?: { hasIndexingErrors?: boolean };
    tasks?: Array<{ state: string }>;
  };
  const history = graphData.tasks ?? [];
  const verified = history.filter((task) => task.state === "VERIFIED").length;
  const failed = history.filter((task) => task.state === "FROZEN" || task.state === "BLOCKED").length;
  const scored = verified + failed;
  const verifiedRate = scored === 0 ? 0 : verified / scored;
  const riskScore = Math.round((1 - verifiedRate) * 100);
  const policy = evaluatePolicy({
    valueWei: 1_000_000n,
    maxValueWei: 5_000_000n,
    dailySpentWei: 1_000_000n,
    dailyLimitWei: 10_000_000n,
    allowedSeller: history.length > 0 && verifiedRate >= 0.8,
    riskScore,
    maxRiskScore: 40,
    confirmationProvided: true,
    requireConfirmation: true,
  });
  if (graphData._meta?.hasIndexingErrors) throw new Error("The Graph reports indexing errors");
  if (policy.decision !== "ALLOW") throw new Error(`Graph-informed policy blocked: ${policy.reasons.join(",")}`);
  const escrow = await ethers.getContractAt("PolicyEscrowERC20", escrowAddress) as unknown as ArcEscrow;
  const token = new ethers.Contract(tokenAddress, ["function approve(address,uint256) returns (bool)"], buyer);
  const value = 1_000_000n;
  const transactions: Record<string, unknown> = {};
  transactions.approve = await mined(await token.approve(escrowAddress, value));
  const intent = {
    task: "YieldScout seller selection from live Arc task history",
    buyerAgent: "TreasuryPlanner",
    sellerAgent: "YieldScout",
    seller: seller.address,
    valueUSDC: "1.000000",
    graphEvidenceHash: graphObservation.evidenceHash,
    graphVerifiedRate: verifiedRate,
    graphHistoryCount: history.length,
    policyDecisionHash: policy.decisionHash,
  };
  const intentHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(intent)));
  const createTx = await escrow.connect(buyer).createTask(seller.address, intentHash, policy.policyHash, value);
  const createReceipt = await createTx.wait();
  if (!createReceipt || createReceipt.status !== 1) throw new Error("create task failed");
  transactions.createTask = { hash: createTx.hash, blockNumber: createReceipt.blockNumber, explorer: `${explorer}${createTx.hash}` };
  const created = createReceipt.logs.map((log: Log): LogDescription | null => { try { return escrow.interface.parseLog(log); } catch { return null; } }).find((event: LogDescription | null) => event?.name === "TaskCreated");
  if (!created) throw new Error("TaskCreated event missing");
  const taskId = created.args.taskId as bigint;
  const sellerResult = {
    recommendation: "hire",
    seller: seller.address,
    verifiedRate,
    riskScore,
    graphEvidenceHash: graphObservation.evidenceHash,
    taskId: taskId.toString(),
  };
  const resultHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(sellerResult)));
  transactions.submitResult = await mined(await escrow.connect(seller).submitResult(taskId, resultHash));
  const verification = {
    indexingHealthy: graphData._meta?.hasIndexingErrors === false,
    sellerHistoryPresent: history.length > 0,
    verifiedRateAccepted: verifiedRate >= 0.8,
    policyAllowed: policy.decision === "ALLOW",
    graphHashBound: sellerResult.graphEvidenceHash === graphObservation.evidenceHash,
    sellerBound: sellerResult.seller.toLowerCase() === seller.address.toLowerCase(),
  };
  const passed = Object.values(verification).every(Boolean);
  const network = await ethers.provider.getNetwork();
  const digest = ethers.keccak256(ethers.solidityPacked(
    ["uint256", "address", "uint256", "bool", "bytes32"],
    [network.chainId, escrowAddress, taskId, passed, resultHash],
  ));
  const signature = await verifier.signMessage(ethers.getBytes(digest));
  transactions.verifyAndRelease = await mined(await escrow.connect(buyer).verifyTaskBySignature(taskId, passed, signature));
  const evidence = {
    evidenceVersion: "1",
    evidenceClass: "LIVE_TESTNET+LIVE_EXTERNAL_DATA",
    network: "Arc Testnet",
    chainId: network.chainId.toString(),
    contract: escrowAddress,
    settlementToken: tokenAddress,
    buyer: buyer.address,
    seller: seller.address,
    verifier: verifier.address,
    taskId: taskId.toString(),
    state: passed ? "VERIFIED" : "FROZEN",
    value: value.toString(),
    graphObservation,
    sellerScore: { historyCount: history.length, verified, failed, verifiedRate, riskScore },
    policy,
    intent,
    intentHash,
    sellerResult,
    resultHash,
    independentVerification: verification,
    transactions,
    generatedAt: new Date().toISOString(),
  };
  const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(evidence)));
  await writeFile("evidence/arc-testnet-graph-driven-task.json", `${JSON.stringify({ ...evidence, evidenceHash }, null, 2)}\n`);
  console.log(JSON.stringify({ state: evidence.state, taskId: taskId.toString(), graphEvidenceHash: graphObservation.evidenceHash, evidenceHash, sellerScore: evidence.sellerScore, transactions }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
