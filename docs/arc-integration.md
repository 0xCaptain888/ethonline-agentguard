# Arc integration boundary

Arc is the settlement rail for the ETHOnline build. The intended flow is:

1. `TreasuryPlanner` receives a live The Graph observation.
2. The policy engine checks amount, recipient, expiry, risk and confirmation.
3. The buyer approves a USDC escrow on Arc Testnet.
4. The seller Agent returns a result commitment.
5. An independent verifier checks the result against the original observation.
6. Only `VERIFIED` releases escrow. A policy violation is `BLOCKED`; a bad
   post-execution result is `FROZEN` and remains recoverable by the buyer.

The browser demo will never contain a private key. Wallet writes are opt-in,
chain-id checked, and displayed as human-readable intent before approval.
Until a real Arc endpoint and USDC contract are configured, any local replay
must be labelled `SIMULATION`.
