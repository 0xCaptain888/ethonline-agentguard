import { readFile } from "node:fs/promises";

type AgentEntry = { name: string; taskId: string; state: string; resultHash: string; evidenceHash: string; verificationTx: string };

async function main() {
  const manifest = JSON.parse(await readFile("evidence/judge-manifest.json", "utf8")) as {
    manifestVersion: string; chainId: number; contract: string; agents: AgentEntry[];
    interactiveJudgeConsole: { url: string; blockedBeforeWrite: boolean; writes: string[] };
    endToEndBenchmark: { evidenceFile: string; pipelines: number; verified: number; transactions: number; averageEndToEndMs: number; p50EndToEndMs: number; p95EndToEndMs: number; averageTotalGas: string };
    parallelV2: { contract: string; deploymentTx: string; deploymentEvidence: string; verifiedSource: string; verificationStatus: string; benchmarkEvidence: string; architecture: string; pipelines: number; lanes: number; verified: number; transactions: number; maxCreatesInSingleBlock: number; maxSubmitsInSingleBlock: number; maxVerifiesInSingleBlock: number };
    taskCreationBaseline: { tasks: number; successRate: number; averageLatencyMs: number; averageGas: number };
    sponsorIntegration: { name: string; path: string; verifyCommand: string; status: string; broadcastClaimed: boolean; liveTaskId: string; evidenceFile: string; buyerAddress: string; createTaskTx: string; verificationTx: string };
  };
  if (manifest.manifestVersion !== "1" || manifest.chainId !== 10143) throw new Error("unsupported judge manifest");
  const checks: Array<{ agent: string; taskId: string; passed: boolean }> = [];
  for (const agent of manifest.agents.filter((entry) => entry.taskId)) {
    const receipt = JSON.parse(await readFile(`evidence/testnet-task-${agent.taskId}.json`, "utf8")) as any;
    const verificationTx = receipt.transactions?.verifyTask?.hash
      ?? receipt.transactions?.independentVerifyAndRelease?.hash;
    const passed = receipt.contract.toLowerCase() === manifest.contract.toLowerCase()
      && String(receipt.taskId) === agent.taskId
      && receipt.state === agent.state
      && receipt.resultHash.toLowerCase() === agent.resultHash.toLowerCase()
      && receipt.evidenceHash.toLowerCase() === agent.evidenceHash.toLowerCase()
      && verificationTx?.toLowerCase() === agent.verificationTx.toLowerCase();
    if (!passed) throw new Error(`${agent.name}: manifest does not match task ${agent.taskId}`);
    checks.push({ agent: agent.name, taskId: agent.taskId, passed });
  }
  if (!manifest.interactiveJudgeConsole.blockedBeforeWrite || manifest.interactiveJudgeConsole.writes.length !== 4 || !manifest.interactiveJudgeConsole.writes.includes("setVerifier-if-needed")) throw new Error("judge console manifest mismatch");
  const baseline = JSON.parse(await readFile("docs/benchmark-testnet.json", "utf8")) as any;
  if (baseline.tasks !== manifest.taskCreationBaseline.tasks || baseline.samples?.length !== manifest.taskCreationBaseline.tasks) throw new Error("task-creation baseline mismatch");
  const benchmark = JSON.parse(await readFile(manifest.endToEndBenchmark.evidenceFile, "utf8")) as any;
  const transactionCount = (benchmark.samples ?? []).flatMap((sample: any) => [sample.create?.txHash, sample.submit?.txHash, sample.verify?.txHash]).filter(Boolean).length;
  if (benchmark.tasks !== manifest.endToEndBenchmark.pipelines
    || benchmark.verified !== manifest.endToEndBenchmark.verified
    || transactionCount !== manifest.endToEndBenchmark.transactions
    || benchmark.averageEndToEndMs !== manifest.endToEndBenchmark.averageEndToEndMs
    || benchmark.p50EndToEndMs !== manifest.endToEndBenchmark.p50EndToEndMs
    || benchmark.p95EndToEndMs !== manifest.endToEndBenchmark.p95EndToEndMs
    || benchmark.averageTotalGas !== manifest.endToEndBenchmark.averageTotalGas) throw new Error("end-to-end benchmark manifest mismatch");
  const parallelDeployment = JSON.parse(await readFile(manifest.parallelV2.deploymentEvidence, "utf8")) as any;
  const parallel = JSON.parse(await readFile(manifest.parallelV2.benchmarkEvidence, "utf8")) as any;
  if (parallelDeployment.address.toLowerCase() !== manifest.parallelV2.contract.toLowerCase()
    || parallelDeployment.transactionHash.toLowerCase() !== manifest.parallelV2.deploymentTx.toLowerCase()
    || parallelDeployment.sourceVerification?.status !== manifest.parallelV2.verificationStatus
    || parallelDeployment.sourceVerification?.url !== manifest.parallelV2.verifiedSource
    || parallel.contract.toLowerCase() !== manifest.parallelV2.contract.toLowerCase()
    || parallel.deploymentTx.toLowerCase() !== manifest.parallelV2.deploymentTx.toLowerCase()
    || parallel.tasks !== manifest.parallelV2.pipelines
    || parallel.lanes !== manifest.parallelV2.lanes
    || parallel.verified !== manifest.parallelV2.verified
    || parallel.transactions !== manifest.parallelV2.transactions
    || parallel.maxCreatesInSingleBlock !== manifest.parallelV2.maxCreatesInSingleBlock
    || parallel.maxSubmitsInSingleBlock !== manifest.parallelV2.maxSubmitsInSingleBlock
    || parallel.maxVerifiesInSingleBlock !== manifest.parallelV2.maxVerifiesInSingleBlock) throw new Error("parallel V2 manifest mismatch");
  await readFile(`${manifest.sponsorIntegration.path}/SKILL.md`, "utf8");
  const sponsorReceipt = JSON.parse(await readFile(manifest.sponsorIntegration.evidenceFile, "utf8")) as any;
  if (manifest.sponsorIntegration.name !== "MetaMask Agent Wallet"
    || manifest.sponsorIntegration.status !== "LIVE_TESTNET_VERIFIED"
    || !manifest.sponsorIntegration.broadcastClaimed
    || sponsorReceipt.taskId !== manifest.sponsorIntegration.liveTaskId
    || sponsorReceipt.buyer.toLowerCase() !== manifest.sponsorIntegration.buyerAddress.toLowerCase()
    || sponsorReceipt.transactions.metamaskCreateTask.hash.toLowerCase() !== manifest.sponsorIntegration.createTaskTx.toLowerCase()
    || sponsorReceipt.transactions.independentVerifyAndRelease.hash.toLowerCase() !== manifest.sponsorIntegration.verificationTx.toLowerCase()) throw new Error("sponsor integration manifest mismatch");
  console.log(JSON.stringify({ evidenceClass: "REPOSITORY_INTEGRITY", manifestVersion: manifest.manifestVersion, contract: manifest.contract, agentReceipts: checks, judgeConsole: true, endToEndPipelines: benchmark.samples.length, endToEndTransactions: transactionCount, parallelV2: { contract: parallel.contract, pipelines: parallel.samples.length, lanes: parallel.lanes, transactions: parallel.transactions }, sponsorIntegration: manifest.sponsorIntegration.name, passed: true }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
