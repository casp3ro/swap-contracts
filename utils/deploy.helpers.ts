import { utils } from "ethers";

export const baseTokenParams = {
  tokenName: "Base Token",
  tokenSymbol: "BTN",
  initalMint: utils.parseEther("100"),
  priceDecimal: 18,
};

export const quoteTokenParams = {
  tokenName: "Quote Token",
  tokenSymbol: "QTN",
  initalMint: utils.parseEther("100"),
  priceDecimal: 9,
};

export const priceRatio = 2;
