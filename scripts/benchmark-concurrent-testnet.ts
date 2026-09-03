import { ethers } from "hardhat";
import type { ContractTransactionResponse, Signer, TransactionReceipt } from "ethers";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { MonadAgentGuard } from "../typechain-types/index.js";

type PhaseReceipt = {
  txHash: string;
  blockNumber: number;
  gasUsed: string;
  latencyMs: number;
};

type Lane = {
  index: number;
  buyerAddress: string;
  sellerAddress: string;
  buyer: Signer;
  seller: Signer;
};

type PipelineSample = {
  taskId: string;
  lane: number;
  buyer: string;
  seller: string;
  state: "VERIFIED";
  resultHash: string;
  create: PhaseReceipt;
  submit: PhaseReceipt;
  verify: PhaseReceipt;
  settlementLatencyMs: number;
  totalGas: string;
};

function percentile(values: number[], percentileValue: number): number {
  const sorted = [...values].sort((a, b) => a - b);
  const index = Math.min(sorted.length - 1, Math.ceil((percentileValue / 100) * sorted.length) - 1);
  return sorted[Math.max(0, index)];
}

function derivedWallet(privateSeed: string, label: string, index: number) {
  const key = ethers.keccak256(ethers.solidityPacked(
    ["bytes32", "string", "uint256"],
    [privateSeed, `monad-agentguard:${label}:v1`, index],
  ));
  return new ethers.Wallet(key, ethers.provider);
}

async function waitReceipt(sentAt: number, transaction: ContractTransactionResponse): Promise<PhaseReceipt> {
  const receipt = await waitForMined(transaction.hash);
  return {
    txHash: transaction.hash,
    blockNumber: receipt.blockNumber,
    gasUsed: receipt.gasUsed.toString(),
    latencyMs: Math.round(performance.now() - sentAt),
  };
}

