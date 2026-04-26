# AGENTS.md

Instructions for coding agents working in this repository.

## Project Overview

All workflows in this repository are intended to be shared workflows that can be reused across repositories in the `luxass` account. The repository centralizes common CI, test, security, and release automation so consumer repositories can call a maintained workflow instead of copying workflow logic.

The public surface is:

- reusable workflows under `.github/workflows/reusable-*.yaml`
- composite actions under `actions/*/action.yaml`
- examples under `examples/`
- workflow documentation next to each reusable workflow

Treat changes here as changes to shared infrastructure. A workflow edit can affect many downstream repositories once a new tag is released.

## Reference Documentation

Use these primary references when changing workflows:

- [GitHub Actions workflow syntax](https://docs.github.com/en/actions/writing-workflows/workflow-syntax-for-github-actions)
- [GitHub Actions reusable workflows](https://docs.github.com/en/actions/reference/workflows-and-actions/reusable-workflows)
- [GitHub Actions secure use reference](https://docs.github.com/actions/learn-github-actions/security-hardening-for-github-actions)
- [GitHub Actions OIDC hardening](https://docs.github.com/en/actions/security-for-github-actions/security-hardening-your-deployments/about-security-hardening-with-openid-connect)

## Shared Workflow Model

Workflows that are meant for consumers must be reusable workflows using `on.workflow_call`. They should use the `reusable-` filename prefix:

- `.github/workflows/reusable-ci.yaml`
- `.github/workflows/reusable-test.yaml`
- `.github/workflows/reusable-ci-security.yaml`
- `.github/workflows/reusable-release-npm.yaml`

Workflows without the `reusable-` prefix are only for automation that runs in this repository itself, such as release maintenance or wrappers that exercise the reusable workflows locally. Repository workflows may call a reusable workflow with a local path:

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

Do not mix `workflow_call` with normal triggers in the same workflow. Keeping reusable workflows separate from repository workflows makes `inputs`, permissions, and documentation easier to reason about.

## Workflow API Style

Treat each reusable workflow as a public API.

- Prefer explicit `workflow_call.inputs` with descriptions, types, defaults, and `required`.
- Prefer optional secrets with clear descriptions unless a workflow cannot function without them.
- Avoid changing input names or defaults casually.
- Keep output names stable if outputs are added later.
- Keep examples in `examples/` aligned with the public interface.

When adding a required permission to a reusable workflow, update every caller example to grant that permission on the calling job.

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

Examples must be copyable and complete. A consumer should be able to copy an example workflow and have the required permissions already set correctly.

## Permissions

Every workflow must set top-level permissions to an empty object:

```yaml
permissions: {}
```

This applies to reusable workflows, repository workflows, and all examples. Do not rely on GitHub's default `GITHUB_TOKEN` permissions.

Every job that needs token access must declare its own minimal `permissions:` block. Grant only the permissions required by that job and no broader access. If a job does not need token access, do not add job-level permissions.

Reusable workflow permissions are constrained by the caller. Because all examples use top-level `permissions: {}`, each calling job must explicitly grant the permissions required by the called workflow.

The permissions shown in `examples/*.yaml` should be exactly the permissions needed for the reusable workflow to run successfully, with no extra privileges. When workflow permissions change, update the matching example in the same change.

Use the narrowest practical permission level:

- Checkout/read-only repository access: `contents: read`
- GitHub Actions metadata for security analysis: `actions: read`
- SARIF upload to code scanning: `security-events: write`
- OIDC token minting: `id-token: write`
- Release commits, tags, changelogs, or GitHub releases: `contents: write`
- Pull request automation: `pull-requests: write`

Before adding any `write` permission, document why the job needs it in the workflow documentation or make the reason obvious from the job name and steps.

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

## GitHub Actions Security

Follow GitHub's secure use guidance when editing workflows.

- Treat `pull_request_target` as a banned trigger. Do not add it to workflows unless the user explicitly asks for it, the workflow never checks out or executes untrusted pull request code, and the security rationale is documented in the workflow documentation.
- Use `pull_request` for pull request validation.
- Treat workflow inputs, PR metadata, issue comments, branch names, commit messages, and file contents as untrusted data.
- Put caller-controlled values in environment variables before shell use, then quote them.
- Do not check out untrusted code in jobs that have write tokens or sensitive secrets.
- Keep `GITHUB_TOKEN` scoped to the minimum required permissions for the specific job.
- Prefer OIDC over long-lived cloud or registry credentials where the target service supports it.
- Be cautious with self-hosted runners, especially for repositories that accept pull requests from forks.

The `reusable-ci-security.yaml` workflow uses zizmor for static analysis of GitHub Actions definitions. It uploads SARIF and therefore requires `security-events: write`; it also uses `actions: read` during analysis and `id-token: write` to resolve the called reusable workflow ref and fetch the matching shared default config.

## Securing Workflows With Zizmor

Use these references when changing the zizmor workflow or interpreting zizmor findings:

- [zizmor usage](https://docs.zizmor.sh/usage/)
- [zizmor configuration](https://docs.zizmor.sh/configuration/)

Use zizmor concepts when reviewing GitHub Actions security:

- Prefer explicit minimum permissions over broad defaults.
- Pin third-party actions to commit SHAs.
- Avoid shell injection patterns from untrusted contexts.
- Keep `persist-credentials: false` on checkout unless git credentials are required later.
- Prefer trusted publishing/OIDC over long-lived registry tokens.

When updating `reusable-ci-security.yaml`, keep `.github/workflows/reusable-ci-security.md` and `examples/ci-security.yaml` aligned with the workflow inputs, permissions, and behavior.

## Shell Safety

For multi-line shell scripts in workflows, use:

```bash
set -euo pipefail
```

Quote variables unless word splitting is intentional. Put user-controlled or caller-controlled values in environment variables before using them in shell commands.

Avoid constructing shell commands from untrusted inputs. If an input is intentionally passed as command arguments, document that behavior in the workflow Markdown file.

## Release Please

Release Please updates versions in the files listed in `release-please-config.json`.

The current `extra-files` entries point to example workflow files. Preserve `# x-release-please-version` comments in examples so Release Please can keep reusable workflow versions current.

This repository has two release components:

- the root workflow package, released as tags like `v0.4.4`
- `actions/setup`, released as tags like `actions/setup/v0.1.1`

The `update-action-refs` workflow updates internal references to `actions/setup` after that action is released.

## Finishing Changes

Keep changes in coherent batches:

- workflow behavior changes
- documentation/example updates
- release configuration changes

Do not mix unrelated refactors with workflow behavior changes. Before finishing, run `git diff --check` and inspect the final diff for stale docs, examples, or permissions.
