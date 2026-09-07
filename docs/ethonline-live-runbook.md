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

Completed on Arc Testnet, chain `5042002`:

1. `PolicyEscrowERC20` deployed at `0x85b6…E67d`.
2. A bootstrap 1 USDC task seeded YieldScout seller history.
3. A second 1 USDC task was created from live Graph history.
4. Seller submission and independent verification released escrow.
5. Public proof is stored in `evidence/arc-testnet-graph-driven-task.json` and
   Arc is marked `LIVE_TESTNET`.

## 2. The Graph

Completed with Studio version `v0.1.0`:

1. The custom Subgraph indexes the Arc escrow from block `60909613`.
2. The live query reported the bootstrap seller task as VERIFIED.
3. YieldScout converted that history into a 100% verified rate and risk score
   `0`; the policy returned `ALLOW`.
4. The observation hash `0x4f02…7b68` and policy decision hash were bound into
   the second task intent.
5. The Subgraph subsequently indexed both tasks as VERIFIED with no indexing
   errors; The Graph is marked `LIVE_EXTERNAL_DATA`.

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

Privy is the remaining sponsor step and stays `DESIGN`. A clearly labelled
partial integration scores better than an unverifiable live claim.
