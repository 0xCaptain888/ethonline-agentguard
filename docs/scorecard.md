# Judge scorecard

| Judge question | Where to verify | Status |
| --- | --- | --- |
| Is there a concrete Agent-to-Agent workflow? | [YieldScout task 30](../evidence/testnet-task-30.json), [ChainSentinel task 29](../evidence/testnet-task-29.json), [Agent catalog](agent-catalog.md) | Complete (2 live workloads) |
| Does it run on Monad? | [deployment](https://testnet.monadexplorer.com/address/0xee84007f8618c2c38Be8C45E8050144EbF00CE4a), [live evidence](live-testnet-evidence.md) | Complete (testnet) |
| Is the deployed bytecode tied to public source? | [Sourcify exact match](https://testnet.monadvision.com/contracts/full_match/10143/0xee84007f8618c2c38Be8C45E8050144EbF00CE4a/), `hardhat.config.ts` | Complete |
| Can the planner certify its own work? | `setVerifier` + `verifyTaskBySignature` | Prevented by design |
| What happens on a policy violation? | Task 26 `BLOCKED` receipt and policy reason codes in [live evidence](live-testnet-evidence.md) | Complete |
| What happens on bad output? | Task 27 `FROZEN` + mutual recovery receipts | Complete (testnet primitive; production quorum DESIGN) |
| Can a judge reproduce it quickly? | `npm run judge:check`, [judge manifest](../evidence/judge-manifest.json), [judge guide](judge-guide.md) | Complete |
| Is the evidence honest? | LIVE_TESTNET/SIMULATION/DESIGN labels | Complete |

The remaining head-prize lift is live-task recording and presentation: show the
external report, policy decision and result hash before each transaction, then
explain the FROZEN recovery boundary without claiming an unaudited production
system.
