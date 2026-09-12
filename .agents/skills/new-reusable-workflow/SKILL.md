---
name: new-reusable-workflow
description: Scaffold a reusable-*.yaml workflow in this repo. Use when adding a new reusable workflow.
---

# New Reusable Workflow

Scaffold a `reusable-*.yaml` workflow. AGENTS.md is the authority on conventions; below is the template plus the checklist that matters.

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
        uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          persist-credentials: false

      - name: setup
        uses: luxass/shared-workflows/actions/setup@3a2dc4e52b786682a0f0fba65eca46b49b7b5c8b # actions/setup/v0.1.5

      # ... workflow steps

      - name: <step name>
        env:
          <VAR_NAME>: ${{ inputs.<input-name> }}
        run: |
          set -euo pipefail
          <command>
```

## Checklist

- Filename `reusable-<name>.yaml`, `on.workflow_call` only, top-level `permissions: {}` always
- Sibling `reusable-<name>.md`: usage, inputs/secrets tables, required caller permissions, jobs and behavior
- Copyable example in `examples/` with minimal caller permissions and `# x-release-please-version`, registered in `release-please-config.json` `extra-files`
- Pin third-party actions to commit SHAs with version comments
- Job-level `permissions:` only as needed, minimal; `persist-credentials: false` on checkout
- Caller-controlled values in env vars before shell use; `set -euo pipefail` in multi-line scripts
- No `pull_request_target` triggers; inputs/secrets must have descriptions
- For GitHub App auth examples, map both `app-id` and `app-private-key` from caller secrets
