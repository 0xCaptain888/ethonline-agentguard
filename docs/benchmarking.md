# Monad Testnet benchmark

The benchmark measures the actual deployed escrow contract, not a local EVM.
It submits 25–50 small `createTask` transactions and records transaction
latency, block numbers, gas used and aggregate tasks/second. It does not claim
that task creation alone represents end-to-end agent latency.

Run it only with a funded testnet buyer and seller:

```bash
set -a; source .env; set +a
BENCHMARK_TASKS=25 npm run benchmark:testnet
```

The result is written to `docs/benchmark-testnet.json` and labelled
`LIVE_TESTNET_BENCHMARK`. It is intentionally excluded from the committed
receipt verifier because benchmark samples are performance telemetry, not
settlement evidence.
