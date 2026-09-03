import { ethers } from "hardhat";
import { writeFile } from "node:fs/promises";
import { fetchChainSentinelReport, verifyChainSentinelReport } from "../src/chainsentinel";

async function main() {
  const report = await fetchChainSentinelReport(ethers.provider);
  const verification = verifyChainSentinelReport(report);
  await writeFile("evidence/chainsentinel-latest.json", `${JSON.stringify(report, null, 2)}\n`);
  console.log(JSON.stringify({ evidenceClass: "LIVE_MONAD_RPC_DATA", report, verification }, null, 2));
  if (!verification.passed) process.exitCode = 1;
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
