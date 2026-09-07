import { createDemoReceipts } from "../src/ethonline/demo-fixtures.js";
import { verifyAgentCommerceReceipt } from "../src/ethonline/receipt.js";

const results = createDemoReceipts().map(({ case: name, receipt }) => {
  const verification = verifyAgentCommerceReceipt(receipt);
  if (!verification.valid) throw new Error(`${name}: ${verification.errors.join(", ")}`);
  return { case: name, state: receipt.state, releaseEligible: receipt.releaseEligible, evidenceHash: receipt.evidenceHash, valid: true };
});

console.log(JSON.stringify({ evidenceClass: "SIMULATION_RECEIPT_INTEGRITY", receipts: results, passed: true }, null, 2));
