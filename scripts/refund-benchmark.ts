import { ethers } from "hardhat";
import { readFile } from "node:fs/promises";
import type { MonadAgentGuard } from "../typechain-types/index.js";

async function main() {
  const deployment = JSON.parse(await readFile("deployments/10143.json", "utf8")) as { address: string };
  const [buyer] = await ethers.getSigners();
  const guard = (await ethers.getContractAt("MonadAgentGuard", deployment.address)) as unknown as MonadAgentGuard;
  const refunded: string[] = [];
  for (let taskId = 0n; taskId < 25n; taskId += 1n) {
    const task = await guard.tasks(taskId);
    if (task.buyer.toLowerCase() !== buyer.address.toLowerCase() || Number(task.state) !== 0) continue;
    const tx = await guard.connect(buyer).blockTask(taskId, ethers.id(`benchmark-cleanup:${taskId}`));
    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) throw new Error(`Refund failed for task ${taskId}`);
    refunded.push(taskId.toString());
  }
  console.log(JSON.stringify({ network: "Monad Testnet", contract: deployment.address, refundedTasks: refunded, refundedEscrow: `${refunded.length * 0.001} MON` }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
