import { strict as assert } from "node:assert";
import { test } from "node:test";
import { computeYieldScoutResultHash, DEFILLAMA_POOLS_URL, verifyYieldScoutReport } from "../src/yieldscout";

test("independent YieldScout verifier accepts a bounded Monad report", () => {
  const report: any = {
    schema: "yieldscout.monad.liquidity.v1",
    agent: "YieldScout",
    requestedChain: "Monad",
    source: { name: "DeFiLlama", endpoint: DEFILLAMA_POOLS_URL, fetchedAt: new Date().toISOString() },
    pools: [
      { pool: "a", project: "demo", chain: "Monad", symbol: "MON-USDC", tvlUsd: 1200, apy: 4.2, apyPct1D: 0.4 },
      { pool: "b", project: "demo", chain: "Monad", symbol: "MON-USDT", tvlUsd: 900, apy: null, apyPct1D: null },
    ],
    methodology: { ranking: "tvlUsd_desc", risk: "heuristic_only", note: "test" },
  };
  report.resultHash = computeYieldScoutResultHash(report);
  const result = verifyYieldScoutReport(report);
  assert.equal(result.passed, true);
});

test("independent verifier rejects an unbounded or wrong-chain report", () => {
  const result = verifyYieldScoutReport({
    schema: "yieldscout.monad.liquidity.v1",
    agent: "YieldScout",
    requestedChain: "Monad",
    source: { name: "DeFiLlama", endpoint: DEFILLAMA_POOLS_URL },
    pools: [{ chain: "Ethereum", tvlUsd: -1 }],
    resultHash: "not-a-hash",
  });
  assert.equal(result.passed, false);
  assert.ok(result.reasons.includes("chain_check_failed"));
});
