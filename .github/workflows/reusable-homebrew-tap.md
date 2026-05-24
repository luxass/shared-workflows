# Update Homebrew Tap

Reusable workflow for updating a Homebrew tap formula after a release.

The workflow downloads release assets from the triggering release, computes SHA256 checksums, clones the tap repository, updates the formula file with new checksums and version, and creates a pull request.

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
    uses: luxass/shared-workflows/.github/workflows/reusable-homebrew-tap.yaml@v0.7.0 # x-release-please-version
    with:
      tap-repository: luxass/homebrew-tap
      formula-path: Formula/actioneer.rb
      formula-name: actioneer
    secrets:
      app-id: ${{ secrets.HOMEBREW_TAP_APP_ID }}
      app-private-key: ${{ secrets.HOMEBREW_TAP_APP_PRIVATE_KEY }}
```

### With PAT

```yaml
jobs:
  update-formula:
    permissions:
      contents: read
    uses: luxass/shared-workflows/.github/workflows/reusable-homebrew-tap.yaml@v0.7.0 # x-release-please-version
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
| `base-branch` | `string` | `main` | Base branch for the PR. |
| `environment` | `string` | `homebrew-tap` | GitHub environment to use. |
| `targets` | `string` | `[darwin arm/x64, linux arm/x64]` | JSON array of targets to update checksums for. |

## Secrets

| Name | Required | Description |
| --- | --- | --- |
| `token` | No | GitHub token for tap repo access. Use as an alternative to GitHub App auth. |
| `app-id` | No | GitHub App client ID. Must be provided together with `app-private-key`. |
| `app-private-key` | No | GitHub App private key. Must be provided together with `app-id`. |

Authentication requirements:

- Provide either `secrets.token`, or
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

## Jobs

| Job | Description |
| --- | --- |
| `update-formula` | Downloads release assets, computes checksums, updates the formula, and creates a PR with a structured summary of updated targets and checksums. |
