# Farmer

A git-powered time tracking desktop application built with Tauri.

<img width="1820" height="1077" alt="Screenshot From 2026-02-18 16-08-54" src="https://github.com/user-attachments/assets/7f9eda92-9628-4409-8681-380279e9c974" />

## Features

- **Git Analysis**: Automatically analyze your git commits to track work activity
- **Multi-Repository Support**: Track commits across multiple repositories
- **AI Integration**: Generate time entries and summaries using AI providers
- **Cross-Platform**: Available for macOS, Linux, and Windows
- **Auto-Update**: Built-in automatic update functionality

## Installation

Download the latest release for your platform from the [Releases](https://github.com/omznc/farmer/releases) page.

### Platform Support

| Platform | Architecture | Format |
|----------|-------------|--------|
| macOS | Intel (x64) | .dmg, .app |
| macOS | Apple Silicon (ARM) | .dmg, .app |
| Linux | x64 | .deb, .rpm, .AppImage |
| Linux | ARM64 | .deb, .rpm, .AppImage |
| Windows | x64 | .msi, .exe |

## Development

### Prerequisites

- [Bun](https://bun.sh) (package manager)
- [Rust](https://rustup.rs/) (stable toolchain)
- Platform-specific dependencies:
  - **Linux**: `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf`, `libssl-dev`, `pkg-config`
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft Visual Studio C++ Build Tools

### Setup

```bash
# Clone the repository
git clone https://github.com/omznc/farmer.git
cd farmer

# Install dependencies
bun install

# Run in development mode (uses system OpenSSL)
bun run tauri:dev

# Alternative: Run with vendored OpenSSL (slower build, requires Perl)
bun run tauri:dev:vendored
```

### Troubleshooting

#### OpenSSL Build Errors

If you encounter errors like `Can't locate FindBin.pm` or `failed to build OpenSSL from source`:

**Solution 1: Use System OpenSSL (Recommended for Development)**
```bash
# Install OpenSSL development libraries
# Ubuntu/Debian
sudo apt-get install libssl-dev pkg-config

# Fedora/RHEL
sudo dnf install openssl-devel pkg-config

# macOS
brew install openssl pkg-config

# Then use the default dev script
bun run tauri:dev
```

**Solution 2: Install Perl Modules (for Vendored OpenSSL)**
```bash
# Fedora/RHEL
sudo dnf install perl-FindBin perl-File-Compare perl-File-Copy perl-IPC-Cmd

# Ubuntu/Debian
sudo apt-get install perl-base

# Then use vendored build
bun run tauri:dev:vendored
```

**Note**: CI/CD builds use vendored OpenSSL by default, while local development uses system OpenSSL for faster builds.

#### Git Author Filtering

By default, Farmer filters commits to only show those from configured git authors (you). This is useful when working in shared repositories.

**If you see "No commits found from configured git authors":**

1. Check your git configuration matches:
   ```bash
   git config user.name   # Should match what's in Settings
   git config user.email  # Should match what's in Settings
   ```

2. In the app:
   - Go to Settings → Git Authors
   - Verify your name and email are listed
   - Or disable "Filter by git authors" checkbox in the Repository view

3. For test repositories:
   ```bash
   # Make sure commits are authored by your configured user
   cd test-local-repo
   git log --pretty=format:"%an <%ae>"  # Check commit authors
   ```

**Local Repositories (without remotes):**
- ✅ Fully supported! Local repos work exactly like remote repos
- 📍 Local repos show a pin emoji to indicate they have no remote
- All features work: commit display, AI summaries, copy to clipboard


### Building

```bash
# Build for current platform
bun run build:linux  # Linux
bun run build:mac    # macOS (universal)
bun run build:windows # Windows (cross-compile)
```

### Code Quality

```bash
bun run typecheck   # TypeScript type checking
bun run lint        # Biome
bun run lint:fix    # Biome with auto-fix
```

## Releasing

Releases are automated via GitHub Actions. Follow these steps:

### 1. Update Version Number

Edit `src-tauri/tauri.conf.json` and update the version:

```json
{
  "version": "0.2.0"  // Update this
}
```

### 2. Commit and Push to Release Branch

```bash
# Commit the version change
git add src-tauri/tauri.conf.json
git commit -m "chore: bump version to 0.2.0"

# Push to the release branch
git push origin main:release
```

**Alternative**: If you're already on a different branch:
```bash
git checkout -b release-0.2.0
git add src-tauri/tauri.conf.json
git commit -m "chore: bump version to 0.2.0"
git push origin release-0.2.0:release
```

### 3. Monitor the Build

1. Go to the [Actions tab](https://github.com/omznc/farmer/actions) on GitHub
2. Watch the "Release" workflow run
3. It will build for all platforms (macOS Intel, macOS ARM, Linux x64, Linux ARM64, Windows x64)
4. Build time: approximately 10-20 minutes

### 4. Publish the Release

1. Once the workflow completes, go to [Releases](https://github.com/omznc/farmer/releases)
2. You'll see a new **draft release** with version `v0.2.0`
3. Review the assets (all platform builds should be attached)
4. Edit the release notes if needed
5. Click **"Publish release"**

### 5. Verify Auto-Update

The app has built-in auto-update functionality. Users running previous versions will be notified of the update automatically.

### Troubleshooting Releases

- **Build fails**: Check the Actions logs for the specific platform that failed
- **Missing assets**: Ensure all platform builds completed successfully
- **Version conflict**: Make sure the version in `tauri.conf.json` is higher than the last release
- **Signing issues**: Verify `TAURI_SIGNING_PRIVATE_KEY` and `TAURI_SIGNING_PRIVATE_KEY_PASSWORD` secrets are set

### Manual Workflow Trigger

You can also trigger a release manually:

1. Go to [Actions](https://github.com/omznc/farmer/actions)
2. Select the "Release" workflow
3. Click "Run workflow"
4. Choose the branch and click "Run workflow"

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Zustand
- **Backend**: Rust, Tauri 2
- **Git**: git2 (Rust)

## License

MIT
