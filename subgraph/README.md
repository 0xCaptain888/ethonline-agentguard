# AgentGuard Arc Task Index

This Subgraph indexes `PolicyEscrowERC20` on Arc Testnet (`arc-testnet`, chain
ID `5042002`). It turns Agent registration, policy, task, verification,
settlement and recovery events into a queryable audit and seller-reliability
surface for YieldScout.

The checked-in manifest points to the public Arc Testnet deployment
`0x85b6df0684529fFAB07C6B62eDB6F04a3eC4E67d` from block `60909613`.

```bash
npm install
npm run codegen
npm run build
npm run deploy:studio
```

Use the rotated local deploy key for Studio deployment; never commit it. Wait
for the version to sync and run the judge query before pressing Publish.

The judge query is in [`queries/yieldscout.graphql`](queries/yieldscout.graphql).
YieldScout uses verified/frozen history and aggregate release/refund data as a
live provenance-bearing input to seller choice and budget policy.
