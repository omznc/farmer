# Profico Farmer - Desktop Application
# Harvest Git Integration Tool

## 🎯 Project Overview

**Profico Farmer** is a cross-platform desktop application that bridges local Git repository activity with Harvest time tracking. It analyzes commits, identifies working days, automatically generates timesheet entries, and intelligently allocates time between meetings and development work.

### Core Value Proposition
- **Automated Time Tracking**: Transform Git commits into Harvest time entries
- **Smart Time Allocation**: Automatically split 8-hour days between meetings (e.g., 20 min) and development (7:40)
- **Zero-Friction Setup**: One-time Harvest OAuth connection, point to repo, go
- **Beautiful Zed-like UI**: Minimal, fast, keyboard-driven interface

---

## 🏗️ Architecture Overview

### Technology Stack

| Layer | Technology | Rationale |
|-------|-----------|-----------|
| **Desktop Framework** | Tauri 2.0+ | Small, fast, secure Rust backend + web frontend |
| **Backend Language** | Rust 1.77.2+ | Performance, safety, excellent Git/Git2 bindings |
| **Frontend** | React + TypeScript + Vite | Modern React patterns, excellent DX |
| **Styling** | Tailwind CSS v4 | Utility-first, fast iteration, Zed-like aesthetics |
| **UI Components** | Radix UI | Accessible primitives, keyboard-first |
| **Git Analysis** | git2-rs | Native Rust bindings to libgit2 |
| **HTTP Client** | reqwest | Async HTTP for Harvest API |
| **State Management** | Zustand | Lightweight, minimal boilerplate |
| **Calendar/Date** | date-fns | Lightweight date utilities |
| **Storage** | SQLite via rusqlite | Local config, cache, commit analysis |

### System Architecture

```
┌─────────────────────────────────────────────────────────┐
│                    Tauri Desktop App                     │
├─────────────────────────────────────────────────────────┤
│  Frontend (React + TypeScript)                          │
│  ├─ Repository Selector                                 │
│  ├─ Commit Timeline View                                │
│  ├─ Time Entry Editor                                   │
│  └─ Settings/Auth Panel                                 │
├─────────────────────────────────────────────────────────┤
│  IPC Layer (Tauri Commands)                             │
│  ├─ git_analysis_* commands                             │
│  ├─ harvest_* commands                                  │
│  └─ config_* commands                                   │
├─────────────────────────────────────────────────────────┤
│  Backend (Rust)                                         │
│  ├─ Git Analyzer Module                                 │
│  │  ├─ Commit parsing                                   │
│  │  ├─ Working day detection                            │
│  │  └─ Commit grouping                                  │
│  ├─ Harvest Client Module                               │
│  │  ├─ OAuth2 flow                                      │
│  │  ├─ Time entry CRUD                                  │
│  │  └─ Project/task sync                                │
│  ├─ Meeting Sync Module                                 │
│  │  ├─ Calendar integration (Google/Outlook)            │
│  │  └─ Time allocation logic                            │
│  └─ State/Config Module                                 │
│     ├─ SQLite persistence                               │
│     └─ User preferences                                 │
└─────────────────────────────────────────────────────────┘
         │                    │                    │
         ▼                    ▼                    ▼
    Local Repo         Harvest API          Calendar APIs
    (git2-rs)          (REST v2)            (Google/Outlook)
```

---

## 📊 Data Models

### 1. Core Domain Models

