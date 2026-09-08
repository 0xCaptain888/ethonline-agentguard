# Arc / Circle feedback

Status: live Arc Testnet integration completed.

The public evidence now covers all three task outcomes: VERIFIED release,
BLOCKED cancellation/refund and FROZEN containment after independent verifier
rejection. The failure-path receipt is
`evidence/arc-testnet-live-failure-outcomes.json`.

Record after testing:

- Arc docs / SDK path used: Arc Testnet JSON-RPC, chain `5042002`, native test
  USDC and an ethers/Hardhat deployment flow.
- Wallet and USDC flow that worked: buyer approval → task escrow → seller
  result commitment → independent EIP-191 verification → USDC release.
- What was confusing or missing: faucet and explorer discovery are separate
  from the RPC onboarding path; a single end-to-end testnet guide would reduce
  setup time.
- Error messages and recovery: RPC/DNS failures occur before broadcast and are
  safe to retry; transaction receipts are required before advancing state.
- VERIFIED transaction hash:
  `0x328a7d5169ff26ffbfa3cf811555c651920790de452ea0657cda7ffb7139efff`.
- Evidence receipt: `evidence/arc-testnet-graph-driven-task.json`.
