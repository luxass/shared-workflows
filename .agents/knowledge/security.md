# Security Notes

Workflow files should use least-privilege permissions:

- Prefer top-level `permissions: {}`.
- Add job-level permissions only when a job needs them.
- Keep third-party action references pinned to full commit SHAs.
- Keep `persist-credentials: false` unless a later git operation needs credentials.
- Avoid passing untrusted inputs directly into shell command strings.

## Common Permissions

| Permission | Use |
| --- | --- |
| `contents: read` | Checkout and read repository contents. |
| `contents: write` | Release automation, commits, tags, or generated changelogs. |
| `pull-requests: write` | Automation that creates or updates pull requests. |
| `security-events: write` | SARIF uploads to code scanning. |
| `id-token: write` | OIDC flows such as npm provenance or workflow-ref resolution. |

## Reusable Workflow Callers

Reusable workflow permissions are constrained by the caller. If a caller uses top-level `permissions: {}`, the calling job should explicitly grant the permissions required by the reusable workflow.

The examples in `examples/` should show those job-level permissions so consumers can copy a secure working setup.

## Repository-Specific Notes

The zizmor reusable workflow uploads SARIF and therefore needs `security-events: write`. It also uses `id-token: write` to resolve the called reusable workflow ref and fetch the matching shared default config.

The npm release workflow needs `id-token: write` for npm provenance publishing and `contents: write` for changelog/release operations.
