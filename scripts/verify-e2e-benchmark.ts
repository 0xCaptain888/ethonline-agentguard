import assert from "node:assert/strict";
import { readFile } from "node:fs/promises";

type Phase = { txHash: string; blockNumber: number; gasUsed: string; latencyMs: number };
type Sample = { taskId: string; state: string; create: Phase; submit: Phase; verify: Phase; endToEndMs: number; totalGas: string };
type Benchmark = {
  evidenceClass: string;
  chainId: number;
  contract: string;
  tasks: number;
  verified: number;
  averageEndToEndMs: number;
  averageTotalGas: string;
  samples: Sample[];
};

async function main() {
  const benchmark = JSON.parse(await readFile("docs/benchmark-e2e-testnet.json", "utf8")) as Benchmark;
  assert.equal(benchmark.evidenceClass, "LIVE_TESTNET_END_TO_END_BENCHMARK");
  assert.equal(benchmark.chainId, 10143);
  assert.match(benchmark.contract, /^0x[a-fA-F0-9]{40}$/);
  assert.equal(benchmark.tasks, benchmark.samples.length);
  assert.equal(benchmark.verified, benchmark.samples.length);
  assert.ok(benchmark.samples.length >= 25);

  const transactionHashes = new Set<string>();
  let latencyTotal = 0;
  let gasTotal = 0n;
  for (const sample of benchmark.samples) {
    assert.equal(sample.state, "VERIFIED");
    assert.ok(sample.endToEndMs > 0);
    const phases = [sample.create, sample.submit, sample.verify];
    const recomputedGas = phases.reduce((sum, phase) => {
      assert.match(phase.txHash, /^0x[a-fA-F0-9]{64}$/);
      assert.ok(phase.blockNumber > 0);
      assert.ok(phase.latencyMs > 0);
      assert.ok(!transactionHashes.has(phase.txHash));
      transactionHashes.add(phase.txHash);
      return sum + BigInt(phase.gasUsed);
    }, 0n);
    assert.equal(sample.totalGas, recomputedGas.toString());
    latencyTotal += sample.endToEndMs;
    gasTotal += recomputedGas;
  }

  assert.equal(benchmark.averageEndToEndMs, Math.round(latencyTotal / benchmark.samples.length));
  assert.equal(benchmark.averageTotalGas, (gasTotal / BigInt(benchmark.samples.length)).toString());

  console.log(JSON.stringify({
    evidenceClass: "REPOSITORY_INTEGRITY",
    benchmark: "end-to-end Monad Testnet Agent pipeline",
    samples: benchmark.samples.length,
    uniqueTransactions: transactionHashes.size,
    passed: true,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
