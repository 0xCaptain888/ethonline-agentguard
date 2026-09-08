import { readFile, writeFile, mkdir } from "node:fs/promises";

async function main() {
  const dbg = JSON.parse(await readFile("artifacts/contracts/PolicyEscrowERC20.sol/PolicyEscrowERC20.dbg.json", "utf8"));
  const buildInfoPath = `artifacts/build-info/${String(dbg.buildInfo).split("/").pop()}`;
  const buildInfo = JSON.parse(await readFile(buildInfoPath, "utf8"));
  const input = buildInfo.input;
  await mkdir("verification", { recursive: true });
  await writeFile("verification/arc-policy-escrow-standard-input.json", `${JSON.stringify(input, null, 2)}\n`);
  console.log(JSON.stringify({ output: "verification/arc-policy-escrow-standard-input.json", solc: buildInfo.solcLongVersion, optimizer: input.settings.optimizer, evmVersion: input.settings.evmVersion }, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
