# Why Monad: measured Agent settlement architecture

Monad AgentGuard publishes three separate Testnet measurements. Each answers a
different engineering question; none is presented as Monad protocol TPS.

## 1. Complete V1 pipeline

On September 3, 2026, 25 sequential Agent-to-Agent tasks each executed:

```text
createTask → submitResult → independent EIP-191 signature
           → verifyTaskBySignature → VERIFIED
```

| Measurement | Result |
| --- | ---: |
| Completed pipelines | 25 / 25 VERIFIED |
| On-chain transactions | 75 |
| Average end-to-end receipt latency | 6,566 ms |
| P50 | 6,479 ms |
| P95 | 7,543 ms |
| Average total gas | 320,048 |

Every hash, block, phase latency and gas value is in
[`benchmark-e2e-testnet.json`](benchmark-e2e-testnet.json) and recomputed by
`npm run benchmark:e2e:verify`.

## 2. V1 concurrent settlement and the discovered hotspot

The concurrent V1 workload completed 25/25 settlements across five independent
Buyer/Seller lanes and 75 unique transactions. The concurrent submit + verify
window took 15,931 ms, with up to 17 related transactions included in one
block. Creation remained sequential because all buyers contended on the same
global `nextTaskId` storage slot.

That limitation is part of the published result, not hidden benchmark noise.
See [`benchmark-concurrent-testnet.json`](benchmark-concurrent-testnet.json)
and run `npm run benchmark:concurrent:verify`.

## 3. Parallel V2: benchmark → diagnosis → deployed improvement

Parallel V2 removes the shared task-ID write. Each task ID is derived from:

```text
keccak256(chainId, contract, buyer, nextBuyerNonce[buyer])
```

The deployed V2 then completed 10/10 full pipelines across five independent
Buyer/Seller lanes and 30 unique Testnet transactions.

| V2 evidence | Result |
| --- | ---: |
| Complete pipelines | 10 / 10 VERIFIED |
| Independent lanes | 5 |
| Unique transactions | 30 |
| Maximum creates in one block | 4 |
| Maximum submissions in one block | 5 |
| Maximum verifications in one block | 5 |
| Recovered four-transaction verification wave | 2,606 ms |

The run was interrupted after six verifications because several benchmark
buyer accounts needed more Testnet gas. Funds stayed in escrow. After topping
up those accounts, the remaining four tasks were verified and the event trail
was reconstructed from public receipts. For that reason, the repository claims
wall-clock time only for the recovered verification wave; create/submit
concurrency is evidenced by public block inclusion, not reconstructed timing.

- V2 contract: `0x91A62595C8eF8c5E5cddcd782cAd7FDdd38D5169`
- Deployment evidence: [`parallel-v2-deployment.json`](../evidence/parallel-v2-deployment.json)
- Full 30-transaction sample: [`benchmark-parallel-testnet.json`](benchmark-parallel-testnet.json)
- Integrity check: `npm run benchmark:parallel:verify`

## Task-creation baseline

The earlier [`benchmark-testnet.json`](benchmark-testnet.json) isolates only
the V1 `createTask` phase: 25 live transactions, 100% mined, approximately
2,000 ms average receipt latency and 170,670 average gas.

## Claim boundary

These measurements show that fine-grained buyer escrow, seller commitment and
independent verification are practical on Monad Testnet, and that the
application architecture can be redesigned around independent account lanes.
They do not measure external model latency, Mainnet performance, audited
production capacity or Monad protocol maximum throughput.
