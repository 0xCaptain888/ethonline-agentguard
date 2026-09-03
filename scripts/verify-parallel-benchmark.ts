import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

async function main() {
  const benchmark = JSON.parse(await readFile("docs/benchmark-parallel-testnet.json", "utf8")) as any;
  assert.equal(benchmark.evidenceClass, "LIVE_TESTNET_PARALLEL_END_TO_END_BENCHMARK");
  assert.equal(benchmark.chainId, 10143);
  assert.match(benchmark.contract, /^0x[a-fA-F0-9]{40}$/);
  assert.ok(benchmark.tasks >= 10 && benchmark.lanes >= 5);
  assert.equal(benchmark.tasks, benchmark.samples.length);
  assert.equal(benchmark.verified, benchmark.samples.length);
  assert.equal(benchmark.transactions, benchmark.samples.length * 3);
  const hashes = new Set<string>();
  const taskIds = new Set<string>();
  const buyers = new Set<string>();
  const sellers = new Set<string>();
  let totalGas = 0n;
  for (const sample of benchmark.samples) {
    assert.equal(sample.state, "VERIFIED");
    assert.ok(sample.pipelineBlocks > 0);
    assert.ok(!taskIds.has(sample.taskId));
    taskIds.add(sample.taskId);
    buyers.add(sample.buyer.toLowerCase());
    sellers.add(sample.seller.toLowerCase());
    const sampleGas = [sample.create, sample.submit, sample.verify].reduce((sum: bigint, phase: any) => {
      assert.match(phase.txHash, /^0x[a-fA-F0-9]{64}$/);
      assert.ok(phase.blockNumber > 0);
      assert.ok(!("latencyMs" in phase) || phase.latencyMs > 0);
      assert.ok(!hashes.has(phase.txHash));
      hashes.add(phase.txHash);
      return sum + BigInt(phase.gasUsed);
    }, 0n);
    assert.equal(sample.totalGas, sampleGas.toString());
    totalGas += sampleGas;
  }
  assert.ok(buyers.size >= 5 && sellers.size >= 5);
  assert.equal(hashes.size, benchmark.transactions);
  assert.ok(benchmark.verificationWaveMs > 0);
  assert.equal(benchmark.maxCreatesInSingleBlock, 4);
  assert.equal(benchmark.maxSubmitsInSingleBlock, 5);
  assert.equal(benchmark.maxVerifiesInSingleBlock, 5);
  assert.ok(benchmark.firstActivityBlock > 0);
  assert.ok(benchmark.lastActivityBlock >= benchmark.firstActivityBlock);
  assert.equal(benchmark.averageTotalGas, (totalGas / BigInt(benchmark.samples.length)).toString());
  console.log(JSON.stringify({
    evidenceClass: "REPOSITORY_INTEGRITY",
    benchmark: "parallel-safe Monad AgentGuard V2",
    pipelines: benchmark.samples.length,
    lanes: benchmark.lanes,
    uniqueTransactions: hashes.size,
    passed: true,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