async function waitForMined(hash: string): Promise<TransactionReceipt> {
  let lastError: unknown;
  for (let attempt = 0; attempt < 180; attempt += 1) {
    let receipt: TransactionReceipt | null = null;
    try {
      receipt = await ethers.provider.getTransactionReceipt(hash);
    } catch (error) {
      lastError = error;
    }
    if (receipt) {
      if (receipt.status !== 1) throw new Error(`Transaction ${hash} failed`);
      return receipt;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Receipt timeout for ${hash}: ${lastError instanceof Error ? lastError.message : "RPC unavailable"}`);
}

function taskIdFromReceipt(guard: MonadAgentGuard, receipt: TransactionReceipt): bigint {
  for (const log of receipt.logs) {
    try {
      const parsed = guard.interface.parseLog({ topics: [...log.topics], data: log.data });
      if (parsed?.name === "TaskCreated") return parsed.args.taskId as bigint;
    } catch {
      // Ignore events emitted by another contract.
    }
  }
  throw new Error(`TaskCreated event missing from ${receipt.hash}`);
}

async function fundTo(funder: Signer, target: string, minimum: bigint) {
  const balance = await ethers.provider.getBalance(target);
  if (balance >= minimum) return;
  const transaction = await funder.sendTransaction({ to: target, value: minimum - balance });
  await waitForMined(transaction.hash);
}

async function ensureIdentity(guard: MonadAgentGuard, signer: Signer, metadata: string) {
  const address = await signer.getAddress();
  const identity = await guard.identities(address);
  if (identity.active) return;
  const transaction = await guard.connect(signer).registerAgent(ethers.id(metadata), { gasLimit: 200_000 });
  await waitForMined(transaction.hash);
}

async function refundOpenTasks(guard: MonadAgentGuard, lanes: Lane[]) {
  const laneByBuyer = new Map(lanes.map((lane) => [lane.buyerAddress.toLowerCase(), lane]));
  const nextTaskId = await guard.nextTaskId();
  const refunds: string[] = [];
  for (let taskId = 0n; taskId < nextTaskId; taskId += 1n) {
    const task = await guard.tasks(taskId);
    const lane = laneByBuyer.get(task.buyer.toLowerCase());
    if (!lane || task.state !== 0n) continue;
    const transaction = await guard.connect(lane.buyer).blockTask(
      taskId,
      ethers.id("concurrent-benchmark:retry-cleanup"),
      { gasLimit: 150_000 },
    );
    await waitForMined(transaction.hash);
    refunds.push(taskId.toString());
  }
  return refunds;
}

async function main() {
  const taskCount = Math.min(50, Math.max(25, Number(process.env.CONCURRENT_BENCHMARK_TASKS ?? 25)));
  const laneCount = Math.min(10, Math.max(5, Number(process.env.CONCURRENT_BENCHMARK_LANES ?? 5)));
  const privateSeed = process.env.DEPLOYER_PRIVATE_KEY;
  const verifierKey = process.env.VERIFIER_PRIVATE_KEY;
  if (!privateSeed || !verifierKey) throw new Error("DEPLOYER_PRIVATE_KEY and VERIFIER_PRIVATE_KEY are required");

  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 10143n) throw new Error(`Expected Monad Testnet (10143), got ${network.chainId}`);
  const deployment = JSON.parse(await readFile(`deployments/${network.chainId}.json`, "utf8")) as { address: string };
  const [funder] = await ethers.getSigners();
  const verifier = new ethers.Wallet(verifierKey, ethers.provider);
  const guard = (await ethers.getContractAt("MonadAgentGuard", deployment.address)) as unknown as MonadAgentGuard;
  const taskValue = ethers.parseEther("0.00001");
  // Monad Testnet gas can fluctuate above 100 gwei. These caps cover actor
  // registration, policy/verifier setup and five full pipelines per lane.
  const buyerMinimum = ethers.parseEther("0.4");
  const sellerMinimum = ethers.parseEther("0.15");
  const requiredTopUp = buyerMinimum * BigInt(laneCount) + sellerMinimum * BigInt(laneCount);
  const funderBalance = await ethers.provider.getBalance(await funder.getAddress());
  if (funderBalance < requiredTopUp + ethers.parseEther("0.005")) {
    throw new Error(`Insufficient Testnet MON for ${laneCount} concurrent lanes`);
  }

  const lanes: Lane[] = [];
  for (let index = 0; index < laneCount; index += 1) {
    const buyerWallet = derivedWallet(privateSeed, "concurrent-buyer", index);
    const sellerWallet = derivedWallet(privateSeed, "concurrent-seller", index);
    await fundTo(funder, buyerWallet.address, buyerMinimum);
    await fundTo(funder, sellerWallet.address, sellerMinimum);
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
      ensureIdentity(guard, lane.buyer, `concurrent-buyer:${lane.index}`),
      ensureIdentity(guard, lane.seller, `concurrent-seller:${lane.index}`),
    ]);
    const policyTransaction = await guard.connect(lane.buyer).setPolicy(
      ethers.parseEther("0.001"),
      true,
      { gasLimit: 160_000 },
    );
    await waitForMined(policyTransaction.hash);
    const verifierTransaction = await guard.connect(lane.buyer).setVerifier(
      verifier.address,
      { gasLimit: 120_000 },
    );
    await waitForMined(verifierTransaction.hash);
  }));

  const cleanupRefundedTaskIds = await refundOpenTasks(guard, lanes);

  const benchmarkStartedAt = performance.now();
  const descriptors = Array.from({ length: taskCount }, (_, index) => ({
    index,
    lane: lanes[index % lanes.length],
    startedAt: performance.now(),
  }));

  const createStartedAt = performance.now();
  const created: Array<(typeof descriptors)[number] & { taskId: bigint; create: PhaseReceipt }> = [];
  for (const descriptor of descriptors) {
    const sentAt = performance.now();
    const transaction = await guard.connect(descriptor.lane.buyer).createTask(
      descriptor.lane.sellerAddress,
      ethers.id(`concurrent:intent:${descriptor.index}`),
      ethers.id("concurrent:policy:v1"),
      { value: taskValue, gasLimit: 350_000 },
    );
    const receipt = await waitForMined(transaction.hash);
    created.push({
      ...descriptor,
      taskId: taskIdFromReceipt(guard, receipt),
      create: {
        txHash: transaction.hash,
        blockNumber: receipt.blockNumber,
        gasUsed: receipt.gasUsed.toString(),
        latencyMs: Math.round(performance.now() - sentAt),
      },
    });
  }
  const createPreparationMs = Math.round(performance.now() - createStartedAt);

  const concurrentSettlementStartedAt = performance.now();
  const submitStartedAt = performance.now();
  const submitted = await Promise.all(created.map(async (sample) => {
    const resultHash = ethers.id(`concurrent:result:${sample.taskId}`);
    const sentAt = performance.now();
    const transaction = await guard.connect(sample.lane.seller).submitResult(
      sample.taskId,
      resultHash,
      { gasLimit: 150_000 },
    );
    return { ...sample, resultHash, submit: await waitReceipt(sentAt, transaction) };
  }));
  const submitWaveMs = Math.round(performance.now() - submitStartedAt);

  const verifyStartedAt = performance.now();
  const verified = await Promise.all(submitted.map(async (sample) => {
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
    const verify = await waitReceipt(sentAt, transaction);
    const task = await guard.tasks(sample.taskId);
    if (task.state !== 2n) throw new Error(`Task ${sample.taskId} did not reach VERIFIED`);
    return { ...sample, verify };
  }));
  const verifyWaveMs = Math.round(performance.now() - verifyStartedAt);
  const concurrentSettlementMs = Math.round(performance.now() - concurrentSettlementStartedAt);

  const samples: PipelineSample[] = verified.map((sample) => ({
    taskId: sample.taskId.toString(),
    lane: sample.lane.index,
    buyer: sample.lane.buyerAddress,
    seller: sample.lane.sellerAddress,
    state: "VERIFIED",
    resultHash: sample.resultHash,
    create: sample.create,
    submit: sample.submit,
    verify: sample.verify,
    settlementLatencyMs: submitWaveMs + sample.verify.latencyMs,
    totalGas: (BigInt(sample.create.gasUsed) + BigInt(sample.submit.gasUsed) + BigInt(sample.verify.gasUsed)).toString(),
  }));

  const elapsedMs = Math.round(performance.now() - benchmarkStartedAt);
  const latencies = samples.map((sample) => sample.settlementLatencyMs);
  const gasValues = samples.map((sample) => BigInt(sample.totalGas));
  const blockCounts = new Map<number, number>();
  for (const sample of samples) {
    for (const phase of [sample.create, sample.submit, sample.verify]) {
      blockCounts.set(phase.blockNumber, (blockCounts.get(phase.blockNumber) ?? 0) + 1);
    }
  }
  const result = {
    evidenceClass: "LIVE_TESTNET_CONCURRENT_AGENT_BENCHMARK",
    measuredAt: new Date().toISOString(),
    network: "Monad Testnet",
    chainId: Number(network.chainId),
    contract: deployment.address,
    definition: "sequential escrow preparation followed by five independent buyer/seller lanes concurrently submitting results and settling through independent EIP-191 verification",
    tasks: taskCount,
    lanes: laneCount,
    verified: samples.length,
    transactions: samples.length * 3,
    elapsedMs,
    concurrentSettlementMs,
    completedSettlementsPerSecond: Number((taskCount / (concurrentSettlementMs / 1000)).toFixed(3)),
    phaseWaveMs: { createPreparation: createPreparationMs, concurrentSubmit: submitWaveMs, concurrentVerify: verifyWaveMs },
    averageSettlementMs: Math.round(latencies.reduce((sum, value) => sum + value, 0) / latencies.length),
    p50SettlementMs: percentile(latencies, 50),
    p95SettlementMs: percentile(latencies, 95),
    averageTotalGas: (gasValues.reduce((sum, value) => sum + value, 0n) / BigInt(gasValues.length)).toString(),
    blocksUsed: blockCounts.size,
    maxTransactionsInSingleBlock: Math.max(...blockCounts.values()),
    actorAddresses: lanes.map(({ index, buyerAddress, sellerAddress }) => ({ lane: index, buyer: buyerAddress, seller: sellerAddress })),
    setupCleanup: {
      refundedTaskIds: cleanupRefundedTaskIds,
      note: "OPEN tasks from interrupted benchmark attempts were refunded before measurement and are excluded from all metrics.",
    },
    samples,
    limitation: "Controlled five-lane Monad Testnet settlement measurement. V1 escrow creation is prepared sequentially because its global nextTaskId counter is a shared write hotspot. The result demonstrates concurrent seller submission and independent settlement, not Monad protocol TPS or production load capacity.",
  };
  await mkdir("docs", { recursive: true });
  await writeFile("docs/benchmark-concurrent-testnet.json", `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
