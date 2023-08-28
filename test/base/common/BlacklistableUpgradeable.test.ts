import { ethers, network, upgrades } from "hardhat";
import { expect } from "chai";
import { Contract, ContractFactory } from "ethers";
import { SignerWithAddress } from "@nomiclabs/hardhat-ethers/dist/src/signer-with-address";
import { loadFixture } from "@nomicfoundation/hardhat-network-helpers";
import { proveTx } from "../../../test-utils/eth";

async function setUpFixture(func: any) {
    if (network.name === "hardhat") {
        return loadFixture(func);
    } else {
        return func();
    }
}

describe("Contract 'BlacklistableUpgradeable'", async () => {
    const EVENT_NAME_BLACKLISTED = "Blacklisted";
    const EVENT_NAME_UNBLACKLISTED = "UnBlacklisted";
    const EVENT_NAME_SELFBLACKLISTED = "SelfBlacklisted";
    const EVENT_NAME_BLACKLISTER_CHANGED = "BlacklisterChanged";
    const EVENT_NAME_TEST_NOT_BLACKLISTED_MODIFIER_SUCCEEDED = "TestNotBlacklistedModifierSucceeded";

    const REVERT_MESSAGE_INITIALIZABLE_CONTRACT_IS_ALREADY_INITIALIZED =
        "Initializable: contract is already initialized";
    const REVERT_MESSAGE_INITIALIZABLE_CONTRACT_IS_NOT_INITIALIZING = "Initializable: contract is not initializing";
    const REVERT_MESSAGE_OWNABLE_CALLER_IS_NOT_THE_OWNER = "Ownable: caller is not the owner";

    const REVERT_ERROR_UNAUTHORIZED_BLACKLISTER = "UnauthorizedBlacklister";
    const REVERT_ERROR_BLACKLISTED_ACCOUNT = "BlacklistedAccount";

    let blacklistableFactory: ContractFactory;

    let deployer: SignerWithAddress;
    let blacklister: SignerWithAddress;
    let user: SignerWithAddress;

    before(async () => {
        [deployer, blacklister, user] = await ethers.getSigners();
        blacklistableFactory = await ethers.getContractFactory("BlacklistableUpgradeableMock");
    });

    async function deployBlacklistable(): Promise<{ blacklistable: Contract }> {
        const blacklistable: Contract = await upgrades.deployProxy(blacklistableFactory);
        await blacklistable.deployed();
        return { blacklistable };
    }

    async function deployAndConfigureBlacklistable(): Promise<{
        blacklistable: Contract;
    }> {
        const { blacklistable } = await deployBlacklistable();
        await proveTx(blacklistable.connect(deployer).setBlacklister(blacklister.address));
        return { blacklistable };
    }

    describe("Function 'initialize()'", async () => {
        it("Configures the contract as expected", async () => {
            const { blacklistable } = await setUpFixture(deployBlacklistable);
            expect(await blacklistable.owner()).to.equal(deployer.address);
            expect(await blacklistable.blacklister()).to.equal(ethers.constants.AddressZero);
        });

        it("Is reverted if called for the second time", async () => {
            const { blacklistable } = await setUpFixture(deployBlacklistable);
            await expect(blacklistable.initialize()).to.be.revertedWith(
                REVERT_MESSAGE_INITIALIZABLE_CONTRACT_IS_ALREADY_INITIALIZED
            );
        });

        it("Is reverted if the implementation contract is called even for the first time", async () => {
            const blacklistableImplementation: Contract = await blacklistableFactory.deploy();
            await blacklistableImplementation.deployed();
            await expect(blacklistableImplementation.initialize()).to.be.revertedWith(
                REVERT_MESSAGE_INITIALIZABLE_CONTRACT_IS_ALREADY_INITIALIZED
            );
        });

        it("Is reverted if the internal initializer is called outside of the init process", async () => {
            const { blacklistable } = await setUpFixture(deployBlacklistable);
            await expect(blacklistable.call_parent_initialize()).to.be.revertedWith(
                REVERT_MESSAGE_INITIALIZABLE_CONTRACT_IS_NOT_INITIALIZING
            );
        });

        it("Is reverted if the internal unchained initializer is called outside of the init process", async () => {
            const { blacklistable } = await setUpFixture(deployBlacklistable);
            await expect(blacklistable.call_parent_initialize_unchained()).to.be.revertedWith(
                REVERT_MESSAGE_INITIALIZABLE_CONTRACT_IS_NOT_INITIALIZING
            );
        });
    });

    describe("Function 'setBlacklister()'", async () => {
        it("Executes as expected and emits the correct event", async () => {
            const { blacklistable } = await setUpFixture(deployBlacklistable);
            expect(await blacklistable.blacklister()).not.to.equal(blacklister.address);
            await expect(blacklistable.connect(deployer).setBlacklister(blacklister.address))
                .to.emit(blacklistable, EVENT_NAME_BLACKLISTER_CHANGED)
                .withArgs(blacklister.address);
            expect(await blacklistable.blacklister()).to.equal(blacklister.address);
            await expect(blacklistable.connect(deployer).setBlacklister(blacklister.address)).not.to.emit(
                blacklistable,
                EVENT_NAME_BLACKLISTER_CHANGED
            );
        });

        it("Is reverted if called not by the owner", async () => {
            const { blacklistable } = await setUpFixture(deployBlacklistable);
            await expect(blacklistable.connect(user).setBlacklister(user.address)).to.be.revertedWith(
                REVERT_MESSAGE_OWNABLE_CALLER_IS_NOT_THE_OWNER
            );
        });
    });

    describe("Function 'blacklist()'", async () => {
        it("Executes as expected and emits the correct event if it is called by the blacklister", async () => {
            const { blacklistable } = await setUpFixture(deployAndConfigureBlacklistable);
            expect(await blacklistable.isBlacklisted(user.address)).to.equal(false);
            await expect(blacklistable.connect(blacklister).blacklist(user.address))
                .to.emit(blacklistable, EVENT_NAME_BLACKLISTED)
                .withArgs(user.address);
            expect(await blacklistable.isBlacklisted(user.address)).to.equal(true);
            await expect(blacklistable.connect(blacklister).blacklist(user.address)).not.to.emit(
                blacklistable,
                EVENT_NAME_BLACKLISTED
            );
        });

        it("Is reverted if called not by the blacklister", async () => {
            const { blacklistable } = await setUpFixture(deployAndConfigureBlacklistable);
            await expect(blacklistable.connect(user).blacklist(user.address)).to.be.revertedWithCustomError(
                blacklistable,
                REVERT_ERROR_UNAUTHORIZED_BLACKLISTER
            );
        });
    });

    describe("Function 'unBlacklist()'", async () => {
        it("Executes as expected and emits the correct event if it is called by the blacklister", async () => {
            const { blacklistable } = await setUpFixture(deployAndConfigureBlacklistable);
            await proveTx(blacklistable.connect(blacklister).blacklist(user.address));
            expect(await blacklistable.isBlacklisted(user.address)).to.equal(true);
            await expect(blacklistable.connect(blacklister).unBlacklist(user.address))
                .to.emit(blacklistable, EVENT_NAME_UNBLACKLISTED)
                .withArgs(user.address);
            expect(await blacklistable.isBlacklisted(user.address)).to.equal(false);
            await expect(blacklistable.connect(blacklister).unBlacklist(user.address)).not.to.emit(
                blacklistable,
                EVENT_NAME_UNBLACKLISTED
            );
        });

        it("Is reverted if called not by the blacklister", async () => {
            const { blacklistable } = await setUpFixture(deployAndConfigureBlacklistable);
            await expect(blacklistable.connect(user).unBlacklist(user.address)).to.be.revertedWithCustomError(
                blacklistable,
                REVERT_ERROR_UNAUTHORIZED_BLACKLISTER
            );
        });
    });

    describe("Function 'selfBlacklist()'", async () => {
        it("Executes as expected and emits the correct events if it is called by any account", async () => {
            const { blacklistable } = await setUpFixture(deployAndConfigureBlacklistable);
            expect(await blacklistable.isBlacklisted(user.address)).to.equal(false);
            await expect(blacklistable.connect(user).selfBlacklist())
                .to.emit(blacklistable, EVENT_NAME_BLACKLISTED)
                .withArgs(user.address)
                .and.to.emit(blacklistable, EVENT_NAME_SELFBLACKLISTED)
                .withArgs(user.address);
            expect(await blacklistable.isBlacklisted(user.address)).to.equal(true);
            await expect(blacklistable.connect(user).selfBlacklist()).not.to.emit(
                blacklistable,
                EVENT_NAME_SELFBLACKLISTED
            );
        });
    });

    describe("Modifier 'notBlacklisted'", async () => {
        it("Is not reverted if the caller is not blacklisted", async () => {
            const { blacklistable } = await setUpFixture(deployAndConfigureBlacklistable);
            await expect(blacklistable.connect(user).testNotBlacklistedModifier()).to.emit(
                blacklistable,
                EVENT_NAME_TEST_NOT_BLACKLISTED_MODIFIER_SUCCEEDED
            );
        });

        it("Is reverted if the caller is blacklisted", async () => {
            const { blacklistable } = await setUpFixture(deployAndConfigureBlacklistable);
            await proveTx(blacklistable.connect(blacklister).blacklist(user.address));
            await expect(blacklistable.connect(user).testNotBlacklistedModifier()).to.be.revertedWithCustomError(
                blacklistable,
                REVERT_ERROR_BLACKLISTED_ACCOUNT
            );
        });
    });
});