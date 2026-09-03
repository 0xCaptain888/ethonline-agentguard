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
    { at: "00:55", screen: "Settlement", narration: "Only after the seller submits a result and the independent verifier signs does Monad release escrow.", liveEvidence: "VERIFIED task 0" },
    { at: "01:35", screen: "Safety outcomes", narration: "The same control boundary blocks an over-budget or unauthorized request before execution.", decision: blocked, liveEvidence: "BLOCKED task 1" },
    { at: "02:05", screen: "Containment", narration: "If execution happened but the result is wrong, funds remain isolated instead of being paid out.", liveEvidence: "FROZEN task 2" },
    { at: "02:35", screen: "Monad proof", narration: "Open the three MonadScan transactions and recompute the committed evidence hashes." },
    { at: "02:55", screen: "Boundary", narration: "FROZEN recovery is DESIGN in this hackathon MVP; no production-security claim is made." },
  ],
  liveLinks: {
    contract: "https://testnet.monadscan.com/address/0x7D9204Ce050cb917b2Db703ec2a63CC987C15235",
    verified: "https://testnet.monadscan.com/tx/0x881522f10258a1bb589b1abf2d0d29422226f872084c0fd9c06e67356f46ea42",
    blocked: "https://testnet.monadscan.com/tx/0x9edf71e46139e44cf8447e0203d9fdc4f79464e481687255be0ee4528b473383",
    frozen: "https://testnet.monadscan.com/tx/0xb57dab7d9db6391bd64c9338b03c11f2e76bdaec80eb4080e9cdb811f6e9c51c",
  },
  whyMonad: "Monad gives this frequent, small agent-task workflow a low-friction settlement boundary while preserving an auditable on-chain trail.",
  evidenceVerifier: "npm run evidence:verify",
  scriptHash: keccak256(toUtf8Bytes("monad-agentguard:judge-demo:v1")),
}, null, 2));
