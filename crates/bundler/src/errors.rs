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

// Entire file borrowed from Rundler: https://github.com/alchemyplatform/rundler/blob/22fc250166cf525596faa9db84f5f56ca945a40b/crates/rpc/src/eth/error.rs
// Alsoe here: https://github.com/alchemyplatform/rundler/blob/22fc250166cf525596faa9db84f5f56ca945a40b/crates/rpc/src/error.rs
// License: GPL-3.0

use ethers::{
    providers::ProviderError,
    types::{Address, Opcode, U256},
};
use jsonrpsee::types::{
    error::{CALL_EXECUTION_FAILED_CODE, INTERNAL_ERROR_CODE, INVALID_PARAMS_CODE},
    ErrorObject, ErrorObjectOwned,
};
use rundler_sim::{PrecheckViolation, SimulationViolation};
use rundler_types::{Entity, EntityType, Timestamp};
use serde::Serialize;

pub(crate) fn rpc_err(code: i32, msg: impl Into<String>) -> ErrorObjectOwned {
    create_rpc_err(code, msg, None::<()>)
}

pub(crate) fn rpc_err_with_data<S: Serialize>(
    code: i32,
    msg: impl Into<String>,
    data: S,
) -> ErrorObjectOwned {
    create_rpc_err(code, msg, Some(data))
}

fn create_rpc_err<S: Serialize>(
    code: i32,
    msg: impl Into<String>,
    data: Option<S>,
) -> ErrorObjectOwned {
    ErrorObject::owned(code, msg.into(), data)
}

// Error codes borrowed from jsonrpsee
// INVALID_REQUEST_CODE = -32600
// INVALID_PARAMS_CODE = -32602
// INTERNAL_ERROR_CODE = -32603

// Custom ERC-4337 error codes
const ENTRYPOINT_VALIDATION_REJECTED_CODE: i32 = -32500;
const PAYMASTER_VALIDATION_REJECTED_CODE: i32 = -32501;
const OPCODE_VIOLATION_CODE: i32 = -32502;
const OUT_OF_TIME_RANGE_CODE: i32 = -32503;
const THROTTLED_OR_BANNED_CODE: i32 = -32504;
const STAKE_TOO_LOW_CODE: i32 = -32505;
const UNSUPORTED_AGGREGATOR_CODE: i32 = -32506;
const SIGNATURE_CHECK_FAILED_CODE: i32 = -32507;
const EXECUTION_REVERTED: i32 = -32521;

pub type EthResult<T> = Result<T, EthRpcError>;

