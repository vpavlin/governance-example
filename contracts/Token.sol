// SPDX-License-Identifier: MIT

pragma solidity ^0.8.0;

import "@openzeppelin/contracts/token/ERC20/extensions/ERC20Votes.sol";
import "@openzeppelin/contracts/access/Ownable.sol";


contract VotingTokenExample is ERC20Votes, Ownable {

    constructor() ERC20Permit("VotingExample") ERC20("VotingExample", "VOX") {

    }

    function mint(address to, uint256 amount) public onlyOwner {
        super._mint(to, amount);
        _delegate(to, to);
    }

    function burn(address from, uint256 amount) public onlyOwner {
        super._burn(from, amount);
        _delegate(from, from);
    }

    function _transfer(address from, address to, uint256 amount) internal  pure override {
        revert("Transfers not allowed");
    }


}