# Live Monad Testnet Evidence

This receipt was generated on **September 2, 2026** by `npm run task:testnet`.

| Field | Value |
| --- | --- |
| Network | Monad Testnet (`10143`) |
| Contract | [`0x7D9204Ce050cb917b2Db703ec2a63CC987C15235`](https://testnet.monadscan.com/address/0x7D9204Ce050cb917b2Db703ec2a63CC987C15235) |
| Buyer | `0xd64Fac11d711d7278a8Bb6D7be1E2De1fdBCC564` |
| Seller | `0x637a61f2644E43aDa1eEeEb6Ff827B2aD60e669b` |
| Task | `0` |
| Escrow | `0.01 MON` |
| Final state | **VERIFIED** (`2`) |
| Evidence hash | `0x42d1c397c830a58ea7666104abb78a304a02bb9d99f6277bbbe1d59214872fee` |
| Independent verifier | `0xE01337d3F0E061017d8Ce547e11d86C0705e8526` |

## Transaction trail

- [Buyer identity registration](https://testnet.monadscan.com/tx/0x6710465e9993f18bc35cb6c143c040691e5f16247d9870c11d7472770f2eb147)
- [Seller identity registration](https://testnet.monadscan.com/tx/0xd91180633e671a07857e909a04701149ccfeb2b7398a2043c8a9fa1cef2df9ef)
- [Policy update](https://testnet.monadscan.com/tx/0x510281e98d938f461efba214e96d1e551ed1fd63b1722010b122dab9f22e0b16)
- [Independent verifier assignment](https://testnet.monadscan.com/tx/0xcfdab2b725f3355b5aaf474a163fe3aea6b62326f057dcd5c56f305fb591072d)
- [Task creation and escrow](https://testnet.monadscan.com/tx/0xd6e3e77c5bbcf284eacf571da5a25c7866e6b97f2319445a7a28f907d48dab3d)
- [Seller result submission](https://testnet.monadscan.com/tx/0xc802ab8391773f26f7f586afe667152d7a4103b2066c6b5ef137ebbb16032fa9)
- [Independent signed verification and release](https://testnet.monadscan.com/tx/0x881522f10258a1bb589b1abf2d0d29422226f872084c0fd9c06e67356f46ea42)

The machine-readable receipt is [`evidence/testnet-task-0.json`](../evidence/testnet-task-0.json). The contract is a hackathon MVP and is not audited production software.

## Failure-path evidence

The same deployed contract also has live failure-path receipts:

| State | Task | Evidence hash | Final transaction |
| --- | ---: | --- | --- |
| **BLOCKED** | 1 | `0x92f7c0deb84ba5efba535b8fabaae729ebccf21ad8b239d53ef5b7f4f043f600` | [block and refund](https://testnet.monadscan.com/tx/0x9edf71e46139e44cf8447e0203d9fdc4f79464e481687255be0ee4528b473383) |
| **FROZEN** | 2 | `0x83495f54f0b4166491c49e87064f23a7999998e064ed3c4e52e205c8ef60dd2f` | [freeze after failed verification](https://testnet.monadscan.com/tx/0xb57dab7d9db6391bd64c9338b03c11f2e76bdaec80eb4080e9cdb811f6e9c51c) |

Receipts: [`BLOCKED`](../evidence/testnet-task-1-blocked.json) · [`FROZEN`](../evidence/testnet-task-2-frozen.json)

These failure-path receipts were produced on the upgraded verifier-signature contract at the same address. Their evidence hashes are computed from the machine-readable receipt payloads and are included in each file.
