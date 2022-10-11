// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PriceConverter.sol";

error FundMe__NotOwner();

/**
 * @title FundMe
 * @author Darius Foodeei
 * @dev This contract allows users to send ETH to the contract and store it.
 * The contract owner can withdraw the funds.
 */
contract FundMe {
	// Type declarations
	using PriceConverter for uint256;

	// State variables
	mapping(address => uint256) public addressToAmountFunded;
	address[] public funders;

	uint256 public constant MINIMUM_USD = 50 * 1e18;
	address public immutable i_owner;
	AggregatorV3Interface public priceFeed;

	// Modifiers
	modifier onlyOwner() {
		if (msg.sender != i_owner) {
			revert FundMe__NotOwner();
		}
		_;
	}

	constructor(address priceFeedAddress) {
		i_owner = msg.sender;
		priceFeed = AggregatorV3Interface(priceFeedAddress);
	}

	receive() external payable {
		fund();
	}

	fallback() external payable {
		fund();
	}

	/**
	 * @dev This function allows users to send ETH to the contract and store it.
	 * The contract owner can withdraw the funds.
	 */
	function fund() public payable {
		require(
			msg.value.getConversionRate(priceFeed) >= MINIMUM_USD,
			"Didn't send enough"
		);
		funders.push(msg.sender);
		addressToAmountFunded[msg.sender] = msg.value;
	}

	function withdraw() public onlyOwner {
		for (
			uint256 funderIndex = 0;
			funderIndex < funders.length;
			funderIndex++
		) {
			address funder = funders[funderIndex];
			addressToAmountFunded[funder] = 0;
		}

		// reset the array
		funders = new address[](0);

		// call
		(bool callSuccess, ) = payable(msg.sender).call{
			value: address(this).balance
		}("");

		require(callSuccess, "Call failed");
	}
}
