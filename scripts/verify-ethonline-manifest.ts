import { readFile } from "node:fs/promises";

type Sponsor = {
  name: string;
  role: string;
  status: "DESIGN" | "LIVE_EXTERNAL_DATA" | "LIVE_TESTNET";
  chain: string | null;
  contract: string | null;
  transactions: string[];
  evidenceHash: string | null;
  nextProof: string;
};

const addressPattern = /^0x[0-9a-fA-F]{40}$/;
const txPattern = /^0x[0-9a-fA-F]{64}$/;
const hashPattern = /^0x[0-9a-fA-F]{64}$/;

async function main() {
  const manifest = JSON.parse(await readFile("evidence/ethonline-manifest.json", "utf8")) as {
    manifestVersion: string;
    submission: string;
    repository: string;
    demo: string;
    evidencePolicy: Record<string, string>;
    workflow: string[];
    sponsors: Sponsor[];
    outcomes: Record<string, { status: string; evidence: string }>;
    continuity: { foundation: string; newForEthOnline: string[] };
    lastUpdated: string;
  };

  if (manifest.manifestVersion !== "1") throw new Error("unsupported manifestVersion");
  if (manifest.submission !== "ETHOnline 2026 Continuity") throw new Error("submission label mismatch");
  if (!manifest.repository.startsWith("https://github.com/")) throw new Error("repository must be public HTTPS URL");
  if (!manifest.demo.startsWith("https://")) throw new Error("demo must be public HTTPS URL");
  for (const label of ["LIVE_TESTNET", "LIVE_EXTERNAL_DATA", "SIMULATION", "DESIGN"]) {
    if (!manifest.evidencePolicy[label]) throw new Error(`missing evidence policy for ${label}`);
  }
  const requiredStages = ["TreasuryPlanner", "The Graph", "Policy Engine", "Privy", "Arc USDC escrow", "Seller Agent", "Independent Verifier", "Receipt"];
  for (const stage of requiredStages) if (!manifest.workflow.includes(stage)) throw new Error(`workflow missing ${stage}`);
  if (manifest.sponsors.length !== 3) throw new Error("exactly three sponsor entries are required");

  const sponsorResults = manifest.sponsors.map((sponsor) => {
    if (!sponsor.name || !sponsor.role || !sponsor.nextProof) throw new Error(`${sponsor.name || "sponsor"}: incomplete entry`);
    if (sponsor.status === "DESIGN") {
      if (sponsor.chain !== null || sponsor.contract !== null || sponsor.transactions.length !== 0 || sponsor.evidenceHash !== null) {
        throw new Error(`${sponsor.name}: DESIGN entries cannot claim live evidence`);
      }
      return { name: sponsor.name, status: sponsor.status, honest: true };
    }
    if (!sponsor.chain || !sponsor.contract || !addressPattern.test(sponsor.contract)) throw new Error(`${sponsor.name}: live entry needs chain and contract`);
    if (sponsor.status === "LIVE_TESTNET" && sponsor.transactions.length === 0) throw new Error(`${sponsor.name}: LIVE_TESTNET needs transaction hashes`);
    if (sponsor.transactions.some((tx) => !txPattern.test(tx))) throw new Error(`${sponsor.name}: malformed transaction hash`);
    if (sponsor.evidenceHash !== null && !hashPattern.test(sponsor.evidenceHash)) throw new Error(`${sponsor.name}: malformed evidence hash`);
    return { name: sponsor.name, status: sponsor.status, honest: true };
  });

  for (const outcome of ["VERIFIED", "BLOCKED", "FROZEN"]) {
    if (!manifest.outcomes[outcome]) throw new Error(`missing ${outcome} outcome`);
    if (!manifest.outcomes[outcome].evidence) throw new Error(`${outcome}: missing evidence reference`);
  }
  if (!manifest.continuity.foundation || manifest.continuity.newForEthOnline.length < 3) throw new Error("continuity boundary is incomplete");
  console.log(JSON.stringify({
    evidenceClass: "ETHONLINE_SUBMISSION_MANIFEST",
    submission: manifest.submission,
    sponsors: sponsorResults,
    outcomes: Object.fromEntries(Object.entries(manifest.outcomes).map(([state, value]) => [state, value.status])),
    continuityItems: manifest.continuity.newForEthOnline.length,
    lastUpdated: manifest.lastUpdated,
    passed: true
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
