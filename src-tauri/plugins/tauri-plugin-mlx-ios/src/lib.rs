use tauri::{
    plugin::{Builder, TauriPlugin},
    Manager, Runtime,
};

mod commands;
mod error;
mod models;

pub use commands::*;
pub use error::MlxIosError;

/// Initialises the MLX iOS plugin.
///
/// On iOS this bridges to Swift/MLX via the Tauri mobile plugin system.
/// On non-iOS platforms it is a no-op stub.
pub fn init<R: Runtime>() -> TauriPlugin<R> {
    Builder::new("mlx-ios")
        .invoke_handler(tauri::generate_handler![
            commands::load_model,
            commands::unload_model,
            commands::generate,
            commands::is_model_loaded,
            commands::list_loaded_models,
            commands::get_device_info,
        ])
        .setup(|_app, _api| {
            // Plugin state initialised on first use
            Ok(())
        })
        .build()
}
