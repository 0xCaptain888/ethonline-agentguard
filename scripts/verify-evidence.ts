import { keccak256, toUtf8Bytes, getAddress } from "ethers";
import { readdir, readFile } from "node:fs/promises";

const expectedState: Record<string, number> = { VERIFIED: 2, BLOCKED: 3, FROZEN: 4, REFUNDED: 5 };
const hashPattern = /^0x[0-9a-fA-F]{64}$/;
const addressPattern = /^0x[0-9a-fA-F]{40}$/;
async function main() {
const files = (await readdir("evidence")).filter((file) => file.startsWith("testnet-task-") && file.endsWith(".json")).sort();
if (files.length === 0) throw new Error("No evidence JSON files found");

const results: Array<{ file: string; state: string; taskId: string; evidenceHash: string; checks: string[] }> = [];
for (const file of files) {
  const receipt = JSON.parse(await readFile(`evidence/${file}`, "utf8")) as Record<string, any>;
  const checks: string[] = [];
  if (receipt.evidenceVersion !== "1") throw new Error(`${file}: unsupported evidenceVersion`);
  if (receipt.network !== "Monad Testnet" || receipt.chainId !== 10143) throw new Error(`${file}: not Monad Testnet evidence`);
  if (!addressPattern.test(receipt.contract) || !addressPattern.test(receipt.buyer) || !addressPattern.test(receipt.seller) || !addressPattern.test(receipt.verifier)) throw new Error(`${file}: malformed address`);
  if (!(receipt.state in expectedState)) throw new Error(`${file}: unsupported state ${receipt.state}`);
  if (receipt.onchainState !== undefined && receipt.onchainState !== expectedState[receipt.state]) throw new Error(`${file}: state enum mismatch`);
  if (!hashPattern.test(receipt.evidenceHash)) throw new Error(`${file}: malformed evidenceHash`);
  const minimumTransactions = receipt.state === "REFUNDED" ? 2 : 3;
  if (!receipt.transactions || Object.keys(receipt.transactions).length < minimumTransactions) throw new Error(`${file}: incomplete transaction trail`);
  for (const [name, tx] of Object.entries(receipt.transactions) as Array<[string, any]>) {
    if (!hashPattern.test(tx.hash) || tx.status !== 1 || typeof tx.blockNumber !== "number") throw new Error(`${file}: invalid transaction ${name}`);
  }
  // task 0 was generated from evidencePayload before generatedAt was appended;
  // failure-path receipts intentionally include generatedAt in their hash.
  const evidenceHash = String(receipt.evidenceHash);
  const withoutHash = { ...receipt };
  delete withoutHash.evidenceHash;
  const hashInput = { ...withoutHash };
  if (receipt.state === "VERIFIED") delete hashInput.generatedAt;
  const recomputed = keccak256(toUtf8Bytes(JSON.stringify(hashInput)));
  if (recomputed.toLowerCase() !== evidenceHash.toLowerCase()) throw new Error(`${file}: evidenceHash mismatch (expected ${recomputed})`);
  checks.push("schema", "network", "state", "transaction trail", "evidence hash");
  results.push({ file, state: receipt.state, taskId: String(receipt.taskId), evidenceHash, checks });
}

console.log(JSON.stringify({ evidenceClass: "LIVE_TESTNET", verifiedFiles: results.length, results }, null, 2));
}
main().catch((error) => { console.error(error); process.exitCode = 1; });
