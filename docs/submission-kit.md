# Metropolis submission kit

## Project name

**Monad AgentGuard**

## One-line pitch

The authorization and settlement firewall that lets autonomous Agents hire
other Agents on Monad without approving their own spending or grading their
own work.

## Project description

TreasuryPlanner hires real seller Agents through a bounded Monad execution
layer. YieldScout ranks live DeFiLlama liquidity data; ChainSentinel reads fresh
Monad network telemetry. Before escrow, deterministic policy checks budget,
seller permission, risk and confirmation. The seller commits the complete
result hash, an independent verifier checks the task-specific output, and only
then can escrow be released. Violations become BLOCKED, invalid output becomes
FROZEN, and buyer plus seller can mutually recover funds. Every path produces
Explorer-linked, machine-verifiable evidence.

## What is innovative

Most Agent demos let one model propose an action, execute it and declare
success. AgentGuard separates planner, policy, wallet, seller, verifier and
settlement authority. It also publishes the engineering process: a concurrent
V1 benchmark exposed contention on a global task counter, so V2 replaced it
with deterministic per-buyer nonce lanes and proved the new architecture with
10 complete five-lane Testnet pipelines.

## Why Monad

One Agent business action requires multiple small, independent state
transitions: escrow, seller commitment and verifier-authorized settlement.
Monad makes that separation practical. V1 completed 25 sequential pipelines
through 75 transactions at 7,543 ms P95 and 25 concurrent settlements across
five lanes. Parallel V2 then completed 10/10 pipelines and 30 unique
transactions, with up to four creates, five submissions and five verifications
included in the same respective block. These are application-level Testnet
measurements, not protocol TPS claims.

## Sponsor integration

MetaMask Agent Wallet is the self-custodial buyer signing boundary; AgentGuard
is the Monad task authorization and settlement boundary. Authenticated BYOK
Task 56 registered identity, committed policy, bound an independent verifier
and created a 0.001 MON YieldScout escrow. A fresh DeFiLlama result was released
only after independent verification. The six-transaction receipt is public;
wallet credentials and session data are not stored in the repository.

## Submission links

- Demo: https://0xcaptain888.github.io/monad-agentguard/
- GitHub: https://github.com/0xCaptain888/monad-agentguard
- V1 verified contract: https://testnet.monadexplorer.com/address/0xee84007f8618c2c38Be8C45E8050144EbF00CE4a
- V1 verified source: https://testnet.monadvision.com/contracts/full_match/10143/0xee84007f8618c2c38Be8C45E8050144EbF00CE4a/
- Parallel V2 contract: https://testnet.monadexplorer.com/address/0x91A62595C8eF8c5E5cddcd782cAd7FDdd38D5169
- Parallel V2 verified source: https://testnet.monadvision.com/contracts/full_match/10143/0x91A62595C8eF8c5E5cddcd782cAd7FDdd38D5169/
- Judge manifest: `evidence/judge-manifest.json`
- One-command verification: `npm run judge:check`
- MetaMask live receipt: `evidence/metamask-agent-wallet-live.json`
- V2 benchmark: `docs/benchmark-parallel-testnet.json`

## Honest boundary

This is a Testnet hackathon MVP, not audited production financial software.
Two-party FROZEN recovery is live. Deadlines, neutral arbitration,
multi-verifier quorum and Mainnet deployment remain production extensions.
The external pilot is open, but no third-party-user count is claimed before
independently submitted evidence exists.
