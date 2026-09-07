import { BigInt } from "@graphprotocol/graph-ts";
import {
  AgentRegistered,
  FrozenRecoveryApproved,
  PolicyUpdated,
  ResultSubmitted,
  TaskBlocked,
  TaskCreated,
  TaskFrozen,
  TaskRecoveredVerified,
  TaskRefunded,
  TaskVerified,
  VerifierUpdated,
} from "../generated/PolicyEscrowERC20/PolicyEscrowERC20";
import { Agent, Policy, ProtocolStats, RecoveryApproval, Task, VerifierBinding } from "../generated/schema";

function stats(timestamp: BigInt): ProtocolStats {
  let entity = ProtocolStats.load("global");
  if (entity == null) {
    entity = new ProtocolStats("global");
    entity.agents = 0;
    entity.policies = 0;
    entity.tasks = 0;
    entity.verified = 0;
    entity.blocked = 0;
    entity.frozen = 0;
    entity.refunded = 0;
    entity.recoveredVerified = 0;
    entity.totalEscrowed = BigInt.zero();
    entity.totalReleased = BigInt.zero();
    entity.totalRefunded = BigInt.zero();
  }
  entity.updatedAt = timestamp;
  return entity;
}

export function handleAgentRegistered(event: AgentRegistered): void {
  let entity = Agent.load(event.params.agent);
  const isNew = entity == null;
  if (entity == null) entity = new Agent(event.params.agent);
  entity.owner = event.params.owner;
  entity.metadataHash = event.params.metadataHash;
  entity.active = true;
  entity.registeredAt = event.block.timestamp;
  entity.registeredBlock = event.block.number;
  entity.registeredTx = event.transaction.hash;
  entity.save();
  const aggregate = stats(event.block.timestamp);
  if (isNew) aggregate.agents += 1;
  aggregate.save();
}

export function handlePolicyUpdated(event: PolicyUpdated): void {
  let entity = Policy.load(event.params.owner);
  const isNew = entity == null;
  if (entity == null) entity = new Policy(event.params.owner);
  entity.owner = event.params.owner;
  entity.maxValue = event.params.maxValue;
  entity.requireConfirmation = event.params.requireConfirmation;
  entity.active = event.params.active;
  entity.updatedAt = event.block.timestamp;
  entity.updatedTx = event.transaction.hash;
  entity.save();
  const aggregate = stats(event.block.timestamp);
  if (isNew) aggregate.policies += 1;
  aggregate.save();
}

export function handleVerifierUpdated(event: VerifierUpdated): void {
  let entity = VerifierBinding.load(event.params.owner);
  if (entity == null) entity = new VerifierBinding(event.params.owner);
  entity.owner = event.params.owner;
  entity.verifier = event.params.verifier;
  entity.updatedAt = event.block.timestamp;
  entity.updatedTx = event.transaction.hash;
  entity.save();
}

export function handleTaskCreated(event: TaskCreated): void {
  const id = event.params.taskId.toString();
  const entity = new Task(id);
  entity.taskId = event.params.taskId;
  entity.buyer = event.params.buyer;
  entity.seller = event.params.seller;
  entity.value = event.params.value;
  entity.intentHash = event.params.intentHash;
  entity.policyHash = event.params.policyHash;
  entity.state = "OPEN";
  entity.createdAt = event.block.timestamp;
  entity.updatedAt = event.block.timestamp;
  entity.createdBlock = event.block.number;
  entity.createTx = event.transaction.hash;
  entity.recoveryApprovals = 0;
  entity.save();
  const aggregate = stats(event.block.timestamp);
  aggregate.tasks += 1;
  aggregate.totalEscrowed = aggregate.totalEscrowed.plus(event.params.value);
  aggregate.save();
}

export function handleResultSubmitted(event: ResultSubmitted): void {
  const entity = Task.load(event.params.taskId.toString());
  if (entity == null) return;
  entity.resultHash = event.params.resultHash;
  entity.state = "SUBMITTED";
  entity.updatedAt = event.block.timestamp;
  entity.submitTx = event.transaction.hash;
  entity.save();
}

export function handleTaskBlocked(event: TaskBlocked): void {
  const entity = Task.load(event.params.taskId.toString());
  if (entity == null) return;
  entity.reasonHash = event.params.reasonHash;
  entity.state = "BLOCKED";
  entity.updatedAt = event.block.timestamp;
  entity.settlementTx = event.transaction.hash;
  entity.refundedValue = entity.value;
  entity.save();
  const aggregate = stats(event.block.timestamp);
  aggregate.blocked += 1;
  aggregate.totalRefunded = aggregate.totalRefunded.plus(entity.value);
  aggregate.save();
}

export function handleTaskVerified(event: TaskVerified): void {
  const entity = Task.load(event.params.taskId.toString());
  if (entity == null) return;
  entity.resultHash = event.params.resultHash;
  entity.state = "VERIFIED";
  entity.updatedAt = event.block.timestamp;
  entity.settlementTx = event.transaction.hash;
  entity.releasedValue = event.params.releasedValue;
  entity.save();
  const aggregate = stats(event.block.timestamp);
  aggregate.verified += 1;
  aggregate.totalReleased = aggregate.totalReleased.plus(event.params.releasedValue);
  aggregate.save();
}

export function handleTaskFrozen(event: TaskFrozen): void {
  const entity = Task.load(event.params.taskId.toString());
  if (entity == null) return;
  entity.resultHash = event.params.resultHash;
  entity.state = "FROZEN";
  entity.updatedAt = event.block.timestamp;
  entity.settlementTx = event.transaction.hash;
  entity.save();
  const aggregate = stats(event.block.timestamp);
  aggregate.frozen += 1;
  aggregate.save();
}

export function handleFrozenRecoveryApproved(event: FrozenRecoveryApproved): void {
  const taskId = event.params.taskId.toString();
  const entity = Task.load(taskId);
  if (entity == null) return;
  const approvalId = taskId.concat("-").concat(event.params.approver.toHexString());
  const approval = new RecoveryApproval(approvalId);
  approval.task = taskId;
  approval.approver = event.params.approver;
  approval.decision = event.params.decision;
  approval.timestamp = event.block.timestamp;
  approval.transactionHash = event.transaction.hash;
  approval.save();
  entity.recoveryDecision = event.params.decision;
  entity.recoveryApprovals += 1;
  entity.updatedAt = event.block.timestamp;
  entity.save();
}

export function handleTaskRefunded(event: TaskRefunded): void {
  const entity = Task.load(event.params.taskId.toString());
  if (entity == null) return;
  entity.state = "REFUNDED";
  entity.updatedAt = event.block.timestamp;
  entity.settlementTx = event.transaction.hash;
  entity.refundedValue = event.params.refundedValue;
  entity.save();
  const aggregate = stats(event.block.timestamp);
  aggregate.refunded += 1;
  aggregate.totalRefunded = aggregate.totalRefunded.plus(event.params.refundedValue);
  aggregate.save();
}

export function handleTaskRecoveredVerified(event: TaskRecoveredVerified): void {
  const entity = Task.load(event.params.taskId.toString());
  if (entity == null) return;
  entity.state = "VERIFIED";
  entity.updatedAt = event.block.timestamp;
  entity.settlementTx = event.transaction.hash;
  entity.releasedValue = event.params.releasedValue;
  entity.save();
  const aggregate = stats(event.block.timestamp);
  aggregate.recoveredVerified += 1;
  aggregate.totalReleased = aggregate.totalReleased.plus(event.params.releasedValue);
  aggregate.save();
}
