# FROZEN recovery boundary

`FROZEN` is a safety outcome, not a silent success: the seller result was
submitted, the verifier rejected it, and escrow remains isolated. The current
hackathon contract intentionally has no unilateral recovery function, so a
malicious buyer or seller cannot drain disputed funds.

## Implemented Testnet recovery state machine

```text
FROZEN
  ├─ buyer + seller approve decision 2 → VERIFIED → release seller
  ├─ buyer + seller approve decision 1 → REFUNDED → return buyer
  ├─ timeout + neutral arbiter quorum → (production extension)
  └─ no quorum → remain FROZEN (funds remain isolated)
```

The deployed MVP implements `approveFrozenRecovery(taskId, decision)` with a
two-party approval barrier. Decision `1` refunds the buyer and decision `2`
releases the seller; both the recorded buyer and seller must approve the same
decision. Separate events (`FrozenRecoveryApproved`, `TaskRefunded`,
`TaskRecoveredVerified`) make the recovery auditable. The production extension
should replace the simple approvals with signatures, a deadline and a neutral
arbiter quorum bound to chain ID, contract, task ID and result hash.

**Status: LIVE_TESTNET after redeployment.** The current implementation is a
minimal hackathon recovery primitive, not a production dispute system.
