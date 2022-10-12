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
	mapping(address => uint256) private s_addressToAmountFunded;
	address[] private s_funders;
	uint256 public constant MINIMUM_USD = 50 * 1e18;
	address private immutable i_owner;
	AggregatorV3Interface private s_priceFeed;

	// Modifiers
	modifier onlyOwner() {
		if (msg.sender != i_owner) {
			revert FundMe__NotOwner();
		}
		_;
	}

	constructor(address priceFeedAddress) {
		i_owner = msg.sender;
		s_priceFeed = AggregatorV3Interface(priceFeedAddress);
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
			msg.value.getConversionRate(s_priceFeed) >= MINIMUM_USD,
			"Didn't send enough"
		);
		s_funders.push(msg.sender);
		s_addressToAmountFunded[msg.sender] = msg.value;
	}

	function withdraw() public onlyOwner {
		for (
			uint256 funderIndex = 0;
			funderIndex < s_funders.length;
			funderIndex++
		) {
			address funder = s_funders[funderIndex];
			s_addressToAmountFunded[funder] = 0;
		}

		// reset the array
		s_funders = new address[](0);

		// call
		(bool callSuccess, ) = payable(msg.sender).call{
			value: address(this).balance
		}("");

		require(callSuccess, "Call failed");
	}

	function cheaperWithdraw() public payable onlyOwner {
		address[] memory funders = s_funders;

		for (
			uint256 funderIndex = 0;
			funderIndex < funders.length;
			funderIndex++
		) {
			address funder = funders[funderIndex];
			s_addressToAmountFunded[funder] = 0;
		}

		s_funders = new address[](0);
		(bool success, ) = i_owner.call{value: address(this).balance}("");
		require(success, "Call failed");
	}

	function getOwner() public view returns (address) {
		return i_owner;
	}

	function getFunders(uint256 index) public view returns (address) {
		return s_funders[index];
	}

	function getAddressToAmountFunded(address funder)
		public
		view
		returns (uint256)
	{
		return s_addressToAmountFunded[funder];
	}

	function getPriceFeed() public view returns (AggregatorV3Interface) {
		return s_priceFeed;
	}
}
