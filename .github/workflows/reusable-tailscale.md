# Connect to Tailscale

Reusable workflow that connects a job to a [Tailscale](https://tailscale.com) tailnet with [`tailscale/github-action`](https://github.com/tailscale/github-action), verifies the connection, and optionally runs a health check or a script from the calling repository.

The node is created as ephemeral, tagged, and preapproved. It logs out at the end of the job and the coordination server removes it automatically, so no cleanup step is needed.

## Usage

Create a workflow in the consuming repository, for example `.github/workflows/tailscale.yaml`:

```yaml
name: Tailscale

on:
  workflow_dispatch:
  schedule:
    - cron: "0 6 * * 1"

permissions: {}

jobs:
  tailnet:
    permissions:
      id-token: write
      contents: read
    uses: luxass/shared-workflows/.github/workflows/reusable-tailscale.yaml@v0.13.0
    with:
      tags: tag:ci
      ping: app.example.ts.net
    secrets:
      oauth-client-id: ${{ secrets.TS_OAUTH_CLIENT_ID }}
      audience: ${{ secrets.TS_AUDIENCE }}
```

## With A Script

A job that `uses:` a reusable workflow cannot declare its own `steps`, so a script is the way to run caller-specific work while the tunnel is live. The workflow checks the calling repository out and runs the script with `bash`.

```yaml
jobs:
  tailnet:
    permissions:
      id-token: write
      contents: read
    uses: luxass/shared-workflows/.github/workflows/reusable-tailscale.yaml@v0.13.0
    with:
      tags: tag:ci
      ping: app.example.ts.net
      script: .github/tailscale/smoke.sh
    secrets:
      oauth-client-id: ${{ secrets.TS_OAUTH_CLIENT_ID }}
      audience: ${{ secrets.TS_AUDIENCE }}
```

A service health check belongs in the script rather than in this workflow, so the request method, headers, and authentication stay under the caller's control:

```bash
#!/usr/bin/env bash
set -euo pipefail

curl --fail-with-body --silent --show-error \
  --connect-timeout 10 --max-time 30 --retry 2 \
  --header "Authorization: Bearer ${RELAY_TOKEN}" \
  http://app.example.ts.net:8080/healthz
```

The script runs after the connection is verified, and receives these environment variables:

| Variable | Description |
| --- | --- |
| `GITHUB_SERVER_URL`, `GITHUB_REPOSITORY`, `GITHUB_RUN_ID` | Standard GitHub Actions context, useful for building links back to the run. |
| Whatever you put in `script-env` | Sourced from the block above, so the names are yours to choose. |

## With An OAuth Client

Instead of workload identity federation, pass `oauth-secret` and leave `audience` empty:

```yaml
    secrets:
      oauth-client-id: ${{ secrets.TS_OAUTH_CLIENT_ID }}
      oauth-secret: ${{ secrets.TS_OAUTH_SECRET }}
```

## Inputs

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `runs-on` | `string` | `ubuntu-latest` | Runner to use for the job. |
| `environment` | `string` | `tailnet` | GitHub environment to use, for environment-scoped secrets. Must not be empty. |
| `tags` | `string` | - | Comma separated tailnet tags to apply to the node. Must be a comma separated list of `tag:name` values. |
| `hostname` | `string` | `""` | Fixed hostname for the node. Letters, digits, and dashes, 1-63 characters, no leading or trailing dash. Tailscale normalizes it to lowercase. |
| `ping` | `string` | `""` | Comma separated hosts to `tailscale ping` after connecting. |
| `version` | `string` | `latest` | Tailscale CLI version. `latest`, `unstable`, or an exact `x.y.z`. |
| `script` | `string` | `""` | Optional path to a script in the calling repository, run with `bash` after connecting. |

## Secrets

| Name | Required | Description |
| --- | --- | --- |
| `oauth-client-id` | Yes | Tailscale OAuth client ID, or OIDC federated identity client ID. |
| `oauth-secret` | No | Tailscale OAuth client secret. Not needed with workload identity federation. |
| `audience` | No | Tailscale OIDC federated identity audience. Used instead of `oauth-secret`. |
| `script-env` | No | Shell assignments sourced into the script's environment, as `KEY=value` lines. |

Authentication requirements:

- Provide `secrets.oauth-client-id`, and
- exactly one of `secrets.oauth-secret` or `secrets.audience`.

Passing both, or neither, fails the job before the runner connects.

## Environments And Secret Scoping

The job sets the GitHub environment itself, through the `environment` input. A job that calls a reusable workflow cannot declare an `environment` key, so the calling job always runs outside that environment.

The caller's `secrets:` mapping **can** still read that environment's secrets, so `oauth-client-id` and `audience` may stay as `tailnet` environment secrets. This was confirmed by running the workflow against a real tailnet.

Those secrets are **not** injected into the script. Anything the script needs is passed as the `script-env` secret, which the workflow sources into the script's environment:

```yaml
secrets:
  oauth-client-id: ${{ secrets.TS_OAUTH_CLIENT_ID }}
  audience: ${{ secrets.TS_AUDIENCE }}
  script-env: |
    RELAY_TOKEN=${{ secrets.RELAY_TOKEN }}
    RELAY_TO=${{ vars.RELAY_TO }}
```

`script-env` is a secret rather than an input for a specific reason: `with:` cannot read the `secrets` context, so a caller cannot build this block with `with:` at all. The `secrets:` key can, and accepts both `secrets.*` and `vars.*`.

The block is sourced as shell, not parsed as `KEY=value`, so quoted values and references to the existing environment behave the way you would expect from shell. The cost is that any value which is not valid shell breaks the whole block. API tokens and phone numbers are fine; a pasted JSON blob or a value containing a quote is not.

## Permissions

The caller can keep top-level permissions empty:

```yaml
permissions: {}
```

The calling job must grant:

| Permission | Reason |
| --- | --- |
| `id-token: write` | Mints the OIDC token that `tailscale/github-action` exchanges for a tailnet node. |
| `contents: read` | Checks out `script` from the calling repository. Not read when `script` is empty, but GitHub scopes permissions per job. |

No other permissions are needed. The workflow does not read the repository by default, and it never writes.

## Tailnet Setup

- The OAuth client or federated identity must have the writable `auth_keys` scope.
- Tags on the node must be a subset of the tags the client is scoped to. A mismatch is the most common cause of a failed `tailscale up`.
- Workload identity federation requires `id-token: write` and Tailscale `1.90.1` or later. It also requires a runner image of `2.237.1` or later.
- The tailnet policy must grant the node tag access to whatever it reaches, for example:

```json
{
  "grants": [
    {
      "src": ["tag:ci"],
      "dst": ["tag:ci"],
      "ip": ["*:*"]
    }
  ]
}
```

## Security Notes

- `inputs.script` runs shell code from the calling repository with `id-token: write` available to that job. Treat it as trusted code and only point it at scripts on trusted refs. Do not add a `pull_request_target` trigger, which this repository treats as banned, and note that for `pull_request` runs from forks GitHub withholds the OIDC token and repository secrets.
- The `script` path is rejected unless it is a relative path with no parent directory references and no characters outside `[A-Za-z0-9._/-]`.
- Secret values are never printed, and validation failures name the input or secret without echoing its value.
- `script-env` is written to a temporary file and sourced into the script step only, then removed. It is never exported to the `connect to tailscale` step, so `tailscale/github-action` does not see those values. It is sourced as shell, which is the same trust level as the `script` it configures, since the caller owns both.
- The `tags`, `hostname`, `ping`, and `version` checks are fail-fast guards, not a security boundary. `tailscale/github-action` passes all four to `tailscale` as argument vector elements rather than through a shell, so they cannot inject a command. They exist to turn an opaque `tailscale up` failure into a named error at the point of the mistake. `script` is the only input that reaches a shell, and its path is constrained.
- Tailnet details such as the MagicDNS suffix, node hostnames, and 100.x addresses appear in the log output of `tailscale/github-action` and `tailscale status`. For public repositories this log is public. Avoid putting sensitive internal names in tailnet hostnames if that matters to you.

## Jobs

| Job | Description |
| --- | --- |
| `tailnet` | Validates inputs, optionally checks out a script, connects to the tailnet, verifies the backend state, and optionally runs the script. |

The workflow verifies the backend state itself even though `tailscale/github-action` checks it too. The action catches a failed status *read* and still exits successfully on Linux, so a tailnet that never actually came up can pass as green. A swallowed read also leaves the action's `ping` skipped without saying so, which turns a misconfigured `ping` into a silent pass. The workflow treats a failed read as fatal instead.
