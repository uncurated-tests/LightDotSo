// Copyright (C) 2023 Light, Inc.
//
// This program is free software: you can redistribute it and/or modify
// it under the terms of the GNU Affero General Public License as published by
// the Free Software Foundation, either version 3 of the License, or
// (at your option) any later version.
//
// This program is distributed in the hope that it will be useful,
// but WITHOUT ANY WARRANTY; without even the implied warranty of
// MERCHANTABILITY or FITNESS FOR A PARTICULAR PURPOSE.  See the
// GNU Affero General Public License for more details.
//
// You should have received a copy of the GNU Affero General Public License
// along with this program.  If not, see <http://www.gnu.org/licenses/>.

// SPDX-License-Identifier: MIT

pragma solidity ^0.8.18;

// From: https://github.com/zerodevapp/kernel/blob/daae3e246f628645a0c52db48710f025ca723189/test/foundry/ERC4337Utils.sol
// Thank you to the awesome folks at ZeroDev for this utility library!
// License: MIT

import {ECDSA} from "@openzeppelin/contracts/utils/cryptography/ECDSA.sol";
import {Vm} from "forge-std/Test.sol";
import {EntryPoint} from "@/contracts/core/EntryPoint.sol";
import {UserOperation} from "@/contracts/LightWallet.sol";
import {ERC4337Utils} from "@/test/utils/ERC4337Utils.sol";
import {LightWalletUtils} from "@/test/utils/LightWalletUtils.sol";

using ERC4337Utils for EntryPoint;

/// @notice Utility functions for ERC4337
library ERC4337Utils {
    // -------------------------------------------------------------------------
    // Internal Functions
    // -------------------------------------------------------------------------

    /// @dev Fills a UserOperation with default values
    /// @param _entryPoint The entry point contract
    /// @param _account The account to fill the UserOperation with
    /// @param _data The data to fill the UserOperation with
    function fillUserOp(EntryPoint _entryPoint, address _account, bytes memory _data)
        internal
        view
        returns (UserOperation memory op)
    {
        op.sender = _account;
        op.nonce = _entryPoint.getNonce(_account, 0);
        op.callData = _data;
        op.callGasLimit = 10000000;
        op.verificationGasLimit = 10000000;
        op.preVerificationGas = 50000;
        op.maxFeePerGas = 50000;
        op.maxPriorityFeePerGas = 1;
    }

    /// @dev Signs the hash of a UserOperation
    /// @param _entryPoint The entry point contract
    /// @param _vm The VM contract
    /// @param _key The user's private key to sign the UserOperation with
    /// @param _op The UserOperation to sign
    function signUserOp(EntryPoint _entryPoint, Vm _vm, uint256 _key, UserOperation memory _op)
        internal
        view
        returns (bytes memory signature)
    {
        bytes32 hash = _entryPoint.getUserOpHash(_op);
        (uint8 v, bytes32 r, bytes32 s) = _vm.sign(_key, ECDSA.toEthSignedMessageHash(hash));
        signature = abi.encodePacked(r, s, v);
    }

    /// @dev Signs a UserOperation with a user's key
    /// @param _entryPoint The entry point contract
    /// @param _vm The VM contract
    /// @param _account The account to sign the UserOperation with
    /// @param _data The data to fill the UserOperation with
    /// @param _key The user's private key to sign the UserOperation with
    /// @param _initCode The initialization code for the user operation (optional parameter)
    /// @param _weight The weight for the signature
    /// @param _threshold The threshold for the signature
    /// @param _checkpoint The checkpoint for the signature
    function signPackUserOp(
        EntryPoint _entryPoint,
        Vm _vm,
        address _account,
        bytes memory _data,
        uint256 _key,
        bytes memory _initCode,
        uint8 _weight,
        uint16 _threshold,
        uint32 _checkpoint
    ) internal view returns (UserOperation memory op) {
        // Example UserOperation to update the account to immutable address one
        op = _entryPoint.fillUserOp(address(_account), _data);

        // Set the initCode from the params
        if (_initCode.length > 0) {
            op.initCode = _initCode;
        }
        // Get the hash of the UserOperation
        bytes32 userOphash = _entryPoint.getUserOpHash(op);

        // Sign the hash
        bytes memory sig = LightWalletUtils.signDigest(_vm, userOphash, _account, _key);

        // Pack the signature
        bytes memory signature = LightWalletUtils.packLegacySignature(sig, _weight, _threshold, _checkpoint);
        op.signature = signature;
    }

    /// @dev Signs a UserOperation with a user's key
    /// @param _entryPoint The entry point contract
    /// @param _vm The VM contract
    /// @param _account The account to sign the UserOperation with
    /// @param _data The data to fill the UserOperation with
    /// @param _key The user's private key to sign the UserOperation with
    /// @param _initCode The initialization code for the user operation (optional parameter)
    /// @param _weight The weight for the signature
    /// @param _threshold The threshold for the signature
    /// @param _checkpoint The checkpoint for the signature
    function signPackUserOps(
        EntryPoint _entryPoint,
        Vm _vm,
        address _account,
        bytes memory _data,
        uint256 _key,
        bytes memory _initCode,
        uint8 _weight,
        uint16 _threshold,
        uint32 _checkpoint
    ) internal view returns (UserOperation[] memory ops) {
        // Pack the UserOperation
        ops = new UserOperation[](1);
        ops[0] = signPackUserOp(_entryPoint, _vm, _account, _data, _key, _initCode, _weight, _threshold, _checkpoint);
    }
}
