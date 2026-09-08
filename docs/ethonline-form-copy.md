# ETHOnline 2026 final form copy

## Project name

**AgentGuard: The Authorization Firewall for Agent Commerce**

## One-line pitch

AgentGuard lets autonomous agents hire and pay one another through live-data decisions, policy-limited Privy wallets and independently verified USDC settlement on Arc.

## Short description

AgentGuard is a policy-controlled execution and settlement layer for autonomous commerce. TreasuryPlanner uses live seller history indexed by The Graph to decide whether to hire YieldScout. Budget, permission, risk and confirmation rules are evaluated before authority is granted. A dedicated Privy wallet can sign only zero-value Arc transactions to the AgentGuard escrow and USDC contracts. Arc then holds USDC while the seller works, and an independent verifier—not the buyer or seller—decides whether payment is released. The public evidence chain includes a real Privy-created task, a VERIFIED 1 USDC release, reproducible hashes and interactive BLOCKED/FROZEN paths.

## What was built during ETHOnline

This is a Continuity submission. Before ETHOnline, AgentGuard already had a Monad-native policy engine, escrow state machine, independent verifier and receipt format. During ETHOnline we built and deployed the generic ERC-20 escrow on Arc Testnet, created a custom The Graph Subgraph for task and seller history, connected that history to the YieldScout policy decision, integrated a P-256-owned Privy wallet with an Arc/contract allowlist, executed a real 1 USDC Agent-to-Agent settlement, added sponsor-specific evidence verification and built a dedicated public judge experience.

## Arc / Circle integration

Arc is the settlement rail and USDC is the escrowed payment asset. The buyer approves and creates a bounded task on `PolicyEscrowERC20`; the seller submits a result hash; a separate verifier signs the decision; and USDC is released only after verification. The primary public release transaction is `0x94b172ee29faadbf4a48d0d752685358fff082df9d65bf3753ac779a146d1fc8`.

## The Graph integration

Our custom Arc Subgraph indexes agent registration, policy changes, task creation, seller submission, VERIFIED settlement, BLOCKED cancellation, FROZEN containment and recovery. YieldScout queries real seller history at runtime. The observed VERIFIED rate becomes a risk input, and the Graph provenance hash is bound into the policy decision and on-chain task intent. This is not a dashboard-only query: removing The Graph changes whether the buyer is allowed to hire the seller.

## Privy integration

Privy controls the buyer wallet used across all live Arc outcomes. A P-256 owner and attached policy restrict `eth_signTransaction` to Arc chain `5042002`, zero native value and only the AgentGuard escrow and Arc USDC targets. Privy authorized nine public writes spanning setup, approval, task creation and the buyer-controlled BLOCKED cancellation. The seller and verifier use separate roles, so the wallet cannot grade its own result.

## Continuity disclosure

Pre-existing foundation: Monad contracts, policy rules, task states, verifier separation, evidence receipts and benchmark work. New ETHOnline work: Arc ERC-20 settlement, custom Graph indexing and decision provenance, Privy policy-controlled signing, composed sponsor evidence, ETHOnline demo and submission materials. No Monad transaction is presented as Arc, The Graph or Privy evidence.

## Public links

- Repository: https://github.com/0xCaptain888/ethonline-agentguard
- Demo: https://0xcaptain888.github.io/ethonline-agentguard/
- Contract: https://testnet.arcscan.app/address/0x85b6df0684529fFAB07C6B62eDB6F04a3eC4E67d
- VERIFIED release: https://testnet.arcscan.app/tx/0x94b172ee29faadbf4a48d0d752685358fff082df9d65bf3753ac779a146d1fc8
- Full evidence: https://github.com/0xCaptain888/ethonline-agentguard/blob/main/evidence/arc-testnet-privy-authorized-task.json
- Subgraph: https://thegraph.com/studio/subgraph/0-x-captain-888

## Evidence labels

- Arc and Privy writes: `LIVE_TESTNET`
- The Graph observation: `LIVE_EXTERNAL_DATA`
- VERIFIED release: `LIVE_TESTNET`
- BLOCKED cancellation/refund: `LIVE_TESTNET`
- FROZEN verifier rejection/containment: `LIVE_TESTNET`
- Browser controls: deterministic replay of the three publicly proven states
