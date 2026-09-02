import { ethers } from "hardhat";

async function main() {
  const verifierAddress = "0xE01337d3F0E061017d8Ce547e11d86C0705e8526";
  const [buyer] = await ethers.getSigners();
  const amount = ethers.parseEther("0.2");
  const tx = await buyer.sendTransaction({ to: verifierAddress, value: amount });
  const receipt = await tx.wait();
  if (!receipt || receipt.status !== 1) throw new Error(`Funding transaction failed: ${tx.hash}`);
  console.log(JSON.stringify({ network: "Monad Testnet", chainId: Number((await ethers.provider.getNetwork()).chainId), from: buyer.address, to: verifierAddress, amount: amount.toString(), txHash: tx.hash, blockNumber: receipt.blockNumber, explorerUrl: `https://testnet.monadscan.com/tx/${tx.hash}` }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
