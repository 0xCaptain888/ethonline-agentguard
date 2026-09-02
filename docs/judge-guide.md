# Judge quick review (5 minutes)

## 1. Open the product (30 seconds)

Open the [Monad AgentGuard Marketplace](https://0xcaptain888.github.io/monad-agentguard/).
The page identifies the Monad Testnet contract, the independent verifier and
the three live outcomes.

## 2. Follow one Agent-to-Agent request (60 seconds)

Run `npm install && npm run agent:flow`. This prints a deterministic
`TreasuryPlanner → YieldScout → verifier → settlement` request and the exact
policy checks that produce its decision. It is labelled `SIMULATION` and does
not move funds.

## 3. Verify the live evidence (2 minutes)

Open [`docs/live-testnet-evidence.md`](live-testnet-evidence.md) and follow the
MonadScan links:

- `VERIFIED` task 0: result accepted and 0.01 MON released;
- `BLOCKED` task 1: policy stop and escrow refund;
- `FROZEN` task 2: failed result isolated in escrow.

Each receipt includes intent, policy, result and evidence hashes. The verifier
address is independent of both buyer and seller.

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

## What is and is not claimed

The contract is a hackathon MVP, not audited production software. The local
benchmark is not a Monad performance claim. `FROZEN` funds are intentionally
isolated; dispute recovery is a documented extension rather than a live claim.
