# Final submission checklist

Run this list immediately before submitting in the Hacker Dashboard.

## Repository

- [ ] Repository is public and the final `v1.0.0` commit is on `main`.
- [x] README identifies this as the only ETHOnline submission repository.
- [x] Continuity before/after boundary is visible.
- [x] AI usage disclosure is present.
- [x] No secrets, tokens, seed phrases or private keys are tracked.

## Technical evidence

- [x] Graph is honestly marked `LIVE_EXTERNAL_DATA` and its observation is bound into the Arc task.
- [x] Arc task-index Subgraph codegen/build succeeds and points to the real deployment address and start block.
- [x] Arc is honestly marked `LIVE_TESTNET` with approve/create/submit/verify hashes.
- [x] Privy is honestly marked `LIVE_TESTNET` with a policy ID, wallet sender,
      authorization evidence hashes and nine public Arc writes.
- [x] Every live transaction has a public explorer URL.
- [x] Evidence hashes are committed and reproducible.
- [ ] Public Demo browser evidence check loads the new v1 manifest after Pages deployment.
- [x] VERIFIED, BLOCKED and FROZEN each have distinct public Arc Testnet receipts.

## Submission media

- [ ] Human-narrated 2–4 minute video, at least 720p.
- [ ] Video shows one complete workflow, not disconnected feature tours.
- [ ] Updated v1 Demo URL loads in a clean browser window after Pages deployment.
- [ ] GitHub, Demo, Judge Guide and Evidence Manifest links work against the final commit.

## Release and dashboard

- [ ] Publish immutable tag and GitHub Release `ethonline-v1.0.0` using
      `docs/ethonline-v1.0.0-release.md` after this commit reaches `main`.
- [ ] Confirm Continuity eligibility for Arc, The Graph and Privy in the
      Hacker Dashboard and preserve a screenshot.
- [ ] Select exactly Arc, The Graph and Privy in the final submission.

## Final commands

```bash
npm ci
npm run ethonline:submission:check
npm run ethonline:check
```
