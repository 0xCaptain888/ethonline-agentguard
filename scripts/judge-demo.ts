import { evaluatePolicy } from "../src/policy-engine.js";
import { keccak256, toUtf8Bytes } from "ethers";

const policy = {
  valueWei: 10_000_000_000_000_000n,
  maxValueWei: 50_000_000_000_000_000n,
  dailySpentWei: 20_000_000_000_000_000n,
  dailyLimitWei: 100_000_000_000_000_000n,
  allowedSeller: true,
  riskScore: 18,
  maxRiskScore: 40,
  confirmationProvided: true,
  requireConfirmation: true,
};
const allowed = evaluatePolicy(policy);
const blocked = evaluatePolicy({ ...policy, valueWei: 80_000_000_000_000_000n, allowedSeller: false, confirmationProvided: false });

console.log(JSON.stringify({
  evidenceClass: "SIMULATION",
  title: "Monad AgentGuard — 3-minute judge path",
  oneLine: "A buyer Agent hires different seller Agents, but policy and task-specific independent verification control when MON can move.",
  steps: [
    { at: "00:00", screen: "Agent-to-Agent", narration: "TreasuryPlanner hires YieldScout for liquidity research and ChainSentinel for Monad network telemetry through one execution layer." },
    { at: "00:20", screen: "Live Judge Console — BLOCK", narration: "Set the task above budget: policy blocks before any wallet write is requested.", decision: blocked },
    { at: "00:55", screen: "Live Judge Console — CREATE", narration: "Restore the allowed values, connect a judge wallet and create a real Monad Testnet escrow task without exposing seller or verifier credentials.", decision: allowed },
    { at: "01:25", screen: "Settlement", narration: "Both full seller reports are committed and re-hashed; only task-specific verifier signatures release MON.", liveEvidence: "YieldScout task 30 + ChainSentinel task 29" },
    { at: "01:55", screen: "Safety outcomes", narration: "Real receipts show VERIFIED, BLOCKED, FROZEN and the two-party REFUNDED recovery path.", liveEvidence: "Tasks 30, 26 and 27" },
    { at: "02:20", screen: "Why Monad", narration: "Twenty-five complete pipelines separated escrow, result commitment and independent verification across 75 unique Testnet transactions.", benchmark: { pipelines: 25, verified: 25, transactions: 75, averageEndToEndMs: 6566, p95EndToEndMs: 7543 } },
    { at: "02:40", screen: "MetaMask Agent Wallet", narration: "MetaMask isolates the self-custodial buyer wallet; AgentGuard adds application policy and settlement proof on Monad.", integration: "npm run sponsor:metamask" },
    { at: "02:55", screen: "Boundary", narration: "This is a Testnet MVP. Two-party recovery is live; neutral arbitration and audited production deployment remain future work." },
  ],
  liveLinks: {
    contract: "https://testnet.monadexplorer.com/address/0xee84007f8618c2c38Be8C45E8050144EbF00CE4a",
    yieldScoutVerified: "https://testnet.monadexplorer.com/tx/0x5ade4e2e783f322fa9c096ef16c609a0afe2323560ef77f2de3ae2b01678d9d9",
    chainSentinelVerified: "https://testnet.monadexplorer.com/tx/0xa97ed7f0863171680fe0dcd4c20130696471d6832db08f57fad65fe42fb6f1fe",
    blocked: "https://testnet.monadexplorer.com/tx/0x35a25bdd69c3de15adb676ac1a29aae37eb09abff518075616aa9f701ee9a34b",
    frozen: "https://testnet.monadexplorer.com/tx/0xa1193b2aaa7a5c9e25d10c1d81331e3180e2b9d83bdacf1f95f8acdbcf58ea8c",
  },
  whyMonad: "Monad keeps escrow, result commitment and independent verification as separate on-chain authority transitions; 25 complete Testnet pipelines measured 7,543 ms at P95.",
  judgeConsole: "https://0xcaptain888.github.io/monad-agentguard/#judge-console",
  sponsorIntegration: {
    name: "MetaMask Agent Wallet",
    command: "npm run sponsor:metamask",
    boundary: "Adapter tested; authenticated wallet broadcast is not claimed.",
  },
  evidenceVerifier: "npm run judge:check",
  scriptHash: keccak256(toUtf8Bytes("monad-agentguard:judge-demo:v3")),
}, null, 2));