/// Error returned by the RPC server eth namespace
#[derive(Debug, thiserror::Error)]
pub enum EthRpcError {
    #[error(transparent)]
    Internal(#[from] anyhow::Error),
    /// Invalid parameters
    #[error("{0}")]
    InvalidParams(String),
    /// Validation rejected the operation in entrypoint or during
    /// wallet creation or validation
    #[error("{0}")]
    EntryPointValidationRejected(String),
    /// Paymaster rejected the operation
    #[error("{}", .0.reason)]
    PaymasterValidationRejected(PaymasterValidationRejectedData),
    /// Opcode violation
    #[error("{0} uses banned opcode: {1:?}")]
    OpcodeViolation(EntityType, Opcode),
    /// Used for other simulation violations that map to Opcode Violations
    #[error("{0}")]
    OpcodeViolationMap(SimulationViolation),
    /// Invalid storage access, maps to Opcode Violation
    #[error("{0} accesses inaccessible storage at address: {1:?} slot: {2:#032x}")]
    InvalidStorageAccess(EntityType, Address, U256),
    /// Operation is out of time range
    #[error("operation is out of time range")]
    OutOfTimeRange(OutOfTimeRangeData),
    /// Entity throttled or banned
    #[error("entity throttled or banned")]
    ThrottledOrBanned(Entity),
    /// Entity stake/unstake delay too low
    #[error("entity stake/unstake delay too low")]
    StakeTooLow(StakeTooLowData),
    /// Unsupported aggregator
    #[error("unsupported aggregator")]
    UnsupportedAggregator(UnsupportedAggregatorData),
    /// Replacement underpriced
    #[error("replacement underpriced")]
    ReplacementUnderpriced(ReplacementUnderpricedData),
    /// Operation already known
    #[error("already known")]
    OperationAlreadyKnown,
    /// Other internal errors
    #[error("Invalid UserOp signature or paymaster signature")]
    SignatureCheckFailed,
    #[error("precheck failed: {0}")]
    PrecheckFailed(PrecheckViolation),
    #[error("validation simulation failed: {0}")]
    SimulationFailed(SimulationViolation),
    #[error("{0}")]
    ExecutionReverted(String),
    #[error("operation rejected by mempool: {0}")]
    OperationRejected(String),
}

#[derive(Debug, Clone, Serialize)]
pub struct PaymasterValidationRejectedData {
    pub paymaster: Address,
    #[serde(skip_serializing)] // this is included in the message
    pub reason: String,
}

#[derive(Debug, Clone, Copy, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct OutOfTimeRangeData {
    pub valid_until: Timestamp,
    pub valid_after: Timestamp,
    pub paymaster: Option<Address>,
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct StakeTooLowData {
    entity: Entity,
    minimum_stake: U256,
    minimum_unstake_delay: U256,
}

impl StakeTooLowData {
    pub fn new(entity: Entity, minimum_stake: U256, minimum_unstake_delay: U256) -> Self {
        Self { entity, minimum_stake, minimum_unstake_delay }
    }
}

#[derive(Debug, Clone, Serialize)]
#[serde(rename_all = "camelCase")]
pub struct ReplacementUnderpricedData {
    pub current_max_priority_fee: U256,
    pub current_max_fee: U256,
}

impl ReplacementUnderpricedData {
    pub fn new(current_max_priority_fee: U256, current_max_fee: U256) -> Self {
        Self { current_max_priority_fee, current_max_fee }
    }
}

#[derive(Debug, Clone, Copy, Serialize)]
pub struct UnsupportedAggregatorData {
    pub aggregator: Address,
}

impl From<PrecheckViolation> for EthRpcError {
    fn from(value: PrecheckViolation) -> Self {
        Self::PrecheckFailed(value)
    }
}

impl From<SimulationViolation> for EthRpcError {
    fn from(value: SimulationViolation) -> Self {
        match value {
            SimulationViolation::InvalidSignature => Self::SignatureCheckFailed,
            SimulationViolation::UnintendedRevertWithMessage(
                EntityType::Paymaster,
                reason,
                Some(paymaster),
            ) => Self::PaymasterValidationRejected(PaymasterValidationRejectedData {
                paymaster,
                reason,
            }),
            SimulationViolation::UnintendedRevertWithMessage(_, reason, _) => {
                Self::EntryPointValidationRejected(reason)
            }
            SimulationViolation::UsedForbiddenOpcode(entity, _, op) => {
                Self::OpcodeViolation(entity.kind, op.0)
            }
            SimulationViolation::UsedForbiddenPrecompile(_, _, _) |
            SimulationViolation::AccessedUndeployedContract(_, _) |
            SimulationViolation::CalledBannedEntryPointMethod(_) |
            SimulationViolation::CallHadValue(_) => Self::OpcodeViolationMap(value),
            SimulationViolation::FactoryCalledCreate2Twice(_) => {
                Self::OpcodeViolation(EntityType::Factory, Opcode::CREATE2)
            }
            SimulationViolation::InvalidStorageAccess(entity, slot) => {
                Self::InvalidStorageAccess(entity.kind, slot.address, slot.slot)
            }
            SimulationViolation::NotStaked(entity, min_stake, min_unstake_delay) => {
                Self::StakeTooLow(StakeTooLowData::new(entity, min_stake, min_unstake_delay))
            }
            SimulationViolation::AggregatorValidationFailed => Self::SignatureCheckFailed,
            _ => Self::SimulationFailed(value),
        }
    }
}

impl From<EthRpcError> for ErrorObjectOwned {
    fn from(error: EthRpcError) -> Self {
        let msg = error.to_string();

        match error {
            EthRpcError::Internal(_) => rpc_err(INTERNAL_ERROR_CODE, msg),
            EthRpcError::InvalidParams(_) => rpc_err(INVALID_PARAMS_CODE, msg),
            EthRpcError::EntryPointValidationRejected(_) => {
                rpc_err(ENTRYPOINT_VALIDATION_REJECTED_CODE, msg)
            }
            EthRpcError::PaymasterValidationRejected(data) => {
                rpc_err_with_data(PAYMASTER_VALIDATION_REJECTED_CODE, msg, data)
            }
            EthRpcError::OpcodeViolation(_, _) |
            EthRpcError::OpcodeViolationMap(_) |
            EthRpcError::InvalidStorageAccess(_, _, _) => rpc_err(OPCODE_VIOLATION_CODE, msg),
            EthRpcError::OutOfTimeRange(data) => {
                rpc_err_with_data(OUT_OF_TIME_RANGE_CODE, msg, data)
            }
            EthRpcError::ThrottledOrBanned(data) => {
                rpc_err_with_data(THROTTLED_OR_BANNED_CODE, msg, data)
            }
            EthRpcError::StakeTooLow(data) => rpc_err_with_data(STAKE_TOO_LOW_CODE, msg, data),
            EthRpcError::UnsupportedAggregator(data) => {
                rpc_err_with_data(UNSUPORTED_AGGREGATOR_CODE, msg, data)
            }
            EthRpcError::ReplacementUnderpriced(data) => {
                rpc_err_with_data(INVALID_PARAMS_CODE, msg, data)
            }
            EthRpcError::OperationAlreadyKnown => rpc_err(INVALID_PARAMS_CODE, msg),
            EthRpcError::SignatureCheckFailed => rpc_err(SIGNATURE_CHECK_FAILED_CODE, msg),
            EthRpcError::PrecheckFailed(_) => rpc_err(CALL_EXECUTION_FAILED_CODE, msg),
            EthRpcError::SimulationFailed(_) => rpc_err(CALL_EXECUTION_FAILED_CODE, msg),
            EthRpcError::ExecutionReverted(_) => rpc_err(EXECUTION_REVERTED, msg),
            EthRpcError::OperationRejected(_) => rpc_err(INVALID_PARAMS_CODE, msg),
        }
    }
}

impl From<ProviderError> for EthRpcError {
    fn from(e: ProviderError) -> Self {
        EthRpcError::Internal(anyhow::anyhow!("provider error: {e:?}"))
    }
}
