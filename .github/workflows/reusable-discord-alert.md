# Discord forum alert

Creates a new alerts forum post through a channel-scoped incoming webhook, using `thread_name` and `applied_tags`. Mentions are disabled. No bot, checkout, dependency installation, or GitHub token permissions are needed.

## Usage

Create an incoming webhook in the alerts forum and store its URL in the calling repository's `DISCORD_ALERTS_WEBHOOK_URL` secret. Use the standard `https://discord.com/api/webhooks/ID/TOKEN` URL without query parameters. Versioned `/api/v10/webhooks/ID/TOKEN` URLs are also accepted.

Replace the tag ID below with the forum's **new** status tag ID. That single tag is enough for CI alerts. Replace `REPLACE_WITH_COMMIT_SHA` with a full commit SHA containing this workflow after it is published.

```yaml
name: CI

on:
  push:
    branches: [main]
  pull_request:

permissions: {}

jobs:
  ci:
    permissions:
      contents: read
    uses: luxass/shared-workflows/.github/workflows/reusable-ci.yaml@v0.12.0

  discord-alert:
    needs: ci
    if: ${{ always() && needs.ci.result == 'failure' }}
    uses: luxass/shared-workflows/.github/workflows/reusable-discord-alert.yaml@REPLACE_WITH_COMMIT_SHA
    with:
      title: "CI failed: ${{ github.repository }}"
      summary: "CI failed. Run: ${{ github.server_url }}/${{ github.repository }}/actions/runs/${{ github.run_id }}"
      applied-tags: '["123456789012345678"]'
    secrets:
      webhook-url: ${{ secrets.DISCORD_ALERTS_WEBHOOK_URL }}
```

The notification runs in a separate job after failed CI, including when the dependency failure would otherwise skip it. Adapt `needs` and the condition if your CI uses more jobs.

## Inputs

| Name | Type | Required | Description |
| --- | --- | --- | --- |
| `title` | `string` | Yes | New post title, 1-100 characters. |
| `summary` | `string` | Yes | Initial message content, 1-2000 characters. |
| `applied-tags` | `string` | Yes | JSON array of 1-5 numeric tag ID strings belonging to the webhook's forum. At least one tag is required. |

## Secrets and permissions

`webhook-url` is an explicit, optional caller secret. When absent, including on fork pull requests where repository secrets are unavailable, the workflow reports a skip and succeeds without sending a request. Do not use `pull_request_target` to expose the secret to untrusted pull request code.

The notification needs no GitHub permissions. Keep `permissions: {}` at workflow level and grant CI its own permissions as shown above.

## Jobs and limitations

The `notify` job uses curl and jq, provided by the hosted Ubuntu runner. jq validates inputs and builds the JSON payload; curl makes one POST with `wait=true` for server confirmation. The webhook URL goes to curl through stdin, not command-line arguments. Redirects and retries are disabled, response bodies are discarded, and failures use credential-free error messages. HTTP and network failures fail the notification job independently of CI.

Requests have a 30-second timeout and no automatic retries, including on rate limits. A timeout can occur after Discord creates the post. Check the forum before manually rerunning a notification, since reruns create new posts and there is no deduplication or status update. Discord validates tag membership and webhook access.

See Discord's [execute webhook reference](https://docs.discord.com/developers/resources/webhook#execute-webhook) for forum post fields.
