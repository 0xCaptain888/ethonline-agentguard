# Live Monad Testnet Evidence

All evidence below is from the recovery-enabled deployment on Monad Testnet
(chain `10143`). The contract is a hackathon MVP, not audited production
software.

| Field | Value |
| --- | --- |
| Contract | [`0xee84007f8618c2c38Be8C45E8050144EbF00CE4a`](https://testnet.monadscan.com/address/0xee84007f8618c2c38Be8C45E8050144EbF00CE4a) |
| Buyer Agent | `0xd64Fac11d711d7278a8Bb6D7be1E2De1fdBCC564` |
| Seller Agent | `0x637a61f2644E43aDa1eEeEb6Ff827B2aD60e669b` |
| Independent verifier | `0xE01337d3F0E061017d8Ce547e11d86C0705e8526` |

## Real external-data → VERIFIED path

Task `25` was created by `TreasuryPlanner` for `YieldScout`. YieldScout read
DeFiLlama's public pools endpoint, ranked the top five Monad pools by TVL,
passed the independent structural verifier, and committed the report hash
on-chain. The 0.01 MON escrow was released only after the verifier signature.

| Field | Value |
| --- | --- |
| Result | **VERIFIED** (`2`) |
| Evidence hash | `0x5091f7f54e01f0c5eb22b407d6b774d9e065b98407f8574b12a2a63f6f7648b1` |
| YieldScout result hash | `0xe856a4c1688817020e1a072a3e97a146828f1daec7abfac92d686e877b0fda5a` |
| Data source | [DeFiLlama pools API](https://yields.llama.fi/pools) |
| Receipt | [`evidence/testnet-task-25.json`](../evidence/testnet-task-25.json) |

Transaction trail:

- [Create task + escrow](https://testnet.monadexplorer.com/tx/0x92831a2f13296cb5f403b3b5fd9d5bf8c83506523f9081e02d2d56824a77b35e)
- [YieldScout submits external result hash](https://testnet.monadexplorer.com/tx/0x4f5c4cb3b573398b57604ba6b49aeb14ee34881b88756ac5ce53de907dd0bd72)
- [Independent verifier signs and releases](https://testnet.monadexplorer.com/tx/0x058b29c97b6774aac1f2018bf26508030faa0fcc9f5b5b524df5a3578dd890c7)

## Failure and recovery paths

| State | Task | Evidence | Final transaction |
| --- | ---: | --- | --- |
| **BLOCKED** | 26 | [`testnet-task-26-blocked.json`](../evidence/testnet-task-26-blocked.json) | [block + refund](https://testnet.monadexplorer.com/tx/0x35a25bdd69c3de15adb676ac1a29aae37eb09abff518075616aa9f701ee9a34b) |
| **FROZEN** | 27 | [`testnet-task-27-frozen.json`](../evidence/testnet-task-27-frozen.json) | [failed verification](https://testnet.monadexplorer.com/tx/0xa1193b2aaa7a5c9e25d10c1d81331e3180e2b9d83bdacf1f95f8acdbcf58ea8c) |
| **REFUNDED** | 27 | [`testnet-task-27-recovered.json`](../evidence/testnet-task-27-recovered.json) | [buyer approval](https://testnet.monadexplorer.com/tx/0x319d2ea05905eec616b1083bd8cf2bde0b27412ea68812519fc5f640cb3532a5), [seller approval](https://testnet.monadexplorer.com/tx/0x610bbf66a7c8bff9cbf951a8a0dd8d03299cfa38a819e67d21574ec7eb0b23d0) |

`FROZEN` recovery is now a live two-party barrier: the recorded buyer and
seller must approve the same decision. Decision `1` refunds the buyer;
decision `2` releases the seller. Production extensions (deadlines, signed
approvals and neutral arbiter quorum) remain outside this MVP.

## Performance sample

[`docs/benchmark-testnet.json`](benchmark-testnet.json) contains 25 live
`createTask` transactions on the same deployment: 100% mined successfully,
approximately 2,000 ms average receipt latency and 170,670 average gas. This
measures task creation only, not end-to-end agent latency.
