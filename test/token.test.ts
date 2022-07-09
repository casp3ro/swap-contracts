/* eslint-disable camelcase */
/* eslint-disable node/no-missing-import */
import { expect, use } from "chai";
import { utils } from "ethers";
import { ethers } from "hardhat";
import "@nomiclabs/hardhat-ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/signers";
import { solidity } from "ethereum-waffle";
import { Token, Token__factory } from "../typechain";

use(solidity);

describe("Token", () => {
  let deployer: SignerWithAddress;
  let Paul: SignerWithAddress;
  let Jones: SignerWithAddress;
  let token: Token;

  const tokenName = "Wrapped Coin";
  const tokenSymbol = "WCN";
  const initalMint = utils.parseEther("10");
  const priceDecimal = 9;

  beforeEach(async () => {
    [deployer, deployer, Paul, Jones] = await ethers.getSigners();

    token = await new Token__factory(deployer).deploy(
      tokenName,
      tokenSymbol,
      priceDecimal,
      initalMint
    );
  });

  it("should return all public variables", async () => {
    const name = await token.name();
    const symbol = await token.symbol();
    const totalSupply = await token.totalSupply();
    const priceDecimal = await token.priceDecimal();

    expect(name).to.equal(tokenName);
    expect(symbol).to.equal(tokenSymbol);
    expect(totalSupply).to.equal(initalMint);
    expect(priceDecimal).to.equal(priceDecimal);
  });

  it("should return correct decimal", async () => {
    const decimal = await token.priceDecimal();
    expect(decimal).to.equal(priceDecimal);
  });

  it("should return proper owner", async () => {
    const getOwner = await token.owner();
    expect(getOwner).to.equal(deployer.address);
  });

  describe("Mint", () => {
    const amountToMint = utils.parseEther("3");
    it("owner can mint token to other adreess", async () => {
      await token.connect(deployer).mint(Paul.address, amountToMint);
      const paulBalance = await token.balanceOf(Paul.address);
      expect(paulBalance).equal(amountToMint);
    });

    it("owner can mint token to themselv", async () => {
      await token.connect(deployer).mint(deployer.address, amountToMint);
      const deployerBalance = await token.balanceOf(deployer.address);
      expect(deployerBalance).equal(amountToMint.add(initalMint));
    });

    it("Ownable: caller is not the owner", async () => {
      await expect(
        token.connect(Paul).mint(Jones.address, amountToMint)
      ).to.be.revertedWith("Ownable: caller is not the owner");
    });
  });
  describe("Burn", () => {
    const amountToMint = utils.parseEther("2");
    beforeEach(async () => {
      await token.connect(deployer).mint(Paul.address, amountToMint);
    });
    it("balanceOf should return correct value ", async () => {
      const paulsAmount = await token.connect(Paul).balanceOf(Paul.address);
      expect(paulsAmount).equal(amountToMint);
    });

    it("owner can burn token", async () => {
      await token.connect(Paul).burn(amountToMint);
      const paulsAmount = await token.connect(Paul).balanceOf(Paul.address);
      expect(paulsAmount).equal(0);
    });

    it("ERC20: burn amount exceeds balance", async () => {
      await expect(token.connect(Jones).burn(amountToMint)).to.be.revertedWith(
        "ERC20: burn amount exceeds balance"
      );
    });
  });

  describe("GetTokens", async () => {
    it("User wants tokens", async () => {
      await token.connect(Jones).getTokens();
      const jonesBalance = await token.balanceOf(Jones.address);
      expect(jonesBalance).equal(1 * 10 ** priceDecimal);
    });
  });
});
