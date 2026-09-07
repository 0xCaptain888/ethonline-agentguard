# Privy feedback

Status: `LIVE_TESTNET`; a dedicated Privy wallet authorized five bounded Arc
writes and created a 1 USDC task that settled as VERIFIED.

Record after testing:

- Wallet / organization flow used: server-side Ethereum wallet created through
  `@privy-io/node`, owned by a local P-256 authorization key.
- Policy, signer or intent control used: `eth_signTransaction` allow rules
  restricted to Arc chain `5042002`, zero native value and only the AgentGuard
  escrow and Arc USDC contract targets.
- What worked well: the wallet and policy objects compose cleanly, and the
  authorization context keeps raw signing material outside the repository.
- What was confusing or missing: policy field formats and the separation
  between app authentication, wallet ownership and transaction authorization
  require careful reading; an end-to-end constrained ERC-20 example would
  shorten onboarding.
- Error messages and recovery: expired/rotated App Secrets fail safely before
  a signing request. Idempotency keys prevent duplicate setup resources.
- Wallet/control evidence:
  `evidence/arc-testnet-privy-authorized-task.json`; task creation
  `0x7ec5e29f0ad2cfc210a72fd4e5220c580b2e6407eb21080ee0947990b9cd06f6`;
  authorization evidence hash
  `0x80d0f8ec6e8beb2f48a002c94cfc260d200df1a7cc2075daa1d4c8b831a0e0e8`.