```rust
// Git Commit Analysis
pub struct Commit {
    pub hash: String,
    pub author: String,
    pub timestamp: DateTime<Utc>,
    pub message: String,
    pub files_changed: Vec<String>,
    pub repo_path: String,
}

pub struct WorkDay {
    pub date: NaiveDate,
    pub commits: Vec<Commit>,
    pub total_commits: usize,
    pub first_commit_time: Option<NaiveTime>,
    pub last_commit_time: Option<NaiveTime>,
    pub estimated_hours: f32,
}

// Harvest Integration
pub struct HarvestConfig {
    pub access_token: String,
    pub account_id: String,
    pub refresh_token: Option<String>,
    pub default_project_id: i64,
    pub default_task_id: i64,
    pub meeting_project_id: Option<i64>,
    pub meeting_task_id: Option<i64>,
}

pub struct TimeEntry {
    pub id: Option<i64>,
    pub project_id: i64,
    pub task_id: i64,
    pub spent_date: NaiveDate,
    pub hours: f32,
    pub notes: String,
    pub external_reference: Option<String>, // Git commit hash
}

// Meeting Integration
pub struct Meeting {
    pub id: String,
    pub title: String,
    pub start_time: DateTime<Utc>,
    pub end_time: DateTime<Utc>,
    pub duration_minutes: i32,
    pub calendar_source: CalendarSource,
}

pub enum CalendarSource {
    Google,
    Outlook,
    ICal,
}
```

### 2. Application State

```rust
pub struct AppState {
    pub harvest_config: Option<HarvestConfig>,
    pub repo_path: Option<PathBuf>,
    pub work_days: Vec<WorkDay>,
    pub projects: Vec<HarvestProject>,
    pub tasks: Vec<HarvestTask>,
    pub meetings: Vec<Meeting>,
    pub generated_entries: Vec<TimeEntry>,
}
```

---

## 🎨 UI Design (Zed-inspired)

### Design Principles

- **Minimal & Clean**: Dark theme by default, limited color palette
- **Keyboard-First**: Everything accessible via keyboard (Vim-style)
- **Fast & Responsive**: Instant feedback, no lag
- **Typography-Driven**: Clear hierarchy, generous spacing
- **Panel-Based**: Similar to Zed's multi-panel layout

### Color Palette (Zed-inspired)

```css
/* Based on Zed's default dark theme */
--bg-primary: #1c1c1c;
--bg-secondary: #252525;
--bg-tertiary: #2d2d2d;
--fg-primary: #c5c5c5;
--fg-secondary: #8b8b8b;
--accent: #78a9ff;      /* Blue for primary actions */
--success: #3d9b74;     /* Green */
--warning: #e3b341;     /* Yellow */
--error: #d95757;       /* Red */
--border: #383838;
--inactive: #505050;
```

### Key Views

#### 1. Main Window Layout

```
┌────────────────────────────────────────────────────────────┐
│  Profico Farmer                    [🔧] [📊] [⚙️]          │
├────────────────────────────────────────────────────────────┤
│  Sidebar │ Commit Timeline │ Time Entry Preview           │
│           │                 │                               │
│  ┌─────┐  │  Mon Jan 13    │ ┌─────────────────────────┐  │
│  │Repo │  │  ├─ 3 commits  │ │ Project: ABC Corp       │  │
│  │     │  │  │  "feat: add │ │ Task: Development       │  │
│  │     │  │  │   login"    │ │ Hours: 7.40             │  │
│  │     │  │  │             │ │                         │  │
│  │Conf │  │  ├─ Meeting:   │ │ Notes:                  │  │
│  │     │  │  │  Standup    │ │ feat: add login         │  │
│  │     │  │  │  9:00-9:20  │ │ auth: implement JWT     │  │
│  │     │  │  │             │ │ refactor: clean up      │  │
│  └─────┘  │  │  Total: 8h  │ └─────────────────────────┘  │
│           │  │             │                               │
│           │  Tue Jan 14    │                               │
│           │  ├─ 7 commits  │                               │
│           │  └─ ...        │                               │
├────────────────────────────────────────────────────────────┤
│  [Ctrl+P] Select Repo  [Ctrl+H] Harvest  [Ctrl+Enter] Sync│
└────────────────────────────────────────────────────────────┘
```

#### 2. Repository Selector (Modal)

