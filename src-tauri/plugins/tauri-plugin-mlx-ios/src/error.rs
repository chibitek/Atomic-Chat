use serde::{Deserialize, Serialize};
use std::fmt;

#[derive(Debug, Clone, Serialize, Deserialize)]
pub enum MlxIosError {
    PlatformNotSupported,
    ModelNotFound(String),
    ModelLoadFailed(String),
    GenerationFailed(String),
    SwiftBridge(String),
    DeviceNotSupported,
    OutOfMemory,
    Unknown(String),
}

impl fmt::Display for MlxIosError {
    fn fmt(&self, f: &mut fmt::Formatter<'_>) -> fmt::Result {
        match self {
            MlxIosError::PlatformNotSupported => {
                write!(f, "MLX iOS is only supported on iOS devices")
            }
            MlxIosError::ModelNotFound(id) => {
                write!(f, "Model not found: {}", id)
            }
            MlxIosError::ModelLoadFailed(msg) => {
                write!(f, "Failed to load model: {}", msg)
            }
            MlxIosError::GenerationFailed(msg) => {
                write!(f, "Generation failed: {}", msg)
            }
            MlxIosError::SwiftBridge(msg) => {
                write!(f, "Swift bridge error: {}", msg)
            }
            MlxIosError::DeviceNotSupported => {
                write!(f, "Device does not support MLX")
            }
            MlxIosError::OutOfMemory => {
                write!(f, "Out of memory — model too large for device")
            }
            MlxIosError::Unknown(msg) => {
                write!(f, "Unknown error: {}", msg)
            }
        }
    }
}

impl std::error::Error for MlxIosError {}
