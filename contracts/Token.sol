// SPDX-License-Identifier: MIT
pragma solidity ^0.8.5;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract Token is ERC20, Ownable {
    uint8 public priceDecimal;
    string public tokenName;
    string public tokenSymbol;

    constructor(
        string memory _tokenName,
        string memory _tokenSymbol,
        uint8 _priceDecimal,
        uint256 _initialSupply
    ) ERC20(_tokenName, _tokenSymbol) {
        tokenName = _tokenName;
        tokenSymbol = _tokenSymbol;
        priceDecimal = _priceDecimal;
        _mint(msg.sender, _initialSupply);
    }

    function mint(address _to, uint256 _amount) public onlyOwner {
        _mint(_to, _amount);
    }

    function getTokens() public {
        _mint(msg.sender, (1 * 10**priceDecimal));
    }

    function burn(uint256 _amount) public {
        _burn(msg.sender, _amount);
    }

    function decimals() public view override returns (uint8) {
        return priceDecimal;
    }
}
