import { keccak256, toUtf8Bytes } from "ethers";

export const CHAINSENTINEL_SCHEMA = "chainsentinel.monad.network.v1";

export type ChainSentinelProvider = {
  getNetwork(): Promise<{ chainId: bigint }>;
  getBlock(tag: number | "latest"): Promise<{ number: number; timestamp: number; baseFeePerGas?: bigint | null } | null>;
  getFeeData(): Promise<{ gasPrice?: bigint | null }>;
};

export type ChainSentinelReport = {
  schema: typeof CHAINSENTINEL_SCHEMA;
  agent: "ChainSentinel";
  network: "Monad Testnet";
  chainId: 10143;
  observedAt: string;
  latestBlock: number;
  latestBlockTimestamp: number;
  gasPriceWei: string;
  baseFeePerGasWei: string | null;
  sample: { fromBlock: number; toBlock: number; blocks: number; averageBlockTimeMs: number };
  assessment: { rpcResponsive: true; chainCorrect: true; freshness: "FRESH" | "STALE" };
  resultHash: string;
};

export function computeChainSentinelHash(report: Omit<ChainSentinelReport, "resultHash">): string {
  return keccak256(toUtf8Bytes(JSON.stringify(report)));
}

/** Monad-native seller task: read recent blocks and fee data without writing. */
export async function fetchChainSentinelReport(provider: ChainSentinelProvider): Promise<ChainSentinelReport> {
  const network = await provider.getNetwork();
  if (network.chainId !== 10143n) throw new Error(`ChainSentinel expected chain 10143, got ${network.chainId}`);
  const latest = await provider.getBlock("latest");
  if (!latest) throw new Error("latest Monad block unavailable");
  const fromNumber = Math.max(0, latest.number - 10);
  const from = await provider.getBlock(fromNumber);
  if (!from) throw new Error(`Monad block ${fromNumber} unavailable`);
  const feeData = await provider.getFeeData();
  const elapsedSeconds = Math.max(0, latest.timestamp - from.timestamp);
  const sampledBlocks = Math.max(1, latest.number - from.number);
  const observedAt = new Date().toISOString();
  const ageSeconds = Math.max(0, Math.floor(Date.now() / 1000) - latest.timestamp);
  const payload: Omit<ChainSentinelReport, "resultHash"> = {
    schema: CHAINSENTINEL_SCHEMA,
    agent: "ChainSentinel",
    network: "Monad Testnet",
    chainId: 10143,
    observedAt,
    latestBlock: latest.number,
    latestBlockTimestamp: latest.timestamp,
    gasPriceWei: (feeData.gasPrice ?? 0n).toString(),
    baseFeePerGasWei: latest.baseFeePerGas?.toString() ?? null,
    sample: { fromBlock: from.number, toBlock: latest.number, blocks: sampledBlocks, averageBlockTimeMs: Math.round((elapsedSeconds * 1000) / sampledBlocks) },
    assessment: { rpcResponsive: true, chainCorrect: true, freshness: ageSeconds <= 120 ? "FRESH" : "STALE" },
  };
  return { ...payload, resultHash: computeChainSentinelHash(payload) };
}

export function verifyChainSentinelReport(report: unknown, nowMs = Date.now()) {
  const value = report as Partial<ChainSentinelReport> | null;
  const ageSeconds = value?.latestBlockTimestamp ? Math.floor(nowMs / 1000) - value.latestBlockTimestamp : Number.POSITIVE_INFINITY;
  const checks = {
    schema: value?.schema === CHAINSENTINEL_SCHEMA,
    identity: value?.agent === "ChainSentinel",
    network: value?.network === "Monad Testnet" && value?.chainId === 10143,
    block: Number.isInteger(value?.latestBlock) && Number(value?.latestBlock) > 0,
    freshness: ageSeconds >= -30 && ageSeconds <= 600,
    sample: Number(value?.sample?.blocks) > 0 && Number(value?.sample?.averageBlockTimeMs) >= 0 && value?.sample?.toBlock === value?.latestBlock,
    fees: typeof value?.gasPriceWei === "string" && /^\d+$/.test(value.gasPriceWei),
    resultHash: (() => {
      try {
        if (!value?.resultHash || !/^0x[0-9a-fA-F]{64}$/.test(value.resultHash)) return false;
        const { resultHash, ...payload } = value as ChainSentinelReport;
        return computeChainSentinelHash(payload) === resultHash;
      } catch { return false; }
    })(),
  };
  const reasons = Object.entries(checks).filter(([, passed]) => !passed).map(([name]) => `${name}_check_failed`);
  return { passed: reasons.length === 0, reasons, checks };
}
