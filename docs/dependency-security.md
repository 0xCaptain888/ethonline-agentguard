# Dependency security posture

## Current result

AgentGuard is a static GitHub Pages demo plus a local Hardhat development
toolchain. `package.json` has no `dependencies`; all npm packages are
`devDependencies`. Therefore the published site does not ship the Hardhat
runtime, Solidity compiler, test runner or their transitive packages.

The current checks are:

```bash
# Runtime/deployable dependency surface — must stay clean
npm run security:audit

# Full development tree — informational until the Hardhat 3 migration
npm run security:audit:full
```

As of September 3, 2026, the runtime audit is clean. The full audit reports 46
advisories in the Hardhat 2 / Toolbox 5 development tree after the available
non-breaking fixes. The remaining high-severity entries are transitive tools
such as `adm-zip`, `undici`, `serialize-javascript`, `tmp` and `lodash`.

## Why we do not force-fix the main branch

`npm audit fix --force` would replace the verified Hardhat 2 toolchain with a
Hardhat 3 / Toolbox 7 major migration. That can change compiler plugins,
TypeScript configuration, generated typings, gas estimation and verification
artifacts. A vulnerability count of zero is not worth invalidating the
published Monad bytecode or CI evidence immediately before a hackathon
submission.

## Correct remediation path

1. Create a separate branch such as `security/hardhat3-migration`.
2. Upgrade Hardhat and Toolbox together; do not mix major versions.
3. Reproduce Solidity `0.8.26`, optimizer `200`, generated TypeChain output and
   both local contract suites.
4. Re-run every evidence verifier and the Monad Testnet smoke task.
5. Compare deployed bytecode and Sourcify metadata before changing the
   submission deployment.
6. Merge only after CI, `npm audit --omit=dev` and the full judge check pass.

Until that branch is independently validated, the safe production posture is
to run the repository in an isolated, patched Node 22 environment and never
use this hackathon toolchain as a public server.
