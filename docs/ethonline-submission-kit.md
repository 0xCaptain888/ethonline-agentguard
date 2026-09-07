# ETHOnline 2026 submission kit

## Official submission constraints

- Deadline: **September 13, 2026 at 12:00 pm EDT**.
- The demo video is **required**, must be 2–4 minutes and at least 720p.
- Select no more than three partner prizes; multiple tracks from one partner
  still consume one partner slot.
- This project is submitted through a Continuity track, with a dated before /
  after record and partner-specific eligibility checked in the dashboard.

## Project title

**AgentGuard: Policy-Gated Agent-to-Agent Commerce**

## One-line pitch

AgentGuard lets autonomous agents hire and pay one another with bounded authority: live blockchain data informs the decision, policy controls the spend, and an independent verifier releases USDC only after the result checks out.

## Partner selections

Select only partners with real evidence in the final build:

1. Arc / Circle
2. The Graph
3. Privy

Arc and The Graph have real evidence. Keep Privy selected only if a
Privy-controlled Arc write is completed before submission; otherwise replace
it with the strongest eligible partner whose technology is genuinely used.

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
- [`evidence/ethonline-manifest.json`](../evidence/ethonline-manifest.json)
  with a machine-readable status for every claim
- [AI usage disclosure](ai-usage.md)
- [Judge scoring map](scoring-map.md)

## Final demo sequence

1. Show the one-line problem: an Agent can act, but should not hold unlimited
   authority.
2. Open the committed Graph-driven receipt and show the live seller-history
   observation: one prior task, 100% verified rate, zero indexing errors.
3. Show the `ALLOW` decision and the task-bound Graph/policy hashes.
4. Open the Arc task-creation transaction.
5. Open the seller result and independent verification transactions.
6. Show the live `VERIFIED` release, 1 USDC settlement and evidence hash.
7. Change the budget and show `BLOCKED` before any write.
8. Corrupt the result and show `FROZEN` with the recovery boundary.

## Submission honesty rule

Use `LIVE_TESTNET` only for a public transaction that can be independently
verified. Use `LIVE_EXTERNAL_DATA` for a real provider response. Use
`SIMULATION` for local replay and `DESIGN` for functionality not yet shipped.

## Judge replay contract

The repository must be reviewable without credentials. A judge can run:

```bash
npm ci
npm run ethonline:check
npm run ethonline:manifest:verify
```

The check proves the contract tests, the three failure states, the custom
Subgraph build and the manifest's honesty rules. Arc and The Graph claims are
backed by public testnet evidence. Privy remains `DESIGN` until it authorizes
an Arc write.

For an additional integrity check, run:

```bash
npm run ethonline:receipt:verify
```

This recomputes the evidence hash for all three deterministic receipts and
checks that release eligibility matches the state. It is intentionally
credential-free and labelled `SIMULATION`; it does not replace public Arc,
Graph or Privy evidence.
