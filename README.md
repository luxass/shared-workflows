# shared-workflows

Reusable GitHub Actions workflows and composite actions for Node.js projects using pnpm.

## Included Workflows

- **CI**: Runs build, lint, and typecheck (each toggleable)
- **Test**: Runs tests
- **CI Security**: Runs [zizmor](https://github.com/woodruffw/zizmor) security analysis on workflows
- **Release (npm)**: Publish packages to npm with OIDC provenance

## Included Actions

- **[`actions/setup`](./actions/setup/action.yaml)**: Checkout, pnpm, Node.js, and dependency installation

## Usage

Reference a workflow in your project's `.github/workflows/*.yml`:

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:

permissions: {}

jobs:
  ci:
    uses: luxass/shared-workflows/.github/workflows/ci.yaml@v0.1.0
  test:
    uses: luxass/shared-workflows/.github/workflows/test.yaml@v0.1.0
```

See the [`examples/`](./examples) folder for full workflow configurations:

- [CI](./examples/ci.yaml)
- [Test](./examples/test.yaml)
- [CI Security](./examples/ci-security.yaml)
- [Release (npm)](./examples/release-npm.yaml)

## Contributing

See [CONTRIBUTING.md](./CONTRIBUTING.md) for the release process and how the two-component versioning works.

## 📄 License

Published under [MIT License](./LICENSE).
