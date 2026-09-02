import { expect } from "chai";
import { ethers } from "hardhat";

describe("MonadAgentGuard", function () {
  it("registers identities and releases a verified task", async function () {
    const [buyer, seller] = await ethers.getSigners();
    const Guard = await ethers.getContractFactory("MonadAgentGuard");
    const guard = await Guard.deploy();
    await guard.waitForDeployment();
    await guard.connect(buyer).registerAgent(ethers.id("buyer"));
    await guard.connect(seller).registerAgent(ethers.id("seller"));
    await guard.connect(buyer).setPolicy(ethers.parseEther("1"), true);
    await guard.connect(buyer).createTask(seller.address, ethers.id("intent"), ethers.id("policy"), { value: ethers.parseEther("0.1") });
    await guard.connect(seller).submitResult(0, ethers.id("result"));
    await expect(guard.connect(buyer).verifyTask(0, true)).to.emit(guard, "TaskVerified");
    expect((await guard.tasks(0)).state).to.equal(2);
  });

  it("blocks before execution and refunds the buyer", async function () {
    const [buyer, seller] = await ethers.getSigners();
    const Guard = await ethers.getContractFactory("MonadAgentGuard");
    const guard = await Guard.deploy();
    await guard.waitForDeployment();
    await guard.connect(buyer).registerAgent(ethers.ZeroHash);
    await guard.connect(seller).registerAgent(ethers.ZeroHash);
    await guard.connect(buyer).setPolicy(ethers.parseEther("1"), true);
    await guard.connect(buyer).createTask(seller.address, ethers.id("intent"), ethers.id("policy"), { value: ethers.parseEther("0.1") });
    await expect(guard.connect(buyer).blockTask(0, ethers.id("budget"))).to.emit(guard, "TaskBlocked");
    expect((await guard.tasks(0)).state).to.equal(3);
  });

  it("freezes a mismatched result without releasing funds", async function () {
    const [buyer, seller] = await ethers.getSigners();
    const Guard = await ethers.getContractFactory("MonadAgentGuard");
    const guard = await Guard.deploy();
    await guard.waitForDeployment();
    await guard.connect(buyer).registerAgent(ethers.ZeroHash);
    await guard.connect(seller).registerAgent(ethers.ZeroHash);
    await guard.connect(buyer).setPolicy(ethers.parseEther("1"), true);
    await guard.connect(buyer).createTask(seller.address, ethers.id("intent"), ethers.id("policy"), { value: ethers.parseEther("0.1") });
    await guard.connect(seller).submitResult(0, ethers.id("unsafe"));
    await expect(guard.connect(buyer).verifyTask(0, false)).to.emit(guard, "TaskFrozen");
    expect((await guard.tasks(0)).state).to.equal(4);
  });
});
