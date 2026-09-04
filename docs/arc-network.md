# Arc Testnet configuration

The official Arc Testnet parameters used by the adapter are:

| Parameter | Value |
| --- | --- |
| Chain ID | `5042002` |
| RPC | `https://rpc.testnet.arc.network` |
| Explorer | `https://testnet.arcscan.app` |
| Native gas/USDC display | USDC (6 display decimals; 18 internal transaction decimals) |
| USDC ERC-20 interface | `0x3600000000000000000000000000000000000000` |
| Finality | deterministic; one confirmation is sufficient |

These values are copied from Arc's public network documentation. They are
configuration references, not evidence that this repository has already
deployed to Arc. A real deployment record and transaction hash will be added
only after a funded testnet wallet and a verified contract are available.
