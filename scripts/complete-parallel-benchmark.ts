import { ethers } from "hardhat";
import type { Signer, TransactionReceipt } from "ethers";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { MonadAgentGuardParallel } from "../typechain-types/index.js";

type Lane = { index: number; buyerAddress: string; sellerAddress: string; buyer: Signer };
type Phase = { txHash: string; blockNumber: number; gasUsed: string };

function derivedWallet(privateSeed: string, label: string, index: number) {
  const key = ethers.keccak256(ethers.solidityPacked(
    ["bytes32", "string", "uint256"],
    [privateSeed, `monad-agentguard:${label}:v1`, index],
  ));
  return new ethers.Wallet(key, ethers.provider);
}

function taskIdFor(contract: string, buyer: string, nonce: bigint) {
  return BigInt(ethers.keccak256(ethers.solidityPacked(
    ["uint256", "address", "address", "uint256"],
    [10143, contract, buyer, nonce],
  )));
}

async function waitForMined(hash: string): Promise<TransactionReceipt> {
  for (let attempt = 0; attempt < 180; attempt += 1) {
    try {
      const receipt = await ethers.provider.getTransactionReceipt(hash);
      if (receipt) {
        if (receipt.status !== 1) throw new Error(`Transaction ${hash} failed`);
        return receipt;
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes("failed")) throw error;
    }
    await new Promise((resolve) => setTimeout(resolve, 1_000));
  }
  throw new Error(`Receipt timeout for ${hash}`);
}

type IndexedEvent = { transactionHash: string };

async function eventIndex(guard: MonadAgentGuardParallel, fromBlock: number) {
  const latestBlock = await ethers.provider.getBlockNumber();
  const created = new Map<string, IndexedEvent>();
  const submitted = new Map<string, IndexedEvent>();
  const verified = new Map<string, IndexedEvent>();
  for (let startBlock = fromBlock; startBlock <= latestBlock; startBlock += 100) {
    const endBlock = Math.min(latestBlock, startBlock + 99);
    const [createdEvents, submittedEvents, verifiedEvents] = await Promise.all([
      guard.queryFilter(guard.filters.TaskCreated(), startBlock, endBlock),
      guard.queryFilter(guard.filters.ResultSubmitted(), startBlock, endBlock),
      guard.queryFilter(guard.filters.TaskVerified(), startBlock, endBlock),
    ]);
    for (const event of createdEvents) created.set(event.args.taskId.toString(), event);
    for (const event of submittedEvents) submitted.set(event.args.taskId.toString(), event);
    for (const event of verifiedEvents) verified.set(event.args.taskId.toString(), event);
  }
  return { created, submitted, verified };
}

function requiredEvent(events: Map<string, IndexedEvent>, taskId: bigint, name: string) {
  const event = events.get(taskId.toString());
  if (!event) throw new Error(`${name} event missing for task ${taskId}`);
  return event;
}

async function existingPhase(hash: string): Promise<Phase> {
  const receipt = await waitForMined(hash);
  return { txHash: hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString() };
}