```
┌─────────────────────────────────────────┐
│  Select Repository                      │
├─────────────────────────────────────────┤
│  ┌───────────────────────────────────┐  │
│  │ 🔍 /home/user/projects/myapp      │  │
│  └───────────────────────────────────┘  │
│                                         │
│  Recent:                                │
│    /home/user/projects/profico-farmer   │
│    /home/user/work/website              │
│    /home/user/scripts/utils             │
│                                         │
│  [Cancel]            [Select]           │
└─────────────────────────────────────────┘
```

#### 3. Harvest Auth Flow

```
┌─────────────────────────────────────────┐
│  Connect Harvest Account                │
├─────────────────────────────────────────┤
│                                         │
│  1. Click "Authorize with Harvest"      │
│  2. Grant permissions                   │
│  3. Return to configure defaults        │
│                                         │
│         [🔗 Authorize with Harvest]      │
│                                         │
│  ✓ Connected as john@example.com        │
│                                         │
│  Default Project: [ABC Corp ▼]          │
│  Default Task:   [Development ▼]        │
│  Meeting Project: [Internal ▼]          │
│  Meeting Task:   [Meetings ▼]           │
│                                         │
│  [Disconnect]        [Save & Continue]  │
└─────────────────────────────────────────┘
```

---

## 🔧 Core Features

### Feature 1: Repository Analysis

**Implementation Approach:**
```rust
use git2::{Repository, TimeWalk};

#[tauri::command]
async fn analyze_repository(repo_path: String) -> Result<Vec<WorkDay>, String> {
    let repo = Repository::open(repo_path)
        .map_err(|e| format!("Failed to open repo: {}", e))?;

    let mut revwalk = repo.revwalk()
        .map_err(|e| format!("Failed to walk commits: {}", e))?;

    revwalk.push_head()
        .map_err(|e| format!("Failed to find HEAD: {}", e))?;

    let mut commits: Vec<Commit> = Vec::new();

    for oid in revwalk {
        let oid = oid.map_err(|e| format!("Invalid OID: {}", e))?;
        let commit = repo.find_commit(oid)
            .map_err(|e| format!("Commit not found: {}", e))?;

        let commit_time = DateTime::from_timestamp(commit.time().seconds(), 0)
            .unwrap()
            .naive_utc();

        commits.push(Commit {
            hash: commit.id().to_string(),
            author: commit.author().name().unwrap_or("Unknown").to_string(),
            timestamp: commit_time,
            message: commit.message().unwrap_or("").to_string(),
            files_changed: extract_changed_files(&repo, &commit),
            repo_path: repo.path().to_str().unwrap().to_string(),
        });

        // Limit to last 3 months
        if commit_time < Utc::now().naive_utc() - Duration::days(90) {
            break;
        }
    }

    let work_days = group_commits_by_workday(commits);
    Ok(work_days)
}

fn group_commits_by_workday(commits: Vec<Commit>) -> Vec<WorkDay> {
    // Group commits by date
    let mut grouped: HashMap<NaiveDate, Vec<Commit>> = HashMap::new();

    for commit in commits {
        let date = commit.timestamp.date();
        grouped.entry(date).or_insert_with(Vec::new).push(commit);
    }

    // Convert to WorkDay structs
    grouped.into_iter()
        .map(|(date, commits)| {
            let first = commits.first().map(|c| c.timestamp.time());
            let last = commits.last().map(|c| c.timestamp.time());

            WorkDay {
                date,
                commits,
                total_commits: commits.len(),
                first_commit_time: first,
                last_commit_time: last,
                estimated_hours: estimate_hours_from_activity(&commits),
            }
        })
        .sorted_by(|a, b| b.date.cmp(&a.date))
        .collect()
}

fn estimate_hours_from_activity(commits: &[Commit]) -> f32 {
    if commits.is_empty() {
        return 0.0;
    }

    // Simple heuristic: 8 hours if any commits, adjust based on spread
    let first = commits.first().unwrap().timestamp.time();
    let last = commits.last().unwrap().timestamp.time();

    if let (Some(first), Some(last)) = (first, last) {
        let spread = last.signed_duration_since(first).num_minutes();
        // Cap at 8 hours, minimum 1 hour
        (spread as f32 / 60.0).min(8.0).max(1.0)
    } else {
        8.0
    }
}
```

