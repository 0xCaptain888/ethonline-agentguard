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
  oneLine: "A buyer agent hires a seller agent, but policy and independent verification control when MON can move.",
  steps: [
    { at: "00:00", screen: "Agent-to-Agent", narration: "TreasuryPlanner hires YieldScout to produce a Monad liquidity report." },
    { at: "00:25", screen: "Policy decision", narration: "Before any transaction, the policy engine checks budget, seller permission, risk and confirmation.", decision: allowed },
    { at: "00:55", screen: "Settlement", narration: "Only after YieldScout's external report is submitted and the independent verifier signs does Monad release escrow.", liveEvidence: "VERIFIED task 25" },
    { at: "01:35", screen: "Safety outcomes", narration: "The same control boundary blocks an over-budget or unauthorized request before execution.", decision: blocked, liveEvidence: "BLOCKED task 26" },
    { at: "02:05", screen: "Containment", narration: "If execution happened but the result is wrong, funds remain isolated; two-party recovery can then refund the buyer.", liveEvidence: "FROZEN task 27 → REFUNDED" },
    { at: "02:35", screen: "Monad proof", narration: "Open the three MonadScan transactions and recompute the committed evidence hashes." },
    { at: "02:55", screen: "Boundary", narration: "FROZEN recovery is a live two-party Testnet primitive; deadlines and neutral arbitration remain a production extension." },
  ],
  liveLinks: {
    contract: "https://testnet.monadexplorer.com/address/0xee84007f8618c2c38Be8C45E8050144EbF00CE4a",
    verified: "https://testnet.monadexplorer.com/tx/0x058b29c97b6774aac1f2018bf26508030faa0fcc9f5b5b524df5a3578dd890c7",
    blocked: "https://testnet.monadexplorer.com/tx/0x35a25bdd69c3de15adb676ac1a29aae37eb09abff518075616aa9f701ee9a34b",
    frozen: "https://testnet.monadexplorer.com/tx/0xa1193b2aaa7a5c9e25d10c1d81331e3180e2b9d83bdacf1f95f8acdbcf58ea8c",
  },
  whyMonad: "Monad gives this frequent, small agent-task workflow a low-friction settlement boundary while preserving an auditable on-chain trail.",
  evidenceVerifier: "npm run evidence:verify",
  scriptHash: keccak256(toUtf8Bytes("monad-agentguard:judge-demo:v1")),
}, null, 2));
