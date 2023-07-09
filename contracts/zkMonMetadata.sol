// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts-upgradeable/utils/Base64Upgradeable.sol";
import "@openzeppelin/contracts-upgradeable/utils/StringsUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/access/OwnableUpgradeable.sol";
import "@openzeppelin/contracts-upgradeable/proxy/utils/Initializable.sol";
import "./interfaces/IzkMonRandomness.sol";
import "./interfaces/IzkMonMetadata.sol";

contract zkMonMetadata is Initializable, OwnableUpgradeable, IzkMonMetadata {
    using StringsUpgradeable for uint256;

    enum MonsterType {
        Ape,
        Cheetah,
        Dragon,
        Ghost,
        MaineCoon,
        Owl,
        Pangolin,
        Pomeranian,
        Squirrel
    }

    struct Monster {
        uint256 supply;
        string name;
        string baseURI;
    }

    /// @dev contract that fetches random number from chainlink for reveal
    IzkMonRandomness public randomness;

    /// @dev generic description for the whole contract
    string public description;

    /// @dev chainlink requestId for reveal
    uint256 public revealRequestId;

    /// @dev URI for unrevealed tokens
    string public unrevealedImageURI;

    /// @dev mapping of monster type to monster data
    mapping (MonsterType => Monster) public monsters;

    event Reveal(uint256 indexed requestId);

    /// @custom:oz-upgrades-unsafe-allow constructor
    constructor(bool test) {
        if (!test) {
            _disableInitializers();
        }
    }

    function initialize(IzkMonRandomness _randomness, string memory _unrevealedImageURI, string memory _description) initializer public {
        __Ownable_init();

        randomness = _randomness;
        unrevealedImageURI = _unrevealedImageURI;
        description = _description;
    }

    function reveal() public onlyOwner {
        require(revealRequestId == 0, "zkMonMetaData: Already revealed");
        revealRequestId = randomness.reveal();
        emit Reveal(revealRequestId);
    }

    function setMonster(
        MonsterType _monType,
        uint256 _supply,
        string memory name,
        string memory _baseURI
    ) public onlyOwner {
        monsters[_monType] = Monster(_supply, name, _baseURI);
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

        if (revealRequestId == 0 || randomness.requests(revealRequestId) == 0) {
            return string(
                abi.encodePacked(
                    "data:application/json;base64,",
                    Base64Upgradeable.encode(
                        bytes(
                            string(
                                abi.encodePacked(
                                    baseMetaData,
                                    '"image":"',
                                    unrevealedImageURI,
                                    '"}'
                                )
                            )
                        )
                    )
                )
            );
        }

        Monster memory monster = monsters[getMonsterType(tokenId)];
        string memory attributes = string(
            abi.encodePacked(
                '{"trait_type":"Creature","value":"',
                monster.name,
                '"}'
            )
        );

        return string(
            abi.encodePacked(
                "data:application/json;base64,",
                Base64Upgradeable.encode(
                    bytes(
                        string(
                            abi.encodePacked(
                                baseMetaData,
                                '"image":"',
                                monster.baseURI,
                                '/',
                                getMonsterImageIndex(tokenId, monster.supply).toString(),
                                '.png",',
                                attributes,
                                ']}'
                            )
                        )
                    )
                )
            )
        );
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
        uint256 revealNumber = randomness.requests(revealRequestId);

        // Compute a deterministic pseudo-random number based on the tokenId and the revealed number
        uint randomNumber = uint(keccak256(abi.encodePacked(revealNumber, tokenId))) % 9;

        return MonsterType(randomNumber);
    }
}
