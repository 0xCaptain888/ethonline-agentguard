const checks = [
  { name: "Arc RPC", env: "ARC_RPC_URL", requiredFor: "Arc deployment" },
  { name: "Arc chain", env: "ARC_CHAIN_ID", requiredFor: "Arc deployment" },
  { name: "Arc USDC", env: "ARC_USDC_ADDRESS", requiredFor: "ERC-20 escrow" },
  { name: "The Graph endpoint", env: "GRAPH_SUBGRAPH_URL", requiredFor: "live indexed data" },
  { name: "The Graph slug", env: "GRAPH_SUBGRAPH_SLUG", requiredFor: "Studio deployment identity" },
  { name: "Privy app", env: "PRIVY_APP_ID", requiredFor: "wallet authorization" },
  { name: "Privy secret", env: "PRIVY_APP_SECRET", requiredFor: "server API authentication" },
  { name: "Privy wallet", env: "PRIVY_WALLET_ID", requiredFor: "wallet authorization" },
  { name: "Privy wallet address", env: "PRIVY_WALLET_ADDRESS", requiredFor: "wallet identity binding" },
  { name: "Privy JWKS", env: "PRIVY_JWKS_URL", requiredFor: "token verification" }
];

const result = checks.map(({ name, env, requiredFor }) => ({
  name,
  env,
  requiredFor,
  configured: Boolean(process.env[env])
}));

console.log(JSON.stringify({
  evidenceClass: "CONFIGURATION_PREFLIGHT",
  configured: result.filter((entry) => entry.configured).map((entry) => entry.name),
  missing: result.filter((entry) => !entry.configured).map((entry) => ({ env: entry.env, requiredFor: entry.requiredFor })),
  safeToRun: "No chain write is performed by this command.",
  checks: result
}, null, 2));
