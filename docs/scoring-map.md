# ETHOnline judge scoring map

This map translates the event's public judging categories into files and
observable actions. It is an execution guide, not a claim of an official score.

| Category | What the judge should see | Repository proof | Demo moment |
| --- | --- | --- | --- |
| Technicality | Graph data, policy evaluation, escrow state machine and independent verification compose into one flow | `src/ethonline/graph-agent.ts`, `src/ethonline/workflow.ts`, `contracts/PolicyEscrowERC20.sol`, tests | Graph observation → policy hash → verifier |
| Originality | Payment is conditional on verified work, not merely a successful tool call | `docs/ethonline-before-after.md`, `docs/architecture.md` | “Tool succeeded, payout still waits” |
| Practicality | A treasury can hire a research/yield Agent with bounded USDC authority | `docs/agent-task-spec.md`, `docs/business-case.md` | One concrete YieldScout task |
| Usability / DX | A judge can reproduce checks without credentials and inspect every status label | `docs/judge-guide.md`, `src/ethonline/workflow.ts`, `test/ethonline-workflow.test.ts`, `scripts/verify-ethonline-manifest.ts` | `npm run ethonline:check` |
| WOW factor | The same task model handles success, pre-execution denial and post-execution containment | `scripts/ethonline-demo.ts`, `site/index.html` | VERIFIED → BLOCKED → FROZEN |

## Scoring guardrails

- One workflow is stronger than many disconnected sponsor demos.
- A live claim must have a public provider response or transaction hash.
- A design placeholder must remain labelled `DESIGN`.
- The video should show the action and the evidence, not only slides.
- The workflow test names the four important boundaries explicitly: policy
  short-circuit, authorization denial, independent verification and frozen
  recovery. This makes the demo behavior auditable rather than merely visual.
