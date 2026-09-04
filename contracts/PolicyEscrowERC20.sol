// SPDX-License-Identifier: MIT
pragma solidity ^0.8.26;

interface IERC20Minimal {
    function transfer(address to, uint256 amount) external returns (bool);
    function transferFrom(address from, address to, uint256 amount) external returns (bool);
}

/// @title PolicyEscrowERC20
/// @notice Generic ERC-20 escrow for Agent-to-Agent commerce.
/// @dev The token is immutable so a task cannot silently switch settlement
///      assets. Policy and verifier authority remain separate from the seller.
contract PolicyEscrowERC20 {
    enum TaskState { OPEN, SUBMITTED, VERIFIED, BLOCKED, FROZEN, REFUNDED }

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

    IERC20Minimal public immutable token;
    mapping(address => AgentIdentity) public identities;
    mapping(address => Policy) public policies;
    mapping(uint256 => Task) public tasks;
    mapping(address => address) public verifiers;
    mapping(address => uint256) public nextBuyerNonce;
    mapping(uint256 => uint8) public recoveryDecision;
    mapping(uint256 => mapping(address => bool)) public recoveryApprovals;
    mapping(uint256 => uint8) public recoveryApprovalCount;

    event AgentRegistered(address indexed agent, address indexed owner, bytes32 metadataHash);
    event PolicyUpdated(address indexed owner, uint256 maxValue, bool requireConfirmation, bool active);
    event VerifierUpdated(address indexed owner, address indexed verifier);
    event TaskCreated(uint256 indexed taskId, address indexed buyer, address indexed seller, uint256 value, bytes32 intentHash, bytes32 policyHash);
    event ResultSubmitted(uint256 indexed taskId, bytes32 resultHash);
    event TaskBlocked(uint256 indexed taskId, bytes32 reasonHash);
    event TaskVerified(uint256 indexed taskId, bytes32 resultHash, uint256 releasedValue);
    event TaskFrozen(uint256 indexed taskId, bytes32 resultHash);
    event FrozenRecoveryApproved(uint256 indexed taskId, address indexed approver, uint8 decision);
    event TaskRefunded(uint256 indexed taskId, uint256 refundedValue);
    event TaskRecoveredVerified(uint256 indexed taskId, uint256 releasedValue);

    constructor(address settlementToken) {
        require(settlementToken != address(0), "token required");
        token = IERC20Minimal(settlementToken);
    }

    modifier onlyIdentityOwner(address agent) {
        require(identities[agent].owner == msg.sender && identities[agent].active, "not identity owner");
        _;
    }

    function registerAgent(bytes32 metadataHash) external {
        identities[msg.sender] = AgentIdentity(msg.sender, metadataHash, true);
        emit AgentRegistered(msg.sender, msg.sender, metadataHash);
    }

    function setPolicy(uint256 maxValue, bool requireConfirmation) external {
        policies[msg.sender] = Policy(maxValue, requireConfirmation, true);
        emit PolicyUpdated(msg.sender, maxValue, requireConfirmation, true);
    }

    function setVerifier(address verifier) external {
        require(verifier != address(0), "verifier required");
        verifiers[msg.sender] = verifier;
        emit VerifierUpdated(msg.sender, verifier);
    }

    function previewTaskId(address buyer) public view returns (uint256) {
        return uint256(keccak256(abi.encodePacked(block.chainid, address(this), buyer, nextBuyerNonce[buyer])));
    }

    function createTask(address seller, bytes32 intentHash, bytes32 policyHash, uint256 value) external returns (uint256 taskId) {
        Policy memory policy = policies[msg.sender];
        require(policy.active && value > 0 && value <= policy.maxValue, "policy denied");
        require(identities[msg.sender].active && identities[seller].active, "identity missing");
        require(token.transferFrom(msg.sender, address(this), value), "escrow transfer failed");
        uint256 nonce = nextBuyerNonce[msg.sender]++;
        taskId = uint256(keccak256(abi.encodePacked(block.chainid, address(this), msg.sender, nonce)));
        require(tasks[taskId].buyer == address(0), "task collision");
        tasks[taskId] = Task(msg.sender, seller, value, intentHash, policyHash, bytes32(0), TaskState.OPEN);
        emit TaskCreated(taskId, msg.sender, seller, value, intentHash, policyHash);
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
        require(token.transfer(task.buyer, task.value), "refund failed");
        emit TaskBlocked(taskId, reasonHash);
    }

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
            require(token.transfer(task.seller, task.value), "release failed");
            emit TaskVerified(taskId, task.resultHash, task.value);
        } else {
            task.state = TaskState.FROZEN;
            emit TaskFrozen(taskId, task.resultHash);
        }
    }

    function approveFrozenRecovery(uint256 taskId, uint8 decision) external {
        require(decision == 1 || decision == 2, "invalid recovery decision");
        Task storage task = tasks[taskId];
        require(task.state == TaskState.FROZEN, "task not frozen");
        require(msg.sender == task.buyer || msg.sender == task.seller, "party required");
        require(!recoveryApprovals[taskId][msg.sender], "already approved");
        if (recoveryDecision[taskId] == 0) recoveryDecision[taskId] = decision;
        require(recoveryDecision[taskId] == decision, "decision mismatch");
        recoveryApprovals[taskId][msg.sender] = true;
        recoveryApprovalCount[taskId] += 1;
        emit FrozenRecoveryApproved(taskId, msg.sender, decision);
        if (recoveryApprovalCount[taskId] < 2) return;
        if (decision == 1) {
            task.state = TaskState.REFUNDED;
            require(token.transfer(task.buyer, task.value), "refund failed");
            emit TaskRefunded(taskId, task.value);
        } else {
            task.state = TaskState.VERIFIED;
            require(token.transfer(task.seller, task.value), "release failed");
            emit TaskRecoveredVerified(taskId, task.value);
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
