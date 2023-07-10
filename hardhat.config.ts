import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import "hardhat-gas-reporter";
import "@openzeppelin/hardhat-upgrades";

const config: HardhatUserConfig = {
  gasReporter: {
    enabled: true,
  },
  mocha: {
    timeout: 100000000,
  },
  solidity: "0.8.18",
};

export default config;
