import { Interface, parseEther } from "ethers";

export const MONAD_TESTNET_CHAIN_ID = 10143;
export const AGENT_GUARD_ADDRESS = "0xee84007f8618c2c38Be8C45E8050144EbF00CE4a";

const guardInterface = new Interface([
  "function registerAgent(bytes32 metadataHash)",
  "function setPolicy(uint256 maxValue, bool requireConfirmation)",
  "function createTask(address seller, bytes32 intentHash, bytes32 policyHash) payable returns (uint256 taskId)",
]);

export type AgentWalletTransaction = {
  chainId: number;
  to: string;
  value: string;
  calldata: string;
  intent: Record<string, unknown>;
};

export function buildRegisterAgentTransaction(metadataHash: string): AgentWalletTransaction {
  return {
    chainId: MONAD_TESTNET_CHAIN_ID,
    to: AGENT_GUARD_ADDRESS,
    value: "0",
    calldata: guardInterface.encodeFunctionData("registerAgent", [metadataHash]),
    intent: { action: "register_agent", protocol: "Monad AgentGuard", metadataHash },
  };
}

export function buildSetPolicyTransaction(maxValueMon: string, requireConfirmation = true): AgentWalletTransaction {
  const maxValue = parseEther(maxValueMon);
  if (maxValue <= 0n) throw new Error("maxValueMon must be positive");
  return {
    chainId: MONAD_TESTNET_CHAIN_ID,
    to: AGENT_GUARD_ADDRESS,
    value: "0",
    calldata: guardInterface.encodeFunctionData("setPolicy", [maxValue, requireConfirmation]),
    intent: {
      action: "set_agent_policy",
      protocol: "Monad AgentGuard",
      maxValueMon,
      requireConfirmation,
    },
  };
}

export function buildCreateTaskTransaction(input: {
  seller: string;
  valueMon: string;
  intentHash: string;
  policyHash: string;
  workload: "YieldScout" | "ChainSentinel";
}): AgentWalletTransaction {
  const value = parseEther(input.valueMon);
  if (value <= 0n) throw new Error("valueMon must be positive");
  return {
    chainId: MONAD_TESTNET_CHAIN_ID,
    to: AGENT_GUARD_ADDRESS,
    value: value.toString(),
    calldata: guardInterface.encodeFunctionData("createTask", [input.seller, input.intentHash, input.policyHash]),
    intent: {
      action: "create_agent_task",
      protocol: "Monad AgentGuard",
      workload: input.workload,
      seller: input.seller,
      valueMon: input.valueMon,
      safety: "Policy must pass before this transaction is submitted",
    },
  };
}

function shellQuote(value: string): string {
  return `'${value.replaceAll("'", `'\\''`)}'`;
}

export function toMetaMaskAgentWalletCommand(transaction: AgentWalletTransaction): string {
  const payload = JSON.stringify({
    to: transaction.to,
    value: `0x${BigInt(transaction.value).toString(16)}`,
    data: transaction.calldata,
  });
  const action = String(transaction.intent.action ?? "submit_agentguard_transaction").replaceAll("_", " ");
  const workload = transaction.intent.workload ? ` for ${transaction.intent.workload}` : "";
  const intent = `Monad AgentGuard: ${action}${workload} on Monad Testnet`;
  const parts = [
    "mm wallet send-transaction",
    `--chain-id ${transaction.chainId}`,
    `--payload ${shellQuote(payload)}`,
    `--intent ${shellQuote(intent)}`,
    "--wait",
    "--json",
  ];
  return parts.join(" ");
}
