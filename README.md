# Farmer

A git-powered time tracking desktop application built with Tauri.

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
  - **Linux**: `libwebkit2gtk-4.1-dev`, `libappindicator3-dev`, `librsvg2-dev`, `patchelf`
  - **macOS**: Xcode Command Line Tools
  - **Windows**: Microsoft Visual Studio C++ Build Tools

### Setup

```bash
# Clone the repository
git clone https://github.com/omznc/farmer.git
cd farmer

# Install dependencies
bun install

# Run in development mode
bun run tauri:dev
```

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

Releases are automated via GitHub Actions:

1. Update the version in `src-tauri/tauri.conf.json`
2. Push to the `release` branch
3. The workflow will build all platforms and create a draft release

## Tech Stack

- **Frontend**: React 19, TypeScript, Vite, Tailwind CSS, Zustand
- **Backend**: Rust, Tauri 2
- **Git**: git2 (Rust)

## License

MIT
