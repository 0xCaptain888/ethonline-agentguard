import { access, readFile } from "node:fs/promises";

const requiredFiles = [
  "README.md",
  "SECURITY.md",
  "docs/ethonline-before-after.md",
  "docs/ethonline-submission-kit.md",
  "docs/ethonline-live-runbook.md",
  "docs/ai-usage.md",
  "docs/scoring-map.md",
  "docs/ethonline-submission-checklist.md",
  "evidence/ethonline-manifest.json",
  "site/index.html",
  "docs/browser-evidence.md",
  "src/ethonline/workflow.ts",
  "test/ethonline-workflow.test.ts",
  ".github/workflows/pages.yml",
  ".github/workflows/ci.yml",
  ".github/workflows/codeql.yml"
];

async function main() {
  const missing: string[] = [];
  for (const file of requiredFiles) {
    try { await access(file); } catch { missing.push(file); }
  }
  if (missing.length) throw new Error(`missing submission files: ${missing.join(", ")}`);

  const readme = await readFile("README.md", "utf8");
  const requiredPhrases = [
    "ETHOnline 2026 Continuity",
    "2–4 minute demo video is required",
    "up to three partner prizes",
    "Continuity submission",
    "evidence/ethonline-manifest.json",
    "AI usage"
  ];
  for (const phrase of requiredPhrases) if (!readme.includes(phrase)) throw new Error(`README missing required phrase: ${phrase}`);

  const site = await readFile("site/index.html", "utf8");
  for (const phrase of ["VERIFIED", "BLOCKED", "FROZEN", "Evidence manifest", "Copy judge command", "Browser evidence verification", "Judge replay: run the complete local workflow", "ethonline-manifest.json"]) {
    if (!site.includes(phrase)) throw new Error(`Demo missing judge-visible element: ${phrase}`);
  }

  const manifest = JSON.parse(await readFile("evidence/ethonline-manifest.json", "utf8")) as any;
  if (manifest.submission !== "ETHOnline 2026 Continuity") throw new Error("manifest submission mismatch");
  if (manifest.sponsors?.length !== 3) throw new Error("manifest must contain exactly three sponsor entries");
  for (const state of ["VERIFIED", "BLOCKED", "FROZEN"]) {
    if (!manifest.outcomes?.[state]) throw new Error(`manifest missing ${state}`);
  }
  console.log(JSON.stringify({
    evidenceClass: "ETHONLINE_SUBMISSION_PREFLIGHT",
    requiredFiles: requiredFiles.length,
    sponsors: manifest.sponsors.map((sponsor: any) => ({ name: sponsor.name, status: sponsor.status })),
    outcomes: Object.fromEntries(Object.entries(manifest.outcomes).map(([state, value]: [string, any]) => [state, value.status])),
    passed: true
  }, null, 2));
}

main().catch((error) => { console.error(error); process.exitCode = 1; });
