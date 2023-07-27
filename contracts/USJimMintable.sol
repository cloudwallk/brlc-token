// SPDX-License-Identifier: MIT

pragma solidity 0.8.16;

import { ERC20Base } from "./base/ERC20Base.sol";
import { ERC20Mintable } from "./base/ERC20Mintable.sol";
import { ERC20Freezable } from "./base/ERC20Freezable.sol";

/**
 * @title USJimMintable contract
 * @author CloudWalk Inc.
 * @dev The USJim token implementation that supports mint, burn and freeze operations.
 */
contract USJimMintable is ERC20Base, ERC20Mintable, ERC20Freezable {
    /**
     * @dev Constructor that prohibits the initialization of the implementation of the upgradable contract.
     *
     * See details
     * https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable#initializing_the_implementation_contract
     *
     * @custom:oz-upgrades-unsafe-allow constructor
     */
    constructor() {
        _disableInitializers();
    }

    /**
     * @dev The initializer of the upgradable contract.
     *
     * See details https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable .
     *
     * @param name_ The name of the token.
     * @param symbol_ The symbol of the token.
     */
    function initialize(string memory name_, string memory symbol_) external virtual initializer {
        __USJimMintable_init(name_, symbol_);
    }

    /**
     * @dev The internal initializer of the upgradable contract.
     *
     * See {USJimMintable-initialize}.
     */
    function __USJimMintable_init(string memory name_, string memory symbol_) internal onlyInitializing {
        __Context_init_unchained();
        __Ownable_init_unchained();
        __Pausable_init_unchained();
        __PausableExt_init_unchained();
        __Blacklistable_init_unchained();
        __ERC20_init_unchained(name_, symbol_);
        __ERC20Base_init_unchained();
        __ERC20Mintable_init_unchained();
        __ERC20Freezable_init_unchained();
        __USJimMintable_init_unchained();
    }

    /**
     * @dev The internal unchained initializer of the upgradable contract.
     *
     * See {USJimMintable-initialize}.
     */
    function __USJimMintable_init_unchained() internal onlyInitializing {}

    /**
     * @dev Returns true if token is USJim implementation.
     */
    function isUSJim() external pure returns (bool) {
        return true;
    }

    /**
     * @dev See {ERC20Upgradeable-_beforeTokenTransfer}.
     */
    function _beforeTokenTransfer(
        address from,
        address to,
        uint256 amount
    ) internal virtual override(ERC20Base, ERC20Freezable) {
        super._beforeTokenTransfer(from, to, amount);
    }
}
