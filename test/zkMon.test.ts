import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import * as constants from "./constants";
import { getMonsterType, MonsterType } from "./constants";

describe("zkMon", function () {
  async function deploy() {
    // Contracts are deployed using the first signer/account by default
    const signers = await ethers.getSigners();
    const [owner, otherAccount, ...moreAccounts] = signers;

    const Randomness = await ethers.getContractFactory("zkMonRandomnessMock");
    const randomness = await Randomness.deploy();

    const ZkMonMetadata = await ethers.getContractFactory("zkMonMetadata");
    const zkMonMetadata = await upgrades.deployProxy(ZkMonMetadata, [
      randomness.target,
      constants.UNREVEALED_IMAGE_URI,
      constants.DESCRIPTION,
    ]);

    // 1000 in total
    await zkMonMetadata.setMonster(
      constants.ZK_MON_TYPE_APE,
      constants.TYPE_TO_SUPPLY_MAPPING[constants.ZK_MON_TYPE_APE],
      "Ape",
      constants.ZK_MON_BASE_URI_APE,
    );
    await zkMonMetadata.setMonster(
      constants.ZK_MON_TYPE_CHEETAH,
      constants.TYPE_TO_SUPPLY_MAPPING[constants.ZK_MON_TYPE_CHEETAH],
      "Cheetah",
      constants.ZK_MON_BASE_URI_CHEETAH,
    );
    await zkMonMetadata.setMonster(
      constants.ZK_MON_TYPE_DRAGON,
      constants.TYPE_TO_SUPPLY_MAPPING[constants.ZK_MON_TYPE_DRAGON],
      "Dragon",
      constants.ZK_MON_BASE_URI_DRAGON,
    );
    await zkMonMetadata.setMonster(
      constants.ZK_MON_TYPE_GHOST,
      constants.TYPE_TO_SUPPLY_MAPPING[constants.ZK_MON_TYPE_GHOST],
      "Ghost",
      constants.ZK_MON_BASE_URI_GHOST,
    );
    await zkMonMetadata.setMonster(
      constants.ZK_MON_TYPE_MAINE_COON,
      constants.TYPE_TO_SUPPLY_MAPPING[constants.ZK_MON_TYPE_MAINE_COON],
      "Maine Coon",
      constants.ZK_MON_BASE_URI_MAINE_COON,
    );
    await zkMonMetadata.setMonster(
      constants.ZK_MON_TYPE_OWL,
      constants.TYPE_TO_SUPPLY_MAPPING[constants.ZK_MON_TYPE_OWL],
      "Owl",
      constants.ZK_MON_BASE_URI_OWL,
    );
    await zkMonMetadata.setMonster(
      constants.ZK_MON_TYPE_PANGOLIN,
      constants.TYPE_TO_SUPPLY_MAPPING[constants.ZK_MON_TYPE_PANGOLIN],
      "Pangolin",
      constants.ZK_MON_BASE_URI_PANGOLIN,
    );
    await zkMonMetadata.setMonster(
      constants.ZK_MON_TYPE_POMERANIAN,
      constants.TYPE_TO_SUPPLY_MAPPING[constants.ZK_MON_TYPE_POMERANIAN],
      "Pomeranian",
      constants.ZK_MON_BASE_URI_POMERANIAN,
    );
    await zkMonMetadata.setMonster(
      constants.ZK_MON_TYPE_SQUIRREL,
      constants.TYPE_TO_SUPPLY_MAPPING[constants.ZK_MON_TYPE_SQUIRREL],
      "Squirrel",
      constants.ZK_MON_BASE_URI_SQUIRREL,
    );

    const ZkMon = await ethers.getContractFactory("zkMon");
    const zkMon = await upgrades.deployProxy(ZkMon, []);
    const zkMonFromOther = await zkMon.connect(otherAccount);

    await zkMon.setMintPrice(ethers.parseEther("0.1"));
    await zkMon.setMaxSupply(1000);
    await zkMon.setMetadata(zkMonMetadata);

    return {
      moreAccounts,
      owner,
      otherAccount,
      randomness,
      zkMon,
      zkMonMetadata,
      zkMonFromOther,
    };
  }

  describe("zkMon", function () {
    it("should allow minting", async function () {
      const {
        moreAccounts,
        otherAccount,
        randomness,
        zkMon,
        zkMonMetadata,
        zkMonFromOther,
      } = await deploy();

      // expect totalSupply to be 0
      expect(await zkMon.totalSupply()).to.equal(0);
      await zkMon.mint({ value: ethers.parseEther("0.1") });
      // expect totalSupply to be 1
      expect(await zkMon.totalSupply()).to.equal(1);

      // get the token URI of an unrevealed NFT
      let unrevealedTokenURI = await zkMon.tokenURI(0);
      let [contentType, base64Part] = unrevealedTokenURI.split(",");
      expect(contentType).to.equal("data:application/json;base64");
      // decode the base64
      let unrevealedTokenURIBuffer = Buffer.from(base64Part, "base64");
      let unrevealedTokenURIString = unrevealedTokenURIBuffer.toString("utf-8");
      let unrevealedTokenURIObject = JSON.parse(unrevealedTokenURIString);
      expect(unrevealedTokenURIObject.description).to.equal(
        constants.DESCRIPTION,
      );
      expect(unrevealedTokenURIObject.name).to.equal("zkMon #0");
      expect(unrevealedTokenURIObject.image).to.equal(
        constants.UNREVEALED_IMAGE_URI,
      );

      // mint the remainimg 998
      for (let i = 0; i < 999; i++) {
        console.info(`Minting no ${i}...`);
        await zkMon.mint({ value: ethers.parseEther("0.1") });
      }

      // it should not allow minting one more
      await expect(
        zkMon.mint({ value: ethers.parseEther("0.1") }),
      ).to.be.revertedWith("Max supply reached");

      // it should allow the reveal
      await zkMonMetadata.reveal();
      // but not again
      await expect(zkMonMetadata.reveal()).to.be.revertedWith(
        "zkMonMetaData: Already revealed",
      );

      // we'll use this object to check if the amount per type is 100% correct
      const countersPerType: Map<number, number> = new Map();
      const imageURIs: string[] = [];

      const CHUNK_SIZE = moreAccounts.length;
      for (let chunkStart = 0; chunkStart < 1000; chunkStart += CHUNK_SIZE) {
        // Prepare the promises for the current chunk
        const promises = [];
        for (
          let i = chunkStart;
          i < Math.min(chunkStart + CHUNK_SIZE, 1000);
          i++
        ) {
          promises.push(
            (async () => {
              const account = moreAccounts[i % CHUNK_SIZE];
              // @ts-ignore (not sure why typing don't work here)
              let tokenURI = await zkMon.connect(account).tokenURI(i);
              [contentType, base64Part] = tokenURI.split(",");
              expect(contentType).to.equal("data:application/json;base64");
              let tokenURIBuffer = Buffer.from(base64Part, "base64");
              let tokenURIString = tokenURIBuffer.toString("utf-8");
              let tokenURIObject = JSON.parse(tokenURIString);
              console.info(
                `Verifying token URI for token ${i}: ${tokenURIObject.name}...`,
              );
              expect(tokenURIObject.name).to.equal("zkMon #" + i);
              // find type trait
              const typeTrait = tokenURIObject.attributes.find(
                (trait: any) => trait.trait_type === "Creature",
              );
              const type = getMonsterType(typeTrait.value);
              if (countersPerType.has(type)) {
                countersPerType.set(type, countersPerType.get(type)! + 1);
              } else {
                countersPerType.set(type, 1);
              }
              // check that the image URI is unique
              expect(imageURIs).to.not.contain(tokenURIObject.image);
              imageURIs.push(tokenURIObject.image);
            })(),
          );
        }
        // Wait for all promises in the current chunk to finish
        await Promise.all(promises);
      }

      // check if the amount per type is 100% correct
      for (const [type, count] of countersPerType.entries()) {
        expect(count).to.equal(
          constants.TYPE_TO_SUPPLY_MAPPING[type as MonsterType],
        );
      }
    });
  });
});
