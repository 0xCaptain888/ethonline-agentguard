# Arc integration boundary

Arc is the settlement rail for the ETHOnline build. The completed live flow is:

1. `TreasuryPlanner` receives a live The Graph observation.
2. The policy engine checks amount, recipient, expiry, risk and confirmation.
3. The buyer approves a USDC escrow on Arc Testnet.
4. The seller Agent returns a result commitment.
5. An independent verifier checks the result against the original observation.
6. Only `VERIFIED` releases escrow. A policy violation is `BLOCKED`; a bad
   post-execution result is `FROZEN` and remains recoverable by the buyer.

The browser demo never contains a private key. The live proof uses contract
`0x85b6df0684529fFAB07C6B62eDB6F04a3eC4E67d` and Arc's test USDC at
`0x3600000000000000000000000000000000000000`. The primary receipt is
`evidence/arc-testnet-graph-driven-task.json`; browser failure-path replay
remains labelled `SIMULATION`.
