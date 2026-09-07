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

If a deploy key, API key or App Secret was pasted into chat or an issue, revoke
and regenerate it before continuing. Put the replacement only in the ignored
local `.env`; never send it through the repository or browser Demo.

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

1. A Studio slug and deploy key are not a query endpoint. Deploy or publish the
   Subgraph, then set its actual `GRAPH_SUBGRAPH_URL` and, if required,
   `GRAPH_API_KEY`.
2. Run `npm run ethonline:graph:check` and retain the response provenance.
3. Pass the response into YieldScout so the recommendation is derived from
   the live data, not from a copied fixture.
4. Include endpoint, query, observed timestamp and the deterministic source
   hash in the task receipt.
5. Change The Graph to `LIVE_EXTERNAL_DATA` only after the response can be
   replayed or independently inspected.

## 3. Privy

1. Create a test application and organization wallet.
2. Set `PRIVY_APP_ID`, the rotated `PRIVY_APP_SECRET`, `PRIVY_WALLET_ID`,
   `PRIVY_WALLET_ADDRESS` and `PRIVY_JWKS_URL` locally.
3. Run `npm run ethonline:privy:check`. The output contains only sanitized
   wallet metadata and an evidence hash; it never prints the App Secret.
4. Configure a signer/policy that allows only the bounded USDC task.
5. Record the human-readable intent and the resulting authorization decision;
   do not commit access tokens or private key material.
6. Change Privy to a live status in the manifest only when the control is used
   in the Arc path.

## Evidence rule

If any sponsor step is unavailable, keep it `DESIGN` and show the blocker in
the Demo. A clearly labelled partial build scores better than an unverifiable
live claim.
