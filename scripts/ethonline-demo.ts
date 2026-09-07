import { runAgentCommerceWorkflow } from "../src/ethonline/workflow.js";

type DemoCase = { name: string; value: number; max: number; risk: number; maxRisk: number; sellerPermitted: boolean; confirmation: boolean };

const cases: DemoCase[] = [
  { name: "verified-candidate", value: 5, max: 10, risk: 20, maxRisk: 40, sellerPermitted: true, confirmation: true },
  { name: "blocked-budget", value: 15, max: 10, risk: 20, maxRisk: 40, sellerPermitted: true, confirmation: true },
  { name: "frozen-bad-output", value: 5, max: 10, risk: 20, maxRisk: 40, sellerPermitted: true, confirmation: true },
];

for (const item of cases) {
  const receipt = runAgentCommerceWorkflow({
    taskId: `demo-${item.name}`,
    buyerAgent: "TreasuryPlanner",
    sellerAgent: "YieldScout",
    graphObservation: {
      source: "The Graph",
      endpoint: "https://example.test/subgraph",
      fetchedAt: "2026-09-07T00:00:00.000Z",
      query: "query DemoPools { pools { id tvl } }",
      variables: {},
      data: { pools: [{ id: "pool-1", tvl: 1000000 }] },
      evidenceHash: "0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa",
    },
    authorization: { provider: "Privy", approved: true, authorizationId: "simulation-auth" },
    sellerResult: { recommendation: "pool-1", risk: "bounded" },
    verifyResult: ({ resultHash }) => item.name === "frozen-bad-output"
      ? { passed: false, reasons: ["result_does_not_match_policy"], checks: { resultHashBound: false } }
      : { passed: true, reasons: [], checks: { resultHashBound: Boolean(resultHash) } },
    policy: {
      valueWei: BigInt(item.value) * 1_000_000n,
      maxValueWei: BigInt(item.max) * 1_000_000n,
      dailySpentWei: 0n,
      dailyLimitWei: 50_000_000n,
      allowedSeller: item.sellerPermitted,
      riskScore: item.risk,
      maxRiskScore: item.maxRisk,
      confirmationProvided: item.confirmation,
      requireConfirmation: true,
    },
  });
  console.log(JSON.stringify({ case: item.name, state: receipt.state, receipt }, null, 2));
}

console.log(JSON.stringify({ sponsorStatus: { arc: "DESIGN", graph: "ADAPTER_READY", privy: "DESIGN" }, note: "No wallet, API key or chain write was used." }, null, 2));
