import { createDemoReceipts } from "../src/ethonline/demo-fixtures.js";

for (const item of createDemoReceipts()) console.log(JSON.stringify(item, null, 2));

console.log(JSON.stringify({ sponsorStatus: { arc: "LIVE_TESTNET", graph: "LIVE_EXTERNAL_DATA", privy: "LIVE_TESTNET" }, liveOutcomes: { VERIFIED: "LIVE_TESTNET", BLOCKED: "LIVE_TESTNET", FROZEN: "LIVE_TESTNET" }, note: "This command remains a credential-free deterministic replay. Separate public Arc receipts prove all three live outcomes in evidence/ethonline-manifest.json." }, null, 2));
