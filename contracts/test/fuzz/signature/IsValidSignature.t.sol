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

// SPDX-License-Identifier: AGPL-3.0-or-later

pragma solidity ^0.8.18;

import {BaseFuzzTest} from "@/test/base/BaseFuzzTest.t.sol";
import {LightWalletFactory} from "@/contracts/LightWalletFactory.sol";
import {LightWalletUtils} from "@/test/utils/LightWalletUtils.sol";

/// @notice Fuzz tests for `LightWallet` for compatibility w/ ERC-1271
contract ERC1271FuzzTest is BaseFuzzTest {
    // -------------------------------------------------------------------------
    // Tests
    // -------------------------------------------------------------------------

    /// Tests that the factory supports EIP-1271 and EIP-6492 w/ the account
    function testFuzz_isValidSignature_eip_1271_6492(bytes memory message) public {
        // Hash of the message
        bytes32 hashed = keccak256(message);

        // Sign the hash
        bytes memory sig = LightWalletUtils.signDigest(vm, hashed, address(account), userKey);

        // Pack the signature
        bytes memory signature = LightWalletUtils.packLegacySignature(sig, weight, threshold, checkpoint);

        // Test the signature w/ EIP-1271
        assertEq(account.isValidSignature(hashed, signature), bytes4(0x1626ba7e));

        // Test the signature w/ EIP-6492
        assertEq(validator.isValidSigImpl(address(account), hashed, signature, false, false), true);
        assertEq(validator.isValidSigWithSideEffects(address(account), hashed, signature), true);
        assertEq(validator.isValidSig(address(account), hashed, signature), true);
    }

    /// Tests that a predeployed contract complies w/ EIP-6492
    function testFuzz_isValidSignature_predeployed_6492(bytes memory message) public {
        // Obtain the original signature w/ the EOA by the user
        bytes32 hashed = keccak256(message);

        // Sign the hash
        bytes memory sig = LightWalletUtils.signDigest(vm, hashed, address(account), userKey);

        // Pack the signature
        bytes memory signature = LightWalletUtils.packLegacySignature(sig, weight, threshold, checkpoint);

        // Concat the signature w/ the EIP-6492 detection suffix because of the predeployed contract
        // concat(abi.encode((create2Factory, factoryCalldata, originalERC1271Signature), (address, bytes, bytes)), magicBytes)
        bytes memory sig_6492 = abi.encodePacked(
            abi.encode(
                // Nonce is 1 (does not exist)
                address(factory),
                abi.encodeWithSelector(LightWalletFactory.createAccount.selector, expectedImageHash, nonce),
                signature
            ),
            ERC6492_DETECTION_SUFFIX
        );

        // Test the signature w/ EIP-6492
        assertEq(validator.isValidSigImpl(address(account), hashed, sig_6492, false, false), true);
        assertEq(validator.isValidSigWithSideEffects(address(account), hashed, sig_6492), true);
        assertEq(validator.isValidSig(address(account), hashed, sig_6492), true);
    }
}
