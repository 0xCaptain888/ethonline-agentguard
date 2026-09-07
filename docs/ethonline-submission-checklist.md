# Final submission checklist

Run this list immediately before submitting in the Hacker Dashboard.

## Repository

- [ ] Repository is public and the latest commit is on `main`.
- [ ] README identifies this as the only ETHOnline submission repository.
- [ ] Continuity before/after boundary is visible.
- [ ] AI usage disclosure is present.
- [ ] No secrets, tokens, seed phrases or private keys are tracked.

## Technical evidence

- [x] Graph is honestly marked `LIVE_EXTERNAL_DATA` and its observation is bound into the Arc task.
- [x] Arc task-index Subgraph codegen/build succeeds and points to the real deployment address and start block.
- [x] Arc is honestly marked `LIVE_TESTNET` with approve/create/submit/verify hashes.
- [x] Privy is honestly marked `LIVE_TESTNET` with a policy ID, wallet sender,
      authorization evidence hash and five public Arc writes.
- [x] Every live transaction has a public explorer URL.
- [x] Evidence hashes are committed and reproducible.
- [x] Public Demo browser evidence check loads the committed manifest after Pages deployment.
- [x] VERIFIED, BLOCKED and FROZEN are all demonstrated with distinct evidence labels.

## Submission media

- [ ] Human-narrated 2–4 minute video, at least 720p.
- [ ] Video shows one complete workflow, not disconnected feature tours.
- [ ] Demo URL loads in a clean browser window.
- [ ] GitHub, Demo, Judge Guide and Evidence Manifest links work.

## Final commands

```bash
npm ci
npm run ethonline:submission:check
npm run ethonline:check
```
