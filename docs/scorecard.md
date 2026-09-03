# Judge scorecard

| Judge question | Where to verify | Status |
| --- | --- | --- |
| Is there a concrete Agent-to-Agent workflow? | `npm run agent:flow`, `npm run yieldscout:report`, [task spec](agent-task-spec.md) | Complete (external read + simulation) |
| Does it run on Monad? | [deployment](https://testnet.monadscan.com/address/0x7D9204Ce050cb917b2Db703ec2a63CC987C15235), [live evidence](live-testnet-evidence.md) | Complete (testnet) |
| Can the planner certify its own work? | `setVerifier` + `verifyTaskBySignature` | Prevented by design |
| What happens on a policy violation? | Task 1 `BLOCKED` receipt and policy reason codes | Complete |
| What happens on bad output? | Task 2 `FROZEN` receipt | Complete; recovery is DESIGN |
| Can a judge reproduce it quickly? | [judge guide](judge-guide.md), `npm run yieldscout:report` | Complete |
| Is the evidence honest? | LIVE_TESTNET/SIMULATION/DESIGN labels | Complete |

The remaining head-prize lift is live-task recording and presentation: show the
external report, policy decision and result hash before each transaction, then
explain the FROZEN recovery boundary without claiming an unaudited production
system.
