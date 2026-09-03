# Security notes

Monad AgentGuard is an active hackathon reference implementation, not audited production software.

- Never commit `DEPLOYER_PRIVATE_KEY`, RPC credentials, or wallet seed phrases.
- Use a dedicated Monad Testnet wallet for development.
- The current contract supports native MON escrow only; token escrow and production dispute resolution are not yet implemented.
- `FROZEN` funds require matching buyer and seller recovery approvals. Task 27 demonstrates a live refund, but deadline-based recovery and neutral arbitration are not implemented. Do not use the MVP with funds you cannot afford to lock.
- The AI planner is not a trusted authorization boundary. Integrators must keep policy evaluation and result verification independent.
- Before mainnet use, the contract needs a formal review, access-control hardening, pause/recovery design, invariant tests, and a third-party audit.

## Deployment verification

- V1 Monad Testnet contract: `0xee84007f8618c2c38Be8C45E8050144EbF00CE4a`
- [V1 Sourcify exact-match source](https://testnet.monadvision.com/contracts/full_match/10143/0xee84007f8618c2c38Be8C45E8050144EbF00CE4a/)
- Parallel V2 Monad Testnet contract: `0x91A62595C8eF8c5E5cddcd782cAd7FDdd38D5169`
- [V2 Sourcify exact-match source](https://testnet.monadvision.com/contracts/full_match/10143/0x91A62595C8eF8c5E5cddcd782cAd7FDdd38D5169/)
- Solidity compiler: `0.8.26`
- Optimizer: enabled with `200` runs
- Constructor arguments: none

Source verification proves that the published source compiles to the deployed
bytecode. It is not a security audit or an endorsement of the contract.

## Dependency boundary

The public product is a static browser site and the package has no deployed
Node service. `npm audit` findings are currently in the Hardhat 2 / Toolbox
development dependency tree. A non-breaking audit fix was applied on September
3, 2026; the remaining advisories require a breaking Hardhat 3 / Toolbox 7
migration. That migration should be performed on a separate branch and must
reproduce compiler settings, bytecode verification and the complete test suite
before replacement. Do not treat this note as a substitute for dependency
maintenance or a production audit.

See [`docs/dependency-security.md`](docs/dependency-security.md) for the
runtime-vs-development audit commands and the isolated Hardhat 3 migration
procedure. Dependabot tracks future npm fixes without silently changing the
verified submission branch.

Report suspected vulnerabilities privately to the repository owner before opening a public issue.
