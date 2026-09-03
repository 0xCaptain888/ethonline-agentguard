import { ethers } from "hardhat";
import type { ContractTransactionResponse, TransactionReceipt } from "ethers";
import { mkdir, writeFile } from "node:fs/promises";
import type { MonadAgentGuard } from "../typechain-types/index.js";
import { fetchYieldScoutReport, verifyYieldScoutReport } from "../src/yieldscout";

const contractAddress = "0xee84007f8618c2c38Be8C45E8050144EbF00CE4a";
const expectedBuyer = "0xD71cf4282466b2197AC69ad027Fd64270a4C2D9E";
const registerTxHash = "0xc596f2fe6be76e03b3f5b6874e9240cfa6a390b30b1db8198c169313a8242fb5";
const policyTxHash = "0x91d03eddf640e915942d66321cfa997a1d9e379bff69231c31a388473bcf568b";
const verifierTxHash = "0xb6b333beb2dc1c9d90b779c617a3c74cf059c076d6c2130e27d6c148ca23f40f";
const createTaskTxHash = "0x6b0875f20eb4fe43b134a46f2740bce03193de1a58e962c6e0845f5a70b87927";

type TransactionEvidence = {
  hash: string;
  blockNumber: number;
  status: number;
  gasUsed: string;
  explorerUrl: string;
};

function receiptEvidence(hash: string, receipt: TransactionReceipt): TransactionEvidence {
  if (receipt.status !== 1) throw new Error(`Transaction failed: ${hash}`);
  return {
    hash,
    blockNumber: receipt.blockNumber,
    status: receipt.status,
    gasUsed: receipt.gasUsed.toString(),
    explorerUrl: `https://testnet.monadexplorer.com/tx/${hash}`,
  };
}

async function existingTransaction(hash: string): Promise<TransactionEvidence> {
  const receipt = await ethers.provider.getTransactionReceipt(hash);
  if (!receipt) throw new Error(`Missing receipt: ${hash}`);
  return receiptEvidence(hash, receipt);
}

async function newTransaction(tx: ContractTransactionResponse): Promise<TransactionEvidence> {
  const receipt = await tx.wait();
  if (!receipt) throw new Error(`Missing receipt: ${tx.hash}`);
  return receiptEvidence(tx.hash, receipt);
}

async function main() {
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 10143n) throw new Error(`Refusing to run on chain ${network.chainId}`);

  const taskId = BigInt(process.env.METAMASK_TASK_ID ?? "56");
  const sellerKey = process.env.SELLER_PRIVATE_KEY;
  const verifierKey = process.env.VERIFIER_PRIVATE_KEY;
  if (!sellerKey) throw new Error("SELLER_PRIVATE_KEY is required");
  if (!verifierKey) throw new Error("VERIFIER_PRIVATE_KEY is required");

  const [relayer] = await ethers.getSigners();
  const seller = new ethers.Wallet(sellerKey, ethers.provider);
  const verifier = new ethers.Wallet(verifierKey, ethers.provider);
  const guard = (await ethers.getContractAt("MonadAgentGuard", contractAddress)) as unknown as MonadAgentGuard;
  const task = await guard.tasks(taskId);

  if (ethers.getAddress(task.buyer) !== ethers.getAddress(expectedBuyer)) throw new Error(`Unexpected buyer: ${task.buyer}`);
  if (ethers.getAddress(task.seller) !== seller.address) throw new Error(`Unexpected seller: ${task.seller}`);
  if (Number(task.state) !== 0) throw new Error(`Task ${taskId} is not OPEN; state=${task.state}`);
  if (ethers.getAddress(await guard.verifiers(task.buyer)) !== verifier.address) throw new Error("Independent verifier binding mismatch");

  const report = await fetchYieldScoutReport();
  const reportVerification = verifyYieldScoutReport(report);
  if (!reportVerification.passed) throw new Error(`YieldScout report failed: ${reportVerification.reasons.join(", ")}`);

  const transactions: Record<string, TransactionEvidence> = {
    metamaskRegisterAgent: await existingTransaction(registerTxHash),
    metamaskSetPolicy: await existingTransaction(policyTxHash),
    metamaskSetVerifier: await existingTransaction(verifierTxHash),
    metamaskCreateTask: await existingTransaction(createTaskTxHash),
  };

  transactions.sellerSubmitResult = await newTransaction(
    await guard.connect(seller).submitResult(taskId, report.resultHash),
  );

  const verificationDigest = ethers.keccak256(
    ethers.solidityPacked(
      ["uint256", "address", "uint256", "bool", "bytes32"],
      [network.chainId, contractAddress, taskId, true, report.resultHash],
    ),
  );
  const verifierSignature = await verifier.signMessage(ethers.getBytes(verificationDigest));
  transactions.independentVerifyAndRelease = await newTransaction(
    await guard.connect(relayer).verifyTaskBySignature(taskId, true, verifierSignature),
  );

  const settledTask = await guard.tasks(taskId);
  if (Number(settledTask.state) !== 2) throw new Error(`Expected VERIFIED state, got ${settledTask.state}`);
  if (settledTask.resultHash.toLowerCase() !== report.resultHash.toLowerCase()) throw new Error("On-chain result hash mismatch");

  const evidencePayload = {
    evidenceVersion: "1",
    evidenceClass: "LIVE_METAMASK_AGENT_WALLET_MONAD_TASK",
    network: "Monad Testnet",
    chainId: Number(network.chainId),
    contract: contractAddress,
    taskId: taskId.toString(),
    taskType: "YieldScout external liquidity report",
    state: "VERIFIED",
    onchainState: Number(settledTask.state),
    buyer: task.buyer,
    buyerWallet: {
      product: "MetaMask Agent Wallet",
      mode: "BYOK guard",
      address: task.buyer,
      credentialBoundary: "Wallet authorization remained outside this repository",
    },
    seller: task.seller,
    verifier: verifier.address,
    relayer: relayer.address,
    value: task.value.toString(),
    intentHash: task.intentHash,
    policyHash: task.policyHash,
    resultHash: report.resultHash,
    externalSource: report.source,
    agentReport: report,
    reportVerification,
    verificationDigest,
    transactions,
  };
  const evidenceHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(evidencePayload)));
  const evidence = { ...evidencePayload, evidenceHash, generatedAt: new Date().toISOString() };

  await mkdir("evidence", { recursive: true });
  await writeFile(`evidence/testnet-task-${taskId}.json`, `${JSON.stringify(evidence, null, 2)}\n`);
  await writeFile("evidence/metamask-agent-wallet-live.json", `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
