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
    constructor() {
        _disableInitializers();
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

        uint256 seed = randomness.requests(revealRequestId);

        Monster memory monster = monsters[getMonsterType(seed, tokenId)];
        string memory attributes = string(
            abi.encodePacked(
                '"attributes":[{"trait_type":"Creature","value":"',
                monster.name,
                '"}]'
            )
        );

        uint256 imageShift = seed % monster.supply;
        uint256 imageIndex = tokenId + imageShift;

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
                                imageIndex.toString(),
                                '.webp",',
                                attributes,
                                '}'
                            )
                        )
                    )
                )
            )
        );
    }

    function getMonsterType(uint256 seed, uint256 tokenId) public view returns (MonsterType) {
        require(revealRequestId != 0, "zkMonMetadata: Not revealed yet");

        // Create the array of all monsters
        MonsterType[] memory allMonsterTypes = createMonsters(seed);

        // Get the revealed random number
        uint256 revealNumber = randomness.requests(revealRequestId) % allMonsterTypes.length;

        // Use the reveal number as an offset
        uint256 index = tokenId + revealNumber;
        if (index > allMonsterTypes.length - 1) {
            index = index % allMonsterTypes.length;
        }

        // Return the selected monster
        return allMonsterTypes[index];
    }

    /// @dev This is not efficient but it works because we only have 1k items and this is only used for reading the token URI.
    //       This way of assigning the monster type allows us to have the type on-chain and still link every item to a
    //       unique image after an on-chain seed based reveal.
    function createMonsters(uint256 seed) public view returns(MonsterType[] memory) {
        MonsterType[] memory monsterTypeArray = new MonsterType[](1000);
        uint256 index = 0;

        for(uint8 i = 0; i < 9;) {
            MonsterType currentMonsterType = MonsterType(i);
            Monster memory currentMonster = monsters[currentMonsterType];
            for(uint256 j = 0; j < currentMonster.supply;) {
                monsterTypeArray[index] = MonsterType(i);

                unchecked {
                index++;
                    j++;
                }
            }

            unchecked {
                i++;
            }
        }

        return shuffle(monsterTypeArray, seed);
    }

    function shuffle(MonsterType[] memory array, uint256 seed) internal pure returns(MonsterType[] memory) {
        uint256 arrayLen = array.length;
        for (uint i = 0; i < arrayLen;) {
            uint256 n = i + seed % (arrayLen - i);
            MonsterType temp = array[n];
            array[n] = array[i];
            array[i] = temp;
            unchecked {
                i++;
            }
        }
        return array;
    }
}
