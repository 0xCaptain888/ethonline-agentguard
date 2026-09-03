# Why Monad for AgentGuard

Agent-to-Agent commerce creates many small actions that should not collapse
into one trusted backend call. AgentGuard keeps buyer escrow, seller result
commitment and independent verification as separate authority transitions.

| Requirement | AgentGuard on Monad | Public evidence |
| --- | --- | --- |
| Small task settlement | Native MON escrow with explicit state transitions | LIVE_TESTNET |
| Bounded authority | Deterministic policy before a wallet write | LIVE_TESTNET + SIMULATION |
| Independent result checks | Task/result-bound EIP-191 verifier signature | LIVE_TESTNET |
| Failure containment | BLOCKED refund, FROZEN isolation, mutual recovery | LIVE_TESTNET |
| Multiple autonomous users | Per-buyer deterministic task-ID lanes in V2 | LIVE_TESTNET_BENCHMARK |

## The chain changed the architecture

The first complete benchmark proved the workflow: 25/25 sequential pipelines,
75 unique transactions and 7,543 ms P95 from escrow creation through verified
release.

The next concurrent experiment exposed a V1 shared-write hotspot. Every buyer
updated the same global `nextTaskId` slot, so creation had to be prepared
sequentially even though seller submission and verification could overlap.

The response was a deployed contract redesign, not a slide-deck claim.
`MonadAgentGuardParallel` derives task IDs from:

```text
chainId + contract + buyer + per-buyer nonce
```

Its public evidence contains 10/10 complete pipelines across five independent
Buyer/Seller lanes and 30 unique transactions. Up to four creates, five
submissions and five verifications landed in the same respective block. That
is a concrete benchmark → diagnosis → redesign → redeploy loop shaped by
parallel execution concerns.

Full methodology and limitations are in
[`monad-performance.md`](monad-performance.md). These are application-level
Testnet traces, not claims about Monad protocol TPS or Mainnet capacity.

## Sponsor fit: MetaMask Agent Wallet

MetaMask Agent Wallet supplies an isolated, self-custodial buyer execution
boundary. AgentGuard adds task policy, escrow, seller/result binding,
independent verification and settlement receipts. Authenticated BYOK Task 56
proves the wallet registered identity, committed policy, bound a verifier and
created escrow before YieldScout work was released.

The integration is therefore compositional rather than decorative: wallet
authority is isolated at the signing layer, while task authority is bounded at
the Monad application and contract layers.
