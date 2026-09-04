# ETHOnline AgentGuard

> **Policy-gated Agent-to-Agent commerce:** live blockchain data informs an
> autonomous buyer, bounded authority controls the spend, and an independent
> verifier decides whether USDC is released.

This is the dedicated **ETHOnline 2026 Continuity** submission repository for
AgentGuard. The pre-existing Monad implementation is the policy, escrow and
verification foundation. The ETHOnline feature work is being added in dated
commits and will be clearly separated from that foundation before submission.

## The one workflow

```text
TreasuryPlanner
  → The Graph live observation
  → policy decision (budget · permission · risk · confirmation)
  → Privy treasury wallet / signer control
  → Arc USDC escrow
  → Seller Agent execution
  → independent verifier
  → VERIFIED / BLOCKED / FROZEN
  → receipt + evidence hash
```

The planner proposes. It does not authorize its own spending and it does not
grade its own work. A policy violation is blocked before execution. A bad
post-execution result is isolated as `FROZEN`; funds are not released by
default. Every decision is bound to hashes that a judge can recompute.

## ETHOnline sponsor fit

| Partner | Load-bearing role | Status |
| --- | --- | --- |
| Arc / Circle | USDC escrow and conditional Agent-to-Agent settlement | Adapter boundary ready; live integration pending |
| The Graph | Live indexed data drives YieldScout's decision and receipt | Read-only adapter ready; provider configuration pending |
| Privy | Organization wallet and policy/signer/intent control | Configuration boundary ready; SDK flow pending |
| Bazantic | Optional fallback: x402/MPP gateway and reusable Recipe | Not selected unless Privy onboarding blocks us |

The submission will name only partners that are actually used in the final
demo. Sponsor SDKs, accounts and network writes are never simulated as live
evidence.

## Continuity boundary

### Pre-existing foundation

- Monad AgentGuard contracts and native-MON escrow.
- Policy engine, independent verifier, receipt format and failure states.
- Monad Testnet evidence, benchmarks and judge console.

### New ETHOnline work

- Arc USDC settlement adapter and testnet evidence.
- The Graph live-query adapter connected to YieldScout decisions.
- Privy organization-wallet / signer / policy flow.
- ETHOnline-specific browser demo, sponsor feedback and submission artifacts.

See [the build plan](docs/ethonline-plan.md), [partner fit](docs/partner-fit.md)
and [Arc boundary](docs/arc-integration.md) for the detailed before/after
scope. No pre-existing Monad transaction is presented as Arc evidence.

## Current implementation status

| Surface | Current state | Evidence label |
| --- | --- | --- |
| Policy engine and independent verification | Working and tested on the Monad foundation | `LIVE_TESTNET` (Monad foundation) |
| VERIFIED / BLOCKED / FROZEN state model | Working and tested | `LIVE_TESTNET` / `SIMULATION` where explicitly marked |
| The Graph adapter | Read-only adapter with deterministic evidence hash | `DESIGN` until a live provider is configured |
| Arc USDC settlement | Not yet deployed | `DESIGN` |
| Privy wallet control | Not yet connected | `DESIGN` |
| ETHOnline browser demo | In progress | `DESIGN` |

## Reproduce the foundation locally

```bash
npm install
npm run build
npm run typecheck
npm test
npm run demo
npm run judge:check
```

The existing Monad commands and evidence are retained only as the continuity
baseline. They are useful for verifying the authorization and verification
machinery, but they do not satisfy the Arc, The Graph or Privy sponsor
requirements by themselves.

## The Graph read-only adapter

[`src/ethonline/graph-agent.ts`](src/ethonline/graph-agent.ts) accepts a real
GraphQL endpoint, query and variables, then returns the response with its
endpoint, timestamp, query, variables and deterministic `evidenceHash`.

It never signs, broadcasts or stores a private key. The endpoint must be
provided locally through `GRAPH_SUBGRAPH_URL` or an equivalent runtime config.

## Security boundary

- No private keys, seed phrases, API keys or OAuth tokens are committed.
- Browser wallet writes are opt-in and must verify the expected chain ID.
- A read-only data source cannot release escrow.
- A seller cannot act as its own verifier.
- Receipts must be re-hashed before they are eligible for settlement.
- Real sponsor evidence is labelled separately from local replay evidence.

Read [SECURITY.md](SECURITY.md) and [dependency security notes](docs/dependency-security.md).

## Demo and submission artifacts

The ETHOnline demo will be a separate browser surface with:

1. One live or explicitly labelled testnet `VERIFIED` task.
2. One `BLOCKED` policy decision before any write.
3. One `FROZEN` bad-output path with recovery boundary shown.
4. Arc transaction and receipt evidence visible to the judge.
5. A Graph provenance panel and Privy authorization panel.

The final submission will include a 2–4 minute video, public source, sponsor
feedback documents, an architecture diagram and a machine-readable evidence
manifest. Until those items are complete, this repository is **not** presented
as a finished ETHOnline submission.

## Links

- [ETHOnline build plan](docs/ethonline-plan.md)
- [Partner fit matrix](docs/partner-fit.md)
- [Arc integration boundary](docs/arc-integration.md)
- [The Graph adapter](src/ethonline/graph-agent.ts)
- [Architecture](docs/architecture.md)
- [Judge guide](docs/judge-guide.md)
- [Existing Monad foundation](https://github.com/0xCaptain888/monad-agentguard)

## License

MIT
