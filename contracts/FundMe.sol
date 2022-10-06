// SPDX-License-Identifier: MIT
pragma solidity ^0.8.0;

import "./PriceConverter.sol";

error NotOwner();

contract FundMe {
	using PriceConverter for uint256;
	uint256 public constant MINIMUM_USD = 50 * 1e18;
	address[] public funders;
	mapping(address => uint256) public addressToAmountFunded;
	address public immutable i_owner;
	AggregatorV3Interface public priceFeed;

	constructor(address priceFeedAddress) {
		i_owner = msg.sender;
		priceFeed = AggregatorV3Interface(priceFeedAddress);
	}

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

		// actually withdraw the tokens

		// msg.sender = address
		// payable(msg.sender) = payable address

		// transfer (automatically reverts the trx if the transfer fails)
		// payable(msg.sender).transfer(address(this).balance);

		// send (only reverts the trx if we add a require statement)
		// bool sendSuccess = payable(msg.sender).send(address(this).balance);
		// require(sendSuccess, "Transaction failed, reverted");

		// call
		(bool callSuccess, ) = payable(msg.sender).call{
			value: address(this).balance
		}("");
		require(callSuccess, "Call failed");
	}

	modifier onlyOwner() {
		// require(msg.sender == i_owner, "Sender is not the owner");
		// alternative equivalent to next line : require(msg.sender == i_owner, NotOwner());
		if (msg.sender != i_owner) {
			revert NotOwner();
		} // this saves gas to avoid string storing
		_; // run the rest of the function code
	}

	receive() external payable {
		fund();
	}

	fallback() external payable {
		fund();
	}
}
