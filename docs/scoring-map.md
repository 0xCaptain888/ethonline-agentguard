# ETHOnline judge scoring map

This map translates the event's public judging categories into files and
observable actions. It is an execution guide, not a claim of an official score.

| Category | What the judge should see | Repository proof | Demo moment |
| --- | --- | --- | --- |
| Technicality | Live Graph data, policy evaluation, Arc USDC escrow and independent verification compose into one flow | `evidence/arc-testnet-graph-driven-task.json`, `src/ethonline/graph-agent.ts`, `contracts/PolicyEscrowERC20.sol` | Graph observation → policy hash → Arc transactions → verifier |
| Originality | Payment is conditional on verified work, not merely a successful tool call | `docs/ethonline-before-after.md`, `docs/architecture.md` | “Tool succeeded, payout still waits” |
| Practicality | A treasury hires YieldScout with bounded USDC authority and seller history | `evidence/arc-testnet-graph-driven-task.json`, `docs/business-case.md` | One real 1 USDC YieldScout task |
| Usability / DX | A judge can reproduce checks without credentials and inspect every status label | `docs/judge-guide.md`, `src/ethonline/workflow.ts`, `src/ethonline/receipt.ts`, `test/ethonline-workflow.test.ts`, `scripts/verify-ethonline-manifest.ts` | `npm run ethonline:check` |
| WOW factor | The same task model handles a live release plus pre-execution denial and post-execution containment | `evidence/arc-testnet-graph-driven-task.json`, `scripts/ethonline-demo.ts`, `site/index.html` | live VERIFIED → simulated BLOCKED → simulated FROZEN |

## Scoring guardrails

- One workflow is stronger than many disconnected sponsor demos.
- A live claim must have a public provider response or transaction hash.
- A design placeholder must remain labelled `DESIGN`.
- The video should show the action and the evidence, not only slides.
- The workflow test names the four important boundaries explicitly: policy
  short-circuit, authorization denial, independent verification and frozen
  recovery. This makes the demo behavior auditable rather than merely visual.
- Receipt integrity is independently replayable: the evidence hash and state
  invariants are checked without sponsor credentials or a wallet connection.
- The strongest public proof is task
  `33969503313480512185595943498318405198659480166392856492294338993101944224568`:
  The Graph seller history produced evidence hash `0x4f02…7b68`, policy returned
  `ALLOW`, and Arc released 1 USDC in transaction `0x328a…efff`.
