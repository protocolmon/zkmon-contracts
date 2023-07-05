// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

interface IzkMonRandomness {
    function requests(uint256 requestId) external view returns (uint256);
    function reveal() external returns (uint256 requestId);
}
