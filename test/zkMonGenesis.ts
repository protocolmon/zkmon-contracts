import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";

describe("zkMon", function () {

  async function deployFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const randomness = await ethers.deployContract("zkMonRandomnessMock");

    const zkMonMetadata = await ethers.deployContract("zkMonMetadata", [true]);
    await zkMonMetadata.initialize(randomness, '', '');

    const zkMon = await ethers.deployContract("zkMon", [true]);
    await zkMon.initialize();
    const zkMonFromOther = await ethers.getContractAt("zkMon", zkMon, otherAccount);

    await zkMon.setMintPrice(ethers.parseEther("0.1"));
    await zkMon.setMaxSupply(1000);
    await zkMon.setMetadata(zkMonMetadata);

    return { owner, otherAccount, randomness, zkMon, zkMonFromOther };
  }

  describe("zkMon", function () {
    it("should allow minting", async function () {
      const { otherAccount, randomness, zkMon, zkMonFromOther } = await loadFixture(deployFixture);

      // expect totalSupply to be 0
      expect(await zkMon.totalSupply()).to.equal(0);
      await zkMonFromOther.mint({ value: ethers.parseEther("0.1") });
      // expect totalSupply to be 1
      expect(await zkMon.totalSupply()).to.equal(1);
    });

    it("should not allow minting more than max supply", async function () {
      const { zkMon, zkMonFromOther } = await loadFixture(deployFixture);
      await zkMon.setMaxSupply(1);

      // expect totalSupply to be 0
      expect(await zkMon.totalSupply()).to.equal(0);
      await zkMonFromOther.mint({ value: ethers.parseEther("0.1") });
      // expect totalSupply to be 1
      expect(await zkMon.totalSupply()).to.equal(1);

      // expect minting to fail
      await expect(zkMonFromOther.mint({ value: ethers.parseEther("0.1") })).to.be.revertedWith("Max supply reached");
    });
  });
});
