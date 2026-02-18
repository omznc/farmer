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


MIT License