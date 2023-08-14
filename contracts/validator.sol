// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface Hasher {
    function poseidon(uint256[2] calldata leftRight)
        external
        pure
        returns (uint256);
}

contract Validator {
    address public verifierContract;
    Hasher public poseidonContract;
    uint256 public merkleRoot;

    constructor (address _verifierContract, Hasher _poseidonContract) {
        verifierContract = _verifierContract;
        poseidonContract = _poseidonContract;
        merkleRoot = 0;
    }

    function verify(bytes calldata proof, bytes calldata instances, uint256 claimedMerkleRoot) public {
        (bool success, ) = verifierContract.call(abi.encodePacked(instances, claimedMerkleRoot, proof));
        require(success, "proof did not verify!");

        merkleRoot = claimedMerkleRoot;
    }

    function verify_merkle_path(uint256[] calldata path, uint256 input_hash, uint256 output_hash) public view returns (bool) {
        uint256 current = poseidonContract.poseidon([input_hash, output_hash]);
        
        for (uint8 i = 0; i < path.length; i++) {
            current = poseidonContract.poseidon([current, path[i]]);
        }

        return current == merkleRoot;
    }
}
