// MLXBridge.swift
//
// Swift bridge for MLX on-device inference on iOS.
// This file is compiled into the iOS app target and exposes C functions
// that the Rust Tauri plugin calls via FFI.
//
// Place this file in:
//   src-tauri/gen/apple/Sources/MLXBridge.swift
//
// Requirements:
//   - mlx-swift package (https://github.com/ml-explore/mlx-swift)
//   - iOS 17+ (for MLX Swift)

import Foundation
import MLX
import MLXLLM
import MLXRandom

// MARK: - Model Registry

/// In-memory registry of loaded models.
private var loadedModels: [String: LLMModelHolder] = [:]
private let modelLock = NSLock()

private struct LLMModelHolder {
    let model: LLMModel
    let tokenizer: Tokenizer
    let modelPath: String
    let loadedAt: Date
}

// MARK: - C FFI Functions

@_cdecl("mlx_ios_load_model")
public func mlx_ios_load_model(modelIdPtr: UnsafePointer<UInt8>, modelPathPtr: UnsafePointer<UInt8>?) -> Int32 {
    let modelId = String(cString: modelIdPtr)
    let modelPath = modelPathPtr.map { String(cString: $0) }
    
    do {
        try loadModel(modelId: modelId, modelPath: modelPath)
        return 0
    } catch {
        print("[MLXBridge] Failed to load model \(modelId): \(error)")
        return 1
    }
}

@_cdecl("mlx_ios_unload_model")
public func mlx_ios_unload_model(modelIdPtr: UnsafePointer<UInt8>) -> Int32 {
    let modelId = String(cString: modelIdPtr)
    
    modelLock.lock()
    loadedModels.removeValue(forKey: modelId)
    modelLock.unlock()
    
    // Force memory cleanup
    MLX.GC.gc()
    
    return 0
}

@_cdecl("mlx_ios_is_model_loaded")
public func mlx_ios_is_model_loaded(modelIdPtr: UnsafePointer<UInt8>) -> Int32 {
    let modelId = String(cString: modelIdPtr)
    
    modelLock.lock()
    let loaded = loadedModels[modelId] != nil
    modelLock.unlock()
    
    return loaded ? 1 : 0
}

@_cdecl("mlx_ios_generate_token")
public func mlx_ios_generate_token(
    modelIdPtr: UnsafePointer<UInt8>,
    promptPtr: UnsafePointer<UInt8>,
    maxTokens: UInt32,
    temperature: Float,
    callback: @escaping @convention(c) (UnsafePointer<UInt8>?, Int32) -> Void
) -> Int32 {
    let modelId = String(cString: modelIdPtr)
    let prompt = String(cString: promptPtr)
    
    modelLock.lock()
    guard let holder = loadedModels[modelId] else {
        modelLock.unlock()
        return 1
    }
    let model = holder.model
    let tokenizer = holder.tokenizer
    modelLock.unlock()
    
    // Run generation on background thread
    DispatchQueue.global(qos: .userInitiated).async {
        do {
            let tokens = try generateTokens(
                model: model,
                tokenizer: tokenizer,
                prompt: prompt,
                maxTokens: Int(maxTokens),
                temperature: Double(temperature)
            )
            
            for token in tokens {
                let tokenStr = token.cString(using: .utf8)
                if let ptr = tokenStr {
                    callback(ptr, 0) // 0 = not finished
                }
            }
            
            // Signal completion
            callback(nil, 1) // 1 = finished
            
        } catch {
            let errorStr = "Error: \(error.localizedDescription)".cString(using: .utf8)
            if let ptr = errorStr {
                callback(ptr, -1) // -1 = error
            }
        }
    }
    
    return 0
}

@_cdecl("mlx_ios_get_device_info")
public func mlx_ios_get_device_info(buffer: UnsafeMutablePointer<UInt8>, length: Int) -> Int32 {
    let info: [String: Any] = [
        "device_name": UIDevice.current.name,
        "os_version": UIDevice.current.systemVersion,
        "total_ram_mb": getTotalRAM(),
        "neural_engine_cores": getNeuralEngineCores(),
        "supports_mlx": true
    ]
    
    do {
        let jsonData = try JSONSerialization.data(withJSONObject: info)
        let jsonString = String(data: jsonData, encoding: .utf8) ?? "{}"
        let cString = jsonString.cString(using: .utf8) ?? []
        
        let copyLength = min(cString.count, length)
        for i in 0..<copyLength {
            buffer[i] = UInt8(cString[i])
        }
        if copyLength < length {
            buffer[copyLength] = 0
        }
        
        return 0
    } catch {
        return 1
    }
}

