import { keccak256, toUtf8Bytes } from "ethers";
import { evaluatePolicy, type PolicyDecision, type PolicyInput } from "../policy-engine";
import type { GraphAgentObservation } from "./graph-agent.js";

export type WorkflowState = "VERIFIED" | "BLOCKED" | "FROZEN";

export type IndependentVerification = {
  passed: boolean;
  reasons: string[];
  checks: Record<string, boolean>;
};

export type AgentCommerceWorkflowInput = {
  taskId: string;
  buyerAgent: string;
  sellerAgent: string;
  policy: PolicyInput;
  graphObservation: GraphAgentObservation;
  /** The wallet provider is an authorization boundary, not the verifier. */
  authorization: {
    provider: "Privy";
    approved: boolean;
    authorizationId: string;
  };
  sellerResult: unknown;
  verifyResult: (context: {
    taskId: string;
    buyerAgent: string;
    sellerAgent: string;
    graphObservation: GraphAgentObservation;
    policy: PolicyDecision;
    sellerResult: unknown;
    resultHash: string;
  }) => IndependentVerification;
};

export type AgentCommerceReceipt = {
  receiptVersion: "1";
  taskId: string;
  buyerAgent: string;
  sellerAgent: string;
  state: WorkflowState;
  releaseEligible: boolean;
  graphEvidenceHash: string;
  policyHash: string;
  decisionHash: string;
  resultHash: string | null;
  authorization: {
    provider: "Privy";
    approved: boolean;
    authorizationId: string;
  };
  verification: IndependentVerification;
  evidenceHash: string;
};

function hashJson(value: unknown): string {
  return keccak256(toUtf8Bytes(JSON.stringify(value)));
}

/**
 * Connects the ETHOnline sponsor boundaries without performing a side effect.
 * A production adapter can replace the authorization and settlement edges;
 * this function keeps policy, verification and evidence deterministic for a
 * judge replay and makes the three failure states explicit.
 */
export function runAgentCommerceWorkflow(input: AgentCommerceWorkflowInput): AgentCommerceReceipt {
  const policy = evaluatePolicy(input.policy);
  const base = {
    receiptVersion: "1" as const,
    taskId: input.taskId,
    buyerAgent: input.buyerAgent,
    sellerAgent: input.sellerAgent,
    graphEvidenceHash: input.graphObservation.evidenceHash,
    policyHash: policy.policyHash,
    decisionHash: policy.decisionHash,
    authorization: input.authorization,
  };

  if (policy.decision === "BLOCK" || !input.authorization.approved) {
    const reasons = policy.reasons.length > 0 ? policy.reasons : ["authorization_not_approved"];
    const verification = { passed: false, reasons, checks: {} };
    const evidenceHash = hashJson({ ...base, state: "BLOCKED", releaseEligible: false, resultHash: null, verification });
    return { ...base, state: "BLOCKED", releaseEligible: false, resultHash: null, verification, evidenceHash };
  }

  const resultHash = hashJson(input.sellerResult);
  const verification = input.verifyResult({
    taskId: input.taskId,
    buyerAgent: input.buyerAgent,
    sellerAgent: input.sellerAgent,
    graphObservation: input.graphObservation,
    policy,
    sellerResult: input.sellerResult,
    resultHash,
  });
  const state: WorkflowState = verification.passed ? "VERIFIED" : "FROZEN";
  const releaseEligible = state === "VERIFIED";
  const evidenceHash = hashJson({ ...base, state, releaseEligible, resultHash, verification });
  return { ...base, state, releaseEligible, resultHash, verification, evidenceHash };
}
