import { generateP256KeyPair } from "@privy-io/node";
import { access, chmod, writeFile } from "node:fs/promises";

const output = ".env.privy";

async function main() {
  try {
    await access(output);
    throw new Error(`${output} already exists; refusing to overwrite an authorization key`);
  } catch (error) {
    if (error instanceof Error && !error.message.includes("ENOENT")) throw error;
  }

  const keypair = await generateP256KeyPair();
  const contents = [
    "# Local Privy P-256 authorization material. Never commit or share this file.",
    `PRIVY_AUTHORIZATION_PUBLIC_KEY=${keypair.publicKey}`,
    `PRIVY_AUTHORIZATION_PRIVATE_KEY=${keypair.privateKey}`,
    "PRIVY_POLICY_ID=",
    "PRIVY_LIVE_WALLET_ID=",
    "PRIVY_LIVE_WALLET_ADDRESS=",
    "",
  ].join("\n");
  await writeFile(output, contents, { mode: 0o600, flag: "wx" });
  await chmod(output, 0o600);
  console.log(JSON.stringify({ status: "CREATED", file: output, mode: "0600", privateKeyPrinted: false }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
