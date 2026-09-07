import { queryPrivyWallet } from "../src/ethonline/privy-agent.js";

async function main() {
  const appId = process.env.PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  const walletId = process.env.PRIVY_WALLET_ID;
  if (!appId || !appSecret || !walletId) {
    console.log(JSON.stringify({
      status: "DESIGN",
      reason: "Privy local credentials are incomplete; no network request was made.",
      required: ["PRIVY_APP_ID", "PRIVY_APP_SECRET", "PRIVY_WALLET_ID"],
    }, null, 2));
    return;
  }
  const evidence = await queryPrivyWallet({
    appId,
    appSecret,
    walletId,
    expectedAddress: process.env.PRIVY_WALLET_ADDRESS,
  });
  console.log(JSON.stringify({
    status: evidence.authorizationReady ? "WALLET_POLICY_BOUNDARY_READY" : "WALLET_EXISTS_POLICY_PENDING",
    evidenceClass: "LIVE_EXTERNAL_DATA",
    evidence,
    note: "Read-only metadata proof. Manifest remains DESIGN until this authorization controls an Arc transaction.",
  }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