### Feature 2: Harvest Integration

**OAuth2 Flow:**
```rust
use tauri::Manager;
use oauth2::{AuthorizationCode, CsrfToken, PkceCodeChallenge};

#[tauri::command]
async fn initiate_harvest_auth(window: tauri::Window) -> Result<String, String> {
    // Generate PKCE verifier
    let (pkce_challenge, pkce_verifier) = PkceCodeChallenge::new_random_sha256();

    // Create authorization URL
    let auth_url = format!(
        "https://id.getharvest.com/oauth2/authorize?\
         client_id={}&\
         redirect_uri=http://localhost:3000/callback&\
         response_type=code&\
         state={}&\
         code_challenge={}&\
         code_challenge_method=S256",
        env!("HARVEST_CLIENT_ID"),
        CsrfToken::new_random,
        pkce_challenge
    );

    // Open system browser
    open::that(&auth_url)
        .map_err(|e| format!("Failed to open browser: {}", e))?;

    // Store verifier for callback
    window.app_handle().state::<Mutex<HashMap<String, String>>>()
        .lock().unwrap()
        .insert("pkce_verifier".to_string(), pkce_verifier.secret().to_string());

    Ok(auth_url)
}

#[tauri::command]
async fn exchange_auth_code(code: String, verifier: String) -> Result<HarvestConfig, String> {
    let client = reqwest::Client::new();

    let params = [
        ("code", &code),
        ("client_id", env!("HARVEST_CLIENT_ID")),
        ("client_secret", env!("HARVEST_CLIENT_SECRET")),
        ("redirect_uri", "http://localhost:3000/callback"),
        ("grant_type", "authorization_code"),
        ("code_verifier", &verifier),
    ];

    let resp: TokenResponse = client
        .post("https://id.getharvest.com/api/v2/oauth2/token")
        .form(&params)
        .send()
        .await
        .map_err(|e| format!("Token request failed: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Invalid token response: {}", e))?;

    // Fetch account ID
    let account_id = get_account_id(&resp.access_token).await?;

    Ok(HarvestConfig {
        access_token: resp.access_token,
        account_id,
        refresh_token: Some(resp.refresh_token),
        default_project_id: 0,
        default_task_id: 0,
        meeting_project_id: None,
        meeting_task_id: None,
    })
}

#[tauri::command]
async fn create_time_entries(
    config: HarvestConfig,
    entries: Vec<TimeEntry>
) -> Result<Vec<i64>, String> {
    let client = reqwest::Client::new();

    let mut created_ids = Vec::new();

    for entry in entries {
        let payload = serde_json::json!({
            "project_id": entry.project_id,
            "task_id": entry.task_id,
            "spent_date": entry.spent_date.format("%Y-%m-%d"),
            "hours": entry.hours,
            "notes": entry.notes,
        });

        let resp: TimeEntryResponse = client
            .post("https://api.harvestapp.com/v2/time_entries")
            .header("Authorization", format!("Bearer {}", config.access_token))
            .header("Harvest-Account-Id", config.account_id)
            .header("User-Agent", "Profico Farmer (profico@example.com)")
            .json(&payload)
            .send()
            .await
            .map_err(|e| format!("Failed to create entry: {}", e))?
            .json()
            .await
            .map_err(|e| format!("Invalid response: {}", e))?;

        created_ids.push(resp.id);
    }

    Ok(created_ids)
}
```

### Feature 3: Smart Time Allocation

