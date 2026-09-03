# Judge scorecard

| Evaluation question | Evidence | Status |
| --- | --- | --- |
| Is the problem important? | [Business case](business-case.md) | Clear buyer: marketplaces and autonomous treasury/DeFi Agents need bounded authority before funds move |
| Is there a complete Agent-to-Agent workflow? | [MetaMask → YieldScout Task 56](../evidence/metamask-agent-wallet-live.json), [ChainSentinel Task 29](../evidence/testnet-task-29.json) | Complete · buyer, seller, external work, verifier and settlement |
| Is Monad materially used? | [V1 → V2 performance study](monad-performance.md) | Complete · measured shared-state bottleneck led to deployed per-buyer lane architecture |
| Does it work on-chain? | [V1 deployment](https://testnet.monadexplorer.com/address/0xee84007f8618c2c38Be8C45E8050144EbF00CE4a), [V2 deployment](https://testnet.monadexplorer.com/address/0x91A62595C8eF8c5E5cddcd782cAd7FDdd38D5169) | Complete · live Monad Testnet |
| Is source tied to bytecode? | [V1 exact match](https://testnet.monadvision.com/contracts/full_match/10143/0xee84007f8618c2c38Be8C45E8050144EbF00CE4a/), [V2 exact match](https://testnet.monadvision.com/contracts/full_match/10143/0x91A62595C8eF8c5E5cddcd782cAd7FDdd38D5169/) | Complete · both deployed contracts verified by Sourcify |
| Can the planner approve its own output? | `setVerifier` + `verifyTaskBySignature` | Prevented by design |
| Are failure paths real? | Task 26 BLOCKED; Task 27 FROZEN → REFUNDED | Complete · live receipts |
| Can a judge operate it? | [Public Judge Console](https://0xcaptain888.github.io/monad-agentguard/#judge-console) | Complete · policy preview and opt-in Testnet task creation |
| Can a judge verify it without a wallet? | Task 56 one-click replay + `npm run judge:check` | Complete · browser RPC and repository integrity checks |
| Is there credible scale work? | [V1 concurrent evidence](benchmark-concurrent-testnet.json), [V2 parallel evidence](benchmark-parallel-testnet.json) | Complete · 25 V1 and 10 V2 pipelines; honest limitations |
| Is a sponsor integration real? | [MetaMask Agent Wallet receipt](../evidence/metamask-agent-wallet-live.json) | Complete · authenticated BYOK buyer transactions and VERIFIED settlement |
| Is adoption proven? | [External pilot](external-pilot.md) | Infrastructure ready; external completed-user count remains unclaimed until a third-party wallet submits evidence |

## Current competition assessment

The build is strong on technical execution, verifiability, Monad relevance and
failure containment. The strongest differentiator is not “an escrow contract”;
it is the closed engineering loop from a measured concurrency problem to a
deployed parallel-safe V2 with public receipts.

The largest remaining non-code risk is presentation and external validation.
For a top-prize submission, the video should show Task 56 replay, one BLOCKED
policy change, the V1 bottleneck, the V2 fix, and the exact product customer in
under three minutes. Do not imply audited production readiness or external
users that have not actually participated.
