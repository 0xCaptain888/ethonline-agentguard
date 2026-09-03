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
                                        │ Seller Agent        │
                                        │ YieldScout or       │
                                        │ ChainSentinel       │
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

The same protocol is exercised by two live seller schemas: DeFiLlama
liquidity research and Monad RPC network telemetry. Each supplies a dedicated
deterministic verifier while reusing identity, policy, escrow, settlement and
receipt infrastructure.

Evidence classes used throughout the submission:

- **LIVE_TESTNET** — a Monad Testnet transaction or state read linked to the Monad Testnet Explorer.
- **SIMULATION** — deterministic local workflow or benchmark; no funds moved.
- **DESIGN** — a planned production extension, not implemented on-chain.
