import { JsonRpcProvider, ethers } from "ethers";
import { readFile } from "node:fs/promises";

type AuthorizedTransaction = {
  label: string;
  chainId: string;
  target: string;
  sender: string;
  transactionHash: string;
};

type Evidence = {
  chainId: string;
  contract: string;
  settlementToken: string;
  buyer: string;
  state: string;
  evidenceHash: string;
  privyAuthorization: {
    provider: string;
    walletId: string;
    walletAddress: string;
    policyId: string;
    method: string;
    authorizedTransactions: AuthorizedTransaction[];
    authorizationEvidenceHash: string;
  };
  transactions: Record<string, { hash: string }>;
};

async function main() {
  const path = "evidence/arc-testnet-privy-authorized-task.json";
  const evidence = JSON.parse(await readFile(path, "utf8")) as Evidence;
  const { evidenceHash, ...evidencePayload } = evidence;
  const recomputedEvidenceHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(evidencePayload)));
  if (recomputedEvidenceHash !== evidenceHash) throw new Error("task evidence hash mismatch");

  const { authorizationEvidenceHash, ...authorizationPayload } = evidence.privyAuthorization;
  const recomputedAuthorizationHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(authorizationPayload)));
  if (recomputedAuthorizationHash !== authorizationEvidenceHash) throw new Error("Privy authorization hash mismatch");
  if (evidence.state !== "VERIFIED") throw new Error("live Privy task is not VERIFIED");
  if (evidence.privyAuthorization.provider !== "Privy" || evidence.privyAuthorization.method !== "eth_signTransaction") {
    throw new Error("unexpected authorization provider or method");
  }

  const provider = new JsonRpcProvider(process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network");
  const network = await provider.getNetwork();
  if (network.chainId.toString() !== evidence.chainId) throw new Error("Arc chain ID mismatch");
  const buyer = ethers.getAddress(evidence.buyer);
  const allowedTargets = new Set([
    ethers.getAddress(evidence.contract),
    ethers.getAddress(evidence.settlementToken),
  ]);

  const verified: Array<{ label: string; hash: string; blockNumber: number }> = [];
  for (const authorization of evidence.privyAuthorization.authorizedTransactions) {
    const transaction = await provider.getTransaction(authorization.transactionHash);
    const receipt = await provider.getTransactionReceipt(authorization.transactionHash);
    if (!transaction || !receipt) throw new Error(`${authorization.label}: transaction unavailable`);
    if (receipt.status !== 1) throw new Error(`${authorization.label}: transaction reverted`);
    if (ethers.getAddress(transaction.from) !== buyer || ethers.getAddress(authorization.sender) !== buyer) {
      throw new Error(`${authorization.label}: sender is not the Privy buyer`);
    }
    if (!transaction.to || !allowedTargets.has(ethers.getAddress(transaction.to))) {
      throw new Error(`${authorization.label}: target is outside the allowlist`);
    }
    if (ethers.getAddress(transaction.to) !== ethers.getAddress(authorization.target)) {
      throw new Error(`${authorization.label}: evidence target mismatch`);
    }
    if (transaction.value !== 0n) throw new Error(`${authorization.label}: non-zero native value`);
    if (authorization.chainId !== evidence.chainId) throw new Error(`${authorization.label}: authorization chain mismatch`);
    verified.push({ label: authorization.label, hash: transaction.hash, blockNumber: receipt.blockNumber });
  }

  const releaseHash = evidence.transactions.verifyAndRelease?.hash;
  const releaseReceipt = releaseHash ? await provider.getTransactionReceipt(releaseHash) : null;
  if (!releaseReceipt || releaseReceipt.status !== 1) throw new Error("VERIFIED release receipt is missing or reverted");

  console.log(JSON.stringify({
    evidenceClass: "LIVE_PRIVY_ARC_RPC_VERIFICATION",
    state: evidence.state,
    chainId: evidence.chainId,
    buyer,
    policyId: evidence.privyAuthorization.policyId,
    authorizedTransactions: verified,
    release: { hash: releaseHash, blockNumber: releaseReceipt.blockNumber },
    evidenceHash,
    authorizationEvidenceHash,
    passed: true,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
