# MetaMask Agent Wallet integration

This integration targets the Metropolis **Best Agent Wallet Plugin** sponsor
prize while strengthening the core product instead of adding an unrelated SDK.

MetaMask Agent Wallet becomes the buyer-side wallet and approval boundary.
Monad AgentGuard remains the on-chain policy, escrow, verification and receipt
boundary. The adapter produces explicit `mm wallet send-transaction` commands
for:

1. `registerAgent`;
2. `setPolicy`;
3. `setVerifier` to bind an independent result verifier;
4. `createTask` with native MON escrow.

Run:

```bash
npm run sponsor:metamask
```

## Live Monad Testnet proof

Task `56` was created by an authenticated MetaMask Agent Wallet `6.2.0` BYOK
guard wallet and completed through the full YieldScout seller and independent
verifier path. The public receipt is
[`evidence/metamask-agent-wallet-live.json`](../../evidence/metamask-agent-wallet-live.json).

- identity: `0xc596f2fe…a8242fb5`;
- policy: `0x91d03edf…3bcf568b`;
- verifier binding: `0xb6b333be…ca23f40f`;
- task escrow: `0x6b0875f2…70b87927`;
- seller result: `0x4db379e1…6cebbf57`;
- independent release: `0x113d9c10…386a15a`.

CLI `6.2.0` lists Monad Testnet chain `10143`, but its default Infura gateway
does not currently route that chain. `npm run sponsor:metamask:rpc-bridge`
starts a localhost-only JSON-RPC bridge to the Monad Testnet RPC; set
`MM_INFURA_RPC_BASE_URL` to its printed base URL while executing the generated
commands. MetaMask still performs wallet signing and authorization. The bridge
receives standard public JSON-RPC payloads only and never receives the
mnemonic, private key or authenticated session token.

The command shape was checked against the official CLI `6.2.0`. To execute it
outside this repository, install the wallet separately:

```bash
npm install -g @metamask/agent-wallet@6.2.0
mm login
mm chains list --json
```

Chain discovery requires an authenticated CLI session. Do not broadcast unless
chain ID `10143` is listed and the Agent Wallet write policy approves the
human-readable intent.

Each command uses the official `--payload` raw-EVM transaction shape with
hex-encoded value and calldata, plus a human-readable `--intent`. The output is
deterministic, credential-free and covered by tests. Executing
the generated commands requires a separately authenticated MetaMask Agent
Wallet session. The repository never inherits or stores that session.

The accompanying [`SKILL.md`](SKILL.md) is an installable Agent instruction
surface with policy-first behavior and explicit no-secret/no-mainnet rules.
