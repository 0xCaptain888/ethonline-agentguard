import { queryPrivyWallet } from "../src/ethonline/privy-agent.js";
import { readFile } from "node:fs/promises";

async function main() {
  const appId = process.env.PRIVY_APP_ID;
  const appSecret = process.env.PRIVY_APP_SECRET;
  const walletId = process.env.PRIVY_LIVE_WALLET_ID ?? process.env.PRIVY_WALLET_ID;
  const walletAddress = process.env.PRIVY_LIVE_WALLET_ADDRESS ?? process.env.PRIVY_WALLET_ADDRESS;
  if (!appId || !appSecret || !walletId) {
    const committed = JSON.parse(await readFile("evidence/arc-testnet-privy-authorized-task.json", "utf8")) as {
      state?: string;
      privyAuthorization?: { walletId?: string; policyId?: string; authorizedTransactions?: unknown[]; authorizationEvidenceHash?: string };
    };
    if (committed.state !== "VERIFIED" || !committed.privyAuthorization?.policyId ||
        (committed.privyAuthorization.authorizedTransactions?.length ?? 0) < 1 ||
        !committed.privyAuthorization.authorizationEvidenceHash) {
      throw new Error("committed Privy evidence is incomplete");
    }
    console.log(JSON.stringify({
      status: "LIVE_TESTNET_COMMITTED_EVIDENCE",
      evidenceClass: "LIVE_TESTNET",
      authorizedTransactions: committed.privyAuthorization.authorizedTransactions?.length,
      authorizationEvidenceHash: committed.privyAuthorization.authorizationEvidenceHash,
      note: "No credentials were available, so the public committed receipt was checked without a Privy API request.",
    }, null, 2));
    return;
  }
  const evidence = await queryPrivyWallet({
    appId,
    appSecret,
    walletId,
    expectedAddress: walletAddress,
  });
  console.log(JSON.stringify({
    status: evidence.authorizationReady ? "WALLET_POLICY_BOUNDARY_READY" : "WALLET_EXISTS_POLICY_PENDING",
    evidenceClass: "LIVE_EXTERNAL_DATA",
    evidence,
    note: "Read-only metadata check for the same Privy wallet that produced the committed Arc transaction evidence.",
  }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
