import { loadFixture } from "@nomicfoundation/hardhat-toolbox/network-helpers";
import { ethers } from "hardhat";
import { expect } from "chai";

const DESCRIPTION = 'TBD - Description to be defined';
const UNREVEALED_IMAGE_URI = 'https://drive.polychainmonsters.com/ipfs/QmUVahrtmwSMGGx3fPaAs5eR5gHDqmM7K3Qd8F3jEW8pDd';

const ZK_MON_BASE_URI_APE = "https://drive.polychainmonsters.com/ipfs/Qme2p1W82R61e2dR1xQjLW8j8v1VYXfcmyHMLBNSHTqZ9D/";
const ZK_MON_BASE_URI_CHEETAH = "https://drive.polychainmonsters.com/ipfs/QmQH2TEo8mAd8k7ShX89SSFwe8XQ4PKyDbt2UVg3xk8Rqx/";
const ZK_MON_BASE_URI_DRAGON = "https://drive.polychainmonsters.com/ipfs/QmPHRhLJPRrWsAzDKwbvgDrDZpK3qjAGV2nSPtWiuNbf9U/";
export const ZK_MON_BASE_URI_GHOST = "https://drive4.polychainmonsters.com/ipfs/QmcS3QwvfpmLtKvB7HjRqdfsNMfwKByZ9umDpZ2Fpp2tfR/";
export const ZK_MON_BASE_URI_MAINE_COON = "https://drive4.polychainmonsters.com/ipfs/QmWRriz29k1T5HixKcRuLxd3rq5agToU8SUH9dzuEGxAes/";
export const ZK_MON_BASE_URI_OWL = "https://drive4.polychainmonsters.com/ipfs/QmPaqTKzYPpGuuKJ4XpmrY8WZouaGq9FFq9PfLTd5i3fEg/";
export const ZK_MON_BASE_URI_PANGOLIN = "https://drive4.polychainmonsters.com/ipfs/QmQqViVuAQksVdnW5Raaj3Bz5zE5ttwKWSDyhuw7rz6tYW/";
export const ZK_MON_BASE_URI_POMERANIAN = "https://drive4.polychainmonsters.com/ipfs/QmbpNE2AAPPF8A9Hs9bqBiigghi68NkjXzK2EGb1BjUL9F/";
export const ZK_MON_BASE_URI_SQUIRREL = "https://drive4.polychainmonsters.com/ipfs/QmWWDW2XjmGV3JAwUoJvqjygDRgd5MeorpY7NMy8oF1FQF/";

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

    // 1000 in total
    await zkMonMetadata.setMonster(0, 125, "Ape", ZK_MON_BASE_URI_APE);
    await zkMonMetadata.setMonster(1, 125, "Cheetah", ZK_MON_BASE_URI_CHEETAH);
    await zkMonMetadata.setMonster(2, 125, "Dragon", ZK_MON_BASE_URI_DRAGON);
    await zkMonMetadata.setMonster(3, 100, "Ghost", ZK_MON_BASE_URI_GHOST);
    await zkMonMetadata.setMonster(4, 100, "MaineCoon", ZK_MON_BASE_URI_MAINE_COON);
    await zkMonMetadata.setMonster(5, 100, "Owl", ZK_MON_BASE_URI_OWL);
    await zkMonMetadata.setMonster(6, 100, "Pangolin", ZK_MON_BASE_URI_PANGOLIN);
    await zkMonMetadata.setMonster(7, 100, "Pomeranian", ZK_MON_BASE_URI_POMERANIAN);
    await zkMonMetadata.setMonster(8, 125, "Squirrel", ZK_MON_BASE_URI_SQUIRREL);

    const zkMon = await ethers.deployContract("zkMon", [true]);
    await zkMon.initialize();
    const zkMonFromOther = await ethers.getContractAt("zkMon", zkMon, otherAccount);

    await zkMon.setMintPrice(ethers.parseEther("0.1"));
    await zkMon.setMaxSupply(1000);
    await zkMon.setMetadata(zkMonMetadata);

    return { owner, otherAccount, randomness, zkMon, zkMonMetadata, zkMonFromOther };
  }

  describe("zkMon", function () {
    it("should allow minting", async function () {
      const { otherAccount, randomness, zkMon, zkMonMetadata, zkMonFromOther } = await loadFixture(deployFixture);

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

      // mint the remainimg 998
      for (let i = 0; i < 998; i++) {
        console.info(`Minting no ${i}...`);
        await zkMonFromOther.mint({ value: ethers.parseEther("0.1") });
      }

      // it should not allow minting one more
      await expect(zkMonFromOther.mint({ value: ethers.parseEther("0.1") })).to.be.revertedWith("Max supply reached");

      // it should allow the reveal
      await zkMonMetadata.reveal();
      // but not again
      await expect(zkMonMetadata.reveal()).to.be.revertedWith("zkMonMetaData: Already revealed");

      // iterate through all the tokens and check the URIs
      for (let i = 0; i < 1000; i++) {
        let tokenURI = await zkMon.tokenURI(i);
        [contentType, base64Part] = tokenURI.split(',');
        expect(contentType).to.equal('data:application/json;base64');
        let tokenURIBuffer = Buffer.from(base64Part, 'base64');
        let tokenURIString = tokenURIBuffer.toString('utf-8');
        let tokenURIObject = JSON.parse(tokenURIString);
        console.info(`Verifying token URI for token ${i}: ${tokenURIObject.name}...`);
        expect(tokenURIObject.name).to.equal('zkMon #' + i);
      }
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
