mod git_analysis;
mod types;

use types::*;
use serde_json;
use std::fs;
use std::path::PathBuf;

#[tauri::command]
fn greet(name: &str) -> String {
    format!("Hello, {}! You've been greeted from Rust!", name)
}

#[tauri::command]
async fn analyze_repository(repo_path: String, git_authors: Vec<String>) -> Result<Vec<WorkDay>, String> {
    git_analysis::analyze_repository(repo_path, git_authors)
}

#[tauri::command]
async fn get_work_days(repo_path: String) -> Result<Vec<WorkDay>, String> {
    git_analysis::get_work_days(repo_path, vec![])
}

#[tauri::command]
async fn save_settings(
    work_schedule: Option<WorkSchedule>,
    ai_config: Option<AIConfig>,
    repo_path: Option<String>,
    repo_history: Option<Vec<String>>,
    active_repos: Option<Vec<String>>,
    filter_by_git_authors: Option<bool>,
    copy_settings: Option<CopySettings>,
) -> Result<(), String> {
    let settings_path = get_settings_path()?;

    let settings_data = serde_json::json!({
        "workSchedule": work_schedule,
        "aiConfig": ai_config,
        "repoPath": repo_path,
        "repoHistory": repo_history,
        "activeRepos": active_repos,
        "filterByGitAuthors": filter_by_git_authors,
        "copySettings": copy_settings,
    });

    fs::write(
        settings_path,
        serde_json::to_string_pretty(&settings_data).map_err(|e| e.to_string())?,
    )
    .map_err(|e| format!("Failed to save settings: {}", e))?;

    Ok(())
}

#[tauri::command]
async fn load_settings() -> Result<serde_json::Value, String> {
    let settings_path = get_settings_path()?;

    if !settings_path.exists() {
        return Ok(serde_json::json!({
            "workSchedule": null,
            "repoPath": null,
            "currentView": "repository"
        }));
    }

    let content = fs::read_to_string(&settings_path)
        .map_err(|e| format!("Failed to read settings: {}", e))?;

    serde_json::from_str(&content).map_err(|e| format!("Failed to parse settings: {}", e))
}

#[tauri::command]
async fn get_git_config() -> Result<Vec<String>, String> {
    use std::process::Command;

    let mut authors = Vec::new();

    if let Ok(output) = Command::new("git")
        .args(["config", "--get", "user.name"])
        .output()
    {
        if output.status.success() {
            if let Ok(name) = String::from_utf8(output.stdout) {
                let name = name.trim();
                if !name.is_empty() {
                    authors.push(name.to_string());
                }
            }
        }
    }

    if let Ok(output) = Command::new("git")
        .args(["config", "--get", "user.email"])
        .output()
    {
        if output.status.success() {
            if let Ok(email) = String::from_utf8(output.stdout) {
                let email = email.trim();
                if !email.is_empty() {
                    authors.push(email.to_string());
                }
            }
        }
    }

    Ok(authors)
}

fn get_settings_path() -> Result<PathBuf, String> {
    let config_dir = dirs::config_dir()
        .ok_or("Could not find config directory")?;

    let app_config_dir = config_dir.join("farmer");
    fs::create_dir_all(&app_config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    Ok(app_config_dir.join("settings.json"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    #[cfg(target_os = "linux")]
    {
        std::env::set_var("WEBKIT_DISABLE_DMABUF_RENDERER", "1");
    }

    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .plugin(tauri_plugin_updater::Builder::new().build())
        .plugin(tauri_plugin_process::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            analyze_repository,
            get_work_days,
            save_settings,
            load_settings,
            get_git_config,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