**Meeting + Development Split Logic:**
```rust
#[tauri::command]
async fn allocate_time_for_workday(
    work_day: WorkDay,
    meetings: Vec<Meeting>,
    default_project_id: i64,
    default_task_id: i64,
    meeting_project_id: i64,
    meeting_task_id: i64,
) -> Result<Vec<TimeEntry>, String> {
    let mut entries = Vec::new();
    let target_hours = 8.0;
    let mut meeting_hours = 0.0;

    // Filter meetings for this workday
    let day_meetings: Vec<_> = meetings.iter()
        .filter(|m| m.start_time.date_naive() == work_day.date)
        .collect();

    // Create meeting entries
    for meeting in day_meetings {
        let hours = meeting.duration_minutes as f32 / 60.0;
        meeting_hours += hours;

        entries.push(TimeEntry {
            id: None,
            project_id: meeting_project_id,
            task_id: meeting_task_id,
            spent_date: work_day.date,
            hours,
            notes: format!("Meeting: {}", meeting.title),
            external_reference: Some(meeting.id.clone()),
        });
    }

    // Create development entry for remaining time
    let dev_hours = (target_hours - meeting_hours).max(0.0);

    if dev_hours > 0.0 && !work_day.commits.is_empty() {
        let commit_notes = work_day.commits.iter()
            .map(|c| format!("{}: {}", c.hash.chars().take(7).collect::<String>(), c.message.lines().next().unwrap_or("")))
            .collect::<Vec<_>>()
            .join("\n");

        entries.push(TimeEntry {
            id: None,
            project_id: default_project_id,
            task_id: default_task_id,
            spent_date: work_day.date,
            hours: dev_hours,
            notes: format!("Development work:\n{}", commit_notes),
            external_reference: None,
        });
    }

    Ok(entries)
}
```

### Feature 4: Calendar Integration (Meetings)

**Google Calendar Integration:**
```rust
use reqwest::header::HeaderValue;

#[tauri::command]
async fn fetch_google_calendar_meetings(
    access_token: String,
    start_date: NaiveDate,
    end_date: NaiveDate,
) -> Result<Vec<Meeting>, String> {
    let client = reqwest::Client::new();

    let start = start_date.and_time(NaiveTime::MIN);
    let end = end_date.and_time(NaiveTime::MAX);

    let resp: GoogleCalendarResponse = client
        .get(&format!(
            "https://www.googleapis.com/calendar/v3/calendars/primary/events?\
             timeMin={}&\
             timeMax={}&\
             singleEvents=true",
            start.format("%Y-%m-%dT%H:%M:%SZ"),
            end.format("%Y-%m-%dT%H:%M:%SZ")
        ))
        .header(
            reqwest::header::AUTHORIZATION,
            HeaderValue::from_str(&format!("Bearer {}", access_token))
                .map_err(|e| format!("Invalid auth header: {}", e))?
        )
        .send()
        .await
        .map_err(|e| format!("Calendar request failed: {}", e))?
        .json()
        .await
        .map_err(|e| format!("Invalid calendar response: {}", e))?;

    let meetings = resp.items.into_iter()
        .filter_map(|event| {
            let start = event.start.date_time.unwrap_or_else(|| {
                DateTime::from_timestamp(event.start.date.unwrap(), 0).unwrap()
            });
            let end = event.end.date_time.unwrap_or_else(|| {
                DateTime::from_timestamp(event.end.date.unwrap(), 0).unwrap()
            });
            let duration = (end - start).num_minutes() as i32;

            Some(Meeting {
                id: event.id,
                title: event.summary.unwrap_or("Untitled".to_string()),
                start_time: start,
                end_time: end,
                duration_minutes: duration,
                calendar_source: CalendarSource::Google,
            })
        })
        .collect();

    Ok(meetings)
}
```

---

## 🔒 Security Considerations

### 1. OAuth2 Security
- **PKCE Flow**: Use Proof Key for Code Exchange (prevent auth code interception)
- **Token Storage**: Encrypt tokens in system keychain (not plaintext)
- **Token Refresh**: Automatic refresh before expiry
- **Scope Limitation**: Request minimal Harvest scopes (timesheet:rw, projects:ro)

