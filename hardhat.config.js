require("@nomicfoundation/hardhat-toolbox");
//require("@nomiclabs/hardhat-waffle");
require("dotenv").config();
require("@nomiclabs/hardhat-etherscan");
require("hardhat-gas-reporter");
require("solidity-coverage");
require("hardhat-deploy");

/** @type import('hardhat/config').HardhatUserConfig */

const GOERLI_RPC_URL =
	process.env.GOERLI_RPC_URL ||
	"https://eth-goerli.alchemyapi.io/v2/your-api-key";
const PRIVATE_KEY = process.env.PRIVATE_KEY || "your-private-key";
const ETHERSCAN_API_KEY =
	process.env.ETHERSCAN_API_KEY || "your-etherscan-api-key";
const COINMARKETCAP_API_KEY =
	process.env.COINMARKETCAP_API_KEY || "your-coinmarketcap-api-key";

module.exports = {
	// solidity: "0.8.17",
	solidity: {
		compilers: [{ version: "0.8.8" }, { version: "0.6.6" }]
	},

	defaultNetwork: "hardhat", // (automatically comes with a rpc url and fake private keys)

	networks: {
		goerli: {
			url: GOERLI_RPC_URL,
			accounts: [PRIVATE_KEY],
			chainId: 5,
			blockConfirmations: 6
		},
		localhost: { url: "http://127.0.0.1:8545/", chainId: 31337 }
	},
	etherscan: {
		apiKey: ETHERSCAN_API_KEY
	},
	gasReporter: {
		enabled: true,
		outputFile: "gas-report.txt",
		noColors: true,
		currency: "USD",
		coinmarketcap: COINMARKETCAP_API_KEY
		//token: "MATIC",
	},
	namedAccounts: {
		deployer: {
			default: 0 // here this will by default take the first account as deployer
		},
		user: {
			default: 1 // here this will by default take the second account as user
		}
	}
};
