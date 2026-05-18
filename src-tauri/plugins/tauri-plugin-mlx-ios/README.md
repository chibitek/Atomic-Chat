/**
 * MLX iOS Plugin
 *
 * On-device MLX inference for iOS via Swift/MLX.
 *
 * ## Setup
 *
 * 1. Add the plugin to your Tauri app:
 *    ```toml
 *    [dependencies]
 *    tauri-plugin-mlx-ios = { path = "./plugins/tauri-plugin-mlx-ios" }
 *    ```
 *
 * 2. Register in `src-tauri/src/lib.rs`:
 *    ```rust
 *    .plugin(tauri_plugin_mlx_ios::init())
 *    ```
 *
 * 3. Add Swift bridge to iOS target:
 *    Copy `Swift/MLXBridge.swift` into your Xcode project under
 *    `gen/apple/Sources/`.
 *
 * 4. Add `mlx-swift` package dependency in Xcode.
 *
 * ## Usage (JavaScript)
 *
 * ```ts
 * import { loadModel, generate, isModelLoaded } from 'tauri-plugin-mlx-ios'
 *
 * await loadModel({ modelId: 'qwen3-1.5b' })
 * const { eventChannel } = await generate({
 *   modelId: 'qwen3-1.5b',
 *   prompt: 'Hello, world!',
 * })
 * ```
 *
 * ## Model Storage
 *
 * Models are stored in the app container:
 *   `Documents/models/{modelId}/`
 *
 * Download models via standard HTTP and extract to this path.
 */
