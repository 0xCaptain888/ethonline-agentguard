# ETHOnline 2026 build plan

## Submission strategy

This repository is the ETHOnline Continuity version of AgentGuard. Existing
Monad work is retained as the policy-and-verification foundation; all new
ETHOnline work is isolated in dated commits and is listed below.

The project will target three partner families:

1. **Arc / Circle** — USDC agent-to-agent payments with conditional escrow,
   policy checks, and verifier-gated settlement.
2. **The Graph** — live Subgraph/MCP data becomes a load-bearing input to the
   buyer's decision and is committed into the receipt.
3. **Bazantic** — the result/verifier endpoint is exposed as an x402/MPP
   gateway and a reusable Recipe that another agent can execute.

This is a Continuity submission, not a claim that the pre-existing Monad
implementation was built during ETHOnline. The submission will include a
before/after table and commit history showing the new feature work.

## Target demo

`TreasuryPlanner → Graph data query → policy decision → Arc USDC escrow →
Seller Agent → independent verifier → VERIFIED / BLOCKED / FROZEN → receipt`

The 2–4 minute video will show one successful payment, one pre-execution
block, and one post-execution freeze, with the Arc transaction and evidence
hash visible. The fallback path is a deterministic local replay if a sponsor
testnet service is unavailable; it will be labelled `SIMULATION`.

## New work required

- Arc testnet adapter and USDC escrow flow.
- Graph live-data adapter (Subgraph MCP or hosted Subgraph) and provenance
  fields in `YieldScout` receipts.
- Bazantic gateway/Recipe integration and a before/after agent run.
- Public architecture diagram, partner-specific integration notes, and
  `FEEDBACK.md` documents.
- Judge-run command that verifies all hashes without private keys.

## Eligibility checklist

- [ ] Public repo and dated commits during ETHOnline.
- [ ] Arc integration is load-bearing and uses USDC.
- [ ] The Graph data is live, not mocked or static.
- [ ] Bazantic account, gateway, Recipe, and repeatable comparison recorded.
- [ ] 2–4 minute 720p demo video.
- [ ] Submission names exactly these three partner families and explains each
      integration.
