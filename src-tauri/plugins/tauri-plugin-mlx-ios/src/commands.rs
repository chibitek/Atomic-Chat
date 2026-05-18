use serde::{Deserialize, Serialize};
use tauri::{command, AppHandle, Runtime};

use crate::error::MlxIosError;
use crate::models::*;

/// Load an MLX model from the app container.
///
/// On iOS this calls into Swift/MLX to load the model weights.
/// On other platforms it returns an error.
#[command]
pub async fn load_model<R: Runtime>(
    _app: AppHandle<R>,
    request: LoadModelRequest,
) -> Result<LoadModelResponse, MlxIosError> {
    #[cfg(target_os = "ios")]
    {
        // Bridge to Swift via objc
        let result = crate::swift::load_model(
            &request.model_id,
            request.model_path.as_deref(),
        )
        .await
        .map_err(|e| MlxIosError::SwiftBridge(e.to_string()))?;

        Ok(LoadModelResponse {
            model_id: request.model_id,
            loaded: result,
        })
    }

    #[cfg(not(target_os = "ios"))]
    {
        Err(MlxIosError::PlatformNotSupported)
    }
}

/// Unload a previously loaded MLX model to free memory.
#[command]
pub async fn unload_model<R: Runtime>(
    _app: AppHandle<R>,
    request: UnloadModelRequest,
) -> Result<UnloadModelResponse, MlxIosError> {
    #[cfg(target_os = "ios")]
    {
        crate::swift::unload_model(&request.model_id)
            .await
            .map_err(|e| MlxIosError::SwiftBridge(e.to_string()))?;

        Ok(UnloadModelResponse {
            model_id: request.model_id,
            unloaded: true,
        })
    }

    #[cfg(not(target_os = "ios"))]
    {
        Err(MlxIosError::PlatformNotSupported)
    }
}

/// Generate text from a loaded MLX model.
///
/// Returns a stream of tokens via Tauri events.
#[command]
pub async fn generate<R: Runtime>(
    app: AppHandle<R>,
    request: GenerateRequest,
) -> Result<GenerateResponse, MlxIosError> {
    #[cfg(target_os = "ios")]
    {
        let channel = request
            .event_channel
            .clone()
            .unwrap_or_else(|| format!("mlx-generate-{}", request.model_id));

        // Spawn generation in background, emit tokens as events
        tokio::spawn(async move {
            let mut stream = crate::swift::generate_stream(
                &request.model_id,
                &request.prompt,
                request.max_tokens,
                request.temperature,
            )
            .await;

            while let Some(token) = stream.next().await {
                let _ = app.emit(&channel, token);
            }
        });

        Ok(GenerateResponse {
            model_id: request.model_id,
            event_channel: channel,
        })
    }

    #[cfg(not(target_os = "ios"))]
    {
        Err(MlxIosError::PlatformNotSupported)
    }
}

/// Check if a model is currently loaded in memory.
#[command]
pub async fn is_model_loaded<R: Runtime>(
    _app: AppHandle<R>,
    request: ModelStatusRequest,
) -> Result<ModelStatusResponse, MlxIosError> {
    #[cfg(target_os = "ios")]
    {
        let loaded = crate::swift::is_model_loaded(&request.model_id)
            .await
            .unwrap_or(false);

        Ok(ModelStatusResponse {
            model_id: request.model_id,
            loaded,
        })
    }

    #[cfg(not(target_os = "ios"))]
    {
        Err(MlxIosError::PlatformNotSupported)
    }
}

/// List all models currently loaded in memory.
#[command]
pub async fn list_loaded_models<R: Runtime>(
    _app: AppHandle<R>,
) -> Result<ListModelsResponse, MlxIosError> {
    #[cfg(target_os = "ios")]
    {
        let models = crate::swift::list_loaded_models()
            .await
            .unwrap_or_default();

        Ok(ListModelsResponse { models })
    }

    #[cfg(not(target_os = "ios"))]
    {
        Err(MlxIosError::PlatformNotSupported)
    }
}

/// Get device info (Neural Engine, RAM, etc.).
#[command]
pub async fn get_device_info<R: Runtime>(
    _app: AppHandle<R>,
) -> Result<DeviceInfoResponse, MlxIosError> {
    #[cfg(target_os = "ios")]
    {
        let info = crate::swift::get_device_info()
            .await
            .map_err(|e| MlxIosError::SwiftBridge(e.to_string()))?;

        Ok(info)
    }

    #[cfg(not(target_os = "ios"))]
    {
        Err(MlxIosError::PlatformNotSupported)
    }
}
