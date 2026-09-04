# ETHOnline architecture

```text
┌──────────────────────┐
│ TreasuryPlanner      │  proposes task + budget
└──────────┬───────────┘
           ▼
┌──────────────────────┐     live query      ┌──────────────────────┐
│ The Graph provider   │ ◀─────────────────── │ YieldScout           │
└──────────┬───────────┘                      └──────────┬───────────┘
           ▼                                             │ observation hash
┌──────────────────────┐                                  ▼
│ Policy Engine        │ ── BLOCKED (no write) ──┐  ┌───────────────┐
│ budget/permission/  │                          └▶ │ Privy control │
│ risk/confirmation    │                             └──────┬────────┘
└──────────┬───────────┘                                    ▼
           │                                      ┌──────────────────┐
           └────────────────────────────────────▶ │ Arc USDC escrow  │
                                                  └────────┬─────────┘
                                                           ▼
                                                  ┌──────────────────┐
                                                  │ Seller Agent      │
                                                  └────────┬─────────┘
                                                           ▼
                                                  ┌──────────────────┐
                                                  │ Independent       │
                                                  │ Verifier          │
                                                  └────────┬─────────┘
                                                           ▼
                                      ┌─────────────────────────────────┐
                                      │ VERIFIED → release USDC          │
                                      │ BLOCKED  → refund before work    │
                                      │ FROZEN   → isolate + recover     │
                                      └────────────────┬────────────────┘
                                                       ▼
                                      receipt + source/policy/result hash
```

Authority is intentionally split: the planner proposes, the policy engine
authorizes, Privy supplies wallet controls, Arc holds the escrow, and the
independent verifier decides whether a result is acceptable.
