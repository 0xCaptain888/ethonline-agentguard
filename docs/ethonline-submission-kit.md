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

All three selections have real, load-bearing evidence. Privy controls the
buyer writes, The Graph supplies the seller-history decision input, and Arc
holds and conditionally releases USDC.

## Required links

- Public GitHub repository
- ETHOnline demo URL
- 2–4 minute video (720p or higher)
- Arc deployment and transaction links
- Arcscan verified-source link and reproducible Standard JSON compiler input
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
2. Open the committed Privy-authorized receipt and show the live seller-history
   observation, verified rate and zero indexing errors.
3. Show the `ALLOW` decision and the task-bound Graph/policy hashes.
4. Show that the task-creation sender is the dedicated Privy wallet and open
   the Arc task-creation transaction.
5. Open the seller result and independent verification transactions.
6. Show the live `VERIFIED` release, 1 USDC settlement and evidence hash.
7. Change the browser budget to show the interactive BLOCKED rule, then open
   the live Arc BLOCKED refund transaction `0x6de4…fe6f`.
8. Corrupt the browser result to show FROZEN, then open the live independent
   verifier rejection transaction `0xb94f…ced1`.
9. Optional: open **Operate one bounded Arc Testnet task**, connect a judge
   wallet, run the readiness check, and show the separate confirmation gates.
   Do not ask a judge to spend funds; the committed receipts above are the
   source of truth for the submission.

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
Subgraph build and the manifest's honesty rules. Arc, The Graph and Privy are
backed by a single composed live workflow and public testnet evidence.

For an additional integrity check, run:

```bash
npm run ethonline:receipt:verify
npm run ethonline:failure:evidence:verify
```

The first command checks deterministic receipt invariants. The second
recomputes the live failure evidence and queries Arc for the current BLOCKED
and FROZEN contract states. Neither command requires a signing credential.
