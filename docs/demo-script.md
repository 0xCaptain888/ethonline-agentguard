# Three-minute demo script

This is the exact recording order for the submission. Keep the browser on the
public Marketplace and use the terminal only for the local policy preview.

| Time | Show | Say |
| --- | --- | --- |
| 0:00–0:25 | `TreasuryPlanner → YieldScout` | “One agent hires another, but neither agent can authorize its own payment.” |
| 0:25–0:55 | `npm run judge:demo` policy output | “The policy engine decides first: budget, seller permission, risk and confirmation are visible before a transaction is sent.” |
| 0:55–1:35 | VERIFIED card and MonadScan | “The seller submits a result; an independent verifier signs it; only then does Monad release 0.01 MON.” |
| 1:35–2:05 | BLOCKED card and MonadScan | “An over-budget or unauthorized request is stopped before execution and refunded.” |
| 2:05–2:35 | FROZEN card and MonadScan | “A bad result is contained: escrow stays isolated instead of being released.” |
| 2:35–2:55 | Contract, hashes, `npm run evidence:verify` | “These are real Monad Testnet transactions, and the receipt hashes are independently recomputed. Task 27 then shows the two approval transactions that refund the buyer.” |
| 2:55–3:00 | Boundary note | “FROZEN recovery is live two-party Testnet refund; signed approvals, deadlines and neutral arbitration remain production extensions.” |

Why Monad, in one sentence:

> Monad gives frequent, small Agent-to-Agent tasks a low-friction settlement boundary while preserving an auditable on-chain trail.

Do not call the local workflow or benchmark LIVE_TESTNET. Do not imply that
FROZEN funds have already been recovered.
