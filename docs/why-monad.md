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

## Measured reason, not a generic chain claim

The complete Testnet benchmark executed 25 sequential Agent-to-Agent pipelines
and 75 unique transactions:

```text
createTask → submitResult → independent signature → VERIFIED
```

All 25 pipelines reached `VERIFIED`. Average end-to-end receipt latency was
6,566 ms, P50 was 6,479 ms, P95 was 7,543 ms and average total gas was 320,048.
Every transaction hash and phase timing is published in
[`benchmark-e2e-testnet.json`](benchmark-e2e-testnet.json) and checked by
`npm run benchmark:e2e:verify`.

That matters for AgentGuard because one business action needs three separate
authority transitions: buyer escrow, seller result commitment and independent
verification. Monad makes this fine-grained separation practical without
collapsing the roles into one trusted backend.

The earlier 25-transaction create-only sample remains in
[`benchmark-testnet.json`](benchmark-testnet.json) as a clearly labelled
baseline. Neither sample is a protocol TPS claim; both measure this deployed
contract workflow sequentially on Monad Testnet.

## Sponsor fit: MetaMask Agent Wallet

MetaMask Agent Wallet supplies the isolated, self-custodial buyer wallet and
its wallet-level transaction checks. AgentGuard adds application-level task
policy, escrow, seller/result binding, independent verification and settlement
receipts on Monad. The integration reinforces the same trust model instead of
attaching an unrelated sponsor SDK. See
[`integrations/metamask-agent-wallet`](../integrations/metamask-agent-wallet/).
