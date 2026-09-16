# Tailnet HTTP service

Connect a GitHub-hosted Ubuntu runner to Tailscale with GitHub OIDC, check a private HTTP endpoint, and optionally send a JSON `POST` request.

The workflow uses [`tailscale/github-action`](https://github.com/tailscale/github-action) for installation, OIDC authentication, connectivity checks, and logout. It does not accept a static Tailscale auth key or OAuth client secret.

## Status check

```yaml
name: Private service status

on:
  workflow_dispatch:

permissions: {}

jobs:
  status:
    permissions:
      id-token: write
    uses: luxass/shared-workflows/.github/workflows/reusable-tailnet-http.yaml@v0.11.2
    with:
      tailscale-oauth-client-id: ${{ vars.TS_OAUTH_CLIENT_ID }}
      tailscale-audience: ${{ vars.TS_AUDIENCE }}
      service-url: http://internal-api:8080
      status-path: /health
      status-jq: '.ready == true'
    secrets:
      bearer-token: ${{ secrets.PRIVATE_SERVICE_TOKEN }}
```

`status-jq` is optional. When set, the status response must be valid JSON and the expression must return true.

## Status check followed by an action

Set `action-path` to send one authenticated JSON `POST` request after the status check passes:

```yaml
jobs:
  run-action:
    permissions:
      id-token: write
    uses: luxass/shared-workflows/.github/workflows/reusable-tailnet-http.yaml@v0.11.2
    with:
      tailscale-oauth-client-id: ${{ vars.TS_OAUTH_CLIENT_ID }}
      tailscale-audience: ${{ vars.TS_AUDIENCE }}
      service-url: http://internal-api:8080
      status-path: /health
      action-path: /jobs/run
      action-body: '{"job":"backup"}'
    secrets:
      bearer-token: ${{ secrets.PRIVATE_SERVICE_TOKEN }}
```

The workflow does not retry the action request. A failed or timed-out request may still have caused a side effect.

## Inputs

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `tailscale-oauth-client-id` | `string` | Required | Tailscale OIDC federated identity client ID. |
| `tailscale-audience` | `string` | Required | Tailscale OIDC federated identity audience. |
| `tailscale-tags` | `string` | `tag:ci` | Comma-separated tags for the ephemeral runner node. |
| `service-url` | `string` | Required | Private HTTP or HTTPS base URL, including the port. |
| `status-path` | `string` | `/status` | Path for the status request. |
| `status-jq` | `string` | `""` | Optional jq expression checked against the status response. |
| `action-path` | `string` | `""` | Optional path for a JSON `POST` request. An empty value disables the request. |
| `action-body` | `string` | `{}` | JSON body for the optional `POST` request. |

## Secrets

| Name | Required | Description |
| --- | --- | --- |
| `bearer-token` | Yes | Bearer token sent to both service endpoints. |

The workflow fails before connecting if required configuration is empty. It never prints the bearer token or response bodies.

## Outputs

| Name | Description |
| --- | --- |
| `status-http-code` | HTTP status code returned by the status request. |
| `action-http-code` | HTTP status code returned by the action request, or empty when disabled. |
| `action-performed` | `true` when the action request was sent. |

## Permissions

The caller job must grant only:

```yaml
permissions:
  id-token: write
```

This lets `tailscale/github-action` request a GitHub OIDC token. The workflow does not check out source code and needs no repository permissions.

## GitHub configuration

Store the Tailscale client ID and audience as repository or organization variables:

- `TS_OAUTH_CLIENT_ID`
- `TS_AUDIENCE`

Store the service bearer token as a repository or organization secret.

GitHub does not pass environment secrets through `workflow_call`. A caller can use an environment approval job before invoking this workflow, but it must pass repository or organization secrets to the called workflow.

## Tailscale configuration

The Tailscale federated identity must have:

- issuer `https://token.actions.githubusercontent.com`
- `auth_keys` scope
- the tags supplied through `tailscale-tags`
- claim rules that restrict trusted callers

Example:

```hcl
resource "tailscale_federated_identity" "github_actions" {
  description = "github-actions-example-service"
  issuer      = "https://token.actions.githubusercontent.com"
  subject     = "repo:*"

  custom_claim_rules = {
    repository = "example-org/example-repo"
    ref        = "refs/heads/main"
  }

  scopes = ["auth_keys"]
  tags   = ["tag:ci"]
}
```

The tailnet policy must grant the runner tag access to the service hostname and port. Keep that grant limited to the required destinations and ports.

The service stays private to the tailnet. This workflow does not use Tailscale Funnel.

## OIDC identity with reusable workflows

GitHub preserves the caller's identity in reusable-workflow OIDC tokens:

- `repository`, `ref`, and `workflow` describe the caller
- `job_workflow_ref` identifies this reusable workflow and its ref
- `job_workflow_sha` identifies this reusable workflow's commit

Moving the job implementation to `shared-workflows` therefore does not make callers authenticate as `luxass/shared-workflows`.

A trust policy may also require this workflow:

```hcl
custom_claim_rules = {
  repository       = "example-org/example-repo"
  ref              = "refs/heads/main"
  job_workflow_ref = "luxass/shared-workflows/.github/workflows/reusable-tailnet-http.yaml@refs/tags/v0.11.2"
}
```

Match the exact claim emitted for the pinned workflow ref.

## JSON and multiline text

Build caller-controlled JSON with `jq`:

```bash
payload=$(jq -cn \
  --arg recipient "$RECIPIENT" \
  --arg text "$TEXT" \
  '{recipient: $recipient, text: $text}')
```

`jq --arg` safely encodes quotes, newlines, and other special characters. The workflow validates `action-body` as JSON before sending it.

The workflow does not convert Markdown or HTML. APIs that accept only plain text receive formatting markers literally.

## `luxass/machines` example

[`examples/tailnet-http.yaml`](../../examples/tailnet-http.yaml) checks `GET http://kestrel:8080/status`. A manual input can also enable `POST /send`.

The caller builds the relay payload with `jq`, so multiline message text is encoded safely. The protected `tailnet` environment gates the send path. Scheduled runs remain status-only.

An action-enabled run may send a real iMessage or SMS.

## Pinning

Pin the workflow to a release tag:

```yaml
uses: luxass/shared-workflows/.github/workflows/reusable-tailnet-http.yaml@v0.11.2
```

For maximum immutability, pin a full commit SHA. Update any `job_workflow_ref` or `job_workflow_sha` trust rule when changing the pinned ref.

The workflow pins `tailscale/github-action` to a full commit SHA.
