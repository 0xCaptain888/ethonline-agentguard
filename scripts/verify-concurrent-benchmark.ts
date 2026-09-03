import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

type Phase = { txHash: string; blockNumber: number; gasUsed: string; latencyMs: number };
type Sample = {
  taskId: string;
  lane: number;
  buyer: string;
  seller: string;
  state: string;
  resultHash: string;
  create: Phase;
  submit: Phase;
  verify: Phase;
  settlementLatencyMs: number;
  totalGas: string;
};

async function main() {
  const benchmark = JSON.parse(await readFile("docs/benchmark-concurrent-testnet.json", "utf8")) as {
    evidenceClass: string;
    chainId: number;
    contract: string;
    tasks: number;
    lanes: number;
    verified: number;
    transactions: number;
    concurrentSettlementMs: number;
    completedSettlementsPerSecond: number;
    blocksUsed: number;
    maxTransactionsInSingleBlock: number;
    averageTotalGas: string;
    samples: Sample[];
  };
  assert.equal(benchmark.evidenceClass, "LIVE_TESTNET_CONCURRENT_AGENT_BENCHMARK");
  assert.equal(benchmark.chainId, 10143);
  assert.match(benchmark.contract, /^0x[a-fA-F0-9]{40}$/);
  assert.ok(benchmark.lanes >= 5);
  assert.ok(benchmark.tasks >= 25);
  assert.equal(benchmark.tasks, benchmark.samples.length);
  assert.equal(benchmark.verified, benchmark.samples.length);
  assert.equal(benchmark.transactions, benchmark.samples.length * 3);
  assert.ok(benchmark.concurrentSettlementMs > 0);
  assert.ok(benchmark.completedSettlementsPerSecond > 0);
  assert.ok(benchmark.blocksUsed > 0);
  assert.ok(benchmark.maxTransactionsInSingleBlock > 0);

  const hashes = new Set<string>();
  const taskIds = new Set<string>();
  const buyers = new Set<string>();
  const sellers = new Set<string>();
  let totalGas = 0n;
  for (const sample of benchmark.samples) {
    assert.equal(sample.state, "VERIFIED");
    assert.match(sample.resultHash, /^0x[a-fA-F0-9]{64}$/);
    assert.ok(sample.settlementLatencyMs > 0);
    assert.ok(!taskIds.has(sample.taskId));
    taskIds.add(sample.taskId);
    buyers.add(sample.buyer.toLowerCase());
    sellers.add(sample.seller.toLowerCase());
    const sampleGas = [sample.create, sample.submit, sample.verify].reduce((sum, phase) => {
      assert.match(phase.txHash, /^0x[a-fA-F0-9]{64}$/);
      assert.ok(phase.blockNumber > 0);
      assert.ok(phase.latencyMs > 0);
      assert.ok(!hashes.has(phase.txHash));
      hashes.add(phase.txHash);
      return sum + BigInt(phase.gasUsed);
    }, 0n);
    assert.equal(sample.totalGas, sampleGas.toString());
    totalGas += sampleGas;
  }
  assert.ok(buyers.size >= 5);
  assert.ok(sellers.size >= 5);
  assert.equal(hashes.size, benchmark.transactions);
  assert.equal(benchmark.averageTotalGas, (totalGas / BigInt(benchmark.samples.length)).toString());

  console.log(JSON.stringify({
    evidenceClass: "REPOSITORY_INTEGRITY",
    benchmark: "concurrent Monad Testnet Agent settlement",
    pipelines: benchmark.samples.length,
    lanes: benchmark.lanes,
    uniqueBuyers: buyers.size,
    uniqueSellers: sellers.size,
    uniqueTransactions: hashes.size,
    passed: true,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