// MARK: - Internal Helpers

private func loadModel(modelId: String, modelPath: String?) throws {
    // Determine model path
    let path: String
    if let explicitPath = modelPath {
        path = explicitPath
    } else {
        // Default to app documents directory
        let docsDir = FileManager.default.urls(for: .documentDirectory, in: .userDomainMask).first!
        path = docsDir.appendingPathComponent("models/\(modelId)").path
    }
    
    // Load model weights and config
    let config = try LLMModelConfiguration(directory: URL(fileURLWithPath: path))
    let model = try loadModel(configuration: config)
    let tokenizer = try loadTokenizer(directory: URL(fileURLWithPath: path))
    
    modelLock.lock()
    loadedModels[modelId] = LLMModelHolder(
        model: model,
        tokenizer: tokenizer,
        modelPath: path,
        loadedAt: Date()
    )
    modelLock.unlock()
}

private func generateTokens(
    model: LLMModel,
    tokenizer: Tokenizer,
    prompt: String,
    maxTokens: Int,
    temperature: Double
) throws -> [String] {
    // Tokenize prompt
    let inputTokens = tokenizer.encode(text: prompt)
    
    // Generate
    var tokens: [String] = []
    var currentTokens = inputTokens
    
    MLXRandom.seed(UInt64(Date().timeIntervalSince1970))
    
    for _ in 0..<maxTokens {
        // Forward pass
        let logits = model(currentTokens)
        
        // Sample with temperature
        let nextToken = sample(logits: logits, temperature: temperature)
        
        // Check for EOS
        if nextToken == tokenizer.eosTokenId {
            break
        }
        
        // Decode token
        let tokenText = tokenizer.decode(tokens: [nextToken])
        tokens.append(tokenText)
        
        // Update context
        currentTokens.append(nextToken)
        
        // Trim context window if needed (keep last 2048 tokens)
        if currentTokens.count > 2048 {
            currentTokens = Array(currentTokens.suffix(2048))
        }
    }
    
    return tokens
}

private func sample(logits: MLXArray, temperature: Double) -> Int {
    if temperature == 0 {
        return argMax(logits).item()
    }
    
    let scaled = logits / temperature
    let probs = softMax(scaled)
    return categorical(probs).item()
}

private func getTotalRAM() -> UInt64 {
    let physicalMemory = ProcessInfo.processInfo.physicalMemory
    return physicalMemory / (1024 * 1024) // MB
}

private func getNeuralEngineCores() -> UInt32 {
    // This is approximate; actual detection requires IOKit
    let device = UIDevice.current
    if device.userInterfaceIdiom == .phone {
        // iPhone 15 Pro+ have 16-core Neural Engine
        // iPhone 17 Pro Max has enhanced Neural Engine
        return 16
    }
    return 8
}

// MARK: - Type Aliases (simplified for bridge)

typealias LLMModel = any LanguageModel
typealias Tokenizer = any TokenizerProtocol

protocol LanguageModel {
    func callAsFunction(_ tokens: [Int]) -> MLXArray
}

protocol TokenizerProtocol {
    var eosTokenId: Int { get }
    func encode(text: String) -> [Int]
    func decode(tokens: [Int]) -> String
}

// These would be replaced with actual MLX Swift types
// when the mlx-swift package is integrated.
struct MLXArray {
    // Placeholder
}

func argMax(_ array: MLXArray) -> MLXArray { MLXArray() }
func softMax(_ array: MLXArray) -> MLXArray { MLXArray() }
func categorical(_ array: MLXArray) -> MLXArray { MLXArray() }

struct LLMModelConfiguration {
    let directory: URL
    init(directory: URL) { self.directory = directory }
}

func loadModel(configuration: LLMModelConfiguration) throws -> LLMModel {
    // Placeholder — actual implementation uses MLX Swift
    struct DummyModel: LanguageModel {
        func callAsFunction(_ tokens: [Int]) -> MLXArray { MLXArray() }
    }
    return DummyModel()
}

func loadTokenizer(directory: URL) throws -> Tokenizer {
    // Placeholder — actual implementation uses MLX Swift
    struct DummyTokenizer: TokenizerProtocol {
        var eosTokenId: Int { 2 }
        func encode(text: String) -> [Int] { [] }
        func decode(tokens: [Int]) -> String { "" }
    }
    return DummyTokenizer()
}
