import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { ethers } from "hardhat";

describe("MonadAgentGuardParallel", () => {
  it("creates collision-free tasks across independent buyer nonce lanes", async () => {
    const [buyerA, buyerB, seller, verifier, relayer] = await ethers.getSigners();
    const Factory = await ethers.getContractFactory("MonadAgentGuardParallel");
    const guard = await Factory.deploy();
    await guard.waitForDeployment();

    await Promise.all([
      guard.connect(buyerA).registerAgent(ethers.id("buyer-a")),
      guard.connect(buyerB).registerAgent(ethers.id("buyer-b")),
      guard.connect(seller).registerAgent(ethers.id("seller")),
    ]);
    await Promise.all([
      guard.connect(buyerA).setPolicy(ethers.parseEther("1"), true),
      guard.connect(buyerB).setPolicy(ethers.parseEther("1"), true),
      guard.connect(buyerA).setVerifier(verifier.address),
      guard.connect(buyerB).setVerifier(verifier.address),
    ]);

    const expectedA = await guard.previewTaskId(buyerA.address);
    const expectedB = await guard.previewTaskId(buyerB.address);
    assert.notEqual(expectedA, expectedB);
    await Promise.all([
      guard.connect(buyerA).createTask(seller.address, ethers.id("intent-a"), ethers.id("policy"), { value: 1n }),
      guard.connect(buyerB).createTask(seller.address, ethers.id("intent-b"), ethers.id("policy"), { value: 1n }),
    ]);
    assert.equal((await guard.tasks(expectedA)).buyer, buyerA.address);
    assert.equal((await guard.tasks(expectedB)).buyer, buyerB.address);

    const resultA = ethers.id("result-a");
    await guard.connect(seller).submitResult(expectedA, resultA);
    const chainId = (await ethers.provider.getNetwork()).chainId;
    const digest = ethers.keccak256(ethers.solidityPacked(
      ["uint256", "address", "uint256", "bool", "bytes32"],
      [chainId, await guard.getAddress(), expectedA, true, resultA],
    ));
    const signature = await verifier.signMessage(ethers.getBytes(digest));
    await guard.connect(relayer).verifyTaskBySignature(expectedA, true, signature);
    assert.equal((await guard.tasks(expectedA)).state, 2n);
  });
});
