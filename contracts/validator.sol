// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

contract Validator {
    address public verifierContract;
    uint256 public merkleRoot;

    constructor (address _verifierContract) public {
        verifierContract = _verifierContract;
        merkleRoot = 0;
    }

    function verify(bytes calldata proof, bytes calldata instances, uint256 claimedMerkleRoot) public {
        (bool success, ) = verifierContract.call(abi.encodePacked(instances, claimedMerkleRoot, proof));
        require(success, "proof did not verify!");

        merkleRoot = claimedMerkleRoot;
    }
}
