import { expect } from "chai";
import { ethers } from "hardhat";

describe("PolicyEscrowERC20", function () {
  async function fixture() {
    const [buyer, seller, verifier, relayer] = await ethers.getSigners();
    const Token = await ethers.getContractFactory("TestUSDC");
    const token = await Token.deploy(1_000_000_000n);
    await token.waitForDeployment();
    const Escrow = await ethers.getContractFactory("PolicyEscrowERC20");
    const escrow = await Escrow.deploy(await token.getAddress());
    await escrow.waitForDeployment();
    await escrow.connect(buyer).registerAgent(ethers.id("buyer"));
    await escrow.connect(seller).registerAgent(ethers.id("seller"));
    await escrow.connect(buyer).setPolicy(100_000_000n, true);
    await escrow.connect(buyer).setVerifier(verifier.address);
    await token.transfer(buyer.address, 100_000_000n);
    await token.connect(buyer).approve(await escrow.getAddress(), 100_000_000n);
    return { buyer, seller, verifier, relayer, token, escrow };
  }

  it("escrows USDC and releases only after an independent signature", async function () {
    const { buyer, seller, verifier, relayer, token, escrow } = await fixture();
    const value = 5_000_000n;
    const receipt = await (await escrow.connect(buyer).createTask(seller.address, ethers.id("intent"), ethers.id("policy"), value)).wait();
    const created = receipt!.logs.map((log) => {
      try { return escrow.interface.parseLog(log); } catch { return null; }
    }).find((event) => event?.name === "TaskCreated");
    const taskId = created!.args.taskId as bigint;
    await escrow.connect(seller).submitResult(taskId, ethers.id("result"));
    const digest = ethers.keccak256(ethers.solidityPacked(["uint256", "address", "uint256", "bool", "bytes32"], [31337, await escrow.getAddress(), taskId, true, ethers.id("result")]));
    const signature = await verifier.signMessage(ethers.getBytes(digest));
    await expect(escrow.connect(relayer).verifyTaskBySignature(taskId, true, signature)).to.emit(escrow, "TaskVerified");
    expect((await escrow.tasks(taskId)).state).to.equal(2);
    expect(await token.balanceOf(seller.address)).to.equal(value);
  });

  it("blocks before execution and refunds the buyer", async function () {
    const { buyer, seller, token, escrow } = await fixture();
    const value = 3_000_000n;
    const before = await token.balanceOf(buyer.address);
    const tx = await escrow.connect(buyer).createTask(seller.address, ethers.id("intent"), ethers.id("policy"), value);
    const receipt = await tx.wait();
    const created = receipt!.logs.map((log) => { try { return escrow.interface.parseLog(log); } catch { return null; } }).find((event) => event?.name === "TaskCreated");
    await expect(escrow.connect(buyer).blockTask(created!.args.taskId, ethers.id("budget"))).to.emit(escrow, "TaskBlocked");
    expect(await token.balanceOf(buyer.address)).to.equal(before);
  });
});
