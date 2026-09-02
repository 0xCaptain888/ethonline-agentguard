# Monad Testnet Runbook

This is the shortest judge-reproducible path from a funded wallet to a live receipt.

## 1. Configure two wallets

Create dedicated testnet-only buyer and seller wallets. Put their private keys in the ignored local `.env` file:

```bash
DEPLOYER_PRIVATE_KEY=0x...
SELLER_PRIVATE_KEY=0x...
MONAD_TESTNET_RPC_URL=https://rpc.testnet.monad.xyz
```

Fund both addresses from the [Monad faucet](https://faucet.monad.xyz). The buyer needs gas for deployment and five transactions; the seller needs gas for registration and result submission.

## 2. Deploy

```bash
npm run deploy:testnet
```

The command writes `deployments/10143.json` locally. Never invent an address if deployment fails.

## 3. Execute and attest one task

```bash
npm run task:testnet
```

The runner performs `registerAgent → setPolicy → createTask → submitResult → verifyTask`, then checks that the on-chain enum is `VERIFIED` (`2`). It writes a receipt under `evidence/` containing every transaction hash, block number, Monad Explorer URL, and an evidence hash.

## 4. Judge verification

Open the contract and transaction URLs in the receipt. Confirm the `TaskCreated`, `ResultSubmitted`, and `TaskVerified` events and compare the receipt's `onchainState` with the displayed contract state.

## Safety

This is a testnet-only MVP. Do not use mainnet keys, do not reuse a production wallet, and do not claim a live deployment until the receipt and Explorer links exist.
