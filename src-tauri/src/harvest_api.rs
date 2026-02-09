use crate::types::*;
use serde_json::json;

const HARVEST_API_BASE: &str = "https://api.harvestapp.com/v2";

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct HarvestUser {
    pub id: i64,
    pub first_name: String,
    pub last_name: String,
    pub email: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct HarvestAccount {
    pub id: i64,
    pub name: String,
    pub base_currency: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct HarvestTimeEntryResponse {
    pub id: i64,
    pub spent_date: String,
    pub hours: f32,
    pub notes: Option<String>,
    pub project: Option<ProjectRef>,
    pub task: Option<TaskRef>,
    pub created_at: String,
    pub updated_at: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct ProjectRef {
    pub id: i64,
    pub name: String,
    pub code: Option<String>,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct TaskRef {
    pub id: i64,
    pub name: String,
}

#[derive(Debug, Clone, serde::Serialize, serde::Deserialize)]
pub struct HarvestTimeEntriesResponse {
    pub time_entries: Vec<HarvestTimeEntryResponse>,
    pub total_pages: i32,
    pub total_entries: i32,
    pub page: i32,
    pub per_page: i32,
}

pub async fn get_current_user(
    access_token: &str,
    account_id: &str,
) -> Result<HarvestUser, String> {
    let client = reqwest::Client::new();
    let response = client
        .get(format!("{}/users/me", HARVEST_API_BASE))
        .header("Authorization", format!("Bearer {}", access_token))
        .header("Harvest-Account-Id", account_id)
        .header("User-Agent", "Profico Farmer")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch user: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to fetch user: {}", response.status()));
    }

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    serde_json::from_value(json["user"].clone())
        .map_err(|e| format!("Failed to parse user data: {}", e))
}

pub async fn get_accounts(
    access_token: &str,
) -> Result<Vec<HarvestAccount>, String> {
    let client = reqwest::Client::new();
    
    let response = client
        .get(format!("{}/accounts", HARVEST_API_BASE))
        .header("Authorization", format!("Bearer {}", access_token))
        .header("User-Agent", "Profico Farmer")
        .send()
        .await
        .map_err(|e| format!("Failed to fetch accounts: {}", e))?;

    if !response.status().is_success() {
        return Err(format!("Failed to fetch accounts: {}", response.status()));
    }

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    serde_json::from_value(json["accounts"].clone())
        .map_err(|e| format!("Failed to parse accounts data: {}", e))
}

pub async fn get_projects(
    access_token: &str,
    account_id: &str,
) -> Result<Vec<HarvestProject>, String> {
    let client = reqwest::Client::new();
    let mut projects = Vec::new();
    let mut page = 1;
    let per_page = 100;

    loop {
        let response = client
            .get(format!("{}/projects?page={}&per_page={}", HARVEST_API_BASE, page, per_page))
            .header("Authorization", format!("Bearer {}", access_token))
            .header("Harvest-Account-Id", account_id)
            .header("User-Agent", "Profico Farmer")
            .send()
            .await
            .map_err(|e| format!("Failed to fetch projects: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to fetch projects: {}", response.status()));
        }

        let json: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let page_projects: Vec<HarvestProject> = serde_json::from_value(json["projects"].clone())
            .map_err(|e| format!("Failed to parse projects data: {}", e))?;

        if page_projects.is_empty() {
            break;
        }

        projects.extend(page_projects);
        page += 1;

        let total_pages = json["total_pages"].as_i64().unwrap_or(1) as i32;
        if page > total_pages {
            break;
        }
    }

    Ok(projects)
}

pub async fn get_tasks(
    access_token: &str,
    account_id: &str,
) -> Result<Vec<HarvestTask>, String> {
    let client = reqwest::Client::new();
    let mut tasks = Vec::new();
    let mut page = 1;
    let per_page = 100;

    loop {
        let response = client
            .get(format!("{}/tasks?page={}&per_page={}", HARVEST_API_BASE, page, per_page))
            .header("Authorization", format!("Bearer {}", access_token))
            .header("Harvest-Account-Id", account_id)
            .header("User-Agent", "Profico Farmer")
            .send()
            .await
            .map_err(|e| format!("Failed to fetch tasks: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to fetch tasks: {}", response.status()));
        }

        let json: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let page_tasks: Vec<HarvestTask> = serde_json::from_value(json["tasks"].clone())
            .map_err(|e| format!("Failed to parse tasks data: {}", e))?;

        if page_tasks.is_empty() {
            break;
        }

        tasks.extend(page_tasks);
        page += 1;

        let total_pages = json["total_pages"].as_i64().unwrap_or(1) as i32;
        if page > total_pages {
            break;
        }
    }

    Ok(tasks)
}

pub async fn get_my_project_assignments(
    access_token: &str,
    account_id: &str,
) -> Result<(Vec<HarvestProject>, Vec<HarvestTask>), String> {
    println!("🔍 Fetching project assignments from Harvest API...");

    let client = reqwest::Client::new();

    let response = client
        .get(format!("{}/users/me/project_assignments?per_page=2000", HARVEST_API_BASE))
        .header("Authorization", format!("Bearer {}", access_token))
        .header("Harvest-Account-Id", account_id)
        .header("User-Agent", "Profico Farmer")
        .send()
        .await
        .map_err(|e| {
            println!("❌ Failed to send request: {}", e);
            format!("Failed to fetch project assignments: {}", e)
        })?;

    println!("📡 Response status: {}", response.status());

    if !response.status().is_success() {
        let status = response.status();
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        println!("❌ Error response body: {}", error_text);
        return Err(format!("Failed to fetch project assignments: {} - {}", status, error_text));
    }

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| {
            println!("❌ Failed to parse JSON: {}", e);
            format!("Failed to parse response: {}", e)
        })?;

    let mut projects_map = std::collections::HashMap::new();
    let mut tasks_map = std::collections::HashMap::new();

    if let Some(assignments) = json["project_assignments"].as_array() {
        println!("📊 Found {} project assignments", assignments.len());

        for assignment in assignments {
            if let Some(project) = assignment.get("project") {
                if let (Some(id), Some(name), Some(client_id), Some(client_name)) = (
                    project.get("id").and_then(|v| v.as_i64()),
                    project.get("name").and_then(|v| v.as_str()),
                    assignment.get("client").and_then(|c| c.get("id")).and_then(|v| v.as_i64()),
                    assignment.get("client").and_then(|c| c.get("name")).and_then(|v| v.as_str()),
                ) {
                    projects_map.insert(id, HarvestProject {
                        id,
                        name: name.to_string(),
                        code: project.get("code").and_then(|v| v.as_str()).map(|s| s.to_string()),
                        client_id,
                        client_name: client_name.to_string(),
                    });
                }
            }

            if let Some(task_assignments) = assignment.get("task_assignments").and_then(|v| v.as_array()) {
                for task_assignment in task_assignments {
                    if let Some(task) = task_assignment.get("task") {
                        if let (Some(id), Some(name)) = (
                            task.get("id").and_then(|v| v.as_i64()),
                            task.get("name").and_then(|v| v.as_str()),
                        ) {
                            tasks_map.insert(id, HarvestTask {
                                id,
                                name: name.to_string(),
                                billable: task_assignment.get("billable").and_then(|v| v.as_bool()).unwrap_or(false),
                                hourly_rate: task_assignment.get("hourly_rate").and_then(|v| v.as_f64()),
                            });
                        }
                    }
                }
            }
        }
    }

    let projects: Vec<HarvestProject> = projects_map.into_values().collect();
    let tasks: Vec<HarvestTask> = tasks_map.into_values().collect();

    println!("✅ Parsed {} unique projects and {} unique tasks", projects.len(), tasks.len());

    Ok((projects, tasks))
}

