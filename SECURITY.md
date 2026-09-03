# Security notes

Monad AgentGuard is an active hackathon reference implementation, not audited production software.

- Never commit `DEPLOYER_PRIVATE_KEY`, RPC credentials, or wallet seed phrases.
- Use a dedicated Monad Testnet wallet for development.
- The current contract supports native MON escrow only; token escrow and production dispute resolution are not yet implemented.
- `FROZEN` funds require matching buyer and seller recovery approvals. Task 27 demonstrates a live refund, but deadline-based recovery and neutral arbitration are not implemented. Do not use the MVP with funds you cannot afford to lock.
- The AI planner is not a trusted authorization boundary. Integrators must keep policy evaluation and result verification independent.
- Before mainnet use, the contract needs a formal review, access-control hardening, pause/recovery design, invariant tests, and a third-party audit.

## Deployment verification

- Monad Testnet contract: `0xee84007f8618c2c38Be8C45E8050144EbF00CE4a`
- [Sourcify exact-match source](https://testnet.monadvision.com/contracts/full_match/10143/0xee84007f8618c2c38Be8C45E8050144EbF00CE4a/)
- Solidity compiler: `0.8.26`
- Optimizer: enabled with `200` runs
- Constructor arguments: none

Source verification proves that the published source compiles to the deployed
bytecode. It is not a security audit or an endorsement of the contract.

Report suspected vulnerabilities privately to the repository owner before opening a public issue.
