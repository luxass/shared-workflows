# Test Build Tools

Reusable workflow for testing pnpm based Node.js projects against a build tool package version.

The workflow checks out the repository, installs dependencies with pnpm, adds one build tool package as a dev dependency, then runs build, test, and typecheck commands. Callers can put a matrix around the reusable workflow to test multiple build tools.

## Usage

Create a workflow in the consuming repository, for example `.github/workflows/test-build-tools.yaml`:

```yaml
name: Test Build Tools

on:
  workflow_dispatch:
  schedule:
    - cron: "0 0 * * 0"

permissions: {}

jobs:
  test-build-tools:
    permissions:
      contents: read
    uses: luxass/shared-workflows/.github/workflows/reusable-test-build-tools.yaml@v0.9.0
    with:
      tool-name: vite
      tool-version: latest
```

## With A Matrix

Define the matrix in the caller workflow and pass each matrix value into the reusable workflow.

```yaml
jobs:
  test-build-tools:
    strategy:
      fail-fast: false
      matrix:
        tool:
          - { name: "vite", version: "latest" }
          - { name: "vite", version: "6.0.2" }
          - { name: "webpack", version: "latest" }
    permissions:
      contents: read
    uses: luxass/shared-workflows/.github/workflows/reusable-test-build-tools.yaml@v0.9.0
    with:
      tool-name: ${{ matrix.tool.name }}
      tool-version: ${{ matrix.tool.version }}
```

## Inputs

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `node-version` | `string` | `lts/*` | Node.js version to use. |
| `tool-name` | `string` | Required | Build tool package name to install. |
| `tool-version` | `string` | Required | Build tool package version or dist-tag to install. |
| `persist-credentials` | `boolean` | `false` | Whether checkout should persist git credentials. |
| `fetch-depth` | `number` | `1` | Number of commits to fetch. Use `0` for full history. |
| `submodules` | `string` | `false` | Whether to checkout submodules. Use `true` or `recursive`. |
| `node-version-file` | `string` | `""` | File containing the Node.js version, such as `.nvmrc`, `.node-version`, or `package.json`. |
| `registry-url` | `string` | `""` | Registry URL to configure for authentication. |
| `scope` | `string` | `""` | Scope for authenticating against scoped registries. |
| `install-args` | `string` | `""` | Additional arguments passed to `pnpm install`. |
| `build-script` | `string` | `build` | Arguments passed to `pnpm` for the build step. |
| `test-script` | `string` | `test` | Arguments passed to `pnpm` for the test step. |
| `typecheck-script` | `string` | `typecheck` | Arguments passed to `pnpm` for the typecheck step. |

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
| `test-build-tools` | Installs dependencies, adds the selected build tool as a dev dependency with `pnpm add -Dw`, then runs build, test, and typecheck. |

## Notable Behavior

The workflow modifies the checked out workspace by adding the selected build tool package before running commands. It does not commit or upload those changes.

The build, test, and typecheck inputs are split on shell whitespace and passed as arguments to `pnpm` without shell re-interpretation.
