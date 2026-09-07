# AI usage disclosure

ETHGlobal permits AI-assisted development, but the submission still needs to
show the builder's own architecture, implementation choices and verification.
This file records how AI tools were used in this Continuity build.

## Human-owned decisions

- The product boundary: policy-controlled Agent-to-Agent commerce rather than
  an unrestricted trading bot.
- The sponsor selection and the single end-to-end workflow.
- The Continuity before/after boundary and evidence labels.
- The contract state machine, verifier boundary and failure-path behavior.
- Which claims are allowed into the final submission.

## AI-assisted work

AI tools were used as an implementation and review assistant for:

- TypeScript scaffolding and refactoring;
- Solidity test cases and deterministic hash helpers;
- README, runbook and submission-document drafts;
- browser Demo copy and local policy playground code;
- static analysis of edge cases and test output.

Every generated change was reviewed, edited and tested locally. No AI tool was
given a private key, seed phrase, sponsor secret, OAuth token or production
credential.

## Verification performed by the builder

The builder owns the final review and runs:

```bash
npm run build
npm run typecheck
npm test
npm run ethonline:check
```

Live sponsor claims are not inferred from generated code. They are promoted
from `DESIGN` only after a public provider response or public testnet receipt
is independently checked and added to the evidence manifest.