pub async fn get_time_entries(
    access_token: &str,
    account_id: &str,
    from: &str,
    to: &str,
    user_id: Option<i64>,
) -> Result<Vec<HarvestTimeEntryResponse>, String> {
    let client = reqwest::Client::new();
    let mut entries = Vec::new();
    let mut page = 1;
    let per_page = 100;

    let mut url = format!(
        "{}/time_entries?from={}&to={}&per_page={}",
        HARVEST_API_BASE, from, to, per_page
    );

    if let Some(uid) = user_id {
        url.push_str(&format!("&user_id={}", uid));
    }

    loop {
        let response = client
            .get(format!("{}&page={}", url, page))
            .header("Authorization", format!("Bearer {}", access_token))
            .header("Harvest-Account-Id", account_id)
            .header("User-Agent", "Profico Farmer")
            .send()
            .await
            .map_err(|e| format!("Failed to fetch time entries: {}", e))?;

        if !response.status().is_success() {
            return Err(format!("Failed to fetch time entries: {}", response.status()));
        }

        let json: serde_json::Value = response
            .json()
            .await
            .map_err(|e| format!("Failed to parse response: {}", e))?;

        let response_data: HarvestTimeEntriesResponse = serde_json::from_value(json.clone())
            .map_err(|e| format!("Failed to parse time entries data: {}", e))?;

        if response_data.time_entries.is_empty() {
            break;
        }

        entries.extend(response_data.time_entries);
        page += 1;

        if page > response_data.total_pages {
            break;
        }
    }

    Ok(entries)
}

pub async fn create_time_entry(
    access_token: &str,
    account_id: &str,
    entry: &TimeEntry,
) -> Result<TimeEntry, String> {
    let client = reqwest::Client::new();

    let mut payload = json!({
        "project_id": entry.project_id,
        "task_id": entry.task_id,
        "spent_date": entry.spent_date,
        "hours": entry.hours,
    });

    if !entry.notes.is_empty() {
        payload["notes"] = json!(entry.notes);
    }

    if let Some(ref ext_ref) = entry.external_reference {
        payload["external_reference"] = json!(ext_ref);
    }

    let response = client
        .post(format!("{}/time_entries", HARVEST_API_BASE))
        .header("Authorization", format!("Bearer {}", access_token))
        .header("Harvest-Account-Id", account_id)
        .header("User-Agent", "Profico Farmer")
        .json(&payload)
        .send()
        .await
        .map_err(|e| format!("Failed to create time entry: {}", e))?;

    let status = response.status();
    if !status.is_success() {
        let error_text = response.text().await.unwrap_or_else(|_| "Unknown error".to_string());
        return Err(format!("Failed to create time entry: {} - {}", status, error_text));
    }

    let json: serde_json::Value = response
        .json()
        .await
        .map_err(|e| format!("Failed to parse response: {}", e))?;

    let created_entry: TimeEntry = serde_json::from_value(json.clone())
        .map_err(|e| format!("Failed to parse created entry: {}", e))?;

    Ok(created_entry)
}
