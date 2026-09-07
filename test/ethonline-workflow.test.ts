import { strict as assert } from "node:assert";
import { test } from "node:test";
import { runAgentCommerceWorkflow } from "../src/ethonline/workflow";

const graphObservation = {
  source: "The Graph" as const,
  endpoint: "https://example.test/subgraph",
  fetchedAt: "2026-09-07T00:00:00.000Z",
  query: "query DemoPools { pools { id tvl } }",
  variables: {},
  data: { pools: [{ id: "pool-1", tvl: 1_000_000 }] },
  evidenceHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
};

const policy = {
  valueWei: 5n,
  maxValueWei: 10n,
  dailySpentWei: 0n,
  dailyLimitWei: 50n,
  allowedSeller: true,
  riskScore: 20,
  maxRiskScore: 40,
  confirmationProvided: true,
  requireConfirmation: true,
};

function run(overrides: Partial<Parameters<typeof runAgentCommerceWorkflow>[0]> = {}) {
  return runAgentCommerceWorkflow({
    taskId: "test-task",
    buyerAgent: "TreasuryPlanner",
    sellerAgent: "YieldScout",
    policy,
    graphObservation,
    authorization: { provider: "Privy", approved: true, authorizationId: "test-auth" },
    sellerResult: { recommendation: "pool-1", risk: "bounded" },
    verifyResult: ({ resultHash }) => ({
      passed: Boolean(resultHash),
      reasons: [],
      checks: { resultHashBound: Boolean(resultHash) },
    }),
    ...overrides,
  });
}

test("agent commerce is VERIFIED only after independent verification", () => {
  const receipt = run();
  assert.equal(receipt.state, "VERIFIED");
  assert.equal(receipt.releaseEligible, true);
  assert.match(receipt.evidenceHash, /^0x[0-9a-f]{64}$/);
});

test("policy failure is BLOCKED before seller verification", () => {
  let verifierCalled = false;
  const receipt = run({
    policy: { ...policy, valueWei: 20n },
    verifyResult: () => {
      verifierCalled = true;
      return { passed: true, reasons: [], checks: {} };
    },
  });
  assert.equal(receipt.state, "BLOCKED");
  assert.equal(receipt.releaseEligible, false);
  assert.equal(verifierCalled, false);
  assert.ok(receipt.verification.reasons.includes("perTaskBudget"));
});

test("bad seller output is FROZEN after execution", () => {
  const receipt = run({
    verifyResult: () => ({
      passed: false,
      reasons: ["result_does_not_match_policy"],
      checks: { resultHashBound: false },
    }),
  });
  assert.equal(receipt.state, "FROZEN");
  assert.equal(receipt.releaseEligible, false);
  assert.equal(receipt.verification.passed, false);
});

test("Privy authorization denial is BLOCKED without a seller result hash", () => {
  const receipt = run({
    authorization: { provider: "Privy", approved: false, authorizationId: "denied-auth" },
  });
  assert.equal(receipt.state, "BLOCKED");
  assert.equal(receipt.resultHash, null);
  assert.ok(receipt.verification.reasons.includes("authorization_not_approved"));
});
