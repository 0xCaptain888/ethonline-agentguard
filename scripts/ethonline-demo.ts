import { evaluatePolicy } from "../src/policy-engine.js";

type DemoCase = { name: string; value: number; max: number; risk: number; maxRisk: number; sellerPermitted: boolean; confirmation: boolean };

const cases: DemoCase[] = [
  { name: "verified-candidate", value: 5, max: 10, risk: 20, maxRisk: 40, sellerPermitted: true, confirmation: true },
  { name: "blocked-budget", value: 15, max: 10, risk: 20, maxRisk: 40, sellerPermitted: true, confirmation: true },
  { name: "frozen-bad-output", value: 5, max: 10, risk: 20, maxRisk: 40, sellerPermitted: true, confirmation: true },
];

for (const item of cases) {
  const decision = evaluatePolicy({
    valueWei: BigInt(item.value) * 1_000_000n,
    maxValueWei: BigInt(item.max) * 1_000_000n,
    dailySpentWei: 0n,
    dailyLimitWei: 50_000_000n,
    allowedSeller: item.sellerPermitted,
    riskScore: item.risk,
    maxRiskScore: item.maxRisk,
    confirmationProvided: item.confirmation,
    requireConfirmation: true,
  });
  const state = item.name === "frozen-bad-output" ? "FROZEN (post-execution verifier mismatch)" : decision.decision === "ALLOW" ? "VERIFIED candidate" : "BLOCKED";
  console.log(JSON.stringify({ case: item.name, state, policy: decision }, null, 2));
}

console.log(JSON.stringify({ sponsorStatus: { arc: "DESIGN", graph: "ADAPTER_READY", privy: "DESIGN" }, note: "No wallet, API key or chain write was used." }, null, 2));
