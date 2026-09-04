# Contract Security Notes

`PolicyEscrowERC20.sol` is the ETHOnline escrow boundary. It is a hackathon
prototype, not an audited production contract. The source intentionally keeps
the settlement surface small so a judge can inspect the state transitions.

## Invariants shown by the tests

- The escrow token is immutable per deployment; a task cannot switch payment
  assets after creation.
- Only the buyer can create a task for its own deterministic task id.
- A task can move to `VERIFIED` only after an independent verifier signature
  matches the task, result hash and policy hash.
- `BLOCKED` is a pre-execution policy result; no seller payout is released.
- `FROZEN` isolates funds after a post-execution verification failure.
- Recovery requires the configured recovery path and never silently releases a
  frozen task to the seller.

## Known prototype boundaries

- No formal third-party audit has been performed.
- The verifier key is an application-level boundary in this prototype; a
  production deployment should use a threshold signer or MPC policy.
- Replay protection, nonce management and token return-value edge cases need a
  dedicated audit before mainnet use.
- Arc deployment, Privy signing and sponsor-specific production controls are
  not claimed until their public testnet evidence is added to the manifest.

## Judge verification

Run `npm run ethonline:manifest:verify` to validate that the repository does
not accidentally label design placeholders as live sponsor evidence. Run the
contract tests with `npm test` before reviewing any deployment claim.
