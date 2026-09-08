# ETHOnline Continuity before/after

This table is part of the submission record. It distinguishes the pre-existing
AgentGuard foundation from work created for ETHOnline 2026.

| Before ETHOnline | Built for ETHOnline | Proof to attach |
| --- | --- | --- |
| Monad native-MON escrow and task state machine | Generic ERC-20 escrow deployed with Arc test USDC | `contracts/PolicyEscrowERC20.sol`, `evidence/arc-testnet-deployment.json` and live task receipts |
| DeFiLlama-based YieldScout | Custom Arc task-index Subgraph makes seller history and settlement outcomes a provenance-bearing decision input | `subgraph/`, `src/ethonline/graph-agent.ts`, `evidence/arc-testnet-graph-driven-task.json` |
| Monad browser judge console | ETHOnline sponsor console for Arc / Graph / Privy | `site/index.html`, screenshot and video timestamp |
| Monad wallet/policy boundary | Privy P-256-owned wallet with an Arc/contract allowlist | `scripts/setup-privy-arc-wallet.ts`, `scripts/run-privy-arc-task.ts`, `evidence/arc-testnet-privy-authorized-task.json` |
| Monad task receipts | Cross-sponsor receipt binding source, policy and settlement hashes | machine-readable ETHOnline evidence manifest |

No Monad transaction is relabelled as Arc or Privy evidence. The Privy claim
is backed by its own Arc Testnet sender and nine public policy-authorized
writes. The browser remains a safe replay surface, while all three outcomes
also have separate public Arc receipts.
