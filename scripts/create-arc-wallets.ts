import { readFile, writeFile } from "node:fs/promises";
import { Wallet } from "ethers";

const envPath = ".env";
const roles = ["ARC_DEPLOYER", "ARC_SELLER", "ARC_VERIFIER"] as const;

async function main() {
  let contents = await readFile(envPath, "utf8").catch(() => "");
  const existing = roles.filter((role) => new RegExp(`^${role}_PRIVATE_KEY=.+$`, "m").test(contents));
  if (existing.length > 0) throw new Error(`Refusing to replace existing local wallets: ${existing.join(", ")}`);
  const wallets = roles.map((role) => ({ role, wallet: Wallet.createRandom() }));
  if (!contents.endsWith("\n")) contents += "\n";
  contents += "\n# Disposable Arc Testnet wallets; never commit or share these keys.\n";
  for (const { role, wallet } of wallets) contents += `${role}_PRIVATE_KEY=${wallet.privateKey}\n`;
  await writeFile(envPath, contents, { mode: 0o600 });
  console.log(JSON.stringify({
    evidenceClass: "LOCAL_WALLET_INITIALIZATION",
    network: "Arc Testnet",
    wallets: wallets.map(({ role, wallet }) => ({ role, address: wallet.address })),
    privateKeysPrinted: false,
    storedIn: ".env (Git-ignored, mode 0600)",
  }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
