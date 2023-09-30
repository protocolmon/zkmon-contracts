// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "@openzeppelin/contracts-upgradeable/utils/CountersUpgradeable.sol";
import "./interfaces/IzkMonMetadata.sol";

interface Hasher {
    function poseidon(uint256[2] calldata leftRight)
    external
    pure
    returns (uint256);
}

contract zkMon is Initializable, ERC721Upgradeable, ERC721EnumerableUpgradeable, OwnableUpgradeable {
    using CountersUpgradeable for CountersUpgradeable.Counter;

    CountersUpgradeable.Counter private _tokenIdCounter;

    uint256 public mintPrice;
    uint256 public maxSupply;
    IzkMonMetadata public meta;

    /// @dev ZK related stuff
    address public verifierContract;
    Hasher public poseidonContract;
    uint256 public merkleRoot;

    event MerkleRootVerified(uint256 indexed merkleRoot);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(address _verifierContract, Hasher _poseidonContract) initializer public {
        __ERC721_init("zkMon", "ZKMON");
        __ERC721Enumerable_init();
        __Ownable_init();
    }

    /****************************
     * ZK *
     ***************************/

    /// @dev Main proof verification
    function verify(bytes calldata proof, bytes calldata instances, uint256 claimedMerkleRoot) public {
        (bool success, ) = verifierContract.call(abi.encodePacked(instances, claimedMerkleRoot, proof));
        require(success, "zkMonValidator: Proof did not verify!");

        merkleRoot = claimedMerkleRoot;
        emit MerkleRootVerified(merkleRoot);
    }

    /// @dev View function to verify merkle path of single NFTs
    function verifyMerklePath(uint256[] calldata path, uint256 input_hash, uint256 output_hash) public view returns (bool) {
        uint256 current = poseidonContract.poseidon([input_hash, output_hash]);

        for (uint8 i = 0; i < path.length; i++) {
            current = poseidonContract.poseidon([current, path[i]]);
        }

        return current == merkleRoot;
    }

    /****************************
     * MINTING *
     ***************************/

    function mint() public payable {
        require(totalSupply() < maxSupply, "Max supply reached");
        require(msg.value >= mintPrice, "Insufficient funds");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(msg.sender, tokenId);
    }

    function ownerMint(address to) public onlyOwner {
        require(totalSupply() < maxSupply, "Max supply reached");

        uint256 tokenId = _tokenIdCounter.current();
        _tokenIdCounter.increment();
        _safeMint(to, tokenId);
    }

    /****************************
     * OWNER FUNCTIONS *
     ***************************/

    function setMintPrice(uint256 _mintPrice) public onlyOwner {
        mintPrice = _mintPrice;
    }

    function setMaxSupply(uint256 _maxSupply) public onlyOwner {
        maxSupply = _maxSupply;
    }

    function setMetadata(address _meta) public onlyOwner {
        meta = IzkMonMetadata(_meta);
    }

    /****************************
     * OVERRIDES *
     ***************************/

    function _beforeTokenTransfer(address from, address to, uint256 tokenId, uint256 batchSize)
    internal
    override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    {
        super._beforeTokenTransfer(from, to, tokenId, batchSize);
    }

    function supportsInterface(bytes4 interfaceId)
    public
    view
    override(ERC721Upgradeable, ERC721EnumerableUpgradeable)
    returns (bool)
    {
        return super.supportsInterface(interfaceId);
    }

    /****************************
     * METADATA FORMATTING *
     ***************************/

    function tokenURI(uint256 tokenId) public view override(ERC721Upgradeable) returns (string memory) {
        require(_exists(tokenId), "zkMon: URI query for nonexistent token");
        require(address(meta) != address(0), "zkMon: Contract not set");

        return meta.tokenURI(tokenId);
    }
}
