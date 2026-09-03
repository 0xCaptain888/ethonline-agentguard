import { ethers } from "hardhat";
import { readFile, writeFile } from "node:fs/promises";
import type { MonadAgentGuard } from "../typechain-types/index.js";

async function main() {
  const taskId = BigInt(process.env.FROZEN_TASK_ID ?? "27");
  const network = await ethers.provider.getNetwork();
  const deployment = JSON.parse(await readFile(`deployments/${network.chainId}.json`, "utf8")) as { address: string };
  const [buyer] = await ethers.getSigners();
  if (!process.env.SELLER_PRIVATE_KEY) throw new Error("SELLER_PRIVATE_KEY is required");
  const seller = new ethers.Wallet(process.env.SELLER_PRIVATE_KEY, ethers.provider);
  const guard = (await ethers.getContractAt("MonadAgentGuard", deployment.address)) as unknown as MonadAgentGuard;
  const before = Number((await guard.tasks(taskId)).state);
  if (before !== 4) throw new Error(`Expected FROZEN task, got state ${before}`);
  const first = await guard.connect(buyer).approveFrozenRecovery(taskId, 1); const firstReceipt = await first.wait();
  const second = await guard.connect(seller).approveFrozenRecovery(taskId, 1); const secondReceipt = await second.wait();
  const after = Number((await guard.tasks(taskId)).state);
  if (after !== 5) throw new Error(`Expected REFUNDED state, got ${after}`);
  const payload = { evidenceVersion: "1", evidenceClass: "LIVE_TESTNET", network: "Monad Testnet", chainId: Number(network.chainId), contract: deployment.address, taskId: taskId.toString(), state: "REFUNDED", onchainState: 5, recovery: "MUTUAL_REFUND", beforeState: "FROZEN", finalState: "REFUNDED", buyer: buyer.address, seller: seller.address, verifier: seller.address, value: "10000000000000000", transactions: { buyerApproval: { hash: first.hash, blockNumber: firstReceipt?.blockNumber, status: firstReceipt?.status }, sellerApproval: { hash: second.hash, blockNumber: secondReceipt?.blockNumber, status: secondReceipt?.status } }, recoveredAt: new Date().toISOString() };
  const evidence = { ...payload, evidenceHash: ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(payload))) };
  await writeFile(`evidence/testnet-task-${taskId}-recovered.json`, `${JSON.stringify(evidence, null, 2)}\n`);
  console.log(JSON.stringify(evidence, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
