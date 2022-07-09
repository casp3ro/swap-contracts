import { ethers } from "hardhat";
import { DeployFunction } from "hardhat-deploy/dist/types";
import { HardhatRuntimeEnvironment } from "hardhat/types";
import { Swap, Token } from "../typechain";
import {
  baseTokenParams,
  priceRatio,
  quoteTokenParams,
} from "../utils/deploy.helpers";

const deploy: DeployFunction = async (hre: HardhatRuntimeEnvironment) => {
  const { deployments, getNamedAccounts } = hre;
  const { deploy } = deployments;
  const { deployer } = await getNamedAccounts();

  const baseToken = await deploy("Token", {
    from: deployer,
    args: [
      baseTokenParams.tokenName,
      baseTokenParams.tokenSymbol,
      baseTokenParams.priceDecimal,
      baseTokenParams.initalMint,
    ],
    log: true,
  });

  const quoteToken = await deploy("Token", {
    from: deployer,
    args: [
      quoteTokenParams.tokenName,
      quoteTokenParams.tokenSymbol,
      quoteTokenParams.priceDecimal,
      quoteTokenParams.initalMint,
    ],
    log: true,
  });

  const swap = await deploy("Swap", {
    from: deployer,
    args: [baseToken.address, quoteToken.address, priceRatio],
    log: true,
  });

  const baseTokenInstance = await ethers.getContractAt<Token>(
    "Token",
    baseToken.address
  );
  const quoteTokenInstance = await ethers.getContractAt<Token>(
    "Token",
    quoteToken.address
  );
  const swapInstance = await ethers.getContractAt<Swap>("Swap", swap.address);

  const approveBaseToken = await baseTokenInstance.approve(
    swap.address,
    baseTokenParams.initalMint
  );
  console.log("approveBaseToken", await approveBaseToken.wait());

  const approveQuoteToken = await quoteTokenInstance.approve(
    swap.address,
    quoteTokenParams.initalMint
  );
  console.log("approveQuoteToken", await approveQuoteToken.wait());

  const depositBaseToken = await swapInstance.deposit(
    baseToken.address,
    baseTokenParams.initalMint
  );
  console.log("depositBaseToken", await depositBaseToken.wait());

  const depositQuoteToken = await swapInstance.deposit(
    quoteToken.address,
    quoteTokenParams.initalMint
  );
  console.log("depositQuoteToken", await depositQuoteToken.wait());
};
export default deploy;
deploy.tags = ["CONTRACTS"];
