---
name: new-reusable-workflow
description: Scaffold a new reusable GitHub Actions workflow following repository conventions. Use when creating/adding a new reusable workflow, or when the user says "create workflow", "add workflow", "new reusable workflow".
---

# New Reusable Workflow

Scaffold a `reusable-*.yaml` workflow that follows AGENTS.md conventions.

## Workflow

1. **Clarify the workflow purpose** - what does it do, what jobs/steps are needed
2. **Define the public API** - inputs, secrets, outputs with descriptions, types, defaults
3. **Generate the workflow** using the template below
4. **Create sibling docs** - `reusable-<name>.md` with usage, inputs, secrets, permissions
5. **Add/update example** in `examples/` with correct permissions
6. **Add to release-please-config.json** - add the new workflow path to the `extra-files` array so Release Please updates its version tag in examples

## Template

```yaml
name: <Human-readable name>

on:
  workflow_call:
    inputs:
      <input-name>:
        description: "<What this input controls>"
        type: <string|boolean|number|choice>
        default: "<default value>"
        required: false
    secrets:
      <secret-name>:
        description: "<What this secret is for>"
        required: false

permissions: {}

jobs:
  <job-name>:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - name: checkout
        uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
        with:
          persist-credentials: false

      - name: setup
        uses: luxass/shared-workflows/actions/setup@36ff555d8540defbb303af3e544ed1bad1848fe4 # v0.4.4

      # ... workflow steps

      - name: <step name>
        env:
          <VAR_NAME>: ${{ inputs.<input-name> }}
        run: |
          set -euo pipefail
          <command>
```

## Rules

- Filename: `reusable-<name>.yaml`
- Top-level `permissions: {}` always
- Job-level `permissions:` only as needed, minimal
- Pin third-party actions to commit SHAs with version comments
- Use `persist-credentials: false` on checkout
- Put caller-controlled values in env vars before shell use
- `set -euo pipefail` in all multi-line shell scripts
- No `pull_request_target` triggers
- Inputs/secrets must have descriptions
- For GitHub App auth examples, prefer mapping both `app-id` and `app-private-key` from caller secrets for consistency
- Follow the existing repo patterns (pnpm, actions/setup, etc.)

## Sibling doc structure

Create `reusable-<name>.md` covering:

- What the workflow does
- Usage example
- Inputs table (name, type, default, description)
- Secrets table (name, required, description)
- Required caller permissions
- Jobs and notable behavior

## Example workflow

Add to `examples/` with:

```yaml
jobs:
  <job>:
    uses: luxass/shared-workflows/.github/workflows/reusable-<name>.yaml@v0.0.0 # x-release-please-version
    permissions:
      contents: read
```
