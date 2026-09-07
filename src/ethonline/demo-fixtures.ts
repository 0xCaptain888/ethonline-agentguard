import { runAgentCommerceWorkflow, type AgentCommerceReceipt } from "./workflow.js";

export type DemoReceipt = { case: "verified-candidate" | "blocked-budget" | "frozen-bad-output"; receipt: AgentCommerceReceipt };

/** Deterministic, no-network fixtures used by the CLI and receipt verifier. */
export function createDemoReceipts(): DemoReceipt[] {
  const cases = [
    { name: "verified-candidate" as const, value: 5, max: 10 },
    { name: "blocked-budget" as const, value: 15, max: 10 },
    { name: "frozen-bad-output" as const, value: 5, max: 10 },
  ];
  return cases.map((item) => ({
    case: item.name,
    receipt: runAgentCommerceWorkflow({
      taskId: `demo-${item.name}`,
      buyerAgent: "TreasuryPlanner",
      sellerAgent: "YieldScout",
      graphObservation: {
        source: "The Graph",
        endpoint: "https://example.test/subgraph",
        fetchedAt: "2026-09-07T00:00:00.000Z",
        query: "query DemoPools { pools { id tvl } }",
        variables: {},
        data: { pools: [{ id: "pool-1", tvl: 1_000_000 }] },
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
        allowedSeller: true,
        riskScore: 20,
        maxRiskScore: 40,
        confirmationProvided: true,
        requireConfirmation: true,
      },
    }),
  }));
}
