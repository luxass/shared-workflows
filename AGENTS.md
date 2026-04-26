# AGENTS.md

Guidance for agents working in this repository.

## Repository Purpose

This repository publishes reusable GitHub Actions workflows and composite actions for pnpm based Node.js projects.

The public surface is:

- reusable workflows under `.github/workflows/reusable-*.yaml`
- composite actions under `actions/*/action.yaml`
- examples under `examples/`
- workflow documentation next to each reusable workflow

## Reusable Workflow Rules

Reusable workflows must use `on.workflow_call` and the `reusable-` filename prefix:

- `.github/workflows/reusable-ci.yaml`
- `.github/workflows/reusable-test.yaml`
- `.github/workflows/reusable-ci-security.yaml`
- `.github/workflows/reusable-release-npm.yaml`

Workflows without the `reusable-` prefix are reserved for automation that runs in this repository itself. Repository workflows may call a reusable workflow with a local path:

```yaml
jobs:
  ci:
    uses: ./.github/workflows/reusable-ci.yaml
```

External consumers should call a pinned ref:

```yaml
jobs:
  ci:
    uses: luxass/shared-workflows/.github/workflows/reusable-ci.yaml@v0.4.4
```

Do not mix `workflow_call` with normal triggers in the same workflow unless there is a strong reason. Keeping reusable workflows separate from repository workflows makes `inputs`, permissions, and documentation easier to reason about.

## Caller Interface

Treat each reusable workflow as a public API.

- Prefer explicit `workflow_call.inputs` with descriptions, types, defaults, and `required`.
- Prefer optional secrets with clear descriptions unless a workflow cannot function without them.
- Avoid changing input names or defaults casually.
- Keep output names stable if outputs are added later.
- Keep examples in `examples/` aligned with the public interface.

When adding a required permission to a reusable workflow, update every caller example to grant that permission on the calling job.

## Permissions

Use least-privilege token permissions.

- Prefer top-level `permissions: {}` in caller examples.
- Add job-level permissions only where needed.
- For checkout-only jobs, use `contents: read`.
- For SARIF upload, use `security-events: write`.
- For OIDC flows, use `id-token: write`.
- For release automation that writes tags, releases, branches, or pull requests, use the narrowest required write permissions.

Remember that reusable workflow permissions are constrained by the caller. A caller using `permissions: {}` should explicitly grant the permissions required by the called workflow job.

## Pinning

Keep third-party actions pinned to full commit SHAs in workflow files. Version comments are useful, but the executable ref should be the SHA.

Good:

```yaml
uses: actions/checkout@de0fac2e4500dabe0009e67214ff5f5447ce83dd # v6.0.2
```

Avoid:

```yaml
uses: actions/checkout@v6
```

Internal reusable workflow examples should use release tags so consumers can copy them:

```yaml
uses: luxass/shared-workflows/.github/workflows/reusable-ci.yaml@v0.4.4 # x-release-please-version
```

Keep the `# x-release-please-version` marker on example `uses:` lines that Release Please should update.

## Secrets And Tokens

Use `github.token` or `GITHUB_TOKEN` unless a workflow genuinely needs a different token.

- Do not persist checkout credentials unless a later step needs git authentication.
- Keep `persist-credentials: false` as the default for checkout.
- Do not echo secrets or tokens.
- Pass secrets through `workflow_call.secrets` only when the reusable workflow needs them.
- Use `secrets: inherit` only in examples where inheriting caller secrets is expected.

For GitHub App automation, keep app credentials in environment-protected secrets and document the required secret names.

## Shell Safety

For multi-line shell scripts in workflows, prefer:

```bash
set -euo pipefail
```

Quote variables unless word splitting is intentional. Put user-controlled or caller-controlled values in environment variables before using them in shell commands.

Avoid constructing shell commands from untrusted inputs. If an input is intentionally passed as command arguments, document that behavior in the workflow Markdown file.

## Documentation

Each reusable workflow should have a sibling Markdown file with the same basename:

- `.github/workflows/reusable-ci.md`
- `.github/workflows/reusable-test.md`
- `.github/workflows/reusable-ci-security.md`
- `.github/workflows/reusable-release-npm.md`

Repository-maintenance workflows do not need dedicated Markdown docs.

Reusable workflow docs should cover:

- what the workflow does
- usage examples
- inputs
- secrets
- required caller permissions
- jobs and notable behavior

When reusable workflow inputs, secrets, permissions, or behavior change, update the matching Markdown file and any affected example in `examples/`.

## Release Please

Release Please updates versions in the files listed in `release-please-config.json`.

The current `extra-files` entries point to example workflow files. Renaming reusable workflow files does not require changing `release-please-config.json` unless files under `examples/` are renamed or moved.

This repository has two release components:

- the root workflow package, released as tags like `v0.4.4`
- `actions/setup`, released as tags like `actions/setup/v0.1.1`

The `update-action-refs` workflow updates internal references to `actions/setup` after that action is released.

## Change Checklist

Before finishing a workflow change:

- Check every `workflow_call` file still uses the `reusable-` prefix.
- Search for stale workflow filenames in README, examples, docs, and agent knowledge.
- Confirm examples grant required job-level permissions.
- Confirm third-party actions are SHA-pinned.
- Update sibling Markdown docs for reusable workflow behavior changes.
- Leave unrelated user changes intact.
