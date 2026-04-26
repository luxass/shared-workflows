# Test

Reusable workflow for running tests in pnpm based Node.js projects.

The workflow checks out the repository, installs dependencies with pnpm, and runs the configured test command.

## Usage

Create a workflow in the consuming repository, for example `.github/workflows/test.yaml`:

```yaml
name: Test

on:
  push:
    branches:
      - main
  pull_request:
    types:
      - opened
      - synchronize

permissions: {}

jobs:
  test:
    permissions:
      contents: read
    uses: luxass/shared-workflows/.github/workflows/reusable-test.yaml@v0.4.4
```

## With Custom Test Command

```yaml
jobs:
  test:
    permissions:
      contents: read
    uses: luxass/shared-workflows/.github/workflows/reusable-test.yaml@v0.4.4
    with:
      node-version: 22
      test-script: "test:ci"
      install-args: "--prefer-offline"
```

## Inputs

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `node-version` | `string` | `lts/*` | Node.js version to use. |
| `persist-credentials` | `boolean` | `false` | Whether checkout should persist git credentials. |
| `fetch-depth` | `number` | `1` | Number of commits to fetch. Use `0` for full history. |
| `submodules` | `string` | `false` | Whether to checkout submodules. Use `true` or `recursive`. |
| `node-version-file` | `string` | `""` | File containing the Node.js version, such as `.nvmrc`, `.node-version`, or `package.json`. |
| `registry-url` | `string` | `""` | Registry URL to configure for authentication. |
| `scope` | `string` | `""` | Scope for authenticating against scoped registries. |
| `install-args` | `string` | `""` | Additional arguments passed to `pnpm install`. |
| `test-script` | `string` | `test` | Arguments passed to `pnpm` for the test step. |

## Secrets

| Name | Required | Description |
| --- | --- | --- |
| `token` | No | GitHub token used for checkout. Defaults to `GITHUB_TOKEN`. |

## Permissions

The caller can keep top-level permissions empty:

```yaml
permissions: {}
```

The caller job should grant `contents: read` because the reusable workflow checks out the repository.

## Jobs

| Job | Description |
| --- | --- |
| `test` | Runs setup, then runs the configured `pnpm` test command. |