### 2. Tauri Security Configuration
```json
// src-tauri/capabilities/default.json
{
  "$schema": "../gen/schemas/desktop-schema.json",
  "identifier": "default",
  "description": "Default permissions for Profico Farmer",
  "windows": ["main"],
  "permissions": [
    "core:event:default",
    "core:window:default",
    "core:webview:default",
    {
      "identifier": "fs:read-repos",
      "allow": ["$HOME/*"],
      "deny": ["$HOME/.ssh/*", "$HOME/.gnupg/*"]
    },
    {
      "identifier": "http:harvest-api",
      "allow": [
        {"url": "https://api.harvestapp.com/*", "method": "GET"},
        {"url": "https://api.harvestapp.com/v2/time_entries", "method": "POST"}
      ]
    }
  ]
}
```

```json
// src-tauri/tauri.conf.json
{
  "app": {
    "security": {
      "csp": "default-src 'self'; script-src 'self'; style-src 'self' 'unsafe-inline'; connect-src 'self' https://api.harvestapp.com https://accounts.google.com;",
      "freezePrototype": true
    }
  }
}
```

### 3. Secrets Management
- **Never expose tokens to frontend**: Keep in Rust backend only
- **Environment variables**: Use `VITE_` prefix only for safe values
- **Keychain integration**: Use platform keychain for token persistence

---

## 📋 Implementation Roadmap

### Phase 1: Foundation (Week 1-2)

**Week 1: Project Setup**
- [ ] Initialize Tauri project with React + TypeScript
- [ ] Configure Tailwind CSS with Zed-inspired theme
- [ ] Set up project structure (components/, lib/, hooks/)
- [ ] Implement base layout (sidebar, main content)
- [ ] Create routing (Tauri Router or react-router)

**Week 2: Core UI Components**
- [ ] Button, Input, Select components (Radix UI)
- [ ] Modal/Dialog component
- [ ] Timeline component for commits
- [ ] Time entry preview panel
- [ ] Keyboard navigation system

### Phase 2: Git Analysis (Week 3-4)

**Week 3: Git Backend**
- [ ] Implement `git2-rs` integration
- [ ] Commit parsing and metadata extraction
- [ ] Workday detection algorithm
- [ ] File change tracking
- [ ] IPC commands: `analyze_repository`, `get_work_days`

**Week 4: Git Frontend**
- [ ] Repository selector UI
- [ ] Commit timeline visualization
- [ ] Workday detail view
- [ ] Commit diff preview
- [ ] Workday selection (for Harvest sync)

### Phase 3: Harvest Integration (Week 5-6)

**Week 5: Auth & Configuration**
- [ ] Implement OAuth2 PKCE flow
- [ ] Local HTTP server for callback
- [ ] Token storage in keychain
- [ ] Fetch user's projects and tasks
- [ ] Configure defaults (project/task mapping)

**Week 6: Time Entry Management**
- [ ] Create time entries API integration
- [ ] List existing time entries
- [ ] Update/delete time entries
- [ ] Preview before sync
- [ ] Batch sync functionality

### Phase 4: Smart Allocation (Week 7-8)

**Week 7: Meeting Integration**
- [ ] Google Calendar OAuth
- [ ] Fetch meetings for date range
- [ ] Outlook/Exchange integration (optional)
- [ ] Meeting duration parsing

**Week 8: Time Allocation Logic**
- [ ] Implement meeting + dev split algorithm
- [ ] Handle edge cases (no commits, all-day meetings)
- [ ] Configurable workday length (8h default)
- [ ] Manual override interface

### Phase 5: Polish & Launch (Week 9-10)

**Week 9: Testing & Refinement**
- [ ] Integration tests (Git, Harvest, Calendar)
- [ ] Error handling improvements
- [ ] Loading states and progress indicators
- [ ] User testing and feedback

**Week 10: Production Prep**
- [ ] Package for Windows, macOS, Linux
- [ ] Auto-updater configuration
- [ ] Documentation (README, setup guide)
- [ ] Release v1.0

