import { ethers, network, upgrades } from "hardhat";
import { expect } from "chai";
import { BigNumber, Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";

async function setUpFixture(func: any) {
  if (network.name === "hardhat") {
    return loadFixture(func);
  } else {
    return func();
  }
}

describe("Contract 'InfinitePointsToken'", async () => {
  const TOKEN_NAME = "Infinite Points Coin";
  const TOKEN_SYMBOL = "OOO";
  const TOKEN_DECIMALS = 6;
  const TOTAL_SUPPLY = 1E9 * 1E6;

  const REVERT_MESSAGE_INITIALIZABLE_CONTRACT_IS_ALREADY_INITIALIZED = "Initializable: contract is already initialized";

  let tokenFactory: ContractFactory;
  let deployer: SignerWithAddress;

  before(async () => {
    [deployer] = await ethers.getSigners();
    tokenFactory = await ethers.getContractFactory("InfinitePointsToken");
  });

  async function deployToken(): Promise<{ token: Contract }> {
    const token: Contract = await upgrades.deployProxy(
      tokenFactory,
      [TOKEN_NAME, TOKEN_SYMBOL, TOTAL_SUPPLY]
    );
    await token.deployed();
    return { token };
  }

  describe("Function 'initialize()'", async () => {
    it("Configures the contract as expected", async () => {
      const { token } = await setUpFixture(deployToken);
      expect(await token.owner()).to.equal(deployer.address);
      expect(await token.pauser()).to.equal(ethers.constants.AddressZero);
      expect(await token.rescuer()).to.equal(ethers.constants.AddressZero);
      expect(await token.blacklister()).to.equal(ethers.constants.AddressZero);
      expect(await token.decimals()).to.equal(TOKEN_DECIMALS);
      expect(await token.balanceOf(deployer.address)).to.equal(BigNumber.from(TOTAL_SUPPLY));
    });

    it("Is reverted if called for the second time", async () => {
      const { token } = await setUpFixture(deployToken);
      await expect(
        token.initialize(TOKEN_NAME, TOKEN_SYMBOL, TOTAL_SUPPLY)
      ).to.be.revertedWith(REVERT_MESSAGE_INITIALIZABLE_CONTRACT_IS_ALREADY_INITIALIZED);
    });

    it("Is reverted if the contract implementation is called even for the first time", async () => {
      const infinitePointsImplementation: Contract = await tokenFactory.deploy();
      await infinitePointsImplementation.deployed();
      await expect(
        infinitePointsImplementation.initialize(TOKEN_NAME, TOKEN_SYMBOL, TOTAL_SUPPLY)
      ).to.be.revertedWith(REVERT_MESSAGE_INITIALIZABLE_CONTRACT_IS_ALREADY_INITIALIZED);
    });
  });

  describe("Function 'isInfinitePoints()'", async () => {
    it("Returns true", async () => {
      const { token } = await setUpFixture(deployToken);
      expect(await token.isInfinitePoints()).to.eq(true);
    });
  });
});
