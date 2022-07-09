// SPDX-License-Identifier: MIT
pragma solidity ^0.8.5;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "hardhat/console.sol";

contract Swap is Ownable {
    using SafeERC20 for ERC20;

    uint8 public priceRatioDecimal = 9;
    address public baseToken;
    address public quoteToken;
    uint256 public priceRatio;

    event Deposited(address depositor, address token, uint256 amount);
    event Swaped(address returnToken, address sender, uint256 amountTo);

    modifier isTokenValid(address _tokenAddress) {
        require(
            _tokenAddress == baseToken || _tokenAddress == quoteToken,
            "Token address is invalid"
        );
        _;
    }

    constructor(
        address _baseToken,
        address _quoteToken,
        uint256 _priceRatio
    ) {
        baseToken = _baseToken;
        quoteToken = _quoteToken;
        priceRatio = _priceRatio;
    }

    function updatePriceRatio(uint256 _priceRatio) public onlyOwner {
        priceRatio = _priceRatio;
    }

    function deposit(address _tokenAddress, uint256 _amount)
        public
        isTokenValid(_tokenAddress)
    {
        ERC20 token = ERC20(_tokenAddress);
        token.safeTransferFrom(msg.sender, address(this), _amount);

        emit Deposited(msg.sender, _tokenAddress, _amount);
    }

    function calculateSwap(
        uint8 _tokenFromDecimals,
        uint8 _tokenToDecimals,
        uint256 _amount,
        bool _isBaseToken
    ) internal view returns (uint256) {
        int8 decimalsDiff = int8(_tokenToDecimals) - int8(_tokenFromDecimals);
        uint256 swapAmount;

        if (_isBaseToken) {
            if (decimalsDiff > 0) {
                swapAmount =
                    (_amount *
                        10**uint8(decimalsDiff + int8(priceRatioDecimal))) /
                    priceRatio;
            } else {
                swapAmount =
                    (_amount * 10**priceRatioDecimal) /
                    (priceRatio * 10**uint8(-decimalsDiff));
            }
        } else {
            if (decimalsDiff - int8(priceRatioDecimal) > 0) {
                swapAmount = (_amount *
                    priceRatio *
                    10**uint8(decimalsDiff - int8(priceRatioDecimal)));
            } else {
                swapAmount = ((_amount * priceRatio) /
                    10**uint8(-(decimalsDiff - int8(priceRatioDecimal))));
            }
        }

        return swapAmount;
    }

    function swap(address _tokenAddress, uint256 _amountFrom)
        public
        isTokenValid(_tokenAddress)
    {
        require(_amountFrom > 0, "Transfer amount exceeds balance");

        ERC20 tokenFrom;
        ERC20 tokenTo;

        bool isBaseToken = _tokenAddress == baseToken;

        if (isBaseToken) {
            tokenFrom = ERC20(baseToken);
            tokenTo = ERC20(quoteToken);
        } else {
            tokenFrom = ERC20(quoteToken);
            tokenTo = ERC20(baseToken);
        }

        uint256 amountTo = calculateSwap(
            tokenFrom.decimals(),
            tokenTo.decimals(),
            _amountFrom,
            isBaseToken
        );

        tokenFrom.safeTransferFrom(msg.sender, address(this), _amountFrom);
        tokenTo.safeTransfer(msg.sender, amountTo);

        emit Swaped(address(tokenTo), msg.sender, amountTo);
    }
}
