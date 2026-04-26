# CI

Reusable workflow for the standard Node.js CI checks in pnpm projects.

The workflow checks out the repository, installs dependencies with pnpm, and can run build, lint, format, and typecheck commands. Each command can be toggled or renamed by the caller.

## Usage

Create a workflow in the consuming repository, for example `.github/workflows/ci.yaml`:

```yaml
name: CI

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
  ci:
    permissions:
      contents: read
    uses: luxass/shared-workflows/.github/workflows/reusable-ci.yaml@v0.4.4
```

## With Custom Scripts

```yaml
jobs:
  ci:
    permissions:
      contents: read
    uses: luxass/shared-workflows/.github/workflows/reusable-ci.yaml@v0.4.4
    with:
      node-version: 22
      build-script: "build"
      lint-script: "lint"
      fmt: true
      fmt-script: "fmt:check"
      typecheck-script: "typecheck"
```

## Inputs

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `node-version` | `string` | `lts/*` | Node.js version to use. |
| `build` | `boolean` | `true` | Run the build step. |
| `build-script` | `string` | `build` | Arguments passed to `pnpm` for the build step. |
| `lint` | `boolean` | `true` | Run the lint step. |
| `lint-script` | `string` | `lint` | Arguments passed to `pnpm` for the lint step. |
| `fmt` | `boolean` | `false` | Run the fmt step. |
| `fmt-script` | `string` | `fmt` | Arguments passed to `pnpm` for the fmt step. |
| `typecheck` | `boolean` | `true` | Run the typecheck step. |
| `typecheck-script` | `string` | `typecheck` | Arguments passed to `pnpm` for the typecheck step. |
| `persist-credentials` | `boolean` | `false` | Whether checkout should persist git credentials. |
| `fetch-depth` | `number` | `1` | Number of commits to fetch. Use `0` for full history. |
| `submodules` | `string` | `false` | Whether to checkout submodules. Use `true` or `recursive`. |
| `node-version-file` | `string` | `""` | File containing the Node.js version, such as `.nvmrc`, `.node-version`, or `package.json`. |
| `registry-url` | `string` | `""` | Registry URL to configure for authentication. |
| `scope` | `string` | `""` | Scope for authenticating against scoped registries. |
| `install-args` | `string` | `""` | Additional arguments passed to `pnpm install`. |

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
| `ci` | Runs setup, then the enabled `pnpm` commands. |
