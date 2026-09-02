# Monad AgentGuard

**Autonomous agents can act on Monad — but authority stays bounded and every result is independently verifiable.**

> Monad execution target: Testnet chain ID `10143` now; Mainnet chain ID `143` after testnet evidence is complete.

Monad AgentGuard is a Monad-native control and settlement layer for AI agents. A planner can propose a task, but it cannot authorize itself or certify its own output. Agent identity, policy authority, escrow, execution and verification are deliberately separated.

### The concrete Agent-to-Agent workflow

`TreasuryPlanner` (buyer) hires `YieldScout` (seller) to return a structured
Monad liquidity report. A deterministic policy engine checks the seller
permission, per-task budget, daily budget, risk score and confirmation before
any escrow transaction is sent. The seller submits a result hash; an
independent verifier signs the decision; the contract settles only after that
signature is recovered on-chain. Run the inspectable local flow with
`npm run agent:flow`.

```text
Agent goal → identity → policy gate → Monad escrow → execution
           → independent verifier → VERIFIED / BLOCKED / FROZEN → Receipt
```

## Why this is new for Metropolis

This repository is a new Monad-native implementation built during Metropolis. It carries forward the design research from [Binance AgentGuard](https://github.com/0xCaptain888/binance-agentguard), but the contracts, Monad deployment, task flow and evidence produced here are specific to this hackathon.

## Contract MVP

[`MonadAgentGuard.sol`](contracts/MonadAgentGuard.sol) currently provides:

- Agent identity registration with metadata hash;
- per-buyer policy limits and confirmation flag;
- native MON escrow for agent-to-agent tasks;
- seller result submission;
- buyer-side independent verification;
- pre-execution `BLOCKED` refund;
- post-execution `FROZEN` isolation;
- `VERIFIED` release and event trail.

The policy engine is intentionally side-effect free and emits reason codes and
decision hashes before the transaction boundary. See the [architecture](docs/architecture.md)
and [judge quick review](docs/judge-guide.md) for the complete path.

The AI planner is not trusted by the contract. The contract and verifier are the authority boundaries.

## Network configuration

| Network | Chain ID | RPC | Explorer |
| --- | ---: | --- | --- |
| Monad Testnet | 10143 | `https://rpc-testnet.monadinfra.com` | [MonadScan Testnet](https://testnet.monadscan.com) |
| Monad Mainnet | 143 | `https://rpc.monad.xyz` | [Monad Explorer](https://monadexplorer.com) |

No private key is committed. Use a dedicated testnet wallet through `DEPLOYER_PRIVATE_KEY` only in your local environment.

## Reproduce locally

```bash
npm install
npm run build
npm test
npm run demo
npm run benchmark
```

Deploy to Monad Testnet after funding a dedicated test wallet:

```bash
export DEPLOYER_PRIVATE_KEY=0x...
npm run deploy:testnet
```

The deploy command writes a local deployment record under `deployments/` (ignored by git). After deployment, configure a second seller wallet locally as `SELLER_PRIVATE_KEY` and run:

```bash
npm run task:testnet
```

The runner registers buyer and seller identities, creates a `0.01 MON` escrow task, submits a result, verifies it, reads the final task state back from Monad, and writes `evidence/testnet-task-<id>.json`. The evidence file includes the intent/policy/result hashes, receipt status, block number, Explorer links, and a deterministic evidence hash. It never prints or persists private keys.

The contract also supports a real independent verifier signature through `setVerifier` and `verifyTaskBySignature`. The seller (or another verifier wallet) signs the task decision off-chain; the contract recovers that signer before releasing or freezing escrow. `npm run benchmark` provides a reproducible local throughput baseline; it is deliberately labelled simulation until run against Monad Testnet. There is no claim of production security or Monad throughput from this local benchmark.

For a first live run, use two dedicated Monad Testnet wallets:

| Role | Address | Minimum recommended balance |
| --- | --- | ---: |
| Buyer / deployer | `0xd64Fac11d711d7278a8Bb6D7be1E2De1fdBCC564` | `1 MON` |
| Seller agent | `0x637a61f2644E43aDa1eEeEb6Ff827B2aD60e669b` | `0.1 MON` |
| Independent verifier | `0xE01337d3F0E061017d8Ce547e11d86C0705e8526` | `0.1 MON` |

Get testnet MON from the [Monad faucet](https://faucet.monad.xyz). Keep `.env` local and never commit it.

## Trust boundaries

| Component | Propose | Execute | Authorize | Verify |
| --- | ---: | ---: | ---: | ---: |
| AI planner | ✓ | — | — | — |
| Policy engine | — | — | ✓ | — |
| Monad contract | — | ✓ | ✓ | — |
| Independent verifier | — | — | — | ✓ |

## Status

This is an active Metropolis build. A live Monad Testnet contract and end-to-end `VERIFIED`, `BLOCKED`, and `FROZEN` tasks are now available in [`docs/live-testnet-evidence.md`](docs/live-testnet-evidence.md). The dated build plan and submission checklist are in [`docs/metropolis-plan.md`](docs/metropolis-plan.md).

## Judge demo

The demo is in [`site/index.html`](site/index.html) and is published by GitHub Pages. It displays the live contract, independent verifier, three task states, receipt links, and a browser-side RPC check for the live task states. The page never requests a wallet connection or sends a transaction.

## Evidence labels and limitations

- **LIVE_TESTNET**: the deployed contract and the three MonadScan-linked task receipts in [live evidence](docs/live-testnet-evidence.md).
- **SIMULATION**: `npm run agent:flow` and `npm run benchmark`; these move no funds.
- **DESIGN**: dispute/recovery, multi-verifier quorum and production monitoring are follow-on work.

`FROZEN` deliberately isolates escrow after a failed result. This hackathon
MVP does not claim an automatic dispute payout or recovery path.

## License

MIT
