import { ethers } from "hardhat";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import type { ContractTransactionResponse } from "ethers";
import type { MonadAgentGuard } from "../typechain-types/index.js";

async function main() {
  const network = await ethers.provider.getNetwork();
  const deployment = JSON.parse(await readFile(`deployments/${network.chainId}.json`, "utf8")) as { address: string };
  const [buyer] = await ethers.getSigners();
  const sellerKey = process.env.SELLER_PRIVATE_KEY;
  if (!sellerKey) throw new Error("SELLER_PRIVATE_KEY is required");
  const seller = new ethers.Wallet(sellerKey, ethers.provider);
  const guard = (await ethers.getContractAt("MonadAgentGuard", deployment.address)) as unknown as MonadAgentGuard;
  const value = ethers.parseEther("0.01");
  const policyHash = ethers.id("monad-agentguard:policy:failure-paths");
  const txs: Record<string, { hash: string; blockNumber: number; status: number; explorerUrl: string }> = {};
  async function record(name: string, tx: ContractTransactionResponse) {
    const receipt = await tx.wait();
    if (!receipt || receipt.status !== 1) throw new Error(`${name} transaction failed: ${tx.hash}`);
    txs[name] = { hash: tx.hash, blockNumber: receipt.blockNumber, status: receipt.status, explorerUrl: `https://testnet.monadscan.com/tx/${tx.hash}` };
  }
  await record("buyerRegister", await guard.connect(buyer).registerAgent(ethers.id("buyer-agent-failure-paths")));
  await record("sellerRegister", await guard.connect(seller).registerAgent(ethers.id("seller-agent-failure-paths")));
  await record("policy", await guard.connect(buyer).setPolicy(ethers.parseEther("1"), true));

  const blockedTaskId = await guard.nextTaskId();
  await record("blockedCreateTask", await guard.connect(buyer).createTask(seller.address, ethers.id(`intent:blocked:${blockedTaskId}`), policyHash, { value }));
  await record("blockedTask", await guard.connect(buyer).blockTask(blockedTaskId, ethers.id("policy:manual-stop")));
  const blockedState = Number((await guard.tasks(blockedTaskId)).state);

  const frozenTaskId = await guard.nextTaskId();
  await record("frozenCreateTask", await guard.connect(buyer).createTask(seller.address, ethers.id(`intent:frozen:${frozenTaskId}`), policyHash, { value }));
  await record("frozenSubmitResult", await guard.connect(seller).submitResult(frozenTaskId, ethers.id(`result:bad:${frozenTaskId}`)));
  await record("frozenTask", await guard.connect(buyer).verifyTask(frozenTaskId, false));
  const frozenState = Number((await guard.tasks(frozenTaskId)).state);
  if (blockedState !== 3 || frozenState !== 4) throw new Error(`unexpected states: blocked=${blockedState}, frozen=${frozenState}`);

  const blockedEvidence = { evidenceVersion: "1", network: "Monad Testnet", chainId: Number(network.chainId), contract: deployment.address, buyer: buyer.address, seller: seller.address, taskId: blockedTaskId.toString(), state: "BLOCKED", value: value.toString(), transactions: { buyerRegister: txs.buyerRegister, sellerRegister: txs.sellerRegister, policy: txs.policy, createTask: txs.blockedCreateTask, blockTask: txs.blockedTask }, generatedAt: new Date().toISOString() };
  const frozenEvidence = { evidenceVersion: "1", network: "Monad Testnet", chainId: Number(network.chainId), contract: deployment.address, buyer: buyer.address, seller: seller.address, taskId: frozenTaskId.toString(), state: "FROZEN", value: value.toString(), transactions: { buyerRegister: txs.buyerRegister, sellerRegister: txs.sellerRegister, policy: txs.policy, createTask: txs.frozenCreateTask, submitResult: txs.frozenSubmitResult, verifyTask: txs.frozenTask }, generatedAt: new Date().toISOString() };
  await mkdir("evidence", { recursive: true });
  await writeFile(`evidence/testnet-task-${blockedTaskId}-blocked.json`, `${JSON.stringify({ ...blockedEvidence, evidenceHash: ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(blockedEvidence))) }, null, 2)}\n`);
  await writeFile(`evidence/testnet-task-${frozenTaskId}-frozen.json`, `${JSON.stringify({ ...frozenEvidence, evidenceHash: ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(frozenEvidence))) }, null, 2)}\n`);
  console.log(JSON.stringify({ blocked: blockedEvidence, frozen: frozenEvidence }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
