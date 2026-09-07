import { ethers } from "hardhat";
import { mkdir, writeFile } from "node:fs/promises";

async function main() {
  const token = process.env.ARC_USDC_ADDRESS;
  if (!token || !ethers.isAddress(token)) throw new Error("ARC_USDC_ADDRESS is required");
  const [deployer] = await ethers.getSigners();
  if (!deployer) throw new Error("ARC_DEPLOYER_PRIVATE_KEY is not configured");
  const balance = await ethers.provider.getBalance(deployer.address);
  if (balance === 0n) throw new Error(`Arc deployer ${deployer.address} has no gas balance`);
  const factory = await ethers.getContractFactory("PolicyEscrowERC20", deployer);
  const escrow = await factory.deploy(token);
  const deploymentTx = escrow.deploymentTransaction();
  if (!deploymentTx) throw new Error("deployment transaction missing");
  const receipt = await deploymentTx.wait();
  if (!receipt || receipt.status !== 1) throw new Error("Arc deployment failed");
  const deployment = {
    evidenceVersion: "1",
    evidenceClass: "LIVE_TESTNET",
    network: "Arc Testnet",
    chainId: "5042002",
    contract: "PolicyEscrowERC20",
    address: await escrow.getAddress(),
    settlementToken: token,
    deployer: deployer.address,
    deploymentTx: deploymentTx.hash,
    startBlock: receipt.blockNumber,
    explorer: `https://testnet.arcscan.app/tx/${deploymentTx.hash}`,
    deployedAt: new Date().toISOString(),
  };
  await mkdir("deployments", { recursive: true });
  await writeFile("deployments/arc-testnet.json", `${JSON.stringify(deployment, null, 2)}\n`);
  console.log(JSON.stringify(deployment, null, 2));
}

main().catch((error) => { console.error(error instanceof Error ? error.message : error); process.exitCode = 1; });
