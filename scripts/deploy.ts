import { ethers } from "hardhat";
import { mkdir, writeFile } from "node:fs/promises";

async function main() {
  const Guard = await ethers.getContractFactory("MonadAgentGuard");
  const guard = await Guard.deploy();
  await guard.waitForDeployment();
  const address = await guard.getAddress();
  const network = await ethers.provider.getNetwork();
  const deployment = { contract: "MonadAgentGuard", address, chainId: network.chainId.toString(), deployedAt: new Date().toISOString() };
  await mkdir("deployments", { recursive: true });
  await writeFile(`deployments/${network.chainId}.json`, `${JSON.stringify(deployment, null, 2)}\n`);
  console.log(JSON.stringify(deployment, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
