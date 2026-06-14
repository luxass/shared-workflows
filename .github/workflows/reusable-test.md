# Test

Reusable workflow for running tests in pnpm based Node.js projects.

The workflow checks out the repository, installs dependencies with pnpm, optionally runs pre-test and post-test pnpm commands, and runs the configured test command.

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
    uses: luxass/shared-workflows/.github/workflows/reusable-test.yaml@v0.8.2
```

## With Custom Test Command

```yaml
jobs:
  test:
    permissions:
      contents: read
    uses: luxass/shared-workflows/.github/workflows/reusable-test.yaml@v0.8.2
    with:
      node-version: 22
      test-script: "test:ci"
      install-args: "--prefer-offline"
```

## With Pre/Post Test Commands

Run `pnpm build` before tests, `pnpm coverage` after tests, or provide any other pnpm arguments that should run before or after the test step.

```yaml
jobs:
  test:
    permissions:
      contents: read
    uses: luxass/shared-workflows/.github/workflows/reusable-test.yaml@v0.8.2
    with:
      pre-test-script: "build"
      test-script: "test:ci"
      post-test-script: "coverage"
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
| `pre-test-script` | `string` | `""` | Optional arguments passed to `pnpm` before the test step. Skipped when empty. |
| `test-script` | `string` | `test` | Arguments passed to `pnpm` for the test step. |
| `post-test-script` | `string` | `""` | Optional arguments passed to `pnpm` after the test step. Skipped when empty. |

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
| `test` | Runs setup, optionally runs the configured pre-test command, runs the configured `pnpm` test command, then optionally runs the configured post-test command. |

The pre-test, test, and post-test script inputs are passed to `pnpm` through `actions/run-pnpm` without shell re-interpretation.
