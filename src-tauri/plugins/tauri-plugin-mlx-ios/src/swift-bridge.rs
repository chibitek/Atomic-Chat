// swift-bridge.rs
//
// iOS-specific FFI bridge to Swift/MLX.
//
// On non-iOS platforms these are no-op stubs.
// On iOS they link to Swift functions exposed via the `swift-bridge` crate
// or raw C FFI.

#[cfg(target_os = "ios")]
pub mod swift {
    use crate::models::*;
    use std::future::Future;
    use std::pin::Pin;

    // These functions are implemented in Swift and exposed via C FFI.
    // The actual Swift code lives in:
    //   src-tauri/gen/apple/Sources/MLXBridge.swift

    extern "C" {
        fn mlx_ios_load_model(model_id: *const u8, model_path: *const u8) -> i32;
        fn mlx_ios_unload_model(model_id: *const u8) -> i32;
        fn mlx_ios_is_model_loaded(model_id: *const u8) -> i32;
        fn mlx_ios_generate_token(
            model_id: *const u8,
            prompt: *const u8,
            max_tokens: u32,
            temperature: f32,
            callback: extern "C" fn(*const u8, i32),
        ) -> i32;
        fn mlx_ios_get_device_info(buffer: *mut u8, len: usize) -> i32;
    }

    pub async fn load_model(model_id: &str, model_path: Option<&str>) -> Result<bool, String> {
        let id = std::ffi::CString::new(model_id).map_err(|e| e.to_string())?;
        let path = model_path
            .and_then(|p| std::ffi::CString::new(p).ok());

        let result = unsafe {
            mlx_ios_load_model(
                id.as_ptr() as *const u8,
                path.as_ref().map(|p| p.as_ptr() as *const u8).unwrap_or(std::ptr::null()),
            )
        };

        if result == 0 {
            Ok(true)
        } else {
            Err(format!("Failed to load model (code: {})", result))
        }
    }

    pub async fn unload_model(model_id: &str) -> Result<(), String> {
        let id = std::ffi::CString::new(model_id).map_err(|e| e.to_string())?;

        let result = unsafe { mlx_ios_unload_model(id.as_ptr() as *const u8) };

        if result == 0 {
            Ok(())
        } else {
            Err(format!("Failed to unload model (code: {})", result))
        }
    }

    pub async fn is_model_loaded(model_id: &str) -> Result<bool, String> {
        let id = std::ffi::CString::new(model_id).map_err(|e| e.to_string())?;

        let result = unsafe { mlx_ios_is_model_loaded(id.as_ptr() as *const u8) };

        Ok(result != 0)
    }

    pub async fn generate_stream(
        model_id: &str,
        prompt: &str,
        max_tokens: u32,
        temperature: f32,
    ) -> Pin<Box<dyn futures::Stream<Item = GenerationToken> + Send>> {
        // This is a simplified stub. In production you'd use a channel
        // to bridge Swift callbacks into a Rust stream.
        use futures::stream;
        use std::sync::Arc;
        use tokio::sync::mpsc;

        let (tx, mut rx) = mpsc::channel::<GenerationToken>(128);

        // Spawn Swift generation in background
        tokio::spawn(async move {
            // Actual implementation would call mlx_ios_generate_token
            // and forward tokens through the channel
            let _ = tx.send(GenerationToken {
                token: "[MLX iOS generation not yet implemented]".to_string(),
                finished: true,
            }).await;
        });

        Box::pin(stream::unfold(rx, |mut rx| async move {
            rx.recv().await.map(|token| (token, rx))
        }))
    }

    pub async fn get_device_info() -> Result<DeviceInfoResponse, String> {
        let mut buffer = vec![0u8; 1024];

        let result = unsafe {
            mlx_ios_get_device_info(buffer.as_mut_ptr(), buffer.len())
        };

        if result != 0 {
            return Err("Failed to get device info".to_string());
        }

        let json = String::from_utf8(buffer)
            .map_err(|e| e.to_string())?
            .trim_end_matches('\0')
            .to_string();

        serde_json::from_str(&json).map_err(|e| e.to_string())
    }

    pub async fn list_loaded_models() -> Result<Vec<LoadedModel>, String> {
        // TODO: Implement via Swift FFI
        Ok(vec![])
    }
}

#[cfg(not(target_os = "ios"))]
pub mod swift {
    use crate::models::*;
    use std::pin::Pin;

    pub async fn load_model(_model_id: &str, _model_path: Option<&str>) -> Result<bool, String> {
        Err("MLX iOS is only supported on iOS".to_string())
    }

    pub async fn unload_model(_model_id: &str) -> Result<(), String> {
        Err("MLX iOS is only supported on iOS".to_string())
    }

    pub async fn is_model_loaded(_model_id: &str) -> Result<bool, String> {
        Err("MLX iOS is only supported on iOS".to_string())
    }

    pub async fn generate_stream(
        _model_id: &str,
        _prompt: &str,
        _max_tokens: u32,
        _temperature: f32,
    ) -> Pin<Box<dyn futures::Stream<Item = GenerationToken> + Send>> {
        use futures::stream;
        Box::pin(stream::empty())
    }

    pub async fn get_device_info() -> Result<DeviceInfoResponse, String> {
        Err("MLX iOS is only supported on iOS".to_string())
    }

    pub async fn list_loaded_models() -> Result<Vec<LoadedModel>, String> {
        Err("MLX iOS is only supported on iOS".to_string())
    }
}
