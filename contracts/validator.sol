contract Validator {
    address public verifierContract;
    uint256 public merkleRoot;

    constructor (address _verifierContract) {
        verifierContract = _verifierContract;
        merkleRoot = 0;
    }

    verify(bytes calldata proof, bytes calldata instances, uint256 calldata claimedMerkleRoot) {
        (bool success, ) = verifierContract.call(abi.encodePacked(instances, claimedMerkleRoot, proof));
        require(success, "proof did not verify!");

        merkleRoot = claimedMerkleRoot;
    }
}