# FROZEN recovery boundary (design)

`FROZEN` is a safety outcome, not a silent success: the seller result was
submitted, the verifier rejected it, and escrow remains isolated. The current
hackathon contract intentionally has no unilateral recovery function, so a
malicious buyer or seller cannot drain disputed funds.

## Proposed production state machine

```text
FROZEN
  ├─ verifier confirms correction → VERIFIED → release seller
  ├─ buyer + seller mutual approval → REFUNDED → return buyer
  ├─ timeout + neutral arbiter quorum → REFUNDED or VERIFIED
  └─ no quorum → remain FROZEN (funds remain isolated)
```

Any implementation should bind recovery signatures to the same chain ID,
contract, task ID, result/evidence hash and decision nonce used for settlement.
Recovery must emit a separate event and receipt, and should use a deadline so
the system cannot remain ambiguous forever.

**Status: DESIGN.** This is deliberately not presented as a live capability of
the deployed Monad Testnet MVP.
