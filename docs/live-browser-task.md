# Live browser task path

The public Demo includes an optional EIP-1193 wallet path under **Operate one
bounded Arc Testnet task**.

1. Connect MetaMask or another browser wallet.
2. Switch to Arc Testnet (`5042002`) if needed.
3. Check live readiness: buyer identity, policy, USDC balance and allowance.
4. If the buyer profile is not ready, explicitly confirm `Register buyer identity`
   and `Set task-value policy` in the wallet.
5. Explicitly approve the displayed USDC amount to the escrow contract.
6. Explicitly create the task. The page displays the Arc explorer transaction.

The default amount is **0.010000 test USDC**. The page never requests a private
key, never sends native value, and never automatically calls `approve` or
`createTask`. Creating a task only reserves escrow; a seller result and an
independent verifier are still required for settlement.

This browser path is intentionally separate from the committed live evidence:
the public `VERIFIED`, `BLOCKED` and `FROZEN` receipts remain the reproducible
source of truth for the submission.
