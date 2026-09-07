# Repository map for reviewers

The account contains several chain- and venue-specific experiments. They are
not separate competing products; they are adapters and historical applications
around the same AgentGuard idea.

## ETHOnline submission

- [`ethonline-agentguard`](https://github.com/0xCaptain888/ethonline-agentguard)
  — the only ETHOnline submission repository. It contains the Continuity
  before/after record, sponsor integration boundaries, judge surface and
  evidence manifest.

## Core and adapters

- [`agent-control-plane`](https://github.com/0xCaptain888/agent-control-plane)
  — generic policy-controlled execution foundation.
- [`monad-agentguard`](https://github.com/0xCaptain888/monad-agentguard)
  — Monad deployment, benchmarks and baseline evidence.
- [`binance-agentguard`](https://github.com/0xCaptain888/binance-agentguard)
  — Binance Agentic execution adapter.

## Historical applications

Earlier payment, treasury, DeFi and Agent marketplace repositories are kept as
experiments and continuity context. They are not part of the ETHOnline
submission unless explicitly linked from the submission manifest.

## Review rule

Start with this repository. Do not infer sponsor usage from another repository.
Arc, The Graph and Privy are claimed only when their evidence status is
promoted in [`evidence/ethonline-manifest.json`](../evidence/ethonline-manifest.json).
