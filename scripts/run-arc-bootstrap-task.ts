import { ethers } from "hardhat";
import { BaseContract, ContractRunner, Log, LogDescription, TransactionResponse, Wallet } from "ethers";
import { mkdir, writeFile } from "node:fs/promises";

const explorer = "https://testnet.arcscan.app/tx/";

type ArcEscrow = Omit<BaseContract, "connect"> & {
  connect(runner: ContractRunner | null): ArcEscrow;
  registerAgent(metadataHash: string): Promise<TransactionResponse>;
  setPolicy(maxValue: bigint, requireConfirmation: boolean): Promise<TransactionResponse>;
  setVerifier(verifierAddress: string): Promise<TransactionResponse>;
  createTask(sellerAddress: string, intentHash: string, policyHash: string, value: bigint): Promise<TransactionResponse>;
  submitResult(taskId: bigint, resultHash: string): Promise<TransactionResponse>;
  verifyTaskBySignature(taskId: bigint, passed: boolean, signature: string): Promise<TransactionResponse>;
};

async function wait(tx: Awaited<ReturnType<Wallet["sendTransaction"]>>) {
  const receipt = await tx.wait();
  if (!receipt || receipt.status !== 1) throw new Error(`transaction failed: ${tx.hash}`);
  return { hash: tx.hash, blockNumber: receipt.blockNumber, explorer: `${explorer}${tx.hash}` };
}

async function main() {
  const escrowAddress = process.env.ARC_ESCROW_ADDRESS;
  const tokenAddress = process.env.ARC_USDC_ADDRESS;
  const sellerKey = process.env.ARC_SELLER_PRIVATE_KEY;
  const verifierKey = process.env.ARC_VERIFIER_PRIVATE_KEY;
  if (!escrowAddress || !tokenAddress || !sellerKey || !verifierKey) throw new Error("Arc task configuration is incomplete");
  const [buyer] = await ethers.getSigners();
  if (!buyer) throw new Error("ARC_DEPLOYER_PRIVATE_KEY is required");
  const seller = new Wallet(sellerKey, ethers.provider);
  const verifier = new Wallet(verifierKey);
  const escrow = await ethers.getContractAt("PolicyEscrowERC20", escrowAddress) as unknown as ArcEscrow;
  const token = new ethers.Contract(tokenAddress, [
    "function balanceOf(address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
  ], buyer);
  const transactions: Record<string, unknown> = {};
  const sellerGas = await ethers.provider.getBalance(seller.address);
  if (sellerGas < ethers.parseEther("0.02")) {
    transactions.fundSeller = await wait(await buyer.sendTransaction({ to: seller.address, value: ethers.parseEther("0.05") }));
  }
  transactions.registerBuyer = await wait(await escrow.connect(buyer).registerAgent(ethers.id("TreasuryPlanner:Arc:v1")));
  transactions.registerSeller = await wait(await escrow.connect(seller).registerAgent(ethers.id("YieldScout:Arc:v1")));
  const value = 1_000_000n;
  transactions.setPolicy = await wait(await escrow.connect(buyer).setPolicy(5_000_000n, true));
  transactions.setVerifier = await wait(await escrow.connect(buyer).setVerifier(verifier.address));
  if (await token.balanceOf(buyer.address) < value) throw new Error("buyer has insufficient Arc USDC");
  transactions.approve = await wait(await token.approve(escrowAddress, value));
  const intent = {
    task: "Bootstrap YieldScout seller reliability history",
    buyerAgent: "TreasuryPlanner",
    sellerAgent: "YieldScout",
    valueUSDC: "1.000000",
    evidenceClass: "LIVE_TESTNET",
  };
  const intentHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(intent)));
  const policyHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify({ maxValue: "5.000000", requireConfirmation: true })));
  const createTx = await escrow.connect(buyer).createTask(seller.address, intentHash, policyHash, value);
  const createReceipt = await createTx.wait();
  if (!createReceipt || createReceipt.status !== 1) throw new Error("create task failed");
  transactions.createTask = { hash: createTx.hash, blockNumber: createReceipt.blockNumber, explorer: `${explorer}${createTx.hash}` };
  const created = createReceipt.logs.map((log: Log): LogDescription | null => { try { return escrow.interface.parseLog(log); } catch { return null; } }).find((event: LogDescription | null) => event?.name === "TaskCreated");
  if (!created) throw new Error("TaskCreated event missing");
  const taskId = created.args.taskId as bigint;
  const sellerResult = { recommendation: "bootstrap-complete", source: "Arc Testnet", taskId: taskId.toString() };
  const resultHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(sellerResult)));
  transactions.submitResult = await wait(await escrow.connect(seller).submitResult(taskId, resultHash));
  const network = await ethers.provider.getNetwork();
  const digest = ethers.keccak256(ethers.solidityPacked(
    ["uint256", "address", "uint256", "bool", "bytes32"],
    [network.chainId, escrowAddress, taskId, true, resultHash],
  ));
  const signature = await verifier.signMessage(ethers.getBytes(digest));
  transactions.verifyAndRelease = await wait(await escrow.connect(buyer).verifyTaskBySignature(taskId, true, signature));
  const evidence = {
    evidenceVersion: "1",
    evidenceClass: "LIVE_TESTNET",
    network: "Arc Testnet",
    chainId: network.chainId.toString(),
    contract: escrowAddress,
    settlementToken: tokenAddress,
    buyer: buyer.address,
    seller: seller.address,
    verifier: verifier.address,
    taskId: taskId.toString(),
    state: "VERIFIED",
    value: value.toString(),
    intent,
    intentHash,
    policyHash,
    sellerResult,
    resultHash,
    transactions,
    generatedAt: new Date().toISOString(),
  };
  const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(evidence)));
  await mkdir("evidence", { recursive: true });
  await writeFile("evidence/arc-testnet-bootstrap-task.json", `${JSON.stringify({ ...evidence, evidenceHash }, null, 2)}\n`);
  console.log(JSON.stringify({ state: "VERIFIED", taskId: taskId.toString(), evidenceHash, transactions }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
