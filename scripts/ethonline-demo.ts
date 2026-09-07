import { createDemoReceipts } from "../src/ethonline/demo-fixtures.js";

for (const item of createDemoReceipts()) console.log(JSON.stringify(item, null, 2));

console.log(JSON.stringify({ sponsorStatus: { arc: "DESIGN", graph: "ADAPTER_READY", privy: "DESIGN" }, note: "No wallet, API key or chain write was used." }, null, 2));
