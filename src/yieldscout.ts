import { keccak256, toUtf8Bytes } from "ethers";

export const YIELDSCOUT_SCHEMA = "yieldscout.monad.liquidity.v1";
export const DEFILLAMA_POOLS_URL = "https://yields.llama.fi/pools";

export type YieldPool = {
  pool: string;
  project: string;
  chain: string;
  symbol: string;
  tvlUsd: number;
  apy: number | null;
  apyPct1D: number | null;
  url?: string;
};

export type YieldScoutReport = {
  schema: typeof YIELDSCOUT_SCHEMA;
  agent: "YieldScout";
  requestedChain: "Monad";
  source: { name: "DeFiLlama"; endpoint: string; fetchedAt: string };
  pools: YieldPool[];
  methodology: {
    ranking: "tvlUsd_desc";
    risk: "heuristic_only";
    note: string;
  };
  resultHash: string;
};

type DeFiLlamaPool = Record<string, unknown>;

function reportPayload(report: Omit<YieldScoutReport, "resultHash">) {
  return {
    schema: report.schema,
    agent: report.agent,
    requestedChain: report.requestedChain,
    source: report.source,
    pools: report.pools,
    methodology: report.methodology,
  };
}

export function computeYieldScoutResultHash(report: Omit<YieldScoutReport, "resultHash">): string {
  return keccak256(toUtf8Bytes(JSON.stringify(reportPayload(report))));
}

function finiteNumber(value: unknown): number | null {
  return typeof value === "number" && Number.isFinite(value) ? value : null;
}

function normalizePool(pool: DeFiLlamaPool): YieldPool | null {
  const tvlUsd = finiteNumber(pool.tvlUsd);
  const project = typeof pool.project === "string" ? pool.project : "unknown";
  const chain = typeof pool.chain === "string" ? pool.chain : "unknown";
  const symbol = typeof pool.symbol === "string" ? pool.symbol : "unknown";
  const id = typeof pool.pool === "string" ? pool.pool : "";
  if (!id || tvlUsd === null || tvlUsd <= 0) return null;
  const url = typeof pool.url === "string" ? pool.url : undefined;
  return { pool: id, project, chain, symbol, tvlUsd, apy: finiteNumber(pool.apy), apyPct1D: finiteNumber(pool.apyPct1D), ...(url ? { url } : {}) };
}

/** Deterministic, read-only external-data task performed by the seller agent. */
export async function fetchYieldScoutReport(fetcher: typeof fetch = fetch): Promise<YieldScoutReport> {
  const response = await fetcher(DEFILLAMA_POOLS_URL, { signal: AbortSignal.timeout(15_000) });
  if (!response.ok) throw new Error(`DeFiLlama request failed: ${response.status}`);
  const body = (await response.json()) as { data?: DeFiLlamaPool[] };
  const pools = (body.data ?? [])
    .filter((pool) => String(pool.chain).toLowerCase() === "monad")
    .map(normalizePool)
    .filter((pool): pool is YieldPool => pool !== null)
    .sort((a, b) => b.tvlUsd - a.tvlUsd)
    .slice(0, 5);
  if (pools.length === 0) throw new Error("DeFiLlama returned no Monad pools");
  const payload = {
    schema: YIELDSCOUT_SCHEMA as typeof YIELDSCOUT_SCHEMA,
    agent: "YieldScout" as const,
    requestedChain: "Monad" as const,
    source: { name: "DeFiLlama" as const, endpoint: DEFILLAMA_POOLS_URL, fetchedAt: new Date().toISOString() },
    pools,
    methodology: { ranking: "tvlUsd_desc" as const, risk: "heuristic_only" as const, note: "TVL is a discovery signal, not investment advice; an independent verifier must apply task-specific risk rules." },
  };
  const resultHash = computeYieldScoutResultHash(payload);
  return { ...payload, resultHash };
}

/** Independent verifier: validates structure, source, chain and conservative output bounds. */
export function verifyYieldScoutReport(report: unknown): { passed: boolean; reasons: string[]; checks: Record<string, boolean> } {
  const value = report as Partial<YieldScoutReport> | null;
  const pools = Array.isArray(value?.pools) ? value.pools : [];
  const checks = {
    schema: value?.schema === YIELDSCOUT_SCHEMA,
    agent: value?.agent === "YieldScout",
    source: value?.source?.name === "DeFiLlama" && value?.source?.endpoint === DEFILLAMA_POOLS_URL,
    chain: value?.requestedChain === "Monad" && pools.every((pool) => pool && pool.chain === "Monad"),
    ranked: pools.length > 0 && pools.length <= 5 && pools.every((pool, i) => i === 0 || Number(pool.tvlUsd) <= Number(pools[i - 1].tvlUsd)),
    boundedNumbers: pools.every((pool) => Number.isFinite(pool.tvlUsd) && pool.tvlUsd > 0 && (pool.apy === null || Number.isFinite(pool.apy))),
    resultHash: typeof value?.resultHash === "string" && /^0x[0-9a-fA-F]{64}$/.test(value.resultHash) && (() => {
      try {
        const { resultHash: _ignored, ...withoutHash } = value as YieldScoutReport;
        return computeYieldScoutResultHash(withoutHash) === value.resultHash;
      } catch { return false; }
    })(),
  };
  const reasons = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => `${name}_check_failed`);
  return { passed: reasons.length === 0, reasons, checks };
}
