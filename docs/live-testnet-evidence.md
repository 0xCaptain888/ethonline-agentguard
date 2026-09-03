# Live Monad Testnet Evidence

All evidence below is from the recovery-enabled deployment on Monad Testnet
(chain `10143`). The contract is a hackathon MVP, not audited production
software.

| Field | Value |
| --- | --- |
| Contract | [`0xee84007f8618c2c38Be8C45E8050144EbF00CE4a`](https://testnet.monadexplorer.com/address/0xee84007f8618c2c38Be8C45E8050144EbF00CE4a) |
| Verified source | [Sourcify exact match on MonadVision](https://testnet.monadvision.com/contracts/full_match/10143/0xee84007f8618c2c38Be8C45E8050144EbF00CE4a/) |
| Build settings | Solidity `0.8.26` · optimizer enabled · `200` runs · no constructor arguments |
| Buyer Agent | `0xd64Fac11d711d7278a8Bb6D7be1E2De1fdBCC564` |
| Seller Agent | `0x637a61f2644E43aDa1eEeEb6Ff827B2aD60e669b` |
| Independent verifier | `0xE01337d3F0E061017d8Ce547e11d86C0705e8526` |

## Authenticated MetaMask Agent Wallet → VERIFIED path

Task `56` is the sponsor-complete path. A MetaMask Agent Wallet BYOK guard
wallet registered its identity, committed a `0.01 MON` maximum policy, bound
the independent verifier and created a `0.001 MON` YieldScout escrow. The
seller fetched a fresh DeFiLlama report, committed its result hash, and the
independent verifier signature released the escrow.

| Field | Value |
| --- | --- |
| Buyer wallet | [`0xD71cf4282466b2197AC69ad027Fd64270a4C2D9E`](https://testnet.monadexplorer.com/address/0xD71cf4282466b2197AC69ad027Fd64270a4C2D9E) |
| Wallet product | MetaMask Agent Wallet `6.2.0` · BYOK guard mode |
| Task | `56` |
| Result | **VERIFIED** (`2`) |
| Escrow | `0.001 MON` |
| Result hash | `0xb931f46edae22aaf7ebbff433507002764c7bfc538bab76b190c0f83cde2c16c` |
| Evidence hash | `0xc4c49b6e98bc5e4c200b1153cf0fdc299f0f73c02d0e01ef9d446d63a484815e` |
| Full receipt | [`evidence/metamask-agent-wallet-live.json`](../evidence/metamask-agent-wallet-live.json) |

Transaction trail:

- [Agent identity](https://testnet.monadexplorer.com/tx/0xc596f2fe6be76e03b3f5b6874e9240cfa6a390b30b1db8198c169313a8242fb5)
- [Bounded policy](https://testnet.monadexplorer.com/tx/0x91d03eddf640e915942d66321cfa997a1d9e379bff69231c31a388473bcf568b)
- [Independent verifier binding](https://testnet.monadexplorer.com/tx/0xb6b333beb2dc1c9d90b779c617a3c74cf059c076d6c2130e27d6c148ca23f40f)
- [Create task + escrow](https://testnet.monadexplorer.com/tx/0x6b0875f20eb4fe43b134a46f2740bce03193de1a58e962c6e0845f5a70b87927)
- [YieldScout submits report hash](https://testnet.monadexplorer.com/tx/0x4db379e1eb3900f54cb27bd674c15d6170a748ab909ff36df4bbf1a96cebbf57)
- [Independent verification + release](https://testnet.monadexplorer.com/tx/0x113d9c10506617dd2b408542bc7da242a0ab105faff345a911164dc82386a15a)

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

## Preferred fully reproducible receipts (September 3, 2026)

These receipts contain each seller's complete business report. The repository
verifier recomputes its task-specific hash and checks that it equals the result
hash committed on Monad before settlement.

### YieldScout · Task 30

- Work: fetch DeFiLlama and rank the top five Monad pools by TVL.
- Result hash: `0xda2d99741a880e33aa7fdf16ffc2f690e7fa444dcca3048aa2e461cbd1bf9470`
- Evidence hash: `0x4bf0962b5dca318e42e0be3880a975f40a6cad42b29191e69da5b4e5fc738996`
- [Create escrow](https://testnet.monadexplorer.com/tx/0x2b57c92ea84e7d660c9e1363908d62b5c4fc4b1ae744055eb2974bdc7f83a2dd)
- [Submit report hash](https://testnet.monadexplorer.com/tx/0x842c121dadaeb361103d6825415af10f145664f09564806fb3e5e285a7c20794)
- [Verify and release](https://testnet.monadexplorer.com/tx/0x5ade4e2e783f322fa9c096ef16c609a0afe2323560ef77f2de3ae2b01678d9d9)
- [Full receipt](../evidence/testnet-task-30.json)

### ChainSentinel · Task 29

- Work: read Monad Testnet block, gas and ten-block timing data.
- Result hash: `0x7f8f72630f40a2312c7b46eba528c5e7900c63d4db26e4d727de49a4fa466717`
- Evidence hash: `0x88cd54badae759492e3a983ab8cebc41572af763b9f3f4063cce5c81e5cb139a`
- [Create escrow](https://testnet.monadexplorer.com/tx/0x0127318b68638e5e87f66c4cdb2d4b7127359774fba0f0b64f605538cea60e6d)
- [Submit report hash](https://testnet.monadexplorer.com/tx/0x6ac61bd1fd492416300056f860da45af0054e2a4077e5a20ba22892228b843e9)
- [Verify and release](https://testnet.monadexplorer.com/tx/0xa97ed7f0863171680fe0dcd4c20130696471d6832db08f57fad65fe42fb6f1fe)
- [Full receipt](../evidence/testnet-task-29.json)
