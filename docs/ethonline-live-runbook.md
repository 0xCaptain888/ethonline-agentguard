# ETHOnline live-evidence runbook

This is the shortest path from the repository replay to sponsor-grade proof.
It deliberately keeps credentials local and makes no claim until a public
transaction or provider response can be independently checked.

## 0. Preflight without secrets in Git

Copy `.env.example` to a local `.env` and fill values only on your machine.
Then run:

```bash
npm run ethonline:preflight
```

The command prints only whether a variable is present; it never prints the
value and never broadcasts a transaction.

## 1. Arc / Circle

1. Fund a disposable Arc Testnet wallet with gas and test USDC.
2. Set `ARC_RPC_URL`, `ARC_CHAIN_ID` and `ARC_USDC_ADDRESS` locally.
3. Deploy `PolicyEscrowERC20.sol` using the deploy script and save the public
   contract address.
4. Approve USDC, create one named buyer/seller task, submit the result and run
   independent verification.
5. Put the create/submit/verify transaction hashes plus the receipt hash into
   `evidence/ethonline-manifest.json` and change Arc to `LIVE_TESTNET`.

## 2. The Graph

1. Set `GRAPH_SUBGRAPH_URL` (and `GRAPH_API_KEY` if the provider requires it).
2. Run `npm run ethonline:graph:check` and retain the response provenance.
3. Pass the response into YieldScout so the recommendation is derived from
   the live data, not from a copied fixture.
4. Include endpoint, query, observed timestamp and the deterministic source
   hash in the task receipt.
5. Change The Graph to `LIVE_EXTERNAL_DATA` only after the response can be
   replayed or independently inspected.

## 3. Privy

1. Create a test application and organization wallet.
2. Set `PRIVY_APP_ID` and `PRIVY_CLIENT_ID` locally.
3. Configure a signer/policy that allows only the bounded USDC task.
4. Record the human-readable intent and the resulting authorization decision;
   do not commit access tokens or private key material.
5. Change Privy to a live status in the manifest only when the control is used
   in the Arc path.

## Evidence rule

If any sponsor step is unavailable, keep it `DESIGN` and show the blocker in
the Demo. A clearly labelled partial build scores better than an unverifiable
live claim.
