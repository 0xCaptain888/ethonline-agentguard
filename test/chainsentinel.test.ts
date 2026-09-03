import { strict as assert } from "node:assert";
import { test } from "node:test";
import { computeChainSentinelHash, verifyChainSentinelReport } from "../src/chainsentinel";

test("ChainSentinel verifier accepts a fresh Monad report", () => {
  const now = 1_800_000_000_000;
  const payload: any = { schema: "chainsentinel.monad.network.v1", agent: "ChainSentinel", network: "Monad Testnet", chainId: 10143, observedAt: new Date(now).toISOString(), latestBlock: 100, latestBlockTimestamp: now / 1000 - 5, gasPriceWei: "50000000000", baseFeePerGasWei: "50000000000", sample: { fromBlock: 90, toBlock: 100, blocks: 10, averageBlockTimeMs: 400 }, assessment: { rpcResponsive: true, chainCorrect: true, freshness: "FRESH" } };
  const report = { ...payload, resultHash: computeChainSentinelHash(payload) };
  assert.equal(verifyChainSentinelReport(report, now).passed, true);
});

test("ChainSentinel verifier rejects stale or wrong-chain output", () => {
  const result = verifyChainSentinelReport({ schema: "chainsentinel.monad.network.v1", agent: "ChainSentinel", network: "Ethereum", chainId: 1, latestBlock: 1, latestBlockTimestamp: 1, gasPriceWei: "x", sample: {} }, 1_800_000_000_000);
  assert.equal(result.passed, false);
  assert.ok(result.reasons.includes("network_check_failed"));
  assert.ok(result.reasons.includes("freshness_check_failed"));
});
