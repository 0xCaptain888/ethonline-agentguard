import assert from "node:assert/strict";
import test from "node:test";
import { ethers } from "ethers";
import {
  AGENT_GUARD_ADDRESS,
  buildCreateTaskTransaction,
  buildRegisterAgentTransaction,
  buildSetPolicyTransaction,
  buildSetVerifierTransaction,
  MONAD_TESTNET_CHAIN_ID,
  toMetaMaskAgentWalletCommand,
} from "../src/metamask-agent-wallet";

const metadataHash = ethers.id("metamask-agent-wallet:judge-buyer:v1");
const intentHash = ethers.id("metamask-agent-wallet:yieldscout:v1");
const policyHash = ethers.id("metamask-agent-wallet:policy:v1");
const seller = "0x637a61f2644E43aDa1eEeEb6Ff827B2aD60e669b";
const verifier = "0xE01337d3F0E061017d8Ce547e11d86C0705e8526";

test("builds deterministic MetaMask Agent Wallet contract calls", () => {
  const register = buildRegisterAgentTransaction(metadataHash);
  const policy = buildSetPolicyTransaction("0.01", true);
  const verifierBinding = buildSetVerifierTransaction(verifier);
  const task = buildCreateTaskTransaction({ seller, valueMon: "0.001", intentHash, policyHash, workload: "YieldScout" });
  assert.equal(register.chainId, MONAD_TESTNET_CHAIN_ID);
  assert.equal(register.to, AGENT_GUARD_ADDRESS);
  assert.equal(register.calldata.slice(0, 10), "0xb19b03a1");
  assert.equal(policy.calldata.slice(0, 10), "0x5405c1e6");
  assert.equal(verifierBinding.calldata.slice(0, 10), "0x5437988d");
  assert.equal(task.calldata.slice(0, 10), "0xb137d616");
  assert.equal(task.value, ethers.parseEther("0.001").toString());
});

test("renders an inspectable mm CLI command without credentials", () => {
  const task = buildCreateTaskTransaction({ seller, valueMon: "0.001", intentHash, policyHash, workload: "YieldScout" });
  const command = toMetaMaskAgentWalletCommand(task);
  assert.match(command, /^mm wallet send-transaction/);
  assert.match(command, /--chain-id 10143/);
  assert.match(command, /--payload '\{"to":"0xee84007f8618c2c38Be8C45E8050144EbF00CE4a","value":"0x38d7ea4c68000","data":"0xb137d616/);
  assert.match(command, /--intent 'Monad AgentGuard: create agent task for YieldScout on Monad Testnet'/);
  assert.match(command, /--wait --json$/);
  assert.doesNotMatch(command, /private|secret|mnemonic/i);
});
