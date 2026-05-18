/**
 * Tauri MLX iOS Plugin — Guest JavaScript bindings
 *
 * These functions invoke the Rust Tauri plugin which bridges to Swift/MLX.
 */

import { invoke } from '@tauri-apps/api/core'

export interface LoadModelRequest {
  modelId: string
  modelPath?: string
}

export interface LoadModelResponse {
  modelId: string
  loaded: boolean
}

export interface UnloadModelRequest {
  modelId: string
}

export interface UnloadModelResponse {
  modelId: string
  unloaded: boolean
}

export interface GenerateRequest {
  modelId: string
  prompt: string
  maxTokens?: number
  temperature?: number
  eventChannel?: string
}

export interface GenerateResponse {
  modelId: string
  eventChannel: string
}

export interface ModelStatusRequest {
  modelId: string
}

export interface ModelStatusResponse {
  modelId: string
  loaded: boolean
}

export interface LoadedModel {
  modelId: string
  modelPath: string
  loadedAt: string
}

export interface ListModelsResponse {
  models: LoadedModel[]
}

export interface DeviceInfoResponse {
  deviceName: string
  osVersion: string
  totalRamMb: number
  neuralEngineCores: number
  supportsMlx: boolean
}

/**
 * Load an MLX model into memory.
 */
export async function loadModel(request: LoadModelRequest): Promise<LoadModelResponse> {
  return invoke<LoadModelResponse>('plugin:mlx-ios|load_model', { request })
}

/**
 * Unload a model to free memory.
 */
export async function unloadModel(request: UnloadModelRequest): Promise<UnloadModelResponse> {
  return invoke<UnloadModelResponse>('plugin:mlx-ios|unload_model', { request })
}

/**
 * Generate text from a loaded model.
 * Tokens are streamed via Tauri events on the returned eventChannel.
 */
export async function generate(request: GenerateRequest): Promise<GenerateResponse> {
  return invoke<GenerateResponse>('plugin:mlx-ios|generate', { request })
}

/**
 * Check if a model is currently loaded.
 */
export async function isModelLoaded(request: ModelStatusRequest): Promise<ModelStatusResponse> {
  return invoke<ModelStatusResponse>('plugin:mlx-ios|is_model_loaded', { request })
}

/**
 * List all models currently loaded in memory.
 */
export async function listLoadedModels(): Promise<ListModelsResponse> {
  return invoke<ListModelsResponse>('plugin:mlx-ios|list_loaded_models')
}

/**
 * Get iOS device info (RAM, Neural Engine cores, etc.).
 */
export async function getDeviceInfo(): Promise<DeviceInfoResponse> {
  return invoke<DeviceInfoResponse>('plugin:mlx-ios|get_device_info')
}
