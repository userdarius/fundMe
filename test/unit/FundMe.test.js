const { deployments, ethers, getNamedAccounts } = require("hardhat");
const { assert, expect } = require("chai");
const { developmentChains } = require("../../helper-hardhat-config");

!developmentChains.includes(network.name)
	? describe.skip
	: describe("FundMe", async function() {
			let fundMe;
			let deployer;
			let MockV3Aggregator;
			const sendValue = ethers.utils.parseEther("1");

			beforeEach(async function() {
				// deploy our fundme contract using hardhat-deploy
				deployer = (await getNamedAccounts()).deployer; // here we grab the deployer account directly from the object
				await deployments.fixture(["all"]); // allows us to deploy our entire deploy folder with one line
				fundMe = await ethers.getContract("FundMe", deployer); // allows us to get our main contract (most recent version)
				MockV3Aggregator = await ethers.getContract(
					"MockV3Aggregator",
					deployer
				);
			});

			describe("constructor", async function() {
				it("should set the right address", async function() {
					const response = await fundMe.getPriceFeed();
					assert.equal(response, MockV3Aggregator.address);
				});
			});

			describe("fund", async function() {
				it("Fails if you don't send enough eth", async function() {
					await expect(fundMe.fund()).to.be.revertedWith(
						"Didn't send enough"
					);
				});

				it("Should update the amountFunded dataStruct", async function() {
					await fundMe.fund({ value: sendValue });
					const response = await fundMe.getAddressToAmountFunded(
						deployer
					);
					assert.equal(response.toString(), sendValue.toString());
				});

				it("Adds funder to array of getFunders", async function() {
					await fundMe.fund({ value: sendValue });
					const response = await fundMe.getFunders(0);
					assert.equal(response, deployer);
				});
			});

			describe("withdraw", async function() {
				beforeEach(async function() {
					await fundMe.fund({ value: sendValue });
				});

				it("Withdraw ETH from a single funder", async function() {
					const startingFundMeBalance = await fundMe.provider.getBalance(
						fundMe.address
					);

					const startingDeployerBalance = await fundMe.provider.getBalance(
						deployer
					);

					const response = await fundMe.withdraw();
					const receipt = await response.wait();

					const { gasUsed, effectiveGasPrice } = receipt;
					const gasCost = gasUsed.mul(effectiveGasPrice);

					const endingFundMeBalance = await fundMe.provider.getBalance(
						fundMe.address
					);

					const endingDeployerBalance = await fundMe.provider.getBalance(
						deployer
					);

					assert.equal(endingFundMeBalance, 0);
					assert.equal(
						startingDeployerBalance.add(startingFundMeBalance),
						endingDeployerBalance.add(gasCost).toString()
					);
				});

				it("Withdraw ETH from a single funder", async function() {
					const startingFundMeBalance = await fundMe.provider.getBalance(
						fundMe.address
					);

					const startingDeployerBalance = await fundMe.provider.getBalance(
						deployer
					);

					const response = await fundMe.cheaperWithdraw();
					const receipt = await response.wait();

					const { gasUsed, effectiveGasPrice } = receipt;
					const gasCost = gasUsed.mul(effectiveGasPrice);

					const endingFundMeBalance = await fundMe.provider.getBalance(
						fundMe.address
					);

					const endingDeployerBalance = await fundMe.provider.getBalance(
						deployer
					);

					assert.equal(endingFundMeBalance, 0);
					assert.equal(
						startingDeployerBalance.add(startingFundMeBalance),
						endingDeployerBalance.add(gasCost).toString()
					);
				});

				it("Allows us to withdraw with multiple getFunders", async function() {
					const accounts = await ethers.getSigners();
					for (let i = 1; i < 6; i++) {
						const fundMeConnectedContract = await fundMe.connect(
							accounts[i]
						);
						await fundMeConnectedContract.fund({
							value: sendValue
						});
					}

					const startingFundMeBalance = await fundMe.provider.getBalance(
						fundMe.address
					);

					const startingDeployerBalance = await fundMe.provider.getBalance(
						deployer
					);

					const response = await fundMe.withdraw();
					const receipt = await response.wait();

					const { gasUsed, effectiveGasPrice } = receipt;
					const gasCost = gasUsed.mul(effectiveGasPrice);

					const endingFundMeBalance = await fundMe.provider.getBalance(
						fundMe.address
					);

					const endingDeployerBalance = await fundMe.provider.getBalance(
						deployer
					);

					assert.equal(endingFundMeBalance, 0);
					assert.equal(
						startingFundMeBalance
							.add(startingDeployerBalance)
							.toString(),
						endingDeployerBalance.add(gasCost).toString()
					);

					await expect(fundMe.getFunders(0)).to.be.reverted;

					for (let i = 1; i < 6; i++) {
						assert.equal(
							await fundMe.getAddressToAmountFunded(
								accounts[i].address
							),
							0
						);
					}
				});

				it("Only allows the owner to withdraw", async function() {
					const accounts = await ethers.getSigners();
					const fundMeConnectedContract = await fundMe.connect(
						accounts[1]
					);
					await expect(fundMeConnectedContract.withdraw()).to.be
						.reverted;
				});

				it("cheaper withdraw testing", async function() {
					const accounts = await ethers.getSigners();
					for (let i = 1; i < 6; i++) {
						const fundMeConnectedContract = await fundMe.connect(
							accounts[i]
						);
						await fundMeConnectedContract.fund({
							value: sendValue
						});
					}

					const startingFundMeBalance = await fundMe.provider.getBalance(
						fundMe.address
					);

					const startingDeployerBalance = await fundMe.provider.getBalance(
						deployer
					);

					const response = await fundMe.cheaperWithdraw();
					const receipt = await response.wait();

					const { gasUsed, effectiveGasPrice } = receipt;
					const gasCost = gasUsed.mul(effectiveGasPrice);

					const endingFundMeBalance = await fundMe.provider.getBalance(
						fundMe.address
					);

					const endingDeployerBalance = await fundMe.provider.getBalance(
						deployer
					);

					assert.equal(endingFundMeBalance, 0);
					assert.equal(
						startingFundMeBalance
							.add(startingDeployerBalance)
							.toString(),
						endingDeployerBalance.add(gasCost).toString()
					);

					await expect(fundMe.getFunders(0)).to.be.reverted;

					for (let i = 1; i < 6; i++) {
						assert.equal(
							await fundMe.getAddressToAmountFunded(
								accounts[i].address
							),
							0
						);
					}
				});
			});
	  });
