use crate::types::{Commit, WorkDay};
use std::collections::HashMap;

pub fn get_remote_url(repo_path: &str) -> Option<String> {
    let repo = git2::Repository::open(repo_path).ok()?;
    let remote = repo.find_remote("origin").ok()?;
    let url = remote.url().map(|s| s.to_string());
    println!("Repository '{}' remote URL: {:?}", repo_path, url);
    url
}

pub fn analyze_repository(
    repo_path: String,
    git_authors: Vec<String>,
) -> Result<Vec<WorkDay>, String> {
    let repo = git2::Repository::open(&repo_path)
        .map_err(|e| format!("Failed to open repository: {}", e))?;

    let mut revwalk = repo
        .revwalk()
        .map_err(|e| format!("Failed to walk commits: {}", e))?;

    revwalk
        .push_head()
        .map_err(|e| format!("Failed to find HEAD: {}", e))?;

    let mut commits: Vec<Commit> = Vec::new();
    let three_months_ago = chrono::Utc::now() - chrono::Duration::days(90);

    let should_filter = !git_authors.is_empty();

    let remote_url = get_remote_url(&repo_path);
    println!("Analyzing repository: {} (remote: {:?}, filtering: {})",
             repo_path, remote_url.as_deref().unwrap_or("none"), should_filter);

    for oid in revwalk {
        let oid = oid.map_err(|e| format!("Invalid OID: {}", e))?;
        let commit = repo
            .find_commit(oid)
            .map_err(|e| format!("Commit not found: {}", e))?;

        let commit_time = chrono::DateTime::from_timestamp(commit.time().seconds(), 0).unwrap();

        if commit_time < three_months_ago {
            break;
        }

        let author_name = commit.author().name().unwrap_or("Unknown").to_string();
        let author_email = commit.author().email().unwrap_or("").to_string();
        let message = commit.message().unwrap_or("").to_string();

        // Filter by git authors if specified
        if should_filter {
            let matches = git_authors.iter().any(|allowed_author| {
                let author_lower = allowed_author.to_lowercase();
                author_name.to_lowercase().contains(&author_lower)
                    || author_email.to_lowercase().contains(&author_lower)
            });

            if !matches {
                continue;
            }
        }

        let files_changed = extract_changed_files(&repo, &commit);

        commits.push(Commit {
            hash: commit.id().to_string(),
            author: author_name,
            timestamp: commit_time,
            message,
            files_changed,
            repo_path: repo_path.clone(),
            remote_url: remote_url.clone(),
        });
    }

    println!("Found {} commits for repository: {}", commits.len(), repo_path);

    if commits.is_empty() {
        println!("Warning: No commits found in repository: {}", repo_path);
        return Ok(Vec::new());
    }

    let work_days = group_commits_by_workday(commits);
    println!("Grouped into {} work days for repository: {}", work_days.len(), repo_path);
    Ok(work_days)
}

pub fn get_work_days(repo_path: String, git_authors: Vec<String>) -> Result<Vec<WorkDay>, String> {
    analyze_repository(repo_path, git_authors)
}

fn extract_changed_files(repo: &git2::Repository, commit: &git2::Commit) -> Vec<String> {
    let mut files = Vec::new();

    let tree = commit.tree().unwrap();
    if let Ok(parent) = commit.parent(0) {
        let parent_tree = parent.tree().unwrap();
        if let Ok(diff) = repo.diff_tree_to_tree(Some(&parent_tree), Some(&tree), None) {
            for delta in diff.deltas() {
                if let Some(path) = delta.new_file().path() {
                    if let Some(path_str) = path.to_str() {
                        files.push(path_str.to_string());
                    }
                }
            }
        }
    }

    files
}

fn group_commits_by_workday(commits: Vec<Commit>) -> Vec<WorkDay> {
    let mut grouped: HashMap<String, Vec<Commit>> = HashMap::new();

    for commit in commits {
        let date = commit.timestamp.format("%Y-%m-%d").to_string();
        grouped.entry(date).or_insert_with(Vec::new).push(commit);
    }

    let mut work_days: Vec<WorkDay> = grouped
        .into_iter()
        .map(|(date, commits)| {
            let total_commits = commits.len();
            let first = commits.first();
            let last = commits.last();

            WorkDay {
                date,
                total_commits,
                first_commit_time: first.map(|c| c.timestamp.format("%H:%M").to_string()),
                last_commit_time: last.map(|c| c.timestamp.format("%H:%M").to_string()),
                commits,
            }
        })
        .collect();

    work_days.sort_by(|a, b| b.date.cmp(&a.date));
    work_days
}
