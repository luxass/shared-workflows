# GitHub Actions Security Analysis

Reusable workflow for auditing GitHub Actions configuration with [zizmor](https://github.com/zizmorcore/zizmor).

The workflow checks out the caller repository, resolves a zizmor configuration, runs zizmor, and uploads the SARIF result to GitHub code scanning.

By default, zizmor findings fail the workflow after SARIF upload. Set `fail-on-findings: false` to upload SARIF results without failing on findings. The workflow always fails when zizmor exits with code `1`, which indicates a crash or execution error. SARIF upload is allowed to continue on error.

## Usage

Create a workflow in the consuming repository, for example `.github/workflows/ci-security.yaml`:

```yaml
name: GitHub Actions Security Analysis

on:
  workflow_dispatch:
  pull_request:
    types:
      - opened
      - synchronize
    paths:
      - ".github/workflows/**"
  push:
    branches:
      - main
    paths:
      - ".github/workflows/**"

permissions: {}

jobs:
  zizmor:
    permissions:
      actions: read
      contents: read
      security-events: write
      id-token: write
    uses: luxass/shared-workflows/.github/workflows/reusable-ci-security.yaml@v0.4.4
```

## With Custom Arguments

```yaml
jobs:
  zizmor:
    permissions:
      actions: read
      contents: read
      security-events: write
      id-token: write
    uses: luxass/shared-workflows/.github/workflows/reusable-ci-security.yaml@v0.4.4
    with:
      min-severity: medium
      min-confidence: medium
      fail-on-findings: false
      zizmor-version: "1.13.0"
      zizmor-args: "--collect=workflows"
```

## Configuration

The workflow prefers a config file from the caller repository when one exists:

- `.github/zizmor.yml`
- `zizmor.yml`

If the caller does not provide one, the workflow fetches the shared default `.github/zizmor.yml` from the same `shared-workflows` ref that was called.

Set `always-use-default-config: true` to force the shared default config even when the caller repository has its own config file.

When the workflow cannot resolve the called workflow ref through OIDC, it falls back to `luxass/shared-workflows@main` for the shared default config lookup.

## Inputs

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `min-severity` | `string` | `low` | Only show results at or above this severity. Possible values: `unknown`, `informational`, `low`, `medium`, `high`. |
| `min-confidence` | `string` | `low` | Only show results at or above this confidence level. Possible values: `unknown`, `low`, `medium`, `high`. |
| `fail-on-findings` | `boolean` | `true` | Fail the workflow when zizmor finds issues. Set to `false` to only upload SARIF results. |
| `zizmor-version` | `string` | `latest` | Version of zizmor to install with `uvx`. |
| `zizmor-args` | `string` | `""` | Additional arguments passed to zizmor. |
| `always-use-default-config` | `boolean` | `false` | Always use the shared default config, even if the caller repository has its own. |

## Secrets

| Name | Required | Description |
| --- | --- | --- |
| `token` | No | GitHub token used by zizmor for API calls. Defaults to `GITHUB_TOKEN`. |

## Permissions

The caller job should grant:

| Permission | Reason |
| --- | --- |
| `actions: read` | Read workflow/action metadata used during analysis. |
| `contents: read` | Checkout and repository analysis. |
| `security-events: write` | Upload SARIF to code scanning. |
| `id-token: write` | Resolve the called workflow ref so the matching shared config can be fetched. |

## Jobs

| Job | Description |
| --- | --- |
| `resolve-workflow-ref` | Resolves the `shared-workflows` owner, repository, and ref from the OIDC `job_workflow_ref` claim. |
| `zizmor` | Runs zizmor with the configured severity and confidence thresholds, uploads `results.sarif` to code scanning, and optionally fails on findings. |
