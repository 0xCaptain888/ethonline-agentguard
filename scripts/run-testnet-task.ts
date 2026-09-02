import { ethers } from "hardhat";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { MonadAgentGuard } from "../typechain-types/index.js";

async function main() {
  const network = await ethers.provider.getNetwork();
  const deploymentPath = `deployments/${network.chainId}.json`;
  const deployment = JSON.parse(await readFile(deploymentPath, "utf8")) as {
    address: string;
  };
  const [buyer] = await ethers.getSigners();
  const sellerKey = process.env.SELLER_PRIVATE_KEY;
  if (!sellerKey) throw new Error("SELLER_PRIVATE_KEY is required");
  const seller = new ethers.Wallet(sellerKey, ethers.provider);
  const guard = (await ethers.getContractAt(
    "MonadAgentGuard",
    deployment.address,
  )) as unknown as MonadAgentGuard;
  const taskId = await guard.nextTaskId();
  const intentHash = ethers.id(`monad-agentguard:buyer:buy:task-${taskId}`);
  const policyHash = ethers.id("monad-agentguard:policy:1-mon");
  const resultHash = ethers.id(`monad-agentguard:result:task-${taskId}`);
  const value = ethers.parseEther("0.01");

  const txs: Record<string, string> = {};
  async function record(
    name: string,
    tx: { hash: string; wait(): Promise<unknown> },
  ) {
    txs[name] = tx.hash;
    await tx.wait();
  }

  await record(
    "buyerRegister",
    await guard.connect(buyer).registerAgent(ethers.id("buyer-agent")),
  );
  await record(
    "sellerRegister",
    await guard.connect(seller).registerAgent(ethers.id("seller-agent")),
  );
  await record(
    "policy",
    await guard.connect(buyer).setPolicy(ethers.parseEther("1"), true),
  );
  await record(
    "createTask",
    await guard
      .connect(buyer)
      .createTask(seller.address, intentHash, policyHash, { value }),
  );
  await record(
    "submitResult",
    await guard.connect(seller).submitResult(taskId, resultHash),
  );
  await record(
    "verifyTask",
    await guard.connect(buyer).verifyTask(taskId, true),
  );

  const evidencePayload = {
    evidenceVersion: "1",
    network: "Monad Testnet",
    chainId: Number(network.chainId),
    contract: deployment.address,
    buyer: buyer.address,
    seller: seller.address,
    taskId: taskId.toString(),
    intentHash,
    policyHash,
    resultHash,
    state: "VERIFIED",
    value: value.toString(),
    transactions: txs,
  };
  const evidenceHash = ethers.keccak256(
    ethers.toUtf8Bytes(JSON.stringify(evidencePayload)),
  );
  const evidence = {
    ...evidencePayload,
    evidenceHash,
    generatedAt: new Date().toISOString(),
  };
  await mkdir("evidence", { recursive: true });
  await writeFile(
    `evidence/testnet-task-${taskId}.json`,
    `${JSON.stringify(evidence, null, 2)}\n`,
  );
  console.log(JSON.stringify(evidence, null, 2));
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
