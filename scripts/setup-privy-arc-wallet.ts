import { PrivyClient } from "@privy-io/node";
import { readFile, writeFile, chmod } from "node:fs/promises";

const secretFile = ".env.privy";

function required(name: string): string {
  const value = process.env[name];
  if (!value) throw new Error(`${name} is required`);
  return value;
}

async function updateSecretFile(values: Record<string, string>) {
  let contents = await readFile(secretFile, "utf8");
  for (const [name, value] of Object.entries(values)) {
    const line = `${name}=${value}`;
    const pattern = new RegExp(`^${name}=.*$`, "m");
    contents = pattern.test(contents) ? contents.replace(pattern, line) : `${contents.trimEnd()}\n${line}\n`;
  }
  await writeFile(secretFile, contents, { mode: 0o600 });
  await chmod(secretFile, 0o600);
}

async function main() {
  const appId = required("PRIVY_APP_ID");
  const appSecret = required("PRIVY_APP_SECRET");
  const publicKey = required("PRIVY_AUTHORIZATION_PUBLIC_KEY");
  const escrow = required("ARC_ESCROW_ADDRESS");
  const token = required("ARC_USDC_ADDRESS");
  const chainId = required("ARC_CHAIN_ID");
  const privateKeyPresent = Boolean(process.env.PRIVY_AUTHORIZATION_PRIVATE_KEY);
  if (!privateKeyPresent) throw new Error("PRIVY_AUTHORIZATION_PRIVATE_KEY is required locally");

  const privy = new PrivyClient({ appId, appSecret });
  let policyId = process.env.PRIVY_POLICY_ID;
  if (!policyId) {
    const policy = await privy.policies().create({
      chain_type: "ethereum",
      name: "ETHOnline AgentGuard Arc allowlist",
      version: "1.0",
      owner: { public_key: publicKey },
      idempotency_key: "ethonline-agentguard-arc-policy-v1",
      rules: [
        {
          name: "Allow AgentGuard escrow writes on Arc",
          action: "ALLOW",
          method: "eth_signTransaction",
          conditions: [
            { field_source: "ethereum_transaction", field: "chain_id", operator: "eq", value: chainId },
            { field_source: "ethereum_transaction", field: "to", operator: "eq", value: escrow },
            { field_source: "ethereum_transaction", field: "value", operator: "eq", value: "0" },
          ],
        },
        {
          name: "Allow Arc USDC approval",
          action: "ALLOW",
          method: "eth_signTransaction",
          conditions: [
            { field_source: "ethereum_transaction", field: "chain_id", operator: "eq", value: chainId },
            { field_source: "ethereum_transaction", field: "to", operator: "eq", value: token },
            { field_source: "ethereum_transaction", field: "value", operator: "eq", value: "0" },
          ],
        },
      ],
    });
    policyId = policy.id;
  }

  let walletId = process.env.PRIVY_LIVE_WALLET_ID;
  let walletAddress = process.env.PRIVY_LIVE_WALLET_ADDRESS;
  if (!walletId || !walletAddress) {
    const wallet = await privy.wallets().create({
      chain_type: "ethereum",
      display_name: "ETHOnline AgentGuard Arc buyer",
      external_id: "ethonline-agentguard-arc-buyer-v1",
      owner: { public_key: publicKey },
      policy_ids: [policyId],
      idempotency_key: "ethonline-agentguard-arc-wallet-v1",
    });
    walletId = wallet.id;
    walletAddress = wallet.address;
  }

  await updateSecretFile({
    PRIVY_POLICY_ID: policyId,
    PRIVY_LIVE_WALLET_ID: walletId,
    PRIVY_LIVE_WALLET_ADDRESS: walletAddress,
  });

  console.log(JSON.stringify({
    status: "PRIVY_POLICY_WALLET_READY",
    walletId,
    walletAddress,
    policyId,
    chainId,
    allowedTargets: [escrow, token],
    authorizationPrivateKeyPrinted: false,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
