# Security notes

Monad AgentGuard is an active hackathon reference implementation, not audited production software.

- Never commit `DEPLOYER_PRIVATE_KEY`, RPC credentials, or wallet seed phrases.
- Use a dedicated Monad Testnet wallet for development.
- The current contract supports native MON escrow only; token escrow and production dispute resolution are not yet implemented.
- `FROZEN` funds remain in the contract until a future dispute/recovery path is added. Do not use the MVP with funds you cannot afford to lock.
- The AI planner is not a trusted authorization boundary. Integrators must keep policy evaluation and result verification independent.
- Before mainnet use, the contract needs a formal review, access-control hardening, pause/recovery design, invariant tests, and a third-party audit.

Report suspected vulnerabilities privately to the repository owner before opening a public issue.
