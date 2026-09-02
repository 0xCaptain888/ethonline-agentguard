import { ethers } from "hardhat";
import type { MonadAgentGuard } from "../typechain-types/index.js";

async function main() {
  const count = Math.max(1, Number(process.env.BENCHMARK_TASKS ?? 25));
  const [buyer, seller] = await ethers.getSigners();
  const Guard = await ethers.getContractFactory("MonadAgentGuard");
  const guard = (await Guard.deploy()) as unknown as MonadAgentGuard;
  await guard.waitForDeployment();
  await guard.connect(buyer).registerAgent(ethers.id("benchmark-buyer"));
  await guard.connect(seller).registerAgent(ethers.id("benchmark-seller"));
  await guard.connect(buyer).setPolicy(ethers.parseEther("100"), false);
  const started = performance.now();
  let totalGas = 0n;
  for (let i = 0; i < count; i += 1) {
    const tx = await guard.connect(buyer).createTask(seller.address, ethers.id(`benchmark-intent:${i}`), ethers.id("benchmark-policy"), { value: ethers.parseEther("0.001") });
    const receipt = await tx.wait();
    totalGas += receipt?.gasUsed ?? 0n;
  }
  const elapsedMs = performance.now() - started;
  console.log(JSON.stringify({ benchmark: "local-hardhat-reference", tasks: count, elapsedMs: Math.round(elapsedMs), tasksPerSecond: Number((count / (elapsedMs / 1000)).toFixed(2)), totalGas: totalGas.toString(), averageGas: (totalGas / BigInt(count)).toString(), note: "Run against Monad Testnet for network-specific latency; this local run is not live evidence." }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
