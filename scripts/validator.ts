import { ethers } from 'hardhat'
// @ts-ignore
import { poseidonContract } from "circomlibjs";

import * as fs from 'fs'

async function deploy() {
    let owner = await ethers.getSigner("");
    var tx_params = {gasLimit: 7e7};

    var poseidon_factory = new ethers.ContractFactory(poseidonContract.generateABI(2), poseidonContract.createCode(2));
    var poseidon = await poseidon_factory.connect(owner).deploy(tx_params);

    var verifier_raw = fs.readFileSync("./proof_dir/verifier_contract_bytecode");
    var verifier_hex = verifier_raw.reduce((output, elem) => (output + ('0' + elem.toString(16)).slice(-2)), '');
    console.log("Okay got here 6");

    var verifier_factory = new ethers.ContractFactory([], verifier_hex);
    var verifier = await verifier_factory.connect(owner).deploy(tx_params);
}

async function prove(validatorContract: any) {
    var proof_raw = fs.readFileSync("./proof_dir/proof");
    var proof_hex = "0x" + proof_raw.reduce((output, elem) => (output + ('0' + elem.toString(16)).slice(-2)), '');

    var instance_raw = fs.readFileSync("./proof_dir/limbs_instance");
    var instance_hex = "0x" + instance_raw.reduce((output, elem) => (output + ('0' + elem.toString(16)).slice(-2)), '');

    //read this in from a JSON somewhere
    var merkle_root = 0;

    await validatorContract.verify(proof_hex, instance_hex, merkle_root);

}