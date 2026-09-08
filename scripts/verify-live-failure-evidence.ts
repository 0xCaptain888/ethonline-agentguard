import { Contract, JsonRpcProvider, ethers } from "ethers";
import { readFile } from "node:fs/promises";

type TransactionProof = { hash: string; blockNumber: number; explorer: string };
type FailureEvidence = {
  chainId: string;
  contract: string;
  buyer: string;
  state?: string;
  evidenceHash: string;
  outcomes: {
    BLOCKED: { taskId: string; state: string; createTransaction: TransactionProof; outcomeTransaction: TransactionProof };
    FROZEN: { taskId: string; state: string; createTransaction: TransactionProof; submitTransaction: TransactionProof; outcomeTransaction: TransactionProof };
  };
  privyAuthorization: {
    walletAddress: string;
    policyId: string;
    authorizedTransactions: Array<{ label: string; target: string; sender: string; transactionHash: string }>;
    authorizationEvidenceHash: string;
  };
};

const taskAbi = [
  "function tasks(uint256 taskId) view returns (address buyer,address seller,uint256 value,bytes32 intentHash,bytes32 policyHash,bytes32 resultHash,uint8 state)",
];

async function main() {
  const path = "evidence/arc-testnet-live-failure-outcomes.json";
  const evidence = JSON.parse(await readFile(path, "utf8")) as FailureEvidence;
  const { evidenceHash, ...payload } = evidence;
  const recomputedEvidenceHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(payload)));
  if (recomputedEvidenceHash !== evidenceHash) throw new Error("failure evidence hash mismatch");

  const { authorizationEvidenceHash, ...authorizationPayload } = evidence.privyAuthorization;
  const recomputedAuthorizationHash = ethers.keccak256(ethers.toUtf8Bytes(JSON.stringify(authorizationPayload)));
  if (recomputedAuthorizationHash !== authorizationEvidenceHash) throw new Error("failure authorization hash mismatch");
  if (evidence.outcomes.BLOCKED.state !== "BLOCKED" || evidence.outcomes.FROZEN.state !== "FROZEN") {
    throw new Error("failure outcome labels are invalid");
  }

  const provider = new JsonRpcProvider(process.env.ARC_RPC_URL ?? "https://rpc.testnet.arc.network");
  const network = await provider.getNetwork();
  if (network.chainId.toString() !== evidence.chainId) throw new Error("Arc chain mismatch");
  const escrow = new Contract(evidence.contract, taskAbi, provider);
  const blockedTask = await escrow.tasks(evidence.outcomes.BLOCKED.taskId);
  const frozenTask = await escrow.tasks(evidence.outcomes.FROZEN.taskId);
  if (Number(blockedTask.state) !== 3) throw new Error(`BLOCKED on-chain state mismatch: ${blockedTask.state}`);
  if (Number(frozenTask.state) !== 4) throw new Error(`FROZEN on-chain state mismatch: ${frozenTask.state}`);
  if (ethers.getAddress(blockedTask.buyer) !== ethers.getAddress(evidence.buyer) ||
      ethers.getAddress(frozenTask.buyer) !== ethers.getAddress(evidence.buyer)) {
    throw new Error("failure task buyer does not match Privy wallet");
  }

  const transactionProofs = [
    evidence.outcomes.BLOCKED.createTransaction,
    evidence.outcomes.BLOCKED.outcomeTransaction,
    evidence.outcomes.FROZEN.createTransaction,
    evidence.outcomes.FROZEN.submitTransaction,
    evidence.outcomes.FROZEN.outcomeTransaction,
  ];
  for (const proof of transactionProofs) {
    const receipt = await provider.getTransactionReceipt(proof.hash);
    if (!receipt || receipt.status !== 1) throw new Error(`missing successful receipt: ${proof.hash}`);
    if (receipt.blockNumber !== proof.blockNumber) throw new Error(`block number mismatch: ${proof.hash}`);
  }

  for (const authorization of evidence.privyAuthorization.authorizedTransactions) {
    const transaction = await provider.getTransaction(authorization.transactionHash);
    if (!transaction) throw new Error(`missing Privy transaction: ${authorization.transactionHash}`);
    if (ethers.getAddress(transaction.from) !== ethers.getAddress(evidence.buyer) ||
        ethers.getAddress(authorization.sender) !== ethers.getAddress(evidence.buyer)) {
      throw new Error(`${authorization.label}: Privy sender mismatch`);
    }
    if (!transaction.to || ethers.getAddress(transaction.to) !== ethers.getAddress(authorization.target)) {
      throw new Error(`${authorization.label}: target mismatch`);
    }
    if (transaction.value !== 0n) throw new Error(`${authorization.label}: native value must be zero`);
  }

  console.log(JSON.stringify({
    evidenceClass: "LIVE_ARC_FAILURE_OUTCOME_VERIFICATION",
    chainId: evidence.chainId,
    buyer: evidence.buyer,
    policyId: evidence.privyAuthorization.policyId,
    outcomes: {
      BLOCKED: { taskId: evidence.outcomes.BLOCKED.taskId, state: Number(blockedTask.state), transaction: evidence.outcomes.BLOCKED.outcomeTransaction.hash },
      FROZEN: { taskId: evidence.outcomes.FROZEN.taskId, state: Number(frozenTask.state), transaction: evidence.outcomes.FROZEN.outcomeTransaction.hash },
    },
    evidenceHash,
    authorizationEvidenceHash,
    passed: true,
  }, null, 2));
}

main().catch((error) => {
  console.error(error instanceof Error ? error.message : error);
  process.exitCode = 1;
});
