use chrono::{DateTime, Utc};
use serde::{Deserialize, Serialize};

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct Commit {
    pub hash: String,
    pub author: String,
    #[serde(with = "chrono::serde::ts_milliseconds")]
    pub timestamp: DateTime<Utc>,
    pub message: String,
    #[serde(rename = "filesChanged")]
    pub files_changed: Vec<String>,
    #[serde(rename = "repoPath")]
    pub repo_path: String,
    #[serde(rename = "remoteUrl")]
    pub remote_url: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkDay {
    pub date: String,
    pub commits: Vec<Commit>,
    #[serde(rename = "totalCommits")]
    pub total_commits: usize,
    #[serde(rename = "firstCommitTime")]
    pub first_commit_time: Option<String>,
    #[serde(rename = "lastCommitTime")]
    pub last_commit_time: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct WorkSchedule {
    #[serde(rename = "workingDays")]
    pub working_days: Vec<String>,
    #[serde(rename = "gitAuthors", default)]
    pub git_authors: Vec<String>,
    #[serde(rename = "weekendAttribution", default = "default_weekend_attribution")]
    pub weekend_attribution: String,
}

fn default_weekend_attribution() -> String {
    "friday".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIProviderConfig {
    pub command: Option<String>,
    #[serde(rename = "baseUrl")]
    pub base_url: Option<String>,
    #[serde(rename = "apiKey")]
    pub api_key: Option<String>,
    pub model: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIProvider {
    pub id: String,
    #[serde(rename = "type")]
    pub provider_type: String,
    pub name: String,
    pub enabled: bool,
    pub config: AIProviderConfig,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct AIConfig {
    pub providers: Vec<AIProvider>,
    #[serde(rename = "selectedProvider")]
    pub selected_provider: Option<String>,
    #[serde(rename = "customPrompt")]
    pub custom_prompt: Option<String>,
    #[serde(default = "default_verbosity")]
    pub verbosity: String,
}

fn default_verbosity() -> String {
    "normal".to_string()
}

#[derive(Debug, Clone, Serialize, Deserialize)]
pub struct CopySettings {
    #[serde(rename = "includeDayTitle", default = "default_include_day_title")]
    pub include_day_title: bool,
}

fn default_include_day_title() -> bool {
    true
}
