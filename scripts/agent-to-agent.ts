import { evaluatePolicy } from "../src/policy-engine.js";

/**
 * Judge-friendly, deterministic workflow preview. This intentionally does not
 * send a transaction: use task:testnet for the live Monad path.
 */
const request = {
  taskId: "research-monad-liquidity-001",
  buyerAgent: "TreasuryPlanner",
  sellerAgent: "YieldScout",
  task: "Collect the top 5 Monad testnet liquidity pools and return a signed JSON report.",
  valueWei: 10_000_000_000_000_000n,
  maxValueWei: 50_000_000_000_000_000n,
  dailySpentWei: 20_000_000_000_000_000n,
  dailyLimitWei: 100_000_000_000_000_000n,
  allowedSeller: true,
  riskScore: 18,
  maxRiskScore: 40,
  requireConfirmation: true,
  confirmationProvided: true,
};

const decision = evaluatePolicy(request);
const resultHash = "0x" + "research-result-placeholder".repeat(4).slice(0, 64);
console.log(JSON.stringify({
  evidenceClass: "SIMULATION",
  workflow: [
    "TreasuryPlanner proposes task",
    "policy-engine evaluates budget, permission, risk and confirmation",
    "YieldScout executes the requested research",
    "Independent verifier checks resultHash",
    "MonadAgentGuard settles only after verification",
  ],
  request: { ...request, valueWei: request.valueWei.toString(), maxValueWei: request.maxValueWei.toString(), dailySpentWei: request.dailySpentWei.toString(), dailyLimitWei: request.dailyLimitWei.toString() },
  decision,
  resultHash,
  nextLiveCommand: "npm run task:testnet",
}, null, 2));
