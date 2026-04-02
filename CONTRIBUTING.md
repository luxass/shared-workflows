# Contributing

## Release Process

This repository uses two independent release components managed by [release-please](https://github.com/googleapis/release-please):

| Component | Path | Tag Format | Example |
|---|---|---|---|
| Workflows | `.` (root) | `v{version}` | `v0.2.0` |
| Setup Action | `actions/setup` | `actions/setup/v{version}` | `actions/setup/v0.1.0` |

### How it works

1. Push commits to `main` using [Conventional Commits](https://www.conventionalcommits.org/) (`feat:`, `fix:`, `chore:`, etc.)
2. Release-please automatically creates a draft PR for each component that has changes
3. Review and merge the release PR
4. Release-please tags the commit and creates a GitHub Release

### When `actions/setup` changes

The reusable workflows (`ci.yaml`, `test.yaml`) reference `actions/setup` by **full SHA** to satisfy strict pinning requirements. When the setup action is released:

1. Merge the `actions/setup` release PR → creates tag `actions/setup/v{version}`
2. The `update-action-refs` workflow triggers automatically and opens a PR updating the SHA references in `ci.yaml` and `test.yaml`
3. Merge that PR
4. Release-please picks up the change and creates a workflows release PR
5. Merge the workflows release PR → creates tag `v{version}`

This means a setup action change results in **three PRs** total:
- `actions/setup` release PR
- Automated SHA ref update PR
- Workflows release PR

### When only workflows change

If you only modify workflow files (not `actions/setup`), only the root component gets a release PR. One PR, one tag.

### Commit scoping

Release-please determines which component a commit belongs to based on file paths:

- Files under `actions/setup/` → `actions/setup` component
- Everything else → root component

### Conventional Commits cheat sheet

| Prefix | Version Bump | Example |
|---|---|---|
| `feat:` | minor | `feat: add coverage support to test workflow` |
| `fix:` | patch | `fix: correct node-version-file passthrough` |
| `feat!:` | major | `feat!: require node 20+` |
| `chore:` | none (changelog only) | `chore: update action descriptions` |
| `deps:` | none (changelog only) | `deps: bump actions/checkout` |
