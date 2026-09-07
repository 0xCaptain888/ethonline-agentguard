import { keccak256, toUtf8Bytes } from "ethers";
import type { AgentCommerceReceipt } from "./workflow.js";

const hashPattern = /^0x[0-9a-fA-F]{64}$/;

/** Recomputes the exact evidence payload used by the workflow receipt. */
export function hashAgentCommerceReceipt(receipt: AgentCommerceReceipt): string {
  const { evidenceHash: _ignored, ...payload } = receipt;
  return keccak256(toUtf8Bytes(JSON.stringify(payload)));
}

export type ReceiptVerification = {
  valid: boolean;
  errors: string[];
  recomputedEvidenceHash: string;
};

/** Independent, side-effect-free receipt verification for judges and API consumers. */
export function verifyAgentCommerceReceipt(receipt: AgentCommerceReceipt): ReceiptVerification {
  const errors: string[] = [];
  const recomputedEvidenceHash = hashAgentCommerceReceipt(receipt);
  if (!hashPattern.test(receipt.evidenceHash)) errors.push("malformed_evidence_hash");
  if (receipt.evidenceHash !== recomputedEvidenceHash) errors.push("evidence_hash_mismatch");
  if (receipt.state === "VERIFIED" && (!receipt.releaseEligible || !receipt.verification.passed)) errors.push("verified_state_invariant_failed");
  if (receipt.state === "BLOCKED" && (receipt.releaseEligible || receipt.resultHash !== null || receipt.verification.passed)) errors.push("blocked_state_invariant_failed");
  if (receipt.state === "FROZEN" && (receipt.releaseEligible || receipt.resultHash === null || receipt.verification.passed)) errors.push("frozen_state_invariant_failed");
  return { valid: errors.length === 0, errors, recomputedEvidenceHash };
}
