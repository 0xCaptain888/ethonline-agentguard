# Final submission checklist

Run this list immediately before submitting in the Hacker Dashboard.

## Repository

- [ ] Repository is public and the latest commit is on `main`.
- [ ] README identifies this as the only ETHOnline submission repository.
- [ ] Continuity before/after boundary is visible.
- [ ] AI usage disclosure is present.
- [ ] No secrets, tokens, seed phrases or private keys are tracked.

## Technical evidence

- [ ] Graph status is honestly marked `LIVE_EXTERNAL_DATA` or `DESIGN`.
- [ ] Arc status is honestly marked `LIVE_TESTNET` or `DESIGN`.
- [ ] Privy status is honestly marked live or `DESIGN`.
- [ ] Every live transaction has a public explorer URL.
- [ ] Evidence hashes are reproducible.
- [ ] VERIFIED, BLOCKED and FROZEN are all demonstrated.

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
