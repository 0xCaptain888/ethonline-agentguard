# Agent task specification: YieldScout liquidity report

This is the concrete Agent-to-Agent task used by the Monad Metropolis demo.
`TreasuryPlanner` is the buyer and `YieldScout` is the seller. The task is
deliberately read-only: it discovers data first, then asks the policy and
escrow layer to decide whether the work is worth paying for.

## Request

```json
{
  "task": "Return the top five Monad liquidity pools by TVL",
  "source": "https://yields.llama.fi/pools",
  "maxResults": 5,
  "freshness": "fetch-at-execution",
  "riskPolicy": "heuristic_only"
}
```

## Seller output

The seller returns `schema = yieldscout.monad.liquidity.v1`, the exact
DeFiLlama endpoint and fetch timestamp, and at most five pools. Every pool must
have a positive `tvlUsd`, chain `Monad`, a stable pool id, and optional numeric
APY fields. Results must be sorted descending by TVL. The seller commits to the
canonical JSON payload with an ethers `keccak256` `resultHash`.

## Independent verification

The verifier applies the same deterministic checks from
`src/yieldscout.ts`: schema, agent identity, source, chain, result count/order,
numeric bounds and hash shape. A failed check is not silently paid:

```text
policy denied before execution  → BLOCKED + buyer refund
report malformed after execution → FROZEN + escrow isolated
report valid + verifier signature → VERIFIED + seller release
```

TVL and APY are discovery signals, not investment advice. A production system
would add source attestation, freshness limits, oracle diversity and a dispute
arbiter; those are intentionally outside this hackathon MVP.

## Reproduce

```bash
npm run yieldscout:report   # live external read, no wallet and no write
npm run evidence:verify     # verify committed Monad receipts
```
