# Update Homebrew Tap

Reusable workflow for updating a Homebrew tap formula and optional cask after a release.

The workflow downloads release assets from the triggering release, computes SHA256 checksums, clones the tap repository, updates the formula and optional cask with the new version and checksums, and creates one pull request.

## Usage

### With GitHub App (recommended)

```yaml
name: Update Homebrew Tap

on:
  release:
    types: [published]

permissions: {}

jobs:
  update-formula:
    permissions:
      contents: read
    uses: luxass/shared-workflows/.github/workflows/reusable-homebrew-tap.yaml@v0.12.0
    with:
      tap-repository: luxass/homebrew-tap
      formula-path: Formula/actioneer.rb
      formula-name: actioneer
      targets: '["aarch64-apple-darwin", "x86_64-apple-darwin", "aarch64-unknown-linux-gnu", "x86_64-unknown-linux-gnu"]'
    secrets:
      app-id: ${{ secrets.HOMEBREW_TAP_APP_ID }}
      app-private-key: ${{ secrets.HOMEBREW_TAP_APP_PRIVATE_KEY }}
```

To update a cask in the same pull request, also provide `cask-path`, `cask-name`, and `cask-target`. For example, `Casks/imessage-relay.rb`, `imessage-relay`, and `macos-universal` select `imessage-relay-<version>-macos-universal.zip`. Pin a release of this workflow that includes cask support, then add these inputs to the calling job:

```yaml
with:
  tap-repository: luxass/homebrew-tap
  formula-path: Formula/imessage-relay-server.rb
  formula-name: imessage-relay-server
  targets: '["macos-universal"]'
  cask-path: Casks/imessage-relay.rb
  cask-name: imessage-relay
  cask-target: macos-universal
```

### With PAT

```yaml
jobs:
  update-formula:
    permissions:
      contents: read
    uses: luxass/shared-workflows/.github/workflows/reusable-homebrew-tap.yaml@v0.12.0
    with:
      tap-repository: luxass/homebrew-tap
      formula-path: Formula/actioneer.rb
      formula-name: actioneer
    secrets:
      token: ${{ secrets.HOMEBREW_TAP_TOKEN }}
```

## Inputs

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `tap-repository` | `string` | - | Homebrew tap repository (e.g. `luxass/homebrew-tap`). |
| `formula-path` | `string` | - | Path to the formula file in the tap repo. |
| `formula-name` | `string` | - | Name of the formula (used for `sha-update-id` markers). |
| `cask-path` | `string` | `""` | Optional path to a cask file in the tap repo. Set with `cask-name` and `cask-target`. |
| `cask-name` | `string` | `""` | Prefix for the versioned cask ZIP and checksum marker. |
| `cask-target` | `string` | `""` | Target suffix for the versioned cask ZIP and checksum marker. |
| `base-branch` | `string` | `main` | Base branch for the PR. |
| `environment` | `string` | `homebrew-tap` | GitHub environment to use. |
| `targets` | `string` | `[darwin arm/x64, linux arm/x64]` | JSON array of targets to update checksums for. |
| `git-user-name` | `string` | `luxass-homebrew` | Git user name for the commit. |
| `git-user-email` | `string` | `luxass-homebrew[bot]@users.noreply.github.com` | Git user email for the commit. |

## Secrets

| Name | Required | Description |
| --- | --- | --- |
| `token` | No | GitHub token for tap repo access. Use as an alternative to GitHub App auth. |
| `app-id` | No | GitHub App client ID. Must be provided together with `app-private-key`. |
| `app-private-key` | No | GitHub App private key. Must be provided together with `app-id`. |

Authentication requirements:

- Provide `secrets.token`, or
- provide both `secrets.app-id` and `secrets.app-private-key`.

## Permissions

The caller can keep top-level permissions empty:

```yaml
permissions: {}
```

Each calling job must grant:

```yaml
permissions:
  contents: read
```

## Formula Requirements

The formula file must contain `sha-update-id` markers for each target:

```ruby
sha256 "..." # sha-update-id: actioneer-aarch64-apple-darwin
sha256 "..." # sha-update-id: actioneer-x86_64-apple-darwin
sha256 "..." # sha-update-id: actioneer-aarch64-unknown-linux-gnu
sha256 "..." # sha-update-id: actioneer-x86_64-unknown-linux-gnu
```

When a cask is configured, its `sha256` line must have a `sha-update-id: <cask-name>-<cask-target>` marker, such as `sha-update-id: imessage-relay-macos-universal`. The cask release ZIP must exist; a missing ZIP stops the update before creating a pull request. Formula-only calls retain their existing handling of missing target archives.

## Jobs

| Job | Description |
| --- | --- |
| `update-formula` | Downloads release assets, computes checksums, updates the formula and optional cask, and creates a PR with a structured summary of updated targets and checksums. |
