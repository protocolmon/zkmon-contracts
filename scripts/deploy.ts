import { ethers } from "hardhat";
import { poseidonContract } from "circomlibjs";
import fs from "fs";

async function main() {
  const [signer] = await ethers.getSigners();
  const PoseidonFactory = new ethers.ContractFactory(
    poseidonContract.generateABI(2),
    poseidonContract.createCode(2),
    signer,
  );
  // console.log("poseidonFactory", PoseidonFactory);
  const poseidon = await PoseidonFactory.deploy();
  console.log(await poseidon.getAddress());

  const verifierRaw = fs.readFileSync("./proof_dir/verifier_contract_bytecode");
  const verifierHex = verifierRaw.reduce(
    (output, elem) => output + ("0" + elem.toString(16)).slice(-2),
    "",
  );

  const verifierFactory = new ethers.ContractFactory([], verifierHex, signer);
  const verifier = await verifierFactory.deploy();
  console.log(await verifier.getAddress());

  const zkMonValidatorFactory = await ethers.getContractFactory(
    "zkMonValidator",
  );
  const zkMonValidator = await zkMonValidatorFactory.deploy(
    await verifier.getAddress(),
    await poseidon.getAddress(),
  );
  console.log(await zkMonValidator.getAddress());

  const proofRaw = fs.readFileSync("./proof_dir/proof");
  const proofHex =
    "0x" +
    proofRaw.reduce(
      (output, elem) => output + ("0" + elem.toString(16)).slice(-2),
      "",
    );

  const instanceRaw = fs.readFileSync("./proof_dir/limbs_instance");
  const instanceHex =
    "0x" +
    instanceRaw.reduce(
      (output, elem) => output + ("0" + elem.toString(16)).slice(-2),
      "",
    );

  const merkleRoot = ethers.toBigInt(
    "0x1953ed8741d64c75595aec3373701ac79a4e21f40e211e62052c29bcc45df528",
  );

  await zkMonValidator.verify(proofHex, instanceHex, merkleRoot);
}

// We recommend this pattern to be able to use async/await everywhere
// and properly handle errors.
main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
