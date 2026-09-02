# Architecture: bounded Agent-to-Agent execution

```text
┌──────────────────┐   task proposal   ┌────────────────────┐
│ TreasuryPlanner  │ ─────────────────▶ │ Policy Engine       │
│ (buyer agent)    │                    │ budget · permission │
└──────────────────┘                    │ risk · confirmation │
                                        └─────────┬──────────┘
                                      ALLOW/BLOCK │ decision hash
                                                  ▼
                                        ┌────────────────────┐
                                        │ MonadAgentGuard    │
                                        │ identity + escrow  │
                                        └─────────┬──────────┘
                                                  │ task
                                                  ▼
                                        ┌────────────────────┐
                                        │ YieldScout          │
                                        │ (seller agent)      │
                                        └─────────┬──────────┘
                                                  │ result hash
                                                  ▼
                                        ┌────────────────────┐
                                        │ Independent         │
                                        │ verifier            │
                                        └─────────┬──────────┘
                                                  │ signed decision
                                                  ▼
                              VERIFIED → release · FROZEN → isolate
                              BLOCKED  → refund before execution
```

The policy engine is deterministic and inspectable, but it is not trusted with
funds. The Monad contract verifies identity, escrow state and the independent
verifier signature. This separation prevents a planner or seller from
certifying its own output.

Evidence classes used throughout the submission:

- **LIVE_TESTNET** — a Monad Testnet transaction or state read linked to MonadScan.
- **SIMULATION** — deterministic local workflow or benchmark; no funds moved.
- **DESIGN** — a planned production extension, not implemented on-chain.
