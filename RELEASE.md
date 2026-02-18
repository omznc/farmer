# Release Guide

Quick reference for creating new releases of Farmer.

## Quick Release

```bash
# 1. Update version in src-tauri/tauri.conf.json
vim src-tauri/tauri.conf.json  # Change "version": "0.X.0"

# 2. Commit and push to release branch
git add src-tauri/tauri.conf.json
git commit -m "chore: bump version to 0.X.0"
git push origin main:release

# 3. Wait for GitHub Actions to build (10-20 min)
# 4. Go to GitHub Releases and publish the draft
```

## Detailed Steps

### 1. Version Update

Edit `src-tauri/tauri.conf.json`:

```json
{
  "version": "0.X.0"  // <- Update this number
}
```

**Version Numbering:**
- Major: Breaking changes (1.0.0)
- Minor: New features (0.2.0)
- Patch: Bug fixes (0.1.1)

### 2. Commit Changes

```bash
git add src-tauri/tauri.conf.json
git commit -m "chore: bump version to 0.X.0"
```

### 3. Push to Release Branch

**From main:**
```bash
git push origin main:release
```

**From feature branch:**
```bash
git push origin your-branch:release
```

### 4. Monitor Build

- URL: https://github.com/omznc/farmer/actions
- Workflow: "Release"
- Duration: ~10-20 minutes
- Platforms built:
  - ✅ macOS (Intel + ARM)
  - ✅ Linux (x64 + ARM64)
  - ✅ Windows (x64)

### 5. Publish Release

1. Go to: https://github.com/omznc/farmer/releases
2. Find the draft release (v0.X.0)
3. Review attached assets (should have 10+ files)
4. Edit release notes:
   ```markdown
   ## What's New
   - Feature 1
   - Feature 2
   
   ## Bug Fixes
   - Fixed issue 1
   - Fixed issue 2
   
   ## Full Changelog
   https://github.com/omznc/farmer/compare/v0.X-1.0...v0.X.0
   ```
5. Click **"Publish release"**

## Artifacts

Each release includes:

| Platform | Files |
|----------|-------|
| macOS ARM | `.app.tar.gz`, `.dmg` |
| macOS Intel | `.app.tar.gz`, `.dmg` |
| Linux x64 | `.deb`, `.rpm`, `.AppImage`, `.tar.gz` |
| Linux ARM64 | `.deb`, `.rpm`, `.AppImage`, `.tar.gz` |
| Windows x64 | `.msi`, `.exe` |

## Troubleshooting

### Build Fails

1. Check Actions logs: https://github.com/omznc/farmer/actions
2. Look for the failed platform
3. Common issues:
   - Dependency installation failed
   - Compilation errors
   - Signing failures

### Missing Signing

Ensure GitHub secrets are set:
- `TAURI_SIGNING_PRIVATE_KEY`
- `TAURI_SIGNING_PRIVATE_KEY_PASSWORD`

To add/update secrets:
1. Go to: Settings → Secrets and variables → Actions
2. Add or update the required secrets

### Version Already Exists

If you get "tag already exists":

```bash
# Delete the tag locally and remotely
git tag -d v0.X.0
git push origin :refs/tags/v0.X.0

# Then push again
git push origin main:release
```

### Rollback a Release

1. Go to Releases page
2. Click on the release to rollback
3. Click "Delete release"
4. Delete the associated tag:
   ```bash
   git push origin :refs/tags/v0.X.0
   ```

## Manual Workflow Trigger

Instead of pushing to the release branch, you can trigger manually:

1. Go to: https://github.com/omznc/farmer/actions
2. Select "Release" workflow
3. Click "Run workflow"
4. Select branch: `main` (or your feature branch)
5. Click "Run workflow"

## Post-Release

### Verify Auto-Update

1. Open an older version of the app
2. Wait 60 seconds (auto-update check interval)
3. Should show update notification
4. Click to update and verify installation

### Update Main Branch

After release, ensure main branch has the version bump:

```bash
git checkout main
git pull origin main

# If version bump was on a separate branch:
git merge release-0.X.0
git push origin main
```

## Hotfix Release

For urgent bug fixes:

```bash
# 1. Create hotfix branch from current release tag
git checkout -b hotfix-0.1.1 v0.1.0

# 2. Make your fixes
git add .
git commit -m "fix: critical bug"

# 3. Update version to 0.1.1
vim src-tauri/tauri.conf.json

# 4. Commit version bump
git add src-tauri/tauri.conf.json
git commit -m "chore: bump version to 0.1.1"

# 5. Push to release
git push origin hotfix-0.1.1:release

# 6. After release, merge back to main
git checkout main
git merge hotfix-0.1.1
git push origin main
```

## CI/CD Details

### Workflow Files

- `.github/workflows/release.yml` - Release builds
- `.github/workflows/ci.yml` - CI checks (lint, build)

### Build Configuration

Releases use **vendored OpenSSL** for reproducible builds across all platforms. This is automatically configured in the workflow with the `--features vendored-openssl` flag.

### Build Matrix

```yaml
platforms:
  - macos-latest (targets: aarch64, x86_64)
  - ubuntu-22.04 (target: x86_64)
  - ubuntu-22.04-arm (target: aarch64)
  - windows-latest (target: x86_64)
```

## Notes

- **Auto-update**: Users will automatically receive updates
- **Code signing**: Binaries are signed with Tauri's signing key
- **Release branch**: Can be force-pushed (used as trigger branch)
- **Draft releases**: Always created as drafts for review
- **Version format**: Must follow semver (0.X.0)