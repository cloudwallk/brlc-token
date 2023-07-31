// SPDX-License-Identifier: MIT

pragma solidity 0.8.16;

import { ERC20Bridgeable } from "../../base/ERC20Bridgeable.sol";

/**
 * @title ERC20BridgeableMock contract
 * @author CloudWalk Inc.
 * @dev An implementation of the {ERC20Bridgeable} contract for test purposes.
 */
contract ERC20BridgeableMock is ERC20Bridgeable {
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
     * @dev The initialize function of the upgradable contract.
     *
     * See details https://docs.openzeppelin.com/upgrades-plugins/1.x/writing-upgradeable.
     *
     * @param name_ The name of the token to set for this ERC20-comparable contract.
     * @param symbol_ The symbol of the token to set for this ERC20-comparable contract.
     * @param bridge_ The address of a bridge contract to support by this contract.
     */
    function initialize(string memory name_, string memory symbol_, address bridge_) public initializer {
        __ERC20Bridgeable_init(name_, symbol_, bridge_);
    }

    /**
     * @dev Needed to check that the initialize function of the ancestor contract
     * has the 'onlyInitializing' modifier.
     *
     * @param name_ The name of the token to set for this ERC20-comparable contract.
     * @param symbol_ The symbol of the token to set for this ERC20-comparable contract.
     * @param bridge_ The address of a bridge contract to support by this contract.
     */
    function call_parent_initialize(string memory name_, string memory symbol_, address bridge_) public {
        __ERC20Bridgeable_init(name_, symbol_, bridge_);
    }

    /**
     * @dev Needed to check that the unchained initialize function of the ancestor contract
     * has the 'onlyInitializing' modifier.
     *
     * @param bridge_ The address of a bridge contract to support by this contract.
     */
    function call_parent_initialize_unchained(address bridge_) public {
        __ERC20Bridgeable_init_unchained(bridge_);
    }
}
