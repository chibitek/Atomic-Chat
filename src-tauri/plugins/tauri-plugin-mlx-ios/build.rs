const COMMANDS: &[&str] = &[
    "load_model",
    "unload_model",
    "generate",
    "is_model_loaded",
    "list_loaded_models",
    "get_device_info",
];

fn main() {
    tauri_plugin::Builder::new(COMMANDS)
        .android_path("android")
        .ios_path("ios")
        .build();
}
