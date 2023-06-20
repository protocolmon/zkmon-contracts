// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/token/ERC721/ERC721Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721EnumerableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721URIStorageUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/token/ERC721/extensions/ERC721BurnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "erc721a-upgradeable/contracts/extensions/ERC721ABurnableUpgradeable.sol";
import "erc721a-upgradeable/contracts/extensions/ERC721AQueryableUpgradeable.sol";
import "./interfaces/IZKMonMetadata.sol";

contract zkMon is Initializable, ERC721ABurnableUpgradeable, ERC721AQueryableUpgradeable, OwnableUpgradeable {
    struct IDRange {
        uint256 start;
        uint256 length;
        IZKMonMetadata resolver;
    }

    /// @dev the mint price in ETH
    uint256 public mintPrice;

    /// @dev mapping of id ranges to the number of tokens minted in that range
    /// e.g. ID range 1 = start = 1,000, length = 1,000 (1 thousand tokens)
    ///      ID range 2 = start = 2,000, length = 5,000 (5 thousand tokens)
    mapping(uint256 => IDRange) public idRanges;

    event IDRangeSet(uint256 indexed start, uint256 indexed length);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(IERC721Upgradeable _edition, uint256 _mintPrice) initializer public {
        __Ownable_init();

        __ERC721A_init("zkMon", "ZK-MON");
        __ERC721ABurnable_init();
        __ERC721AQueryable_init();

        mintPrice = _mintPrice;
    }

    function mint(address to, uint256 quantity) external payable {
        require(quantity > 0, "zkMon: quantity cannot be zero");
        require(msg.value == quantity * mintPrice, "zkMon: incorrect ether value");
        _mint(to, quantity);
    }

    function ownerMint(address to, uint256 quantity) public onlyOwner {
        _mint(to, quantity);
    }

    function setMintPrice(uint256 _mintPrice) public onlyOwner {
        mintPrice = _mintPrice;
    }

    function setIDRange(uint256 start, uint256 length, IZKMonMetadata resolver) public onlyOwner {
        idRanges[start] = IDRange(start, length, resolver);
        emit IDRangeSet(start, length, resolver);
    }

    function tokenURI(uint256 tokenId) public view virtual override(ERC721Upgradeable, ERC721URIStorageUpgradeable) returns (string memory) {
        IDRange memory idRange = IDRange(0, 0, address(0));
        /// @dev - no, this does not scale for thousands of id ranges, but that's also not the purpose of this contract
        for (uint256 i = 0; i < idRanges.length; i++) {
            if (tokenId >= idRanges[i].start && tokenId < idRanges[i].start + idRanges[i].length) {
                idRange = idRanges[i];
                break;
            }
        }

        require(idRange.resolver != address(0), "zkMon: tokenId out of range");
        return idRange.resolver.tokenURI(tokenId);
    }
}
