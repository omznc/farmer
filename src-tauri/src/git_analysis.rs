use crate::types::{Commit, FileDiff, WorkDay};
use std::collections::HashMap;

const IGNORED_EXTENSIONS: &[&str] = &[
    ".min.js", ".min.css", ".map", ".png", ".jpg", ".jpeg", ".gif", ".ico", ".svg", ".woff",
    ".woff2", ".ttf", ".eot", ".pdf", ".zip", ".gz", ".tar", ".mp4", ".mp3", ".wav", ".avi",
    ".mov", ".webm", ".lock", ".sum",
];

const IGNORED_PATHS: &[&str] = &[
    "node_modules/",
    "dist/",
    "build/",
    "target/",
    ".git/",
    "vendor/",
    "__pycache__/",
    ".venv/",
    "venv/",
];

fn should_ignore_file(path: &str) -> bool {
    let path_lower = path.to_lowercase();

    for ext in IGNORED_EXTENSIONS {
        if path_lower.ends_with(ext) {
            return true;
        }
    }

    for ignored_path in IGNORED_PATHS {
        if path.contains(ignored_path) {
            return true;
        }
    }

    false
}

pub fn get_commit_diffs(
    repo_path: &str,
    commit_hash: &str,
    max_file_size_kb: u32,
    max_files: u32,
) -> Result<Vec<FileDiff>, String> {
    let repo = git2::Repository::open(repo_path)
        .map_err(|e| format!("Failed to open repository: {}", e))?;

    let oid =
        git2::Oid::from_str(commit_hash).map_err(|e| format!("Invalid commit hash: {}", e))?;

    let commit = repo
        .find_commit(oid)
        .map_err(|e| format!("Commit not found: {}", e))?;

    let tree = commit
        .tree()
        .map_err(|e| format!("Failed to get commit tree: {}", e))?;

    let mut diffs: Vec<FileDiff> = Vec::new();
    let max_bytes = (max_file_size_kb as u64) * 1024;

    if commit.parent_count() > 0 {
        let parent = commit
            .parent(0)
            .map_err(|e| format!("Failed to get parent commit: {}", e))?;
        let parent_tree = parent
            .tree()
            .map_err(|e| format!("Failed to get parent tree: {}", e))?;

        let diff = repo
            .diff_tree_to_tree(Some(&parent_tree), Some(&tree), None)
            .map_err(|e| format!("Failed to compute diff: {}", e))?;

        let mut file_count = 0u32;

        for delta in diff.deltas() {
            if file_count >= max_files {
                break;
            }

            let path = if let Some(p) = delta.new_file().path() {
                p.to_str().unwrap_or("").to_string()
            } else if let Some(p) = delta.old_file().path() {
                p.to_str().unwrap_or("").to_string()
            } else {
                continue;
            };

            if should_ignore_file(&path) {
                continue;
            }

            let file_size = delta.new_file().size();
            if file_size > max_bytes {
                continue;
            }

            file_count += 1;

            let mut additions = 0usize;
            let mut deletions = 0usize;
            let mut diff_text = String::new();

            if let Ok(Some(patch)) = git2::Patch::from_diff(&diff, (delta.nfiles() - 1) as usize) {
                let num_hunks = patch.num_hunks();
                for hunk_idx in 0..num_hunks {
                    if let Ok(num_lines) = patch.num_lines_in_hunk(hunk_idx) {
                        for line_idx in 0..num_lines {
                            if let Ok(line) = patch.line_in_hunk(hunk_idx, line_idx) {
                                let prefix = match line.origin() {
                                    '+' => {
                                        additions += 1;
                                        "+"
                                    }
                                    '-' => {
                                        deletions += 1;
                                        "-"
                                    }
                                    ' ' => " ",
                                    _ => continue,
                                };

                                if let Ok(text) = std::str::from_utf8(line.content()) {
                                    diff_text.push_str(&format!("{}{}\n", prefix, text.trim_end()));
                                }
                            }
                        }
                    }
                }
            }

            if !diff_text.is_empty() {
                diffs.push(FileDiff {
                    path,
                    additions,
                    deletions,
                    diff: diff_text,
                });
            }
        }
    }

    Ok(diffs)
}

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
    println!(
        "Analyzing repository: {} (remote: {:?}, filtering: {})",
        repo_path,
        remote_url.as_deref().unwrap_or("none"),
        should_filter
    );

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

    println!(
        "Found {} commits for repository: {}",
        commits.len(),
        repo_path
    );

    if commits.is_empty() {
        println!("Warning: No commits found in repository: {}", repo_path);
        return Ok(Vec::new());
    }

    let work_days = group_commits_by_workday(commits);
    println!(
        "Grouped into {} work days for repository: {}",
        work_days.len(),
        repo_path
    );
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
