# Workflow Conventions

Reusable workflows live in `.github/workflows/` and use the `reusable-` prefix.

## Reusable Workflows

These workflows expose `on.workflow_call` and are intended to be called by other repositories:

- `reusable-ci.yaml`
- `reusable-test.yaml`
- `reusable-ci-security.yaml`
- `reusable-release-npm.yaml`

Use `workflow_call` inputs for caller customization. Keep examples in `examples/` aligned with the public workflow interface.

## Repository Workflows

Workflows that run in this repository should not use the `reusable-` prefix. They can call reusable workflows with a local relative path if needed:

```yaml
jobs:
  ci:
    uses: ./.github/workflows/reusable-ci.yaml
```

## Documentation

Every reusable workflow should have a sibling `.md` file that covers usage, inputs, secrets, permissions, and jobs. Repository-maintenance workflows do not need dedicated Markdown docs.
