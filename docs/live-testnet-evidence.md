# Live Monad Testnet Evidence

This receipt was generated on **September 2, 2026** by `npm run task:testnet`.

| Field | Value |
| --- | --- |
| Network | Monad Testnet (`10143`) |
| Contract | [`0x8b284E27563aE33a71b170386eC8e8abab1d7067`](https://testnet.monadscan.com/address/0x8b284E27563aE33a71b170386eC8e8abab1d7067) |
| Buyer | `0xd64Fac11d711d7278a8Bb6D7be1E2De1fdBCC564` |
| Seller | `0x637a61f2644E43aDa1eEeEb6Ff827B2aD60e669b` |
| Task | `0` |
| Escrow | `0.01 MON` |
| Final state | **VERIFIED** (`2`) |
| Evidence hash | `0xc1f72e0044170617dfb14ff8eeb9af0c2eb291c1f548f8cd02c1e37405422ff4` |

## Transaction trail

- [Buyer identity registration](https://testnet.monadscan.com/tx/0x9fb2b1339582da21d55510359c37e32a23ec37a8e500b2b6b9b558b239f02633)
- [Seller identity registration](https://testnet.monadscan.com/tx/0x6fa0c6c3e9a0e0582835748b39db94134c654085f0a6e1d556f56f0e836f5710)
- [Policy update](https://testnet.monadscan.com/tx/0x096618c0cebbd15a12d0e53120d58241a50e768c2bd5cd9b37c6b7780dfa627d)
- [Task creation and escrow](https://testnet.monadscan.com/tx/0xc64dbe55edd26c807afb350ab69b5cd0a783fa0547a3e30a91fb8e3c966c76d1)
- [Seller result submission](https://testnet.monadscan.com/tx/0x5ff3a98f5b29c811f668ce71f42ad4c32054b3fb2b400525bc3377d6170cb809)
- [Independent verification and release](https://testnet.monadscan.com/tx/0xd67f7a7d553a0ff9859d5e8edf7a62603b7abb51e5ce9d66729ee3fc6dc28b1b)

The machine-readable receipt is [`evidence/testnet-task-0.json`](../evidence/testnet-task-0.json). The contract is a hackathon MVP and is not audited production software.

## Failure-path evidence

The same deployed contract also has live failure-path receipts:

| State | Task | Evidence hash | Final transaction |
| --- | ---: | --- | --- |
| **BLOCKED** | 1 | `0x5fccc5795b8aecff12575ca6df1844b6e6ab81c8d602595976b291044387b167` | [block and refund](https://testnet.monadscan.com/tx/0x759fc86dfff8da3893c977a1c3e40a9db2191f857a842f3d914f4e3924c3c287) |
| **FROZEN** | 2 | `0xc521267d0862ee3cf54fb982c2bcbc75492201d1dcb4440fce24743a8ccd868f` | [freeze after failed verification](https://testnet.monadscan.com/tx/0x517632f06d89652893ea51c484e56983dec912b3ace69c675d983d7c78b514c4) |

Receipts: [`BLOCKED`](../evidence/testnet-task-1-blocked.json) · [`FROZEN`](../evidence/testnet-task-2-frozen.json)
