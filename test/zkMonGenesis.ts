import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";

const DESCRIPTION = 'TBD - Description to be defined';
const UNREVEALED_IMAGE_URI = 'https://drive.polychainmonsters.com/ipfs/QmUVahrtmwSMGGx3fPaAs5eR5gHDqmM7K3Qd8F3jEW8pDd';

describe("zkMon", function () {

  async function deployFixture() {
    // Contracts are deployed using the first signer/account by default
    const [owner, otherAccount] = await ethers.getSigners();

    const randomness = await ethers.deployContract("zkMonRandomnessMock");

    const zkMonMetadata = await ethers.deployContract("zkMonMetadata", [true]);
    await zkMonMetadata.initialize(
      randomness,
      UNREVEALED_IMAGE_URI,
      DESCRIPTION
    );

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

      // get the token URI of an unrevealed NFT
      let unrevealedTokenURI = await zkMon.tokenURI(0);
      let [contentType,base64Part] = unrevealedTokenURI.split(',');
      expect(contentType).to.equal('data:application/json;base64');
      // decode the base64
      let unrevealedTokenURIBuffer = Buffer.from(base64Part, 'base64');
      let unrevealedTokenURIString = unrevealedTokenURIBuffer.toString('utf-8');
      let unrevealedTokenURIObject = JSON.parse(unrevealedTokenURIString);
      expect(unrevealedTokenURIObject.description).to.equal(DESCRIPTION);
      expect(unrevealedTokenURIObject.name).to.equal('zkMon #0');
      expect(unrevealedTokenURIObject.image).to.equal(UNREVEALED_IMAGE_URI);

      // mint another one
      await zkMonFromOther.mint({ value: ethers.parseEther("0.1") });
      expect(await zkMon.totalSupply()).to.equal(2);

      unrevealedTokenURI = await zkMon.tokenURI(1);
      [contentType, base64Part] = unrevealedTokenURI.split(',');
      expect(contentType).to.equal('data:application/json;base64');
      unrevealedTokenURIBuffer = Buffer.from(base64Part, 'base64');
      unrevealedTokenURIString = unrevealedTokenURIBuffer.toString('utf-8');
      unrevealedTokenURIObject = JSON.parse(unrevealedTokenURIString);
      expect(unrevealedTokenURIObject.name).to.equal('zkMon #1');
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
