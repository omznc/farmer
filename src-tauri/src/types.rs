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
#[allow(dead_code)]
pub struct HarvestConfig {
    #[serde(alias = "accessToken")]
    pub access_token: String,
    #[serde(alias = "accountId")]
    pub account_id: String,
    #[serde(alias = "refreshToken")]
    pub refresh_token: Option<String>,
    #[serde(alias = "defaultProjectId")]
    pub default_project_id: i64,
    #[serde(alias = "defaultTaskId")]
    pub default_task_id: i64,
    #[serde(alias = "meetingProjectId")]
    pub meeting_project_id: Option<i64>,
    #[serde(alias = "meetingTaskId")]
    pub meeting_task_id: Option<i64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct HarvestProject {
    pub id: i64,
    pub name: String,
    pub code: Option<String>,
    pub client_id: i64,
    pub client_name: String,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct HarvestTask {
    pub id: i64,
    pub name: String,
    pub billable: bool,
    pub hourly_rate: Option<f64>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct TimeEntry {
    pub id: Option<i64>,
    #[serde(alias = "projectId")]
    pub project_id: i64,
    #[serde(alias = "taskId")]
    pub task_id: i64,
    #[serde(alias = "spentDate")]
    pub spent_date: String,
    pub hours: f32,
    pub notes: String,
    #[serde(alias = "externalReference")]
    pub external_reference: Option<String>,
}

#[derive(Debug, Clone, Serialize, Deserialize)]
#[allow(dead_code)]
pub struct Meeting {
    pub id: String,
    pub title: String,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub start_time: DateTime<Utc>,
    #[serde(with = "chrono::serde::ts_seconds")]
    pub end_time: DateTime<Utc>,
    pub duration_minutes: i32,
    pub calendar_source: String,
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
}
