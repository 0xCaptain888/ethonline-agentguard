import { ethers } from "hardhat";
import type { ContractTransactionResponse, Signer, TransactionReceipt } from "ethers";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { MonadAgentGuardParallel } from "../typechain-types/index.js";

type Phase = { txHash: string; blockNumber: number; gasUsed: string; latencyMs: number };
type Lane = { index: number; buyerAddress: string; sellerAddress: string; buyer: Signer; seller: Signer };

function percentile(values: number[], p: number) {
  const sorted = [...values].sort((a, b) => a - b);
  return sorted[Math.min(sorted.length - 1, Math.ceil((p / 100) * sorted.length) - 1)];
}

function derivedWallet(privateSeed: string, label: string, index: number) {
  const key = ethers.keccak256(ethers.solidityPacked(
    ["bytes32", "string", "uint256"],
    [privateSeed, `monad-agentguard:${label}:v1`, index],
  ));
  return new ethers.Wallet(key, ethers.provider);
}

async function waitForMined(hash: string): Promise<TransactionReceipt> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 180; attempt += 1) {
    let receipt: TransactionReceipt | null = null;
    try { receipt = await ethers.provider.getTransactionReceipt(hash); } catch (error) { lastError = error; }
    if (receipt) {
      if (receipt.status !== 1) throw new Error(`Transaction ${hash} failed`);
      return receipt;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Receipt timeout for ${hash}: ${lastError instanceof Error ? lastError.message : "RPC unavailable"}`);
}

async function record(sentAt: number, transaction: ContractTransactionResponse): Promise<Phase> {
  const receipt = await waitForMined(transaction.hash);
  return {
    txHash: transaction.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    latencyMs: Math.round(performance.now() - sentAt),
  };
}

function taskIdFromReceipt(guard: MonadAgentGuardParallel, receipt: TransactionReceipt): bigint {
  for (const log of receipt.logs) {
    try {
      const parsed = guard.interface.parseLog({ topics: [...log.topics], data: log.data });
      if (parsed?.name === "TaskCreated") return parsed.args.taskId as bigint;
    } catch { /* another contract event */ }
  }
  throw new Error(`TaskCreated event missing from ${receipt.hash}`);
}

async function fundTo(funder: Signer, address: string, target: bigint) {
  const balance = await ethers.provider.getBalance(address);
  if (balance >= target) return;
  const transaction = await funder.sendTransaction({ to: address, value: target - balance });
  await waitForMined(transaction.hash);
}

async function ensureIdentity(guard: MonadAgentGuardParallel, signer: Signer, metadata: string) {
  const address = await signer.getAddress();
  if ((await guard.identities(address)).active) return;
  const transaction = await guard.connect(signer).registerAgent(ethers.id(metadata), { gasLimit: 200_000 });
  await waitForMined(transaction.hash);
}

function taskIdFor(contract: string, buyer: string, nonce: bigint) {
  return BigInt(ethers.keccak256(ethers.solidityPacked(
    ["uint256", "address", "address", "uint256"],
    [10143, contract, buyer, nonce],
  )));
}

async function refundOpenTasks(guard: MonadAgentGuardParallel, contract: string, lanes: Lane[]) {
  const refunded: string[] = [];
  for (const lane of lanes) {
    const nextNonce = await guard.nextBuyerNonce(lane.buyerAddress);
    for (let nonce = 0n; nonce < nextNonce; nonce += 1n) {
      const taskId = taskIdFor(contract, lane.buyerAddress, nonce);
      const task = await guard.tasks(taskId);
      if (task.state !== 0n || task.buyer.toLowerCase() !== lane.buyerAddress.toLowerCase()) continue;
      const transaction = await guard.connect(lane.buyer).blockTask(
        taskId,
        ethers.id("parallel-benchmark:retry-cleanup"),
        { gasLimit: 150_000 },
      );
      await waitForMined(transaction.hash);
      refunded.push(taskId.toString());
    }
  }
  return refunded;
}

async function main() {
  const taskCount = Math.min(25, Math.max(10, Number(process.env.PARALLEL_BENCHMARK_TASKS ?? 10)));
  const laneCount = Math.min(10, Math.max(5, Number(process.env.PARALLEL_BENCHMARK_LANES ?? 5)));
  const privateSeed = process.env.DEPLOYER_PRIVATE_KEY;
  const verifierKey = process.env.VERIFIER_PRIVATE_KEY;
  if (!privateSeed || !verifierKey) throw new Error("DEPLOYER_PRIVATE_KEY and VERIFIER_PRIVATE_KEY are required");
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 10143n) throw new Error(`Expected Monad Testnet, got ${network.chainId}`);
  const deployment = JSON.parse(await readFile("deployments/10143-parallel.json", "utf8")) as { address: string };
  const [funder] = await ethers.getSigners();
  const verifier = new ethers.Wallet(verifierKey, ethers.provider);
  const guard = (await ethers.getContractAt("MonadAgentGuardParallel", deployment.address)) as unknown as MonadAgentGuardParallel;

  const lanes: Lane[] = [];
  for (let index = 0; index < laneCount; index += 1) {
    const buyerWallet = derivedWallet(privateSeed, "concurrent-buyer", index);
    const sellerWallet = derivedWallet(privateSeed, "concurrent-seller", index);
    await fundTo(funder, buyerWallet.address, ethers.parseEther("0.14"));
    await fundTo(funder, sellerWallet.address, ethers.parseEther("0.04"));
    lanes.push({
      index,
      buyerAddress: buyerWallet.address,
      sellerAddress: sellerWallet.address,
      buyer: new ethers.NonceManager(buyerWallet),
      seller: new ethers.NonceManager(sellerWallet),
    });
  }

  await Promise.all(lanes.map(async (lane) => {
    await Promise.all([
      ensureIdentity(guard, lane.buyer, `parallel-buyer:${lane.index}`),
      ensureIdentity(guard, lane.seller, `parallel-seller:${lane.index}`),
    ]);
    const policy = await guard.connect(lane.buyer).setPolicy(ethers.parseEther("0.001"), true, { gasLimit: 160_000 });
    await waitForMined(policy.hash);
    const verifierTx = await guard.connect(lane.buyer).setVerifier(verifier.address, { gasLimit: 120_000 });
    await waitForMined(verifierTx.hash);
  }));
  const cleanupRefundedTaskIds = await refundOpenTasks(guard, deployment.address, lanes);

  const taskValue = ethers.parseEther("0.00001");
  const descriptors = Array.from({ length: taskCount }, (_, index) => ({ index, lane: lanes[index % lanes.length] }));
  const benchmarkStartedAt = performance.now();
  const createStartedAt = performance.now();
  const created: Array<(typeof descriptors)[number] & { taskId: bigint; create: Phase }> = [];
  for (let offset = 0; offset < descriptors.length; offset += laneCount) {
    const wave = await Promise.all(descriptors.slice(offset, offset + laneCount).map(async (descriptor) => {
      const sentAt = performance.now();
      const transaction = await guard.connect(descriptor.lane.buyer).createTask(
        descriptor.lane.sellerAddress,
        ethers.id(`parallel:intent:${descriptor.index}`),
        ethers.id("parallel:policy:v2"),
        { value: taskValue, gasLimit: 350_000 },
      );
      const create = await record(sentAt, transaction);
      const receipt = await ethers.provider.getTransactionReceipt(transaction.hash);
      if (!receipt) throw new Error(`Missing create receipt ${transaction.hash}`);
      return { ...descriptor, taskId: taskIdFromReceipt(guard, receipt), create };
    }));
    created.push(...wave);
  }
  const createWaveMs = Math.round(performance.now() - createStartedAt);

  const submitStartedAt = performance.now();
  const submitted: Array<(typeof created)[number] & { resultHash: string; submit: Phase }> = [];
  for (let offset = 0; offset < created.length; offset += laneCount) {
    const wave = await Promise.all(created.slice(offset, offset + laneCount).map(async (sample) => {
      const resultHash = ethers.id(`parallel:result:${sample.taskId}`);
      const sentAt = performance.now();
      const transaction = await guard.connect(sample.lane.seller).submitResult(
        sample.taskId,
        resultHash,
        { gasLimit: 150_000 },
      );
      return { ...sample, resultHash, submit: await record(sentAt, transaction) };
    }));
    submitted.push(...wave);
  }
  const submitWaveMs = Math.round(performance.now() - submitStartedAt);

  const verifyStartedAt = performance.now();
  const completed: Array<(typeof submitted)[number] & { verify: Phase }> = [];
  for (let offset = 0; offset < submitted.length; offset += laneCount) {
    const wave = await Promise.all(submitted.slice(offset, offset + laneCount).map(async (sample) => {
      const digest = ethers.keccak256(ethers.solidityPacked(
        ["uint256", "address", "uint256", "bool", "bytes32"],
        [network.chainId, deployment.address, sample.taskId, true, sample.resultHash],
      ));
      const signature = await verifier.signMessage(ethers.getBytes(digest));
      const sentAt = performance.now();
      const transaction = await guard.connect(sample.lane.buyer).verifyTaskBySignature(
        sample.taskId,
        true,
        signature,
        { gasLimit: 150_000 },
      );
      const verify = await record(sentAt, transaction);
      if ((await guard.tasks(sample.taskId)).state !== 2n) throw new Error(`Task ${sample.taskId} not VERIFIED`);
      return { ...sample, verify };
    }));
    completed.push(...wave);
  }
  const verifyWaveMs = Math.round(performance.now() - verifyStartedAt);
  const elapsedMs = Math.round(performance.now() - benchmarkStartedAt);

  const samples = completed.map((sample) => ({
    taskId: sample.taskId.toString(),
    lane: sample.lane.index,
    buyer: sample.lane.buyerAddress,
    seller: sample.lane.sellerAddress,
    resultHash: sample.resultHash,
    state: "VERIFIED" as const,
    create: sample.create,
    submit: sample.submit,
    verify: sample.verify,
    pipelineLatencyMs: createWaveMs + submitWaveMs + sample.verify.latencyMs,
    totalGas: (BigInt(sample.create.gasUsed) + BigInt(sample.submit.gasUsed) + BigInt(sample.verify.gasUsed)).toString(),
  }));
  const latencies = samples.map((sample) => sample.pipelineLatencyMs);
  const gas = samples.map((sample) => BigInt(sample.totalGas));
  const blockCounts = new Map<number, number>();
  for (const sample of samples) for (const phase of [sample.create, sample.submit, sample.verify]) {
    blockCounts.set(phase.blockNumber, (blockCounts.get(phase.blockNumber) ?? 0) + 1);
  }
  const result = {
    evidenceClass: "LIVE_TESTNET_PARALLEL_END_TO_END_BENCHMARK",
    measuredAt: new Date().toISOString(),
    network: "Monad Testnet",
    chainId: Number(network.chainId),
    contract: deployment.address,
    architecture: "per-buyer deterministic task id; no global task counter write",
    tasks: taskCount,
    lanes: laneCount,
    verified: samples.length,
    transactions: samples.length * 3,
    elapsedMs,
    completedPipelinesPerSecond: Number((taskCount / (elapsedMs / 1_000)).toFixed(3)),
    phaseWaveMs: { concurrentCreate: createWaveMs, concurrentSubmit: submitWaveMs, concurrentVerify: verifyWaveMs },
    averagePipelineMs: Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length),
    p50PipelineMs: percentile(latencies, 50),
    p95PipelineMs: percentile(latencies, 95),
    averageTotalGas: (gas.reduce((sum, value) => sum + value, 0n) / BigInt(gas.length)).toString(),
    blocksUsed: blockCounts.size,
    maxTransactionsInSingleBlock: Math.max(...blockCounts.values()),
    actorAddresses: lanes.map(({ index, buyerAddress, sellerAddress }) => ({ lane: index, buyer: buyerAddress, seller: sellerAddress })),
    setupCleanup: {
      refundedTaskIds: cleanupRefundedTaskIds,
      note: "OPEN tasks from interrupted V2 attempts were derived from per-buyer nonces, refunded before measurement and excluded from metrics.",
    },
    samples,
    limitation: "Controlled five-lane Testnet workload with explicit gas caps. Application benchmark, not Monad protocol TPS or audited production capacity.",
  };
  await mkdir("docs", { recursive: true });
  await writeFile("docs/benchmark-parallel-testnet.json", `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
