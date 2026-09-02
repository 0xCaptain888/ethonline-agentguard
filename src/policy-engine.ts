import { keccak256, toUtf8Bytes } from "ethers";

export type PolicyInput = {
  valueWei: bigint;
  maxValueWei: bigint;
  dailySpentWei: bigint;
  dailyLimitWei: bigint;
  allowedSeller: boolean;
  riskScore: number;
  maxRiskScore: number;
  confirmationProvided: boolean;
  requireConfirmation: boolean;
};

export type PolicyDecision = {
  decision: "ALLOW" | "BLOCK";
  reasons: string[];
  checks: Record<string, boolean>;
  policyHash: string;
  decisionHash: string;
};

/**
 * Deterministic, side-effect-free policy evaluation for the planner boundary.
 * The contract remains the final authority; this module makes the reason for a
 * BLOCKED decision inspectable before a transaction is submitted.
 */
export function evaluatePolicy(input: PolicyInput): PolicyDecision {
  const checks = {
    perTaskBudget: input.valueWei > 0n && input.valueWei <= input.maxValueWei,
    dailyBudget: input.dailySpentWei + input.valueWei <= input.dailyLimitWei,
    sellerPermission: input.allowedSeller,
    riskLimit: input.riskScore <= input.maxRiskScore,
    confirmation: !input.requireConfirmation || input.confirmationProvided,
  };
  const reasons = Object.entries(checks)
    .filter(([, passed]) => !passed)
    .map(([name]) => name);
  const policyPayload = JSON.stringify({
    maxValueWei: input.maxValueWei.toString(),
    dailyLimitWei: input.dailyLimitWei.toString(),
    maxRiskScore: input.maxRiskScore,
    requireConfirmation: input.requireConfirmation,
  });
  const policyHash = keccak256(toUtf8Bytes(policyPayload));
  const decisionPayload = JSON.stringify({ policyHash, checks, reasons });
  return {
    decision: reasons.length === 0 ? "ALLOW" : "BLOCK",
    reasons,
    checks,
    policyHash,
    decisionHash: keccak256(toUtf8Bytes(decisionPayload)),
  };
}
