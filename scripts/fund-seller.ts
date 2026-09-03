import { ethers } from "hardhat";

async function main() {
  const sellerAddress = "0x637a61f2644E43aDa1eEeEb6Ff827B2aD60e669b";
  const [buyer] = await ethers.getSigners();
  const amountMon = process.env.SELLER_FUND_MON ?? "0.2";
  const amount = ethers.parseEther(amountMon);
  const tx = await buyer.sendTransaction({ to: sellerAddress, value: amount });
  const receipt = await tx.wait();
  if (!receipt || receipt.status !== 1) throw new Error(`Funding transaction failed: ${tx.hash}`);
  const balance = await ethers.provider.getBalance(sellerAddress);
  console.log(JSON.stringify({
    network: "Monad Testnet",
    chainId: Number((await ethers.provider.getNetwork()).chainId),
    from: buyer.address,
    to: sellerAddress,
    amount: amount.toString(),
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
    sellerBalance: balance.toString(),
    explorerUrl: `https://testnet.monadexplorer.com/tx/${tx.hash}`,
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
