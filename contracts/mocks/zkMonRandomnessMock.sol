// SPDX-License-Identifier: MIT
pragma solidity ^0.8.9;

import "../interfaces/IzkMonRandomness.sol";

contract zkMonRandomnessMock is IzkMonRandomness {
    function requests(uint256 requestId) external view returns (uint256) {
        return 111;
    }

    function reveal() external returns (uint256 requestId) {
        return 1;
    }
}
