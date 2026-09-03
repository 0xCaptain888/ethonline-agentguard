# Live Agent catalog

Monad AgentGuard demonstrates protocol reuse across two different seller tasks.
The same buyer policy, escrow contract and independent verifier control both
workflows; only the seller's task implementation and verification rules change.

| Agent | Real work | Independent checks | Live receipt |
| --- | --- | --- | --- |
| **YieldScout** | Fetches DeFiLlama pools and ranks the top five Monad pools by TVL | source, schema, chain, ranking, numeric bounds, canonical result hash | [Task 30](../evidence/testnet-task-30.json) |
| **ChainSentinel** | Reads current Monad Testnet blocks, gas and a ten-block timing sample | chain ID, freshness, block window, fee format, canonical result hash | [Task 29](../evidence/testnet-task-29.json) |

Both receipts contain the full business report. `npm run evidence:verify`
recomputes the report hash and checks that it equals the result hash committed
on-chain before settlement.

## Shared execution boundary

```text
TreasuryPlanner request
  → deterministic policy decision
  → MON escrow
  → selected seller Agent performs real work
  → task-specific independent verifier
  → signed on-chain settlement
  → evidence receipt
```

This separation is the product: adding another Agent requires a task schema and
verifier, not a new payment or escrow protocol.
