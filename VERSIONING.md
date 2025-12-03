# Version Management with Changesets

This project uses [Changesets](https://github.com/changesets/changesets) for version management and changelog generation. Changesets is designed specifically for monorepos and provides controlled, predictable releases.

## How It Works

### 1. Development Phase

When you make changes that should be included in a release:

```bash
# Add a changeset for your changes
bun changeset add
```

This interactive CLI will ask you:

- Which packages are affected by your changes?
- What type of release is this? (patch/minor/major)
- A summary of the changes

### 2. Release Phase

When you're ready to create a release:

1. **Automatic Version PR**: The GitHub Actions workflow automatically creates a "Version Packages" pull request when changesets exist
2. **Version Updates**: This PR updates package versions and generates CHANGELOG.md files
3. **Merge & Release**: Merging the version PR triggers the release process

### 3. Publishing & Docker

After version PR is merged:

- Packages are published (if configured)
- Docker images are built with semantic version tags
- GitHub releases are created with changelogs

## Configuration

### Changeset Configuration (`.changeset/config.json`)

- **Linked packages**: `@reafrac/database`, `@reafrac/feed-utils`, `@reafrac/external-script` (always version together)
- **Ignored packages**: `@reafrac/web` (versioned separately via Docker)
- **Base branch**: `main`

### Docker Image Tags

- **Development builds**: `ghcr.io/rulasfia/reafrac:dev-latest` (built on code changes)
- **Release builds**:
  - `ghcr.io/rulasfia/reafrac:1.2.3` (full version)
  - `ghcr.io/rulasfia/reafrac:1.2` (minor version)
  - `ghcr.io/rulasfia/reafrac:1` (major version)
  - `ghcr.io/rulasfia/reafrac:latest` (latest stable)

### Workflow Separation

- **docker.yml**: Builds `dev-latest` on code changes (skips changeset-only commits)
- **release.yml**: Handles versioning and semantic releases (only runs when changesets exist)

## Workflows

### Development Workflow

```bash
# Make your changes
git add .
git commit -m "feat: add new feature"

# Add a changeset
bun changeset add
# Select affected packages, version type, and write summary

# Push your changes
git push
```

### Release Workflow

1. Push changes to `main` branch
   - Code changes → `dev-latest` Docker image built
   - Changeset changes → "Version Packages" PR created
2. Review and merge version PR
3. Automatic release with semantic Docker images and GitHub release

## Available Scripts

```bash
# Add a changeset for current changes
bun changeset add

# Update versions and changelogs (consumes changesets)
bun version-packages

# Build and publish packages
bun release

# Check if there are changesets to be released
bun changeset status
```

## Version Information

The web application includes version information that's automatically injected during build:

- **Version endpoint**: `/version` - Shows current version and build info
- **Environment variables**: `VITE_APP_VERSION`, `BUILD_DATE`
- **Docker labels**: Version and build metadata

## Best Practices

### Changeset Guidelines

- **Minor**: New features, user-facing changes
- **Patch**: Bug fixes, documentation updates
- **Major**: Breaking changes, significant architectural changes

### Commit Messages

Use conventional commits to help with changelog clarity:

- `feat:` for new features
- `fix:` for bug fixes
- `chore:` for maintenance
- `docs:` for documentation

### Release Frequency

- Release when you have meaningful changes accumulated
- Don't release every single commit
- Use changesets to group related changes

## Troubleshooting

### No Version PR Created

- Ensure you have changesets in `.changeset/` directory
- Check that changesets follow the correct format
- Verify GitHub Actions permissions

### Version Conflicts

- Run `bun changeset status` to check for issues
- Ensure all changesets are properly formatted
- Check for merge conflicts in version PR

### Docker Build Issues

- Verify build arguments are passed correctly
- Check that version environment variables are set
- Ensure Dockerfile supports version injection

## Examples

### Adding a New Feature

```bash
# Make changes to @reafrac/web
git add .
git commit -m "feat: add dark mode toggle"

# Add changeset
bun changeset add
# Select: @reafrac/web
# Select: minor
# Summary: "Added dark mode toggle to reader interface"

git push
# This will create a version PR when merged
```

### Fixing a Bug

```bash
# Fix bug in @reafrac/database
git add .
git commit -m "fix: resolve connection pool issue"

# Add changeset
bun changeset add
# Select: @reafrac/database (will also include linked packages)
# Select: patch
# Summary: "Fixed database connection pool timeout issue"

git push
```

### Breaking Changes

```bash
# Make breaking API changes
git add .
git commit -m "feat!: redesign authentication API"

# Add changeset
bun changeset add
# Select: affected packages
# Select: major
# Summary: "BREAKING: Redesigned authentication API with new endpoints"

git push
```

This system ensures predictable, documented releases with proper versioning and changelogs for your monorepo.
