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

Completed with a dedicated Privy wallet and P-256 authorization key:

1. `npm run ethonline:privy:keygen` generated local authorization material in
   ignored file `.env.privy` with mode `0600`.
2. `npm run ethonline:privy:setup` created a policy restricted to chain
   `5042002`, zero native value and only the escrow and Arc USDC targets.
3. The policy was attached to wallet
   `0x8b9cD36D829fC658feD8938a057c27CE072bd554`.
4. `npm run ethonline:privy:arc-task` used Privy to sign agent registration,
   policy setup, verifier binding, USDC approval and task creation.
5. The seller submitted independently; the verifier released 1 USDC only
   after all Graph, policy and identity checks passed.
6. The sanitized evidence is committed at
   `evidence/arc-testnet-privy-authorized-task.json`. No App Secret or private
   authorization material is printed or committed.

## 4. Live failure outcomes

Completed from the same Privy-controlled buyer:

1. A 0.25 test USDC reservation was created and then moved to `BLOCKED` before
   seller execution; the escrow refunded the buyer in `0x6de4…fe6f`.
2. A separate 0.25 test USDC task received an intentionally invalid seller
   result; the independent verifier rejected it and moved the task to `FROZEN`
   in `0xb94f…ced1`.
3. The complete evidence and authorization hashes are stored in
   `evidence/arc-testnet-live-failure-outcomes.json`.
4. Run `npm run ethonline:failure:evidence:verify` to re-hash the receipt and
   query the two current contract states without a Privy credential.

## Evidence rule

Arc and Privy writes are `LIVE_TESTNET`; The Graph is `LIVE_EXTERNAL_DATA`.
The browser is a safe replay surface, while VERIFIED, BLOCKED and FROZEN are
all backed by separate public Arc transactions.
