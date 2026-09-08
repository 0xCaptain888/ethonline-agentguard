# Browser evidence verification

The public Demo publishes `evidence/ethonline-manifest.json` as a static
artifact during the Pages workflow. The browser loads that same file and
checks:

- the ETHOnline Continuity submission label;
- exactly three sponsor entries;
- that `DESIGN` sponsors contain no contract, transaction or evidence hash;
- coverage for `VERIFIED`, `BLOCKED` and `FROZEN` outcomes.

The manifest now points all three outcomes to live Arc Testnet evidence. The
browser's interactive controls remain non-broadcasting replays so judges can
change policy and result quality without a wallet.

This protects against a stale or accidentally over-claimed Demo page. It is a
consistency check, not a replacement for cryptographic transaction verification
or a sponsor's own explorer. Live claims still require a public provider
response or testnet receipt in the manifest.
