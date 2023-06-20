// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "@openzeppelin/contracts/access/AccessControl.sol";
import "@chainlink/contracts/src/v0.8/interfaces/VRFCoordinatorV2Interface.sol";
import "@chainlink/contracts/src/v0.8/VRFConsumerBaseV2.sol";
import "@chainlink/contracts/src/v0.8/ConfirmedOwner.sol";
import "./interfaces/IZKMonRandomness.sol";

contract zkMonRandomness is AccessControl, VRFConsumerBaseV2, ConfirmedOwner, IZKMonRandomness {
    bytes32 public constant REVEALER_ROLE = keccak256("REVEALER_ROLE");

    VRFCoordinatorV2Interface public vrfCoordinator;
    mapping(uint256 => uint256) public override requests;

    bytes32 public keyHash;
    uint64 public subscriptionId;
    uint16 public requestConfirmations;
    uint32 public callbackGasLimit;

    event RequestSent(uint256 indexed requestId);
    event RequestFulfilled(uint256 indexed requestId, uint256 indexed randomWord);

    constructor(
        address _vrfCoordinator,
        bytes32 _keyHash,
        uint64 _subscriptionId,
        uint16 _requestConfirmations,
        uint32 _callbackGasLimit
    ) VRFConsumerBaseV2(_vrfCoordinator) ConfirmedOwner(msg.sender) {
        vrfCoordinator = VRFCoordinatorV2Interface(_vrfCoordinator);
        subscriptionId = _subscriptionId;
        keyHash = _keyHash;
        requestConfirmations = _requestConfirmations;
        callbackGasLimit = _callbackGasLimit;

        _grantRole(DEFAULT_ADMIN_ROLE, msg.sender);
        _grantRole(REVEALER_ROLE, msg.sender);
    }

    function reveal() external override returns (uint256 requestId) {
        require(hasRole(REVEALER_ROLE, msg.sender), "Caller is not a revealer");

        /// @dev Will revert if subscription is not set and funded.
        requestId = vrfCoordinator.requestRandomWords(
            keyHash,
            subscriptionId,
            requestConfirmations,
            callbackGasLimit,
            1
        );

        requests[requestId] = 0;

        emit RequestSent(requestId);
    }

    function fulfillRandomWords(
        uint256 _requestId,
        uint256[] memory _randomWords
    ) internal override {
        require(
            requests[_requestId] == 0,
            "SummoningEffectNFBOpener: Request already fulfilled"
        );

        require(_randomWords.length == 1, "zkMonRandomness: Unexpected length of random words");
        requests[_requestId] = _randomWords[0];

        emit RequestFulfilled(_requestId, _randomWords[0]);
    }
}
