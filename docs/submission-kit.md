# Metropolis submission kit

## Project name

**Monad AgentGuard**

## One-line pitch

Monad AgentGuard lets one autonomous Agent hire another while policy, escrow,
task-specific independent verification and recovery determine when funds move.

## Short description

TreasuryPlanner hires real seller Agents through one bounded execution layer.
YieldScout fetches and ranks Monad liquidity data from DeFiLlama;
ChainSentinel reads live Monad block and gas telemetry. Before escrow, a
deterministic policy checks budget, seller permission, risk and confirmation.
Each seller commits its complete report hash on Monad Testnet. A separate
verifier recomputes task-specific checks and signs the decision before MON is
released. Policy violations become BLOCKED, invalid output becomes FROZEN, and
buyer plus seller can mutually recover frozen funds. Every path produces a
machine-readable receipt and Explorer-linked evidence.

## Innovation

Most Agent demos let the same model propose an action, execute it and declare
success. AgentGuard separates those powers. The planner proposes, policy
authorizes, a seller performs work, a task-specific verifier checks the full
report, and Monad settles. Adding a new Agent requires a schema and verifier,
not another payment protocol.

## Why Monad

Agent commerce creates frequent, small settlements, but AgentGuard deliberately
splits one action into escrow, result commitment and independent verification.
On Monad Testnet, 25 complete sequential pipelines reached `VERIFIED` through
75 unique transactions with 6,566 ms average and 7,543 ms P95 end-to-end
receipt latency. The hashes, phase timings and gas values are public and
machine-verifiable. This is a workflow measurement, not a protocol TPS claim.

## Sponsor integration

MetaMask Agent Wallet is the buyer-side self-custodial execution boundary;
AgentGuard is the Monad task-policy and settlement boundary. The adapter emits
inspectable identity, policy and escrow transaction intents through the Agent
Wallet CLI. It never stores wallet credentials and does not claim a broadcast
without an authenticated user session.

## Submission links

- Demo: https://0xcaptain888.github.io/monad-agentguard/
- GitHub: https://github.com/0xCaptain888/monad-agentguard
- Contract: https://testnet.monadexplorer.com/address/0xee84007f8618c2c38Be8C45E8050144EbF00CE4a
- Verified source: https://testnet.monadvision.com/contracts/full_match/10143/0xee84007f8618c2c38Be8C45E8050144EbF00CE4a/
- Judge manifest: `evidence/judge-manifest.json`
- One-command verification: `npm run judge:check`
- Complete benchmark: `docs/benchmark-e2e-testnet.json`
- Sponsor adapter: `integrations/metamask-agent-wallet/`

## Honest boundary

This is a Testnet hackathon MVP, not audited production financial software.
Two-party recovery is live; signed deadlines, neutral arbitration, multi-
verifier quorum and mainnet deployment are production extensions.
