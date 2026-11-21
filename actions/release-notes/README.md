# Generate Release Notes

This action reads Git history and writes Markdown. It adapts the Markdown renderer from [changelogithub v15.0.5](https://github.com/antfu/changelogithub/tree/v15.0.5) and keeps upstream credits in [Third-party notices](THIRD-PARTY-NOTICES.md). It uses Node.js and Git, with no package install or build step.

Use `fetch-depth: 0` to check out the release commit with full history and tags in the default workspace. Pass a local tag or commit as `to`. If `from` is empty, the action looks for an earlier tag in that history. For a stable release, it prefers a stable tag and falls back to a prerelease. For an independently versioned package, set `from` and `to` to that package's tags.

The action uses the default sections and does not load repository-specific changelog configuration files. It expands supported emoji shortcodes in commit descriptions and leaves unknown shortcodes as written.

If you pass a read-only GitHub token, the action looks up contributor handles. It uses Git author names when the lookup fails or the token is absent. It never creates tags or publishes releases.

## GitHub Actions

Replace `RELEASE_SHA` with a commit from a shared-workflows release that includes this action.

```yaml
permissions: {}

jobs:
  notes:
    runs-on: ubuntu-latest
    permissions:
      contents: read
    steps:
      - uses: actions/checkout@3d3c42e5aac5ba805825da76410c181273ba90b1 # v7.0.1
        with:
          fetch-depth: 0
          persist-credentials: false
      - uses: luxass/shared-workflows/actions/release-notes@RELEASE_SHA
        with:
          to: HEAD
          output: release-notes.md
          github-token: ${{ github.token }}
```

| Input | Required | Purpose |
| --- | --- | --- |
| `to` | Yes | Local tag or commit to end the range. |
| `output` | Yes | Path for the Markdown file. |
| `from` | No | Local tag or commit to exclude from the range, along with its ancestors. |
| `github-token` | No | Read-only token for contributor handles. |

## Local use

Run this command from the repository with the release history:

```fish
node /path/to/shared-workflows/actions/release-notes/generate-release-notes.mjs \
  --repo luxass/github-schema \
  --from v1.51.0 \
  --to v1.52.0 \
  --output /tmp/release-notes.md
```
