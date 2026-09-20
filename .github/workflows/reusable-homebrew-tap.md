# Update Homebrew Tap

Reusable workflow for updating a Homebrew tap formula, cask, or both after a release.

The workflow downloads release assets from the triggering release, computes SHA256 checksums, clones the tap repository, updates the configured tap entries, and creates one pull request. Configure at least one formula or cask. Existing formula-only callers can keep their inputs unchanged.

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

### Formula and cask

To update both in the same pull request, provide both sets of inputs. For example, `Casks/imessage-relay.rb`, `imessage-relay`, and `macos-universal` select `imessage-relay-<version>-macos-universal.zip`. Pin a release of this workflow that includes cask support, then use:

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

### Cask only

Omit `formula-path`, `formula-name`, and `targets` when the release has no formula:

```yaml
with:
  tap-repository: luxass/homebrew-tap
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
      targets: '["aarch64-apple-darwin", "x86_64-apple-darwin", "aarch64-unknown-linux-gnu", "x86_64-unknown-linux-gnu"]'
    secrets:
      token: ${{ secrets.HOMEBREW_TAP_TOKEN }}
```

## Inputs

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `tap-repository` | `string` | - | Homebrew tap repository (e.g. `luxass/homebrew-tap`). |
| `formula-path` | `string` | `""` | Optional path to a formula file in the tap repo. Set with `formula-name`. |
| `formula-name` | `string` | `""` | Formula archive prefix and `sha-update-id` marker prefix. |
| `cask-path` | `string` | `""` | Optional path to a cask file in the tap repo. Set with `cask-name` and `cask-target`. |
| `cask-name` | `string` | `""` | Prefix for the versioned cask ZIP and checksum marker. |
| `cask-target` | `string` | `""` | Target suffix for the versioned cask ZIP and checksum marker. |
| `base-branch` | `string` | `main` | Base branch for the PR. |
| `environment` | `string` | `homebrew-tap` | GitHub environment to use. |
| `targets` | `string` | `""` | JSON array of formula targets; required when a formula is configured. |
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

## Tap File Requirements

When a formula is configured, its file must contain `sha-update-id` markers for each target:

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
| `update-formula` | Downloads release assets, computes checksums, updates the configured formula or cask entries, and creates a PR with a structured summary of updated targets and checksums. |
