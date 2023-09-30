import { ethers, upgrades } from "hardhat";
import { expect } from "chai";
import { poseidonContract } from "circomlibjs";
import * as constants from "./constants";
import { getMonsterType, MAX_SUPPLY, MonsterType } from "./constants";
import fs from "fs";
import { ZkMon } from "../typechain-types";

const toHex = (buffer: Buffer) => {
  return "0x" + buffer.toString("hex");
};

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

    // MAX_SUPPLY in total
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

    // deploy the zk related contracts
    const [signer] = await ethers.getSigners();
    const PoseidonFactory = new ethers.ContractFactory(
      poseidonContract.generateABI(2),
      poseidonContract.createCode(2),
      signer,
    );
    const poseidon = await PoseidonFactory.deploy();

    const verifierRaw = fs.readFileSync(
      "./proof_dir/verifier_contract_bytecode",
    );
    const verifierHex = verifierRaw.reduce(
      (output, elem) => output + ("0" + elem.toString(16)).slice(-2),
      "",
    );

    const verifierFactory = new ethers.ContractFactory([], verifierHex, signer);
    const verifier = await verifierFactory.deploy();

    const ZkMon = await ethers.getContractFactory("zkMon");
    const zkMon = await upgrades.deployProxy(ZkMon, [
      await verifier.getAddress(),
      await poseidon.getAddress(),
    ]);
    const zkMonFromOther = await zkMon.connect(otherAccount);

    await zkMon.setMintPrice(ethers.parseEther("0.1"));
    await zkMon.setMaxSupply(MAX_SUPPLY);
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

  async function prove(validatorContract: ZkMon): Promise<boolean> {
    const proofRaw = fs.readFileSync("./proof_dir/proof");
    const proofHex = toHex(proofRaw);

    const instanceRaw = fs.readFileSync("./proof_dir/limbs_instance");
    const instanceHex = toHex(instanceRaw);

    const merkleRoot = ethers.toBigInt(
      "0x1953ed8741d64c75595aec3373701ac79a4e21f40e211e62052c29bcc45df528",
    );

    await expect(validatorContract.verify(proofHex, instanceHex, merkleRoot))
      .to.emit(validatorContract, "MerkleRootVerified")
      .withArgs(merkleRoot);

    return true;
  }

  describe("zkMon", function () {
    it("should verify the zk proof", async function () {
      const { zkMon } = await deploy();
      const proven = await prove(zkMon as unknown as ZkMon);
      expect(proven).to.equal(true);
    });

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

      // mint the remaining tokens
      for (let i = 0; i < MAX_SUPPLY - 1; i++) {
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

      for (let i = 0; i < MAX_SUPPLY; i++) {
        // @ts-ignore (not sure why typing don't work here)
        let tokenURI = await zkMon.connect(otherAccount).tokenURI(i);
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
        console.log(tokenURIObject.image);
        imageURIs.push(tokenURIObject.image);
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
