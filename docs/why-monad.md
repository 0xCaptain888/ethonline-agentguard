# Why Monad for AgentGuard

Agent-to-agent commerce produces many small, policy-gated actions. The chain
must make each decision affordable and quick enough for an autonomous workflow,
while still leaving a permanent settlement trail.

| Requirement | Monad AgentGuard implementation | Evidence |
| --- | --- | --- |
| Low-friction settlement for small tasks | Native MON escrow and compact task state machine | LIVE_TESTNET |
| Verifiable authority boundary | Independent signature binds chain, contract, task, result and decision | LIVE_TESTNET |
| Failure containment | `BLOCKED` refunds before execution; `FROZEN` isolates failed output | LIVE_TESTNET |
| Repeatable policy decisions | Deterministic budget, permission, risk and confirmation checks | SIMULATION |

This build does not claim measured Monad throughput: its benchmark is a local
Hardhat baseline. A production deployment would measure latency and gas on
Monad Testnet before making a performance claim. The design is chain-portable,
but Monad is the execution target because this workload benefits from a
low-friction settlement boundary for frequent, small agent tasks.
