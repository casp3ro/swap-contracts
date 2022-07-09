import { expect, use } from "chai";
import { utils } from "ethers";
import { ethers } from "hardhat";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { solidity } from "ethereum-waffle";
import { Swap, Swap__factory, Token, Token__factory } from "../typechain";
import { baseTokenParams, quoteTokenParams } from "../utils/deploy.helpers";

use(solidity);

describe("Swap", async () => {
  let deployer: SignerWithAddress;
  let Paul: SignerWithAddress;
  let Jones: SignerWithAddress;
  let baseToken: Token;
  let quoteToken: Token;
  let invalidToken: Token;
  let swap: Swap;

  const priceRatio = 2;
  const depositValue = utils.parseEther("1");

  beforeEach(async () => {
    [deployer, deployer, Paul, Jones] = await ethers.getSigners();

    baseToken = await new Token__factory(Paul).deploy(
      baseTokenParams.tokenName,
      baseTokenParams.tokenSymbol,
      baseTokenParams.priceDecimal,
      baseTokenParams.initalMint
    );

    quoteToken = await new Token__factory(Jones).deploy(
      quoteTokenParams.tokenName,
      quoteTokenParams.tokenSymbol,
      quoteTokenParams.priceDecimal,
      quoteTokenParams.initalMint
    );

    invalidToken = await new Token__factory(Paul).deploy(
      baseTokenParams.tokenName,
      baseTokenParams.tokenSymbol,
      baseTokenParams.priceDecimal,
      baseTokenParams.initalMint
    );

    swap = await new Swap__factory(deployer).deploy(
      baseToken.address,
      quoteToken.address,
      priceRatio
    );
  });

  it("check public variables", async () => {
    const _baseTokenAddress = await swap.baseToken();
    const _quoteTokenAddress = await swap.quoteToken();
    const _priceRatioDecimal = await swap.priceRatioDecimal();
    const _priceRatio = await swap.priceRatio();

    expect(_baseTokenAddress).to.equal(baseToken.address);
    expect(_quoteTokenAddress).to.equal(quoteToken.address);
    expect(_priceRatioDecimal).to.equal(9);
    expect(_priceRatio).to.equal(priceRatio);
  });

  describe("deposit", () => {
    it("deposit base token", async () => {
      await baseToken.connect(Paul).approve(swap.address, depositValue);
      const allowanceValue = await baseToken
        .connect(Paul)
        .allowance(Paul.address, swap.address);
      await swap.connect(Paul).deposit(baseToken.address, depositValue);
      const swapBaseTokenBalance = await baseToken.balanceOf(swap.address);
      expect(allowanceValue).equal(depositValue);
      expect(swapBaseTokenBalance).equal(depositValue);
    });
    it("deposit quote token", async () => {
      await quoteToken.connect(Jones).approve(swap.address, depositValue);
      const allowanceValue = await quoteToken
        .connect(Jones)
        .allowance(Jones.address, swap.address);
      await swap.connect(Jones).deposit(quoteToken.address, depositValue);
      const swapQuoteTokenBalance = await quoteToken.balanceOf(swap.address);
      expect(allowanceValue).equal(depositValue);
      expect(swapQuoteTokenBalance).equal(depositValue);
    });

    it("try to deposit invalid token", async () => {
      await expect(
        swap.connect(Paul).deposit(invalidToken.address, depositValue)
      ).to.be.revertedWith("Token address is invalid");
    });

    it("try to deposit token without approve", async () => {
      await expect(
        swap.connect(Paul).deposit(baseToken.address, depositValue)
      ).to.be.revertedWith("ERC20: insufficient allowance");
    });
  });

  describe("updatePriceRatio", () => {
    const _newPriceRatio = 5;
    it("update price as owner", async () => {
      await swap.connect(deployer).updatePriceRatio(_newPriceRatio);
      const newPriceRatio = await swap.priceRatio();
      expect(newPriceRatio).equal(_newPriceRatio);
    });

    it("try to update price as no-owner", async () => {
      await expect(
        swap.connect(Jones).updatePriceRatio(_newPriceRatio)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });

  describe("swap", () => {
    const depositAmount = utils.parseEther("10");
    beforeEach(async () => {
      await baseToken
        .connect(Paul)
        .approve(swap.address, utils.parseEther("100"));
      await swap.connect(Paul).deposit(baseToken.address, depositAmount);

      await quoteToken
        .connect(Jones)
        .approve(swap.address, utils.parseEther("100"));
      await swap.connect(Jones).deposit(quoteToken.address, depositAmount);
    });

    it("baseToken owner want to swap", async () => {
      const swapValue = utils.parseEther("1");
      const initialSwapBaseTokenBalance = await baseToken.balanceOf(
        swap.address
      );
      const initialSwapQuoteTokenBalance = await quoteToken.balanceOf(
        swap.address
      );

      const initialUserBaseTokenBalance = await baseToken.balanceOf(
        Paul.address
      );

      await swap.connect(Paul).swap(baseToken.address, swapValue);

      const afterSwapBaseTokenBalance = await baseToken.balanceOf(swap.address);
      const afterSwapQuoteTokenBalance = await quoteToken.balanceOf(
        swap.address
      );

      const afterUserBaseTokenBalance = await baseToken.balanceOf(Paul.address);
      const afterUserQuoteTokenBalance = await quoteToken.balanceOf(
        Paul.address
      );

      expect(afterSwapBaseTokenBalance).equal(
        initialSwapBaseTokenBalance.add(swapValue)
      );
      expect(afterSwapQuoteTokenBalance).equal(
        initialSwapQuoteTokenBalance.sub(swapValue.div(priceRatio))
      );
      expect(afterUserBaseTokenBalance).equal(
        initialUserBaseTokenBalance.sub(swapValue)
      );

      expect(afterUserQuoteTokenBalance).equal("500000000000000000");
    });

    it("quoteToken owner want to swap", async () => {
      const swapValue = utils.parseEther("1");

      const initialSwapQuoteTokenBalance = await quoteToken.balanceOf(
        swap.address
      );

      const initialUserBaseTokenBalance = await baseToken.balanceOf(
        Jones.address
      );
      const initialUserQuoteTokenBalance = await quoteToken.balanceOf(
        Jones.address
      );

      await swap.connect(Jones).swap(quoteToken.address, swapValue);

      const afterSwapBaseTokenBalance = await baseToken.balanceOf(swap.address);
      const afterSwapQuoteTokenBalance = await quoteToken.balanceOf(
        swap.address
      );

      const afterUserBaseTokenBalance = await baseToken.balanceOf(
        Jones.address
      );
      const afterUserQuoteTokenBalance = await quoteToken.balanceOf(
        Jones.address
      );

      expect(afterSwapBaseTokenBalance).equal("8000000000000000000");

      expect(afterSwapQuoteTokenBalance).equal(
        initialSwapQuoteTokenBalance.add(swapValue)
      );
      expect(afterUserBaseTokenBalance).equal(
        initialUserBaseTokenBalance.add(swapValue.mul(priceRatio))
      );

      expect(afterUserQuoteTokenBalance).equal(
        initialUserQuoteTokenBalance.sub(swapValue)
      );
    });

    it("invalid token", async () => {
      await expect(
        swap.connect(Paul).swap(invalidToken.address, depositValue)
      ).to.be.revertedWith("Token address is invalid");
    });

    it("invalid amount to swap", async () => {
      await expect(
        swap.connect(Paul).swap(baseToken.address, 0)
      ).to.be.revertedWith("Transfer amount exceeds balance");
    });
  });
});