async function main() {
  const privateSeed = process.env.DEPLOYER_PRIVATE_KEY;
  const verifierKey = process.env.VERIFIER_PRIVATE_KEY;
  if (!privateSeed || !verifierKey) throw new Error("DEPLOYER_PRIVATE_KEY and VERIFIER_PRIVATE_KEY are required");
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 10143n) throw new Error(`Expected Monad Testnet, got ${network.chainId}`);
  const deployment = JSON.parse(await readFile("deployments/10143-parallel.json", "utf8")) as {
    address: string;
    blockNumber: number;
    transactionHash: string;
  };
  const verifier = new ethers.Wallet(verifierKey, ethers.provider);
  const guard = (await ethers.getContractAt("MonadAgentGuardParallel", deployment.address)) as unknown as MonadAgentGuardParallel;
  const lanes: Lane[] = Array.from({ length: 5 }, (_, index) => {
    const buyerWallet = derivedWallet(privateSeed, "concurrent-buyer", index);
    const sellerWallet = derivedWallet(privateSeed, "concurrent-seller", index);
    return {
      index,
      buyerAddress: buyerWallet.address,
      sellerAddress: sellerWallet.address,
      buyer: new ethers.NonceManager(buyerWallet),
    };
  });

  const candidates: Array<{ lane: Lane; taskId: bigint; resultHash: string; alreadyVerified: boolean }> = [];
  for (const lane of lanes) {
    const nextNonce = await guard.nextBuyerNonce(lane.buyerAddress);
    for (let nonce = 0n; nonce < nextNonce; nonce += 1n) {
      const taskId = taskIdFor(deployment.address, lane.buyerAddress, nonce);
      const task = await guard.tasks(taskId);
      if (task.state !== 1n && task.state !== 2n) continue;
      if (task.resultHash === ethers.ZeroHash) continue;
      if (task.seller.toLowerCase() !== lane.sellerAddress.toLowerCase()) throw new Error(`Unexpected seller for ${taskId}`);
      candidates.push({ lane, taskId, resultHash: task.resultHash, alreadyVerified: task.state === 2n });
    }
  }
  if (candidates.length !== 10) throw new Error(`Expected 10 completed-or-submitted V2 tasks, found ${candidates.length}`);
  const events = await eventIndex(guard, deployment.blockNumber);

  const pending = candidates.filter((task) => !task.alreadyVerified);
  const byLane = lanes.map((lane) => pending.filter((task) => task.lane.index === lane.index));
  const verificationStartedAt = performance.now();
  const verified: Array<(typeof candidates)[number] & { verify: Phase }> = [];
  for (const sample of candidates.filter((task) => task.alreadyVerified)) {
    const verifiedEvent = requiredEvent(events.verified, sample.taskId, "TaskVerified");
    verified.push({ ...sample, verify: await existingPhase(verifiedEvent.transactionHash) });
  }
  for (let round = 0; round < Math.max(...byLane.map((tasks) => tasks.length)); round += 1) {
    const wave = await Promise.all(byLane.flatMap((tasks) => tasks[round] ? [tasks[round]] : []).map(async (sample) => {
      const digest = ethers.keccak256(ethers.solidityPacked(
        ["uint256", "address", "uint256", "bool", "bytes32"],
        [network.chainId, deployment.address, sample.taskId, true, sample.resultHash],
      ));
      const signature = await verifier.signMessage(ethers.getBytes(digest));
      const transaction = await guard.connect(sample.lane.buyer).verifyTaskBySignature(
        sample.taskId,
        true,
        signature,
        { gasLimit: 120_000 },
      );
      const receipt = await waitForMined(transaction.hash);
      return {
        ...sample,
        verify: { txHash: transaction.hash, blockNumber: receipt.blockNumber, gasUsed: receipt.gasUsed.toString() },
      };
    }));
    verified.push(...wave);
  }
  const verificationWaveMs = Math.round(performance.now() - verificationStartedAt);

  const samples: Array<{
    taskId: string;
    lane: number;
    buyer: string;
    seller: string;
    resultHash: string;
    state: "VERIFIED";
    create: Phase;
    submit: Phase;
    verify: Phase;
    pipelineBlocks: number;
    totalGas: string;
  }> = [];
  for (const sample of verified) {
    const finalTask = await guard.tasks(sample.taskId);
    if (finalTask.state !== 2n) throw new Error(`Task ${sample.taskId} did not reach VERIFIED`);
    const createdEvent = requiredEvent(events.created, sample.taskId, "TaskCreated");
    const submittedEvent = requiredEvent(events.submitted, sample.taskId, "ResultSubmitted");
    const create = await existingPhase(createdEvent.transactionHash);
    const submit = await existingPhase(submittedEvent.transactionHash);
    samples.push({
      taskId: sample.taskId.toString(),
      lane: sample.lane.index,
      buyer: sample.lane.buyerAddress,
      seller: sample.lane.sellerAddress,
      resultHash: sample.resultHash,
      state: "VERIFIED" as const,
      create,
      submit,
      verify: sample.verify,
      pipelineBlocks: sample.verify.blockNumber - create.blockNumber + 1,
      totalGas: (BigInt(create.gasUsed) + BigInt(submit.gasUsed) + BigInt(sample.verify.gasUsed)).toString(),
    });
  }

  const blocks = samples.flatMap((sample) => [sample.create.blockNumber, sample.submit.blockNumber, sample.verify.blockNumber]);
  const blockCounts = new Map<number, number>();
  for (const block of blocks) blockCounts.set(block, (blockCounts.get(block) ?? 0) + 1);
  const phaseMaximum = (phase: "create" | "submit" | "verify") => {
    const counts = new Map<number, number>();
    for (const sample of samples) counts.set(sample[phase].blockNumber, (counts.get(sample[phase].blockNumber) ?? 0) + 1);
    return Math.max(...counts.values());
  };
  const gas = samples.map((sample) => BigInt(sample.totalGas));
  const result = {
    evidenceClass: "LIVE_TESTNET_PARALLEL_END_TO_END_BENCHMARK",
    measuredAt: new Date().toISOString(),
    network: "Monad Testnet",
    chainId: Number(network.chainId),
    contract: deployment.address,
    deploymentTx: deployment.transactionHash,
    architecture: "per-buyer deterministic task id; no global task counter write",
    tasks: samples.length,
    lanes: lanes.length,
    verified: samples.length,
    transactions: samples.length * 3,
    verificationWaveMs,
    firstActivityBlock: Math.min(...blocks),
    lastActivityBlock: Math.max(...blocks),
    blocksUsed: blockCounts.size,
    maxTransactionsInSingleBlock: Math.max(...blockCounts.values()),
    maxCreatesInSingleBlock: phaseMaximum("create"),
    maxSubmitsInSingleBlock: phaseMaximum("submit"),
    maxVerifiesInSingleBlock: phaseMaximum("verify"),
    averageTotalGas: (gas.reduce((sum, value) => sum + value, 0n) / BigInt(gas.length)).toString(),
    actorAddresses: lanes.map(({ index, buyerAddress, sellerAddress }) => ({ lane: index, buyer: buyerAddress, seller: sellerAddress })),
    samples,
    limitation: "Five independent account lanes executed in two concurrent waves. Timing retained for the recovered verification wave; create and submit concurrency is proven by public transaction/block evidence rather than reconstructed wall-clock claims.",
  };
  await mkdir("docs", { recursive: true });
  await writeFile("docs/benchmark-parallel-testnet.json", `${JSON.stringify(result, null, 2)}\n`);
  console.log(JSON.stringify({
    evidenceClass: result.evidenceClass,
    contract: result.contract,
    tasks: result.tasks,
    lanes: result.lanes,
    verified: result.verified,
    transactions: result.transactions,
    verificationWaveMs: result.verificationWaveMs,
    firstActivityBlock: result.firstActivityBlock,
    lastActivityBlock: result.lastActivityBlock,
    maxTransactionsInSingleBlock: result.maxTransactionsInSingleBlock,
    evidenceFile: "docs/benchmark-parallel-testnet.json",
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
