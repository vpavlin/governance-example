// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/governance/extensions/GovernorCountingSimple.sol";
import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";

contract GovernorExample is GovernorCountingSimple {
    ERC20Votes private _token;
    uint256 private _quorumDenominator = 2;

    constructor(address token) Governor("ExampleGovernor") {
        require(token != address(0), "Voting contract cannot be 0");
        _token = ERC20Votes(token);

    }

    function getVotes(address account, uint256 blockNumber) public view override returns (uint256) {
        return _token.getPastVotes(account, blockNumber);
    }

    function quorum(uint256 blockNumber) public view override returns (uint256) {
        return _token.getPastTotalSupply(blockNumber) / _quorumDenominator;
    }

    function votingDelay() public view override returns (uint256) {
        return 1;
    }

    function votingPeriod() public view override returns (uint256) {
        return 5;
    }

}