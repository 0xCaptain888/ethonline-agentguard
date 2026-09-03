# MetaMask Agent Wallet integration

This integration targets the Metropolis **Best Agent Wallet Plugin** sponsor
prize while strengthening the core product instead of adding an unrelated SDK.

MetaMask Agent Wallet becomes the buyer-side wallet and approval boundary.
Monad AgentGuard remains the on-chain policy, escrow, verification and receipt
boundary. The adapter produces explicit `mm wallet send-transaction` commands
for:

1. `registerAgent`;
2. `setPolicy`;
3. `createTask` with native MON escrow.

Run:

```bash
npm run sponsor:metamask
```

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
