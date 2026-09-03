import { ethers } from "hardhat";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { MonadAgentGuard } from "../typechain-types/index.js";

async function main() {
  const count = Math.min(50, Math.max(25, Number(process.env.BENCHMARK_TASKS ?? 25)));
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 10143n) throw new Error(`Expected Monad Testnet (10143), got ${network.chainId}`);
  const deployment = JSON.parse(await readFile(`deployments/${network.chainId}.json`, "utf8")) as { address: string };
  const [buyer] = await ethers.getSigners();
  if (!process.env.SELLER_PRIVATE_KEY) throw new Error("SELLER_PRIVATE_KEY is required");
  const seller = new ethers.Wallet(process.env.SELLER_PRIVATE_KEY, ethers.provider);
  const guard = (await ethers.getContractAt("MonadAgentGuard", deployment.address)) as unknown as MonadAgentGuard;
  await (await guard.connect(buyer).registerAgent(ethers.id("benchmark-buyer"))).wait();
  await (await guard.connect(seller).registerAgent(ethers.id("benchmark-seller"))).wait();
  await (await guard.connect(buyer).setPolicy(ethers.parseEther("1"), false)).wait();
  const value = ethers.parseEther("0.001");
  const started = performance.now();
  const samples: Array<{ taskId: string; txHash: string; blockNumber: number; gasUsed: string; latencyMs: number }> = [];
  for (let i = 0; i < count; i += 1) {
    const taskId = await guard.nextTaskId();
    const sentAt = performance.now();
    const tx = await guard.connect(buyer).createTask(seller.address, ethers.id(`benchmark-live:intent:${taskId}`), ethers.id("benchmark-live:policy"), { value });
    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) throw new Error(`Task ${taskId} failed`);
    samples.push({ taskId: taskId.toString(), txHash: tx.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString(), latencyMs: Math.round(performance.now() - sentAt) });
  }
  const elapsedMs = performance.now() - started;
  const result = { evidenceClass: "LIVE_TESTNET_BENCHMARK", network: "Monad Testnet", chainId: Number(network.chainId), contract: deployment.address, tasks: count, elapsedMs: Math.round(elapsedMs), tasksPerSecond: Number((count / (elapsedMs / 1000)).toFixed(3)), averageLatencyMs: Math.round(samples.reduce((sum, sample) => sum + sample.latencyMs, 0) / samples.length), averageGas: (samples.reduce((sum, sample) => sum + BigInt(sample.gasUsed), 0n) / BigInt(samples.length)).toString(), samples };
  await mkdir("docs", { recursive: true });
  await writeFile("docs/benchmark-testnet.json", `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
