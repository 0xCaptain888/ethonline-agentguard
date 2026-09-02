import { strict as assert } from "node:assert";
import { test } from "node:test";
import { evaluatePolicy } from "../src/policy-engine";

const base = {
  valueWei: 10n,
  maxValueWei: 20n,
  dailySpentWei: 0n,
  dailyLimitWei: 100n,
  allowedSeller: true,
  riskScore: 10,
  maxRiskScore: 40,
  confirmationProvided: true,
  requireConfirmation: true,
};

test("policy engine allows an in-bound Agent-to-Agent request", () => {
  const decision = evaluatePolicy(base);
  assert.equal(decision.decision, "ALLOW");
  assert.deepEqual(decision.reasons, []);
  assert.match(decision.policyHash, /^0x[0-9a-f]{64}$/);
});

test("policy engine explains a blocked request", () => {
  const decision = evaluatePolicy({ ...base, valueWei: 30n, allowedSeller: false, confirmationProvided: false });
  assert.equal(decision.decision, "BLOCK");
  assert.deepEqual(decision.reasons, ["perTaskBudget", "sellerPermission", "confirmation"]);
});
