# Why Monad for AgentGuard

Agent-to-agent commerce produces many small, policy-gated actions. The chain
must make each decision affordable and quick enough for an autonomous workflow,
while still leaving a permanent settlement trail.

| Requirement | Monad AgentGuard implementation | Evidence |
| --- | --- | --- |
| Low-friction settlement for small tasks | Native MON escrow and compact task state machine | LIVE_TESTNET |
| Verifiable authority boundary | Independent signature binds chain, contract, task, result and decision | LIVE_TESTNET |
| Failure containment | `BLOCKED` refunds before execution; `FROZEN` isolates failed output; mutual recovery refunds both parties | LIVE_TESTNET |
| Repeatable policy decisions | Deterministic budget, permission, risk and confirmation checks | SIMULATION |

The repository now includes a 25-task Monad Testnet sample in
`docs/benchmark-testnet.json`. It measures task-creation latency and gas only,
not end-to-end agent throughput. The design is chain-portable, but Monad is the
execution target because this workload benefits from a low-friction settlement
boundary for frequent, small agent tasks.
