import { createDemoReceipts } from "../src/ethonline/demo-fixtures.js";

for (const item of createDemoReceipts()) console.log(JSON.stringify(item, null, 2));

console.log(JSON.stringify({ sponsorStatus: { arc: "LIVE_TESTNET", graph: "LIVE_EXTERNAL_DATA", privy: "LIVE_TESTNET" }, note: "This command is a credential-free deterministic replay. Public Arc, The Graph and Privy evidence is indexed separately in evidence/ethonline-manifest.json." }, null, 2));
