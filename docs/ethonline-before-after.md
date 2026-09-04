# ETHOnline Continuity before/after

This table is part of the submission record. It distinguishes the pre-existing
AgentGuard foundation from work created for ETHOnline 2026.

| Before ETHOnline | Built for ETHOnline | Proof to attach |
| --- | --- | --- |
| Monad native-MON escrow and task state machine | Generic ERC-20 escrow with immutable settlement token | `contracts/PolicyEscrowERC20.sol`, tests and deployment receipt |
| DeFiLlama-based YieldScout | The Graph query becomes a provenance-bearing decision input | `src/ethonline/graph-agent.ts`, live observation JSON |
| Monad browser judge console | ETHOnline sponsor console for Arc / Graph / Privy | `site/index.html`, screenshot and video timestamp |
| Monad wallet/policy boundary | Privy organization wallet or signer control | Privy dashboard evidence and transaction receipt |
| Monad task receipts | Cross-sponsor receipt binding source, policy and settlement hashes | machine-readable ETHOnline evidence manifest |

No Monad transaction is relabelled as Arc or Privy evidence. If a sponsor
service is not available at submission time, the demo labels that path
`DESIGN` or `SIMULATION` instead of implying a live integration.
