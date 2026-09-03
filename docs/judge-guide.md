# Judge quick review (5 minutes)

## 1. Open the product (30 seconds)

Open the [Monad AgentGuard Marketplace](https://0xcaptain888.github.io/monad-agentguard/).
The page identifies the Monad Testnet contract, the independent verifier and
the three live outcomes.

## 2. Follow one Agent-to-Agent request (60 seconds)

Run `npm install && npm run agent:flow`. This prints a deterministic
`TreasuryPlanner → YieldScout → verifier → settlement` request and the exact
policy checks that produce its decision. It is labelled `SIMULATION` and does
not move funds. To show the seller doing actual work, run
`npm run yieldscout:report`: it reads DeFiLlama, returns the top five Monad
pools as structured JSON, and prints a keccak result commitment. This is
labelled `LIVE_EXTERNAL_DATA` and is read-only.

## 3. Verify the live evidence (2 minutes)

Open [`docs/live-testnet-evidence.md`](live-testnet-evidence.md) and follow the
MonadScan links:

- `VERIFIED` task 25: real DeFiLlama result accepted and 0.01 MON released;
- `BLOCKED` task 26: policy stop and escrow refund;
- `FROZEN` task 27: failed result isolated, then refunded after two-party recovery.

Each receipt includes intent, policy, result and evidence hashes. The verifier
address is independent of both buyer and seller.

Run `npm run evidence:verify` to recompute every committed receipt's evidence
hash and validate its state, network and transaction trail. This is read-only.

Use [`docs/demo-script.md`](demo-script.md) for the exact three-minute recording
order, or run `npm run judge:demo` to print the same judge path as structured
JSON.

For the Monad-specific rationale, see [why Monad](why-monad.md). For a direct
mapping from judge questions to artifacts, see the [scorecard](scorecard.md).
The FROZEN recovery boundary is documented separately in [frozen-recovery.md](frozen-recovery.md).

## 4. Reproduce locally (90 seconds)

```bash
npm install
npm run build
npm test
npm run demo
npm run agent:flow
```

The live testnet runner is opt-in and requires local wallet keys:
`npm run task:testnet`. Never commit `.env` or private keys.

## The 30-second explanation

> TreasuryPlanner can hire YieldScout, but it cannot move money just because a
> model said “done”. The policy engine decides first. YieldScout commits to a
> real, structured result. An independent verifier checks that result. Only a
> valid signature can release escrow; a policy violation is `BLOCKED`, and a
> bad post-execution result is `FROZEN`.

## What is and is not claimed

The contract is a hackathon MVP, not audited production software. The local
benchmark is not a Monad performance claim. `FROZEN` funds are intentionally
isolated; dispute recovery is a documented extension rather than a live claim.
