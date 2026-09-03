import { fetchYieldScoutReport, verifyYieldScoutReport } from "../src/yieldscout.js";

async function main() {
  const report = await fetchYieldScoutReport();
  const verification = verifyYieldScoutReport(report);
  console.log(JSON.stringify({ evidenceClass: "LIVE_EXTERNAL_DATA", report, verification, nextStep: "Use report.resultHash as the seller result commitment; submit it to MonadAgentGuard and have the independent verifier check the report." }, null, 2));
  if (!verification.passed) process.exitCode = 1;
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
