import { ethers } from "hardhat";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { MonadAgentGuard } from "../typechain-types/index.js";

type PhaseReceipt = {
  txHash: string;
  blockNumber: number;
  gasUsed: string;
  latencyMs: number;
};

type PipelineSample = {
  taskId: string;
  state: "VERIFIED";
  create: PhaseReceipt;
  submit: PhaseReceipt;
  verify: PhaseReceipt;
  endToEndMs: number;
  totalGas: string;
};

function percentile(values: number[], percentileValue: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

async function waitPhase(sentAt: number, transaction: Awaited<ReturnType<MonadAgentGuard["createTask"]>>): Promise<PhaseReceipt> {
  const receipt = await transaction.wait();
  if (!receipt || receipt.status !== 1) throw new Error(`Transaction ${transaction.hash} failed`);
  return {
    txHash: transaction.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    latencyMs: Math.round(performance.now() - sentAt),
  };
}

async function main() {
  const count = Math.min(50, Math.max(25, Number(process.env.E2E_BENCHMARK_TASKS ?? 25)));
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 10143n) throw new Error(`Expected Monad Testnet (10143), got ${network.chainId}`);
  const deployment = JSON.parse(await readFile(`deployments/${network.chainId}.json`, "utf8")) as { address: string };
  const [buyer] = await ethers.getSigners();
  if (!process.env.SELLER_PRIVATE_KEY || !process.env.VERIFIER_PRIVATE_KEY) {
    throw new Error("SELLER_PRIVATE_KEY and VERIFIER_PRIVATE_KEY are required");
  }
  const seller = new ethers.Wallet(process.env.SELLER_PRIVATE_KEY, ethers.provider);
  const verifier = new ethers.Wallet(process.env.VERIFIER_PRIVATE_KEY, ethers.provider);
  const guard = (await ethers.getContractAt("MonadAgentGuard", deployment.address)) as unknown as MonadAgentGuard;

  await (await guard.connect(buyer).registerAgent(ethers.id("e2e-benchmark-buyer"))).wait();
  await (await guard.connect(seller).registerAgent(ethers.id("e2e-benchmark-seller"))).wait();
  await (await guard.connect(buyer).setPolicy(ethers.parseEther("0.01"), true)).wait();
  await (await guard.connect(buyer).setVerifier(verifier.address)).wait();

  const value = ethers.parseEther("0.0001");
  const samples: PipelineSample[] = [];
  const benchmarkStartedAt = performance.now();

  for (let index = 0; index < count; index += 1) {
    const taskId = await guard.nextTaskId();
    const pipelineStartedAt = performance.now();
    const resultHash = ethers.id(`e2e-benchmark:result:${taskId}`);

    let phaseStartedAt = performance.now();
    const createTx = await guard.connect(buyer).createTask(
      seller.address,
      ethers.id(`e2e-benchmark:intent:${taskId}`),
      ethers.id("e2e-benchmark:policy:v1"),
      { value },
    );
    const create = await waitPhase(phaseStartedAt, createTx);

    phaseStartedAt = performance.now();
    const submitTx = await guard.connect(seller).submitResult(taskId, resultHash);
    const submit = await waitPhase(phaseStartedAt, submitTx as Awaited<ReturnType<MonadAgentGuard["createTask"]>>);

    const digest = ethers.keccak256(ethers.solidityPacked(
      ["uint256", "address", "uint256", "bool", "bytes32"],
      [network.chainId, deployment.address, taskId, true, resultHash],
    ));
    const signature = await verifier.signMessage(ethers.getBytes(digest));
    phaseStartedAt = performance.now();
    const verifyTx = await guard.connect(buyer).verifyTaskBySignature(taskId, true, signature);
    const verify = await waitPhase(phaseStartedAt, verifyTx as Awaited<ReturnType<MonadAgentGuard["createTask"]>>);
    const task = await guard.tasks(taskId);
    if (task.state !== 2n) throw new Error(`Task ${taskId} did not reach VERIFIED`);

    samples.push({
      taskId: taskId.toString(),
      state: "VERIFIED",
      create,
      submit,
      verify,
      endToEndMs: Math.round(performance.now() - pipelineStartedAt),
      totalGas: (BigInt(create.gasUsed) + BigInt(submit.gasUsed) + BigInt(verify.gasUsed)).toString(),
    });
  }

  const elapsedMs = Math.round(performance.now() - benchmarkStartedAt);
  const latencies = samples.map((sample) => sample.endToEndMs);
  const totalGasValues = samples.map((sample) => BigInt(sample.totalGas));
  const result = {
    evidenceClass: "LIVE_TESTNET_END_TO_END_BENCHMARK",
    measuredAt: new Date().toISOString(),
    network: "Monad Testnet",
    chainId: Number(network.chainId),
    contract: deployment.address,
    definition: "createTask → submitResult → independent EIP-191 verification → VERIFIED",
    tasks: count,
    verified: samples.filter((sample) => sample.state === "VERIFIED").length,
    elapsedMs,
    pipelinesPerSecond: Number((count / (elapsedMs / 1000)).toFixed(3)),
    averageEndToEndMs: Math.round(latencies.reduce((sum, valueMs) => sum + valueMs, 0) / latencies.length),
    p50EndToEndMs: percentile(latencies, 50),
    p95EndToEndMs: percentile(latencies, 95),
    averageTotalGas: (totalGasValues.reduce((sum, valueGas) => sum + valueGas, 0n) / BigInt(totalGasValues.length)).toString(),
    samples,
    limitation: "Sequential Testnet receipt latency for the AgentGuard contract workflow; not a claim about Monad protocol TPS.",
  };
  await mkdir("docs", { recursive: true });
  await writeFile("docs/benchmark-e2e-testnet.json", `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
