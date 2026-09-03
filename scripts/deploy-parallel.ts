import { ethers } from "hardhat";
import { mkdir, writeFile } from "node:fs/promises";

async function main() {
  const [deployer] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 10143n) throw new Error(`Refusing to deploy on chain ${network.chainId}`);
  const Factory = await ethers.getContractFactory("MonadAgentGuardParallel");
  const guard = await Factory.deploy();
  await guard.waitForDeployment();
  const deploymentTransaction = guard.deploymentTransaction();
  if (!deploymentTransaction) throw new Error("Deployment transaction unavailable");
  const receipt = await deploymentTransaction.wait();
  if (!receipt || receipt.status !== 1) throw new Error("Parallel deployment failed");
  const evidence = {
    contract: "MonadAgentGuardParallel",
    version: "2",
    network: "Monad Testnet",
    chainId: Number(network.chainId),
    address: await guard.getAddress(),
    deployer: deployer.address,
    transactionHash: deploymentTransaction.hash,
    blockNumber: receipt.blockNumber,
    compiler: "0.8.26",
    optimizerRuns: 200,
    purpose: "Remove the V1 global task counter hotspot with per-buyer deterministic task ids.",
  };
  await mkdir("deployments", { recursive: true });
  await writeFile("deployments/10143-parallel.json", `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
