# Shared GitHub Actions Workflows

This repository contains reusable GitHub Actions workflows and composite actions for pnpm based Node.js projects. The goal is to keep common CI, test, security, and release logic in one place while each consuming repository can configure it with its own triggers, permissions, inputs, and secrets.

## Available Reusable Workflows

| Workflow | Description | Docs | Example |
| :------- | :---------- | :--- | :------ |
| [reusable-ci.yaml](.github/workflows/reusable-ci.yaml) | Runs build, lint, format, and typecheck steps. Each step is configurable. | [Docs](.github/workflows/reusable-ci.md) | [Example](examples/ci.yaml) |
| [reusable-test.yaml](.github/workflows/reusable-test.yaml) | Installs dependencies and runs the configured pnpm test command. | [Docs](.github/workflows/reusable-test.md) | [Example](examples/test.yaml) |
| [reusable-ci-security.yaml](.github/workflows/reusable-ci-security.yaml) | Runs zizmor security analysis for GitHub Actions and uploads SARIF results. | [Docs](.github/workflows/reusable-ci-security.md) | [Example](examples/ci-security.yaml) |
| [reusable-release-npm.yaml](.github/workflows/reusable-release-npm.yaml) | Publishes packages to npm with OIDC provenance. | [Docs](.github/workflows/reusable-release-npm.md) | [Example](examples/release-npm.yaml) |

Each reusable workflow has its own documentation with inputs, secrets, permissions, examples, and operational notes.

## Available Composite Actions

| Action | Description |
| :----- | :---------- |
| [actions/setup](actions/setup/action.yaml) | Checks out the repository, sets up pnpm and Node.js, and installs dependencies. |

## How To Use A Shared Workflow

In your repository, create a workflow file such as `.github/workflows/ci.yaml`.

Add a job that references one of the reusable workflows:

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

Pin consumers to a release tag, for example `@v0.4.4`. For the most reproducible setup, pin to a full commit SHA.

## Permissions

Examples use top-level `permissions: {}` and grant the required permissions on each calling job. This keeps the token scope narrow and makes the permissions required by each reusable workflow explicit.

## Full Examples

- [CI](examples/ci.yaml)
- [Test](examples/test.yaml)
- [CI Security](examples/ci-security.yaml)
- [Release (npm)](examples/release-npm.yaml)

## Contributing

See [CONTRIBUTING.md](CONTRIBUTING.md) for the release process and how the two-component versioning works.

## License

Published under the [MIT License](LICENSE).
