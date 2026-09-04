# ETHOnline 2026 submission kit

## Project title

**AgentGuard: Policy-Gated Agent-to-Agent Commerce**

## One-line pitch

AgentGuard lets autonomous agents hire and pay one another with bounded authority: live blockchain data informs the decision, policy controls the spend, and an independent verifier releases USDC only after the result checks out.

## Partner selections

Select only partners with real evidence in the final build:

1. Arc / Circle
2. The Graph
3. Privy

Bazantic is the fallback third selection if Privy onboarding blocks the live
wallet flow.

## Required links

- Public GitHub repository
- ETHOnline demo URL
- 2–4 minute video (720p or higher)
- Arc deployment and transaction links
- The Graph live-query evidence
- Privy wallet/control evidence
- Architecture diagram
- Continuity before/after document
- Sponsor feedback documents

## Final demo sequence

1. Show the one-line problem: an Agent can act, but should not hold unlimited
   authority.
2. Run a live Graph observation through YieldScout.
3. Show the policy decision and Privy authorization boundary.
4. Create the Arc USDC task and show the transaction.
5. Submit the seller result and verify it independently.
6. Show `VERIFIED` and the receipt/evidence hash.
7. Change the budget and show `BLOCKED` before any write.
8. Corrupt the result and show `FROZEN` with the recovery boundary.

## Submission honesty rule

Use `LIVE_TESTNET` only for a public transaction that can be independently
verified. Use `LIVE_EXTERNAL_DATA` for a real provider response. Use
`SIMULATION` for local replay and `DESIGN` for functionality not yet shipped.
