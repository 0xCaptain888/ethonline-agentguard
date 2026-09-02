# Monad AgentGuard

**Autonomous agents can act on Monad — but authority stays bounded and every result is independently verifiable.**

> Monad execution target: Testnet chain ID `10143` now; Mainnet chain ID `143` after testnet evidence is complete.

Monad AgentGuard is a Monad-native control and settlement layer for AI agents. A planner can propose a task, but it cannot authorize itself or certify its own output. Agent identity, policy authority, escrow, execution and verification are deliberately separated.

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

The AI planner is not trusted by the contract. The contract and verifier are the authority boundaries.

## Network configuration

| Network | Chain ID | RPC | Explorer |
| --- | ---: | --- | --- |
| Monad Testnet | 10143 | `https://testnet-rpc.monad.xyz` | [Monad Explorer](https://testnet.monadexplorer.com) |
| Monad Mainnet | 143 | `https://rpc.monad.xyz` | [Monad Explorer](https://monadexplorer.com) |

No private key is committed. Use a dedicated testnet wallet through `DEPLOYER_PRIVATE_KEY` only in your local environment.

## Reproduce locally

```bash
npm install
npm run build
npm test
npm run demo
```

Deploy to Monad Testnet after funding a dedicated test wallet:

```bash
export DEPLOYER_PRIVATE_KEY=0x...
npm run deploy:testnet
```

The deploy command writes a local deployment record under `deployments/` (ignored by git). After deployment, the next milestone is to register two test identities and execute one real task through `createTask → submitResult → verifyTask`.

## Trust boundaries

| Component | Propose | Execute | Authorize | Verify |
| --- | ---: | ---: | ---: | ---: |
| AI planner | ✓ | — | — | — |
| Policy engine | — | — | ✓ | — |
| Monad contract | — | ✓ | ✓ | — |
| Independent verifier | — | — | — | ✓ |

## Status

This is an active Metropolis build. The first commit is the protocol skeleton; testnet deployment and live task evidence are the next milestones. See [`docs/metropolis-plan.md`](docs/metropolis-plan.md) for the dated build plan and submission checklist.

## License

MIT
