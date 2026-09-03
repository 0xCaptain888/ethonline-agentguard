# Why Monad: measured Agent settlement loop

Monad AgentGuard publishes two separate Testnet measurements. They answer
different questions and are not presented as protocol-level TPS claims.

## Complete Agent pipeline

On September 3, 2026, the runner executed 25 sequential Agent-to-Agent tasks
against the verified deployment. Every sample performed:

```text
createTask → submitResult → independent EIP-191 signature
           → verifyTaskBySignature → VERIFIED
```

| Measurement | Result |
| --- | ---: |
| Completed pipelines | 25 / 25 VERIFIED |
| On-chain transactions | 75 |
| Average end-to-end receipt latency | 6,566 ms |
| P50 end-to-end receipt latency | 6,479 ms |
| P95 end-to-end receipt latency | 7,543 ms |
| Average total gas per complete pipeline | 320,048 |
| Sequential pipelines per second | 0.147 |

The machine-readable sample, including every transaction hash, block, phase
latency and gas value, is in
[`benchmark-e2e-testnet.json`](benchmark-e2e-testnet.json). Run
`npm run benchmark:e2e:verify` to recompute its aggregate fields and ensure all
75 transaction hashes are unique.

## Task-creation baseline

The earlier [`benchmark-testnet.json`](benchmark-testnet.json) isolates only
the `createTask` phase: 25 live transactions, 100% mined, approximately 2,000
ms average receipt latency and 170,670 average gas. It is retained so judges
can distinguish contract task creation from the complete settlement loop.

## What this proves

The measurements support a narrow product claim: a policy-gated, independently
verified micro-settlement loop can complete on Monad Testnet in under eight
seconds at P95 in this sequential sample while preserving three separate
on-chain authority transitions.

They do **not** measure concurrent Agent throughput, external model latency,
Monad Mainnet performance or protocol maximum TPS. Those require a separate
load methodology and production environment.
