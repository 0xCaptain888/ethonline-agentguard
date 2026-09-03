import { id } from "ethers";
import {
  buildCreateTaskTransaction,
  buildRegisterAgentTransaction,
  buildSetPolicyTransaction,
  toMetaMaskAgentWalletCommand,
} from "../src/metamask-agent-wallet.js";

const seller = "0x637a61f2644E43aDa1eEeEb6Ff827B2aD60e669b";
const transactions = [
  buildRegisterAgentTransaction(id("metamask-agent-wallet:judge-buyer:v1")),
  buildSetPolicyTransaction("0.01", true),
  buildCreateTaskTransaction({
    seller,
    valueMon: "0.001",
    workload: "YieldScout",
    intentHash: id("metamask-agent-wallet:yieldscout:v1"),
    policyHash: id("metamask-agent-wallet:policy:v1"),
  }),
];

console.log(JSON.stringify({
  evidenceClass: "SPONSOR_INTEGRATION",
  sponsor: "MetaMask Agent Wallet",
  description: "Three explicit, inspectable Agent Wallet transactions: identity, policy and task escrow.",
  transactions: transactions.map((transaction) => ({ transaction, command: toMetaMaskAgentWalletCommand(transaction) })),
  boundary: "Commands require an authenticated MetaMask Agent Wallet and user-approved write policy. No credential is stored in this repository.",
}, null, 2));
