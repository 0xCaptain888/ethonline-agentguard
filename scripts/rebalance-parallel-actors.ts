import { ethers } from "hardhat";
import type { Wallet } from "ethers";

function derivedWallet(privateSeed: string, label: string, index: number) {
  const key = ethers.keccak256(ethers.solidityPacked(
    ["bytes32", "string", "uint256"],
    [privateSeed, `monad-agentguard:${label}:v1`, index],
  ));
  return new ethers.Wallet(key, ethers.provider);
}

async function transfer(from: Wallet, to: string, amountMon: string) {
  const transaction = await from.sendTransaction({
    to,
    value: ethers.parseEther(amountMon),
    gasLimit: 21_000,
  });
  const receipt = await transaction.wait();
  if (!receipt || receipt.status !== 1) throw new Error(`Rebalance failed: ${transaction.hash}`);
  return {
    from: from.address,
    to,
    amountMon,
    txHash: transaction.hash,
    blockNumber: receipt.blockNumber,
  };
}

async function main() {
  const privateSeed = process.env.DEPLOYER_PRIVATE_KEY;
  if (!privateSeed) throw new Error("DEPLOYER_PRIVATE_KEY is required");
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 10143n) throw new Error(`Expected Monad Testnet, got ${network.chainId}`);
  const targets = Array.from({ length: 5 }, (_, index) => derivedWallet(privateSeed, "concurrent-buyer", index));
  const donors = [2, 3, 4, 1, 0].map((index) => derivedWallet(privateSeed, "concurrent-seller", index));
  const targetMinimum = ethers.parseEther("0.025");
  const donorReserve = ethers.parseEther("0.01");
  const transferGasReserve = ethers.parseEther("0.003");
  const transactions = [];
  for (const target of targets) {
    const targetBalance = await ethers.provider.getBalance(target.address);
    let deficit = targetMinimum > targetBalance ? targetMinimum - targetBalance : 0n;
    if (deficit === 0n) continue;
    for (const donor of donors) {
      const donorBalance = await ethers.provider.getBalance(donor.address);
      const available = donorBalance > donorReserve + transferGasReserve
        ? donorBalance - donorReserve - transferGasReserve
        : 0n;
      if (available < deficit) continue;
      transactions.push(await transfer(donor, target.address, ethers.formatEther(deficit)));
      deficit = 0n;
      break;
    }
    if (deficit > 0n) throw new Error(`Unable to fund verification gas for ${target.address}`);
  }
  console.log(JSON.stringify({
    evidenceClass: "TESTNET_ACTOR_REBALANCE",
    network: "Monad Testnet",
    targetMinimumMon: ethers.formatEther(targetMinimum),
    targetBalances: await Promise.all(targets.map(async (target) => ({
      address: target.address,
      balanceMon: ethers.formatEther(await ethers.provider.getBalance(target.address)),
    }))),
    transactions,
    note: "Testnet-only actor funding; excluded from benchmark metrics.",
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
