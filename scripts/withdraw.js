const { getNamedAccounts, ethers } = require("hardhat");

async function main() {
	const { deployer } = await getNamedAccounts();
	const fundMe = ethers.getContract("FundMe", deployer);
	console.log("FundMe contract address:", fundMe.address);

	const transactionResponse = await fundMe.withdraw();

	await transactionResponse.wait(1);

	console.log("Withdrew!");
}

main()
	.then(() => process.exit(0))
	.catch(error => {
		console.error(error);
		process.exit(1);
	});
