// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/Base64Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/IZKMonRandomness.sol";
import "./interfaces/IZKMonMetadata.sol";

contract zkMonMetaDataSetGenesis is Initializable, OwnableUpgradeable, IZKMonMetadata {
    using StringsUpgradeable for uint256;

    enum MonsterType {
        Ape,
        Cheetah,
        Dragon,
        Ghost,
        MainCoon,
        Owl,
        Pangolin,
        Pomeranian,
        Squirrel
    }

    struct Monster {
        uint256 availableCount;
        string baseURI;
    }

    IZKMonRandomness public randomness;

    string public description;
    uint256 public revealRequestId;
    string public unrevealedImageURI;

    mapping (MonsterType => Monster) public monsters;

    event Reveal(uint256 indexed requestId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor() {
        _disableInitializers();
    }

    function initialize(IZKMonRandomness _randomness, string memory _unrevealedImageURI, string memory _description) initializer public {
        __Ownable_init();

        randomness = _randomness;
        unrevealedImageURI = _unrevealedImageURI;
        description = _description;
    }

    function reveal() public onlyOwner {
        require(revealRequestId != 0, "zkMonMetaDataSet1: Already revealed");
        revealRequestId = randomness.reveal();
        emit Reveal(revealRequestId);
    }

    function setMonster(MonsterType _monType, uint256 _availableCount, string memory _baseURI) public onlyOwner {
        monsters[_monType] = Monster(_availableCount, _baseURI);
    }

    function setUnrevealedImageURI(string memory _unrevealedImageURI) public onlyOwner {
        unrevealedImageURI = _unrevealedImageURI;
    }

    function tokenURI(uint256 tokenId) external override view returns (string memory) {
        string memory baseMetaData = string(
            abi.encodePacked(
                '{"name":"zkMon #',
                tokenId.toString(),
                '","description":"',
                description,
                '",'
            )
        );

        string memory setMetaData = ',"attributes":[{"trait_type":"Set","value":"Genesis"}]';

        if (revealRequestId == 0) {
            return string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64Upgradeable.encode(
                        bytes(
                            string(
                                abi.encodePacked(
                                    baseMetaData,
                                    '","image":"',
                                    unrevealedImageURI,
                                    setMetaData
                                )
                            )
                        )
                    )
                )
            );
        }

        return "";
    }

    function getMonsterImageIndex(uint256 tokenId, uint256 availableCount) public view returns (uint256) {
        require(revealRequestId != 0, "zkMonMetaDataSet1: Not revealed yet");

        // Get the revealed random number
        uint256 revealNumber = randomness.requests(revealRequestId);
        require(revealNumber != 0, "zkMonMetaDataSet1: Reveal not found");

        // Compute a deterministic pseudo-random number based on the tokenId, the revealed number, and the available count
        uint randomNumber = uint(keccak256(abi.encodePacked(revealNumber, tokenId))) % availableCount;

        return randomNumber;
    }

    function getMonsterType(uint256 tokenId) public view returns (MonsterType) {
        require(revealRequestId != 0, "zkMonMetaDataSet1: Not revealed yet");

        // Get the revealed random number
        uint256 revealNumber = randomness.getNumber(revealRequestId);

        // Compute a deterministic pseudo-random number based on the tokenId and the revealed number
        uint randomNumber = uint(keccak256(abi.encodePacked(revealNumber, tokenId))) % 9;

        return MonsterType(randomNumber);
    }
}
