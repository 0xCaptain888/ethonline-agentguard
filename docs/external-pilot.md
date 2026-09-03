# External wallet pilot

This pilot lets a real third-party wallet create one bounded Monad Testnet task
without receiving any seller, verifier or repository credential.

## Participant steps

1. Open the [public Judge Console](https://0xcaptain888.github.io/monad-agentguard/#judge-console).
2. Use a dedicated Testnet wallet with a small amount of faucet MON.
3. Try a value above the visible budget and confirm `BLOCKED` occurs before a
   wallet write request.
4. Restore an allowed value, connect the wallet and create a YieldScout or
   ChainSentinel task.
5. Copy the task ID, buyer address and creation transaction into the
   **External pilot task** GitHub issue template.

## Maintainer completion

The maintainer validates that the task is OPEN, owned by the submitted buyer,
uses the published seller and binds the published independent verifier. The
seller then performs fresh external work, submits the result hash, and the
verifier releases only after task-specific checks pass.

```bash
PILOT_TASK_ID=<id> PILOT_BUYER=<address> PILOT_CREATE_TX=<hash> PILOT_WORKLOAD=yieldscout npm run pilot:complete
```

The command is opt-in, requires local seller/verifier keys and writes a public
receipt under `evidence/external-pilot-task-<id>.json`. It never prints or
persists those keys.

## Evidence policy

- A pilot counts only when the buyer wallet is not controlled by the project
  maintainer and its creation transaction is public.
- Failed or abandoned tasks remain visible; they are not silently counted as
  completed users.
- The project currently makes no numerical external-user claim until such
  receipts exist.
