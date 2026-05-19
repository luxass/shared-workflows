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
    uses: luxass/shared-workflows/.github/workflows/reusable-homebrew-tap.yaml@v0.7.0 # x-release-please-version
    with:
      tap-repository: luxass/homebrew-tap
      formula-path: Formula/actioneer.rb
      formula-name: actioneer
      app-id: ${{ secrets.HOMEBREW_TAP_APP_ID }}
      app-private-key: ${{ secrets.HOMEBREW_TAP_APP_PRIVATE_KEY }}
```

### With PAT

```yaml
jobs:
  update-formula:
    uses: luxass/shared-workflows/.github/workflows/reusable-homebrew-tap.yaml@v0.7.0 # x-release-please-version
    with:
      tap-repository: luxass/homebrew-tap
      formula-path: Formula/actioneer.rb
      formula-name: actioneer
      token: ${{ secrets.HOMEBREW_TAP_TOKEN }}
```

## Inputs

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `tap-repository` | `string` | - | Homebrew tap repository (e.g. `luxass/homebrew-tap`). |
| `formula-path` | `string` | - | Path to the formula file in the tap repo. |
| `formula-name` | `string` | - | Name of the formula (used for `sha-update-id` markers). |
| `token` | `string` | - | GitHub token for tap repo access. Required if not using GitHub App. |
| `app-id` | `string` | - | GitHub App client ID. Required if not using `token`. |
| `app-private-key` | `string` | - | GitHub App private key. Required if not using `token`. |
| `base-branch` | `string` | `main` | Base branch for the PR. |
| `environment` | `string` | `homebrew-tap` | GitHub environment to use. |
| `targets` | `string` | `[darwin arm/x64, linux arm/x64]` | JSON array of targets to update checksums for. |

## Secrets

This workflow does not define explicit `workflow_call` secrets. Pass credentials via `with` inputs from the caller's secrets.

At least one of `token` or `app-id`/`app-private-key` must be provided.

## Permissions

The caller can keep top-level permissions empty:

```yaml
permissions: {}
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
| `update-formula` | Downloads release assets, computes checksums, updates the formula, and creates a PR. |
