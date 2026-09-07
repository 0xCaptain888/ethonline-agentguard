# AgentGuard Arc Task Index

This Subgraph indexes `PolicyEscrowERC20` on Arc Testnet (`arc-testnet`, chain
ID `5042002`). It turns Agent registration, policy, task, verification,
settlement and recovery events into a queryable audit and seller-reliability
surface for YieldScout.

The checked-in manifest intentionally contains a placeholder address until a
real Arc deployment exists. Do not deploy it unchanged.

```bash
npm install
npm run codegen
npm run build
npm run deploy:studio
```

Before Studio deployment, replace the address and `startBlock` in
`subgraph.yaml` with the public `PolicyEscrowERC20` deployment values. Use the
rotated local deploy key; never commit it.

The judge query is in [`queries/yieldscout.graphql`](queries/yieldscout.graphql).
YieldScout uses verified/frozen history and aggregate release/refund data as a
live provenance-bearing input to seller choice and budget policy.
