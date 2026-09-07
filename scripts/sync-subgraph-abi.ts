import { mkdir, readFile, writeFile } from "node:fs/promises";

async function main() {
  const artifactPath = "artifacts/contracts/PolicyEscrowERC20.sol/PolicyEscrowERC20.json";
  const artifact = JSON.parse(await readFile(artifactPath, "utf8")) as { abi: unknown[] };
  if (!Array.isArray(artifact.abi) || artifact.abi.length === 0) throw new Error("PolicyEscrowERC20 ABI missing");
  await mkdir("subgraph/abis", { recursive: true });
  await writeFile("subgraph/abis/PolicyEscrowERC20.json", `${JSON.stringify(artifact.abi, null, 2)}\n`);
  console.log(JSON.stringify({ source: artifactPath, destination: "subgraph/abis/PolicyEscrowERC20.json", entries: artifact.abi.length }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
