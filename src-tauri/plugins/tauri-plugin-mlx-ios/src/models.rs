use serde::{Deserialize, Serialize};

// ── Load / Unload ─────────────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct LoadModelRequest {
    pub model_id: String,
    pub model_path: Option<String>,
}

#[derive(Debug, Clone, Serialize)]
pub struct LoadModelResponse {
    pub model_id: String,
    pub loaded: bool,
}

#[derive(Debug, Clone, Deserialize)]
pub struct UnloadModelRequest {
    pub model_id: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct UnloadModelResponse {
    pub model_id: String,
    pub unloaded: bool,
}

// ── Generation ──────────────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct GenerateRequest {
    pub model_id: String,
    pub prompt: String,
    #[serde(default = "default_max_tokens")]
    pub max_tokens: u32,
    #[serde(default = "default_temperature")]
    pub temperature: f32,
    pub event_channel: Option<String>,
}

fn default_max_tokens() -> u32 {
    1024
}

fn default_temperature() -> f32 {
    0.7
}

#[derive(Debug, Clone, Serialize)]
pub struct GenerateResponse {
    pub model_id: String,
    pub event_channel: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct GenerationToken {
    pub token: String,
    pub finished: bool,
}

// ── Status ────────────────────────────────────────────────────────────

#[derive(Debug, Clone, Deserialize)]
pub struct ModelStatusRequest {
    pub model_id: String,
}

#[derive(Debug, Clone, Serialize)]
pub struct ModelStatusResponse {
    pub model_id: String,
    pub loaded: bool,
}

#[derive(Debug, Clone, Serialize)]
pub struct ListModelsResponse {
    pub models: Vec<LoadedModel>,
}

#[derive(Debug, Clone, Serialize)]
pub struct LoadedModel {
    pub model_id: String,
    pub model_path: String,
    pub loaded_at: String,
}

// ── Device Info ───────────────────────────────────────────────────────

#[derive(Debug, Clone, Serialize)]
pub struct DeviceInfoResponse {
    pub device_name: String,
    pub os_version: String,
    pub total_ram_mb: u64,
    pub neural_engine_cores: u32,
    pub supports_mlx: bool,
}
