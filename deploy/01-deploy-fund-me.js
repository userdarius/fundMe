/*async function deployFunc() {
	console.log("Deploying FundMe... lololilol");
}

module.exports.default = deployFunc;*/

const {
	networkConfig,
	developmentChains
} = require("../helper-hardhat-config");
const { network } = require("hardhat");
const { verify } = require("../utils/verify");
// const helperConfig = require("../helper-hardhat-config");
// const networkConfig = helperConfig.networkConfig;

module.exports = async ({ getNamedAccounts, deployments }) => {
	const { deploy, log } = deployments;
	const { deployer } = await getNamedAccounts();
	const chainId = network.config.chainId;

	let ethUsdPriceFeedAddress;

	if (developmentChains.includes(network.name)) {
		const ethUsdAggregator = await deployments.get("MockV3Aggregator");
		ethUsdPriceFeedAddress = ethUsdAggregator.address;
	} else {
		ethUsdPriceFeedAddress = networkConfig[chainId].ethUsdPriceFeed;
	}

	// if (chainId == 5) {
	//     log("Deploying FundMe on Goerli...");
	//     const result = await deploy("FundMe", {
	//         from: deployer,
	//         log: true,
	//         args: [networkConfig[chainId].ethUsdPriceFeed]
	//     });
	// } elif (chainId == 31337) {
	//     log("Deploying FundMe on localhost...");
	// }

	const args = [ethUsdPriceFeedAddress];

	const fundMe = await deploy("FundMe", {
		from: deployer,
		args: [ethUsdPriceFeedAddress],
		log: true,
		waitConfirmations: network.config.blockConfirmations || 1
	});

	if (
		!developmentChains.includes(network.name) &&
		process.env.ETHERSCAN_API_KEY
	) {
		await verify(fundMe.address, args);
	}

	log("------------------------------------");
};

module.exports.tags = ["all", "fund-me"];
