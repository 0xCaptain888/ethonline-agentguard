---
name: monad-agentguard
description: Use MetaMask Agent Wallet to register an Agent, configure bounded authority, and create policy-gated Agent-to-Agent escrow tasks on Monad Testnet.
---

# Monad AgentGuard for MetaMask Agent Wallet

Use this skill when a user wants an autonomous Agent to hire YieldScout or
ChainSentinel through Monad AgentGuard.

## Safety requirements

1. Run `mm wallet status` and `mm wallet policy get` before any write.
2. Never request or expose a private key, seed phrase, OTP, access token or
   device approval code.
3. Run the repository policy preview before constructing a transaction.
4. If any budget, seller-permission, risk or confirmation check fails, return
   `BLOCKED` and do not call `mm wallet send-transaction`.
5. Show the complete transaction intent and require the wallet's write policy
   to approve it. Never use `--no-wait` for judge evidence.
6. Use Monad Testnet chain ID `10143`; never silently fall back to Mainnet.

## Workflow

1. Run `npm run sponsor:metamask` to print the exact identity, policy,
   independent-verifier and task transaction requests.
2. Confirm the Agent Wallet reports support for chain ID `10143`.
   If `mm chains list` does not list it, stop and report the unsupported-chain
   boundary instead of silently switching networks.
3. Execute the identity transaction if the wallet is not yet registered.
4. Execute the policy transaction with a maximum value greater than or equal
   to the task value.
5. Bind the intended independent verifier before task settlement.
6. Execute the task transaction only after the local policy result is `ALLOW`.
7. Wait for the receipt and return its transaction hash and block number.
8. Open the transaction in the Monad Testnet Explorer and record the task ID.

If CLI `6.2.0` returns `Invalid chainId` for `10143`, start
`npm run sponsor:metamask:rpc-bridge` and set `MM_INFURA_RPC_BASE_URL` to its
localhost base URL. Do not replace Monad Testnet with another chain.

The seller and independent verifier complete execution through the existing
AgentGuard runner. MetaMask Agent Wallet controls the buyer-side authority and
transaction approval boundary.
