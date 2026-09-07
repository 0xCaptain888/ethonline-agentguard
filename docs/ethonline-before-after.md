# ETHOnline Continuity before/after

This table is part of the submission record. It distinguishes the pre-existing
AgentGuard foundation from work created for ETHOnline 2026.

| Before ETHOnline | Built for ETHOnline | Proof to attach |
| --- | --- | --- |
| Monad native-MON escrow and task state machine | Generic ERC-20 escrow deployed with Arc test USDC | `contracts/PolicyEscrowERC20.sol`, `evidence/arc-testnet-deployment.json` and live task receipts |
| DeFiLlama-based YieldScout | Custom Arc task-index Subgraph makes seller history and settlement outcomes a provenance-bearing decision input | `subgraph/`, `src/ethonline/graph-agent.ts`, `evidence/arc-testnet-graph-driven-task.json` |
| Monad browser judge console | ETHOnline sponsor console for Arc / Graph / Privy | `site/index.html`, screenshot and video timestamp |
| Monad wallet/policy boundary | Privy organization wallet or signer control | Privy dashboard evidence and transaction receipt |
| Monad task receipts | Cross-sponsor receipt binding source, policy and settlement hashes | machine-readable ETHOnline evidence manifest |

No Monad transaction is relabelled as Arc or Privy evidence. If a sponsor
service is not available at submission time, the demo labels that path
`DESIGN` or `SIMULATION` instead of implying a live integration.
