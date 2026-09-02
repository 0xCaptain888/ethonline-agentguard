// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

/// @title MonadAgentGuard
/// @notice Minimal reference escrow for bounded, independently verified agent tasks.
/// @dev The AI planner is intentionally off-chain; this contract is the authority,
///      escrow, and immutable event boundary on Monad.
contract MonadAgentGuard {
    enum TaskState { OPEN, SUBMITTED, VERIFIED, BLOCKED, FROZEN }

    struct AgentIdentity { address owner; bytes32 metadataHash; bool active; }
    struct Policy { uint256 maxValue; bool requireConfirmation; bool active; }
    struct Task {
        address buyer;
        address seller;
        uint256 value;
        bytes32 intentHash;
        bytes32 policyHash;
        bytes32 resultHash;
        TaskState state;
    }

    uint256 public nextTaskId;
    mapping(address => AgentIdentity) public identities;
    mapping(address => Policy) public policies;
    mapping(uint256 => Task) public tasks;

    event AgentRegistered(address indexed agent, address indexed owner, bytes32 metadataHash);
    event PolicyUpdated(address indexed owner, uint256 maxValue, bool requireConfirmation, bool active);
    event TaskCreated(uint256 indexed taskId, address indexed buyer, address indexed seller, uint256 value, bytes32 intentHash, bytes32 policyHash);
    event ResultSubmitted(uint256 indexed taskId, bytes32 resultHash);
    event TaskBlocked(uint256 indexed taskId, bytes32 reasonHash);
    event TaskVerified(uint256 indexed taskId, bytes32 resultHash, uint256 releasedValue);
    event TaskFrozen(uint256 indexed taskId, bytes32 resultHash);

    modifier onlyIdentityOwner(address agent) { require(identities[agent].owner == msg.sender && identities[agent].active, "not identity owner"); _; }

    function registerAgent(bytes32 metadataHash) external {
        identities[msg.sender] = AgentIdentity(msg.sender, metadataHash, true);
        emit AgentRegistered(msg.sender, msg.sender, metadataHash);
    }

    function setPolicy(uint256 maxValue, bool requireConfirmation) external {
        policies[msg.sender] = Policy(maxValue, requireConfirmation, true);
        emit PolicyUpdated(msg.sender, maxValue, requireConfirmation, true);
    }

    function createTask(address seller, bytes32 intentHash, bytes32 policyHash) external payable returns (uint256 taskId) {
        Policy memory policy = policies[msg.sender];
        require(policy.active && msg.value > 0 && msg.value <= policy.maxValue, "policy denied");
        require(identities[msg.sender].active && identities[seller].active, "identity missing");
        taskId = nextTaskId++;
        tasks[taskId] = Task(msg.sender, seller, msg.value, intentHash, policyHash, bytes32(0), TaskState.OPEN);
        emit TaskCreated(taskId, msg.sender, seller, msg.value, intentHash, policyHash);
    }

    function submitResult(uint256 taskId, bytes32 resultHash) external onlyIdentityOwner(tasks[taskId].seller) {
        Task storage task = tasks[taskId];
        require(task.state == TaskState.OPEN, "task not open");
        task.resultHash = resultHash;
        task.state = TaskState.SUBMITTED;
        emit ResultSubmitted(taskId, resultHash);
    }

    function blockTask(uint256 taskId, bytes32 reasonHash) external {
        Task storage task = tasks[taskId];
        require(msg.sender == task.buyer && task.state == TaskState.OPEN, "cannot block");
        task.state = TaskState.BLOCKED;
        (bool sent,) = payable(task.buyer).call{value: task.value}("");
        require(sent, "refund failed");
        emit TaskBlocked(taskId, reasonHash);
    }

    function verifyTask(uint256 taskId, bool passed) external {
        Task storage task = tasks[taskId];
        require(msg.sender == task.buyer && task.state == TaskState.SUBMITTED, "cannot verify");
        if (passed) {
            task.state = TaskState.VERIFIED;
            (bool sent,) = payable(task.seller).call{value: task.value}("");
            require(sent, "release failed");
            emit TaskVerified(taskId, task.resultHash, task.value);
        } else {
            task.state = TaskState.FROZEN;
            emit TaskFrozen(taskId, task.resultHash);
        }
    }
}
