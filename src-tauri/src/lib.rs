mod git_analysis;
mod harvest_api;
mod types;

use types::*;
use harvest_api::*;
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
async fn harvest_get_user(
    access_token: String,
    account_id: String,
) -> Result<HarvestUser, String> {
    get_current_user(&access_token, &account_id).await
}

#[tauri::command]
async fn harvest_get_accounts(
    access_token: String,
) -> Result<Vec<HarvestAccount>, String> {
    get_accounts(&access_token).await
}

#[tauri::command]
async fn harvest_get_projects(
    access_token: String,
    account_id: String,
) -> Result<Vec<HarvestProject>, String> {
    get_projects(&access_token, &account_id).await
}

#[tauri::command]
async fn harvest_get_tasks(
    access_token: String,
    account_id: String,
) -> Result<Vec<HarvestTask>, String> {
    get_tasks(&access_token, &account_id).await
}

#[tauri::command]
async fn harvest_get_my_assignments(
    access_token: String,
    account_id: String,
) -> Result<(Vec<HarvestProject>, Vec<HarvestTask>), String> {
    get_my_project_assignments(&access_token, &account_id).await
}

#[tauri::command]
async fn harvest_get_time_entries(
    access_token: String,
    account_id: String,
    from: String,
    to: String,
    user_id: Option<i64>,
) -> Result<Vec<HarvestTimeEntryResponse>, String> {
    get_time_entries(&access_token, &account_id, &from, &to, user_id).await
}

#[tauri::command]
async fn harvest_create_time_entry(
    access_token: String,
    account_id: String,
    entry: TimeEntry,
) -> Result<TimeEntry, String> {
    create_time_entry(&access_token, &account_id, &entry).await
}

#[tauri::command]
async fn save_settings(
    work_schedule: Option<WorkSchedule>,
    ai_config: Option<AIConfig>,
    repo_path: Option<String>,
    repo_history: Option<Vec<String>>,
    filter_by_git_authors: Option<bool>,
) -> Result<(), String> {
    let settings_path = get_settings_path()?;

    let settings_data = serde_json::json!({
        "workSchedule": work_schedule,
        "aiConfig": ai_config,
        "repoPath": repo_path,
        "repoHistory": repo_history,
        "filterByGitAuthors": filter_by_git_authors,
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
            "harvestConfig": null,
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

    let app_config_dir = config_dir.join("profico-farmer");
    fs::create_dir_all(&app_config_dir)
        .map_err(|e| format!("Failed to create config directory: {}", e))?;

    Ok(app_config_dir.join("settings.json"))
}

#[cfg_attr(mobile, tauri::mobile_entry_point)]
pub fn run() {
    tauri::Builder::default()
        .plugin(tauri_plugin_opener::init())
        .plugin(tauri_plugin_dialog::init())
        .plugin(tauri_plugin_fs::init())
        .plugin(tauri_plugin_shell::init())
        .plugin(tauri_plugin_clipboard_manager::init())
        .invoke_handler(tauri::generate_handler![
            greet,
            analyze_repository,
            get_work_days,
            save_settings,
            load_settings,
            get_git_config,
            harvest_get_user,
            harvest_get_accounts,
            harvest_get_projects,
            harvest_get_tasks,
            harvest_get_my_assignments,
            harvest_get_time_entries,
            harvest_create_time_entry,
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
