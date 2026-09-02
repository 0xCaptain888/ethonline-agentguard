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
    mapping(address => address) public verifiers;

    event AgentRegistered(address indexed agent, address indexed owner, bytes32 metadataHash);
    event PolicyUpdated(address indexed owner, uint256 maxValue, bool requireConfirmation, bool active);
    event VerifierUpdated(address indexed owner, address indexed verifier);
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

    /// @notice Select an independent verifier for future tasks.
    function setVerifier(address verifier) external {
        require(verifier != address(0), "verifier required");
        verifiers[msg.sender] = verifier;
        emit VerifierUpdated(msg.sender, verifier);
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
        require(verifiers[task.buyer] == address(0), "independent verifier required");
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

    /// @notice Verify with an EIP-191 signature from the buyer-selected verifier.
    /// @dev The signed payload binds this contract, task id, result hash and decision.
    function verifyTaskBySignature(uint256 taskId, bool passed, bytes calldata signature) external {
        Task storage task = tasks[taskId];
        require(task.state == TaskState.SUBMITTED, "cannot verify");
        address verifier = verifiers[task.buyer];
        require(verifier != address(0), "verifier missing");
        bytes32 digest = keccak256(abi.encodePacked(block.chainid, address(this), taskId, passed, task.resultHash));
        bytes32 ethSigned = keccak256(abi.encodePacked("\x19Ethereum Signed Message:\n32", digest));
        (uint8 v, bytes32 r, bytes32 s) = _splitSignature(signature);
        require(ecrecover(ethSigned, v, r, s) == verifier, "invalid verifier signature");
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

    function _splitSignature(bytes calldata signature) private pure returns (uint8 v, bytes32 r, bytes32 s) {
        require(signature.length == 65, "bad signature");
        assembly {
            r := calldataload(signature.offset)
            s := calldataload(add(signature.offset, 32))
            v := byte(0, calldataload(add(signature.offset, 64)))
        }
        if (v < 27) v += 27;
        require(v == 27 || v == 28, "bad signature v");
    }
}