---

## 🎯 Success Criteria

### Functional Requirements
- [ ] Successfully connect to Harvest via OAuth2
- [ ] Analyze any local Git repository (detect commits)
- [ ] Group commits by workday
- [ ] Fetch meetings from Google Calendar
- [ ] Automatically split 8h days between meetings and dev
- [ ] Create time entries in Harvest via API
- [ ] Work on Windows, macOS, and Linux

### Non-Functional Requirements
- [ ] Launch time < 2 seconds
- [ ] Repository analysis < 5 seconds (1000 commits)
- [ ] Harvest sync < 10 seconds (30 days)
- [ ] Keyboard-first navigation (Vim-style)
- [ ] Zed-like aesthetics (dark theme, clean UI)
- [ ] Secure token storage (keychain)

### User Experience Goals
- **Zero-Config UX**: One-time setup, then "just works"
- **Fast Feedback**: Instant previews before sync
- **Smart Defaults**: Guess project/task from context
- **Forgiving**: Easy to edit/undo before committing to Harvest

---

## 🚀 Getting Started (Development)

### Prerequisites
```bash
# Install Rust
curl --proto '=https' --tlsv1.2 -sSf https://sh.rustup.rs | sh

# Install Node.js 20 LTS
# macOS
brew install node@20

# Ubuntu/Debian
curl -fsSL https://deb.nodesource.com/setup_20.x | sudo -E bash -
sudo apt-get install -y nodejs

# Install pnpm (recommended for Tauri)
npm install -g pnpm
```

### Project Initialization
```bash
# Create Tauri app
pnpm create tauri-app profico-farmer
# Choose: React + TypeScript + Vite

cd profico-farmer

# Install dependencies
pnpm install

# Add required dependencies
pnpm add @tauri-apps/api @tauri-apps/plugin-ssh
pnpm add zustand date-fns
pnpm add @radix-ui/react-dialog @radix-ui/react-select

cd src-tauri
cargo add git2 reqwest tokio rusqlite oauth2 chrono

# Dev mode
pnpm tauri dev
```

### Development Commands
```bash
# Frontend dev server
pnpm dev

# Tauri dev (builds Rust + frontend)
pnpm tauri dev

# Type check
pnpm typecheck

# Lint
pnpm lint

# Build for production
pnpm tauri build

# Run tests
pnpm test
cd src-tauri && cargo test
```

---

## 📚 API References

### Harvest API V2
- **Base URL**: `https://api.harvestapp.com/v2`
- **Auth**: Bearer token + `Harvest-Account-Id` header
- **Rate Limit**: 100 requests per 15s (per account)
- **Key Endpoints**:
  - `GET /v2/users/me/project_assignments` - User's projects
  - `POST /v2/time_entries` - Create time entry
  - `GET /v2/time_entries` - List entries (paginated)

### Git Operations (git2-rs)
- `Repository::open(path)` - Open repository
- `Repository::revwalk()` - Commit iterator
- `Commit::time()` - Commit timestamp
- `Commit::message()` - Commit message

### Google Calendar API
- **Base URL**: `https://www.googleapis.com/calendar/v3`
- **Auth**: OAuth2 Bearer token
- **Endpoint**: `/calendars/primary/events` with `timeMin`/`timeMax`

---

## 📝 License & Attribution

This project will be released under MIT License.

**Third-party attributions:**
- Tauri: MIT License
- Harvest API: Proprietary (user's data)
- Radix UI: MIT License
- Git commits are user's private data

---

## 🤝 Contributing

This is a personal project, but contributions welcome:
1. Fork the repository
2. Create a feature branch
3. Make commits with clear messages
4. Open a pull request

**Areas for future enhancement:**
- Jira/Linear integration (map commits to tickets)
- AI-powered commit summarization
- Custom workday schedules (part-time, flex hours)
- Multiple repository support
- Team-based time allocation
