import { ethers } from "hardhat";

async function main() {
  const target = process.env.METAMASK_AGENT_WALLET_ADDRESS;
  if (!target || !ethers.isAddress(target)) throw new Error("METAMASK_AGENT_WALLET_ADDRESS must be a valid EVM address");
  const amountMon = process.env.METAMASK_AGENT_WALLET_FUND_MON ?? "0.01";
  const amount = ethers.parseEther(amountMon);
  if (amount <= 0n || amount > ethers.parseEther("0.05")) throw new Error("Funding amount must be between 0 and 0.05 Testnet MON");

  const [funder] = await ethers.getSigners();
  const network = await ethers.provider.getNetwork();
  if (network.chainId !== 10143n) throw new Error(`Refusing to fund on chain ${network.chainId}`);
  const tx = await funder.sendTransaction({ to: target, value: amount });
  const receipt = await tx.wait();
  if (!receipt || receipt.status !== 1) throw new Error(`Funding transaction failed: ${tx.hash}`);

  console.log(JSON.stringify({
    evidenceClass: "LIVE_TESTNET_SPONSOR_FUNDING",
    network: "Monad Testnet",
    chainId: Number(network.chainId),
    from: funder.address,
    to: target,
    amountMon,
    txHash: tx.hash,
    blockNumber: receipt.blockNumber,
    recipientBalanceWei: (await ethers.provider.getBalance(target)).toString(),
    explorerUrl: `https://testnet.monadexplorer.com/tx/${tx.hash}`,
  }, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
