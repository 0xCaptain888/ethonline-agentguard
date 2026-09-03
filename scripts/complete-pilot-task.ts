import { ethers } from "hardhat";
import type { ContractTransactionResponse, TransactionReceipt } from "ethers";
import { mkdir, writeFile } from "node:fs/promises";
import type { MonadAgentGuard } from "../typechain-types/index.js";
import { fetchYieldScoutReport, verifyYieldScoutReport } from "../src/yieldscout";
import { fetchChainSentinelReport, verifyChainSentinelReport } from "../src/chainsentinel";

const contractAddress = "0xee84007f8618c2c38Be8C45E8050144EbF00CE4a";

function transactionEvidence(hash: string, receipt: TransactionReceipt) {
  if (receipt.status !== 1) throw new Error(`Transaction failed: ${hash}`);
  return {
    hash,
    blockNumber: receipt.blockNumber,
    status: receipt.status,
    gasUsed: receipt.gasUsed.toString(),
    explorerUrl: `https://testnet.monadexplorer.com/tx/${hash}`,
  };
}

async function mined(tx: ContractTransactionResponse) {
  const receipt = await tx.wait();
  if (!receipt) throw new Error(`Missing receipt: ${tx.hash}`);
  return transactionEvidence(tx.hash, receipt);
}

async function main() {
  const taskIdText = process.env.PILOT_TASK_ID;
  const createHash = process.env.PILOT_CREATE_TX;
  const expectedBuyerText = process.env.PILOT_BUYER;
  const workload = (process.env.PILOT_WORKLOAD ?? "yieldscout").toLowerCase();
  const sellerKey = process.env.SELLER_PRIVATE_KEY;
  const verifierKey = process.env.VERIFIER_PRIVATE_KEY;
  if (!taskIdText || !/^\d+$/.test(taskIdText)) throw new Error("PILOT_TASK_ID is required and must be numeric");
  if (!createHash || !/^0x[0-9a-fA-F]{64}$/.test(createHash)) throw new Error("PILOT_CREATE_TX is required");
  if (!expectedBuyerText || !ethers.isAddress(expectedBuyerText)) throw new Error("PILOT_BUYER is required");
  if (!sellerKey || !verifierKey) throw new Error("SELLER_PRIVATE_KEY and VERIFIER_PRIVATE_KEY are required");
  if (!["yieldscout", "chainsentinel"].includes(workload)) throw new Error("PILOT_WORKLOAD must be yieldscout or chainsentinel");

  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 10143n) throw new Error(`Refusing to run on chain ${network.chainId}`);
  const taskId = BigInt(taskIdText);
  const expectedBuyer = ethers.getAddress(expectedBuyerText);
  const [relayer] = await ethers.getSigners();
  const seller = new ethers.Wallet(sellerKey, ethers.provider);
  const verifier = new ethers.Wallet(verifierKey, ethers.provider);
  const guard = (await ethers.getContractAt("MonadAgentGuard", contractAddress)) as unknown as MonadAgentGuard;
  const task = await guard.tasks(taskId);
  if (Number(task.state) !== 0) throw new Error(`Task ${taskId} is not OPEN; state=${task.state}`);
  if (ethers.getAddress(task.buyer) !== expectedBuyer) throw new Error("Task buyer does not match the pilot submission");
  if (ethers.getAddress(task.seller) !== seller.address) throw new Error("Task does not use the published seller");
  if (ethers.getAddress(await guard.verifiers(task.buyer)) !== verifier.address) throw new Error("Independent verifier binding mismatch");

  const createReceipt = await ethers.provider.getTransactionReceipt(createHash);
  if (!createReceipt || createReceipt.to?.toLowerCase() !== contractAddress.toLowerCase()) throw new Error("Creation receipt does not target AgentGuard");
  const created = createReceipt.logs.some((log) => {
    try {
      const event = guard.interface.parseLog({ topics: [...log.topics], data: log.data });
      return event?.name === "TaskCreated" && event.args.taskId === taskId && ethers.getAddress(event.args.buyer) === expectedBuyer;
    } catch { return false; }
  });
  if (!created) throw new Error("Creation transaction does not contain the submitted task/buyer event");

  const report = workload === "yieldscout"
    ? await fetchYieldScoutReport()
    : await fetchChainSentinelReport(ethers.provider);
  const reportVerification = workload === "yieldscout"
    ? verifyYieldScoutReport(report)
    : verifyChainSentinelReport(report);
  if (!reportVerification.passed) throw new Error(`External report failed: ${reportVerification.reasons.join(", ")}`);

  const transactions = {
    buyerCreateTask: transactionEvidence(createHash, createReceipt),
    sellerSubmitResult: await mined(await guard.connect(seller).submitResult(taskId, report.resultHash)),
    independentVerifyAndRelease: undefined as ReturnType<typeof transactionEvidence> | undefined,
  };
  const digest = ethers.keccak256(ethers.solidityPacked(
    ["uint256", "address", "uint256", "bool", "bytes32"],
    [network.chainId, contractAddress, taskId, true, report.resultHash],
  ));
  const signature = await verifier.signMessage(ethers.getBytes(digest));
  transactions.independentVerifyAndRelease = await mined(
    await guard.connect(relayer).verifyTaskBySignature(taskId, true, signature),
  );

  const settled = await guard.tasks(taskId);
  if (Number(settled.state) !== 2 || settled.resultHash.toLowerCase() !== report.resultHash.toLowerCase()) throw new Error("Final task state/result mismatch");
  const payload = {
    evidenceVersion: "1",
    evidenceClass: "LIVE_EXTERNAL_PILOT_TASK",
    network: "Monad Testnet",
    chainId: Number(network.chainId),
    contract: contractAddress,
    taskId: taskId.toString(),
    workload,
    state: "VERIFIED",
    buyer: task.buyer,
    seller: task.seller,
    verifier: verifier.address,
    value: task.value.toString(),
    intentHash: task.intentHash,
    policyHash: task.policyHash,
    resultHash: report.resultHash,
    agentReport: report,
    reportVerification,
    transactions,
  };
  const evidence = {
    ...payload,
    evidenceHash: ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(payload))),
    generatedAt: new Date().toISOString(),
  };
  await mkdir("evidence", { recursive: true });
  await writeFile(`evidence/external-pilot-task-${taskId}.json`, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify({ state: evidence.state, taskId: evidence.taskId, buyer: evidence.buyer, resultHash: evidence.resultHash, evidenceHash: evidence.evidenceHash, receipt: `evidence/external-pilot-task-${taskId}.json` }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
