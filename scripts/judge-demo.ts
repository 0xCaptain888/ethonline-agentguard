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
    { at: "00:25", screen: "Policy decision", narration: "Before any transaction, the policy engine checks budget, seller permission, risk and confirmation.", decision: allowed },
    { at: "00:55", screen: "Settlement", narration: "Both full seller reports are committed and re-hashed; only task-specific verifier signatures release MON.", liveEvidence: "YieldScout task 30 + ChainSentinel task 29" },
    { at: "01:35", screen: "Safety outcomes", narration: "The same control boundary blocks an over-budget or unauthorized request before execution.", decision: blocked, liveEvidence: "BLOCKED task 26" },
    { at: "02:05", screen: "Containment", narration: "If execution happened but the result is wrong, funds remain isolated; two-party recovery can then refund the buyer.", liveEvidence: "FROZEN task 27 → REFUNDED" },
    { at: "02:35", screen: "Monad proof", narration: "Open the Monad Testnet Explorer transactions and recompute the committed evidence hashes." },
    { at: "02:55", screen: "Boundary", narration: "FROZEN recovery is a live two-party Testnet primitive; deadlines and neutral arbitration remain a production extension." },
  ],
  liveLinks: {
    contract: "https://testnet.monadexplorer.com/address/0xee84007f8618c2c38Be8C45E8050144EbF00CE4a",
    yieldScoutVerified: "https://testnet.monadexplorer.com/tx/0x5ade4e2e783f322fa9c096ef16c609a0afe2323560ef77f2de3ae2b01678d9d9",
    chainSentinelVerified: "https://testnet.monadexplorer.com/tx/0xa97ed7f0863171680fe0dcd4c20130696471d6832db08f57fad65fe42fb6f1fe",
    blocked: "https://testnet.monadexplorer.com/tx/0x35a25bdd69c3de15adb676ac1a29aae37eb09abff518075616aa9f701ee9a34b",
    frozen: "https://testnet.monadexplorer.com/tx/0xa1193b2aaa7a5c9e25d10c1d81331e3180e2b9d83bdacf1f95f8acdbcf58ea8c",
  },
  whyMonad: "Monad gives this frequent, small agent-task workflow a low-friction settlement boundary while preserving an auditable on-chain trail.",
  evidenceVerifier: "npm run judge:check",
  scriptHash: keccak256(toUtf8Bytes("monad-agentguard:judge-demo:v2")),
}, null, 2));
