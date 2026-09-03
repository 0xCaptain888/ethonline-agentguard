# Judge quick review (5 minutes)

## 1. Open the product (30 seconds)

Open the [Monad AgentGuard Marketplace](https://0xcaptain888.github.io/monad-agentguard/).
The page identifies the Monad Testnet contract, the independent verifier and
the three live outcomes.

## 2. Operate one policy-gated task (60 seconds)

In the public Demo, open **Live Judge Console**, connect an injected wallet and
switch to Monad Testnet. Set a task value above the visible maximum budget and
click Create: the console returns `BLOCKED` before requesting a write. Restore
the default `0.01 MON` task and `0.05 MON` budget, then create a YieldScout or
ChainSentinel task. The wallet confirms identity/policy writes only when needed
and one real escrow transaction. The new task remains `OPEN`; no seller or
verifier credential is shipped to the browser.

If no wallet is available, the console says so without affecting the evidence
review below. Existing tasks 29 and 30 show the complete seller and independent
verifier path.

## 3. Follow two completed Agent-to-Agent requests (60 seconds)

Run `npm install && npm run judge:check` for the complete read-only review:
contract build, typecheck, tests, business-report hash verification, receipt
verification and judge timeline. Start from the machine-readable
[`evidence/judge-manifest.json`](../evidence/judge-manifest.json).

Run `npm run agent:flow` separately to print a deterministic
`TreasuryPlanner → YieldScout → verifier → settlement` request and the exact
policy checks that produce its decision. It is labelled `SIMULATION` and does
not move funds. To show the seller doing actual work, run
`npm run yieldscout:report`: it reads DeFiLlama, returns the top five Monad
pools as structured JSON, and prints a keccak result commitment. This is
labelled `LIVE_EXTERNAL_DATA` and is read-only.

Then inspect [ChainSentinel task 29](../evidence/testnet-task-29.json). It
contains a real Monad RPC report and verification matrix for chain ID,
freshness, block sample, fees and canonical result hash.

## 4. Verify the live evidence (2 minutes)

Open [`docs/live-testnet-evidence.md`](live-testnet-evidence.md) and follow the
Monad Testnet Explorer links:

- `VERIFIED` task 30: full DeFiLlama report accepted and 0.01 MON released;
- `VERIFIED` task 29: full Monad RPC report accepted and 0.01 MON released;
- `BLOCKED` task 26: policy stop and escrow refund;
- `FROZEN` task 27: failed result isolated, then refunded after two-party recovery.

Each receipt includes intent, policy, result and evidence hashes. The verifier
address is independent of both buyer and seller.

Run `npm run evidence:verify` to recompute every committed receipt's evidence
hash and validate its state, network and transaction trail. This is read-only.

Open [`docs/monad-performance.md`](monad-performance.md) for 25 complete live
pipelines, 75 unique Testnet transactions and phase-by-phase latency/gas. Run
`npm run benchmark:e2e:verify` to validate the aggregate fields and uniqueness.

Run `npm run sponsor:metamask` to inspect the explicit MetaMask Agent Wallet
requests for identity, policy and escrow. They are credential-free templates;
an authenticated Agent Wallet session is required to broadcast them.

Use [`docs/demo-script.md`](demo-script.md) for the exact three-minute recording
order, or run `npm run judge:demo` to print the same judge path as structured
JSON.

For the Monad-specific rationale, see [why Monad](why-monad.md). For a direct
mapping from judge questions to artifacts, see the [scorecard](scorecard.md).
The FROZEN recovery boundary is documented separately in [frozen-recovery.md](frozen-recovery.md).

## 5. Reproduce locally (90 seconds)

```bash
npm install
npm run build
npm test
npm run demo
npm run agent:flow
npm run benchmark:e2e:verify
npm run sponsor:metamask
```

The live testnet runner is opt-in and requires local wallet keys:
`npm run task:testnet`. Never commit `.env` or private keys.

## The 30-second explanation

> TreasuryPlanner can hire YieldScout or ChainSentinel, but it cannot move money
> just because an Agent said “done”. Policy decides first. Each seller commits
> a real structured report. A task-specific independent verifier checks it.
> Only a valid signature releases escrow; policy violations are `BLOCKED`, bad
> results are `FROZEN`, and mutual approval can recover the funds.

## What is and is not claimed

The contract is a hackathon MVP, not audited production software. The complete
benchmark measures sequential contract-workflow receipt latency, not Monad
protocol TPS or concurrent Agent throughput. Two-party FROZEN recovery is live;
signed deadlines and neutral arbitration remain documented production
extensions. The MetaMask adapter is implemented and tested, but the repository
does not include or inherit an authenticated MetaMask Agent Wallet session.
