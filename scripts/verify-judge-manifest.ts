import { readFile } from "node:fs/promises";

type AgentEntry = { name: string; taskId: string; state: string; resultHash: string; evidenceHash: string; verificationTx: string };

async function main() {
  const manifest = JSON.parse(await readFile("evidence/judge-manifest.json", "utf8")) as {
    manifestVersion: string; chainId: number; contract: string; agents: AgentEntry[];
    benchmark: { tasks: number; successRate: number; averageLatencyMs: number; averageGas: number };
  };
  if (manifest.manifestVersion !== "1" || manifest.chainId !== 10143) throw new Error("unsupported judge manifest");
  const checks: Array<{ agent: string; taskId: string; passed: boolean }> = [];
  for (const agent of manifest.agents.filter((entry) => entry.taskId)) {
    const receipt = JSON.parse(await readFile(`evidence/testnet-task-${agent.taskId}.json`, "utf8")) as any;
    const verificationTx = receipt.transactions?.verifyTask?.hash;
    const passed = receipt.contract.toLowerCase() === manifest.contract.toLowerCase()
      && String(receipt.taskId) === agent.taskId
      && receipt.state === agent.state
      && receipt.resultHash.toLowerCase() === agent.resultHash.toLowerCase()
      && receipt.evidenceHash.toLowerCase() === agent.evidenceHash.toLowerCase()
      && verificationTx?.toLowerCase() === agent.verificationTx.toLowerCase();
    if (!passed) throw new Error(`${agent.name}: manifest does not match task ${agent.taskId}`);
    checks.push({ agent: agent.name, taskId: agent.taskId, passed });
  }
  const benchmark = JSON.parse(await readFile("docs/benchmark-testnet.json", "utf8")) as any;
  if (benchmark.tasks !== manifest.benchmark.tasks || benchmark.samples?.length !== manifest.benchmark.tasks) throw new Error("benchmark manifest mismatch");
  console.log(JSON.stringify({ evidenceClass: "REPOSITORY_INTEGRITY", manifestVersion: manifest.manifestVersion, contract: manifest.contract, agentReceipts: checks, benchmarkSamples: benchmark.samples.length, passed: true }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
