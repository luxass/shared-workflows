# Release (npm)

Reusable workflow for publishing pnpm packages to npm with provenance.

The workflow checks out the repository, sets up pnpm and Node.js, optionally generates a GitHub changelog, installs dependencies, optionally builds, detects the npm dist-tag from the git tag, and publishes with `NPM_CONFIG_PROVENANCE=true`.

## Usage

Create a workflow in the consuming repository, for example `.github/workflows/release.yaml`:

```yaml
name: Release

on:
  push:
    tags:
      - "v*"

permissions: {}

jobs:
  release:
    permissions:
      id-token: write
      contents: write
    uses: luxass/shared-workflows/.github/workflows/reusable-release-npm.yaml@v0.8.2
    secrets: inherit
```

## Workspace Publish

```yaml
jobs:
  release:
    permissions:
      id-token: write
      contents: write
    uses: luxass/shared-workflows/.github/workflows/reusable-release-npm.yaml@v0.8.2
    with:
      recursive: true
      publish-args: "--access public --no-git-checks"
    secrets: inherit
```

## Inputs

| Name | Type | Default | Description |
| --- | --- | --- | --- |
| `node-version` | `string` | `lts/*` | Node.js version to use. |
| `environment` | `string` | `npm-registry` | GitHub environment to use for the release job. |
| `build` | `boolean` | `true` | Run the build step before publishing. |
| `build-script` | `string` | `build` | Arguments passed to `pnpm` for the build step. |
| `recursive` | `boolean` | `false` | Publish all packages in the workspace with `pnpm publish -r`. |
| `publish-args` | `string` | `--access public --no-git-checks` | Additional arguments passed to `pnpm publish`. |
| `generate-changelog` | `boolean` | `true` | Generate a GitHub release changelog with `changelogithub`. |
| `install-args` | `string` | `""` | Additional arguments passed to `pnpm install`. |
| `stage` | `boolean` | `false` | Use `pnpm stage publish` for npm's staged publishing workflow instead of direct publishing. |

## Secrets

This workflow does not define explicit `workflow_call` secrets. Use `secrets: inherit` when the release environment or npm publishing setup requires secrets from the caller.

## Permissions

The caller can keep top-level permissions empty:

```yaml
permissions: {}
```

The caller job should grant:

| Permission | Reason |
| --- | --- |
| `id-token: write` | npm provenance publishing through trusted publishing/OIDC. |
| `contents: write` | Changelog and release related GitHub operations. |

## Dist Tags

The workflow uses `git describe --tags --abbrev=0` to find the latest tag:

- Tags containing `-` publish with the `next` dist-tag.
- Other tags publish with the `latest` dist-tag.

## Staged Publishing

When `stage: true` is passed, the workflow uses `pnpm stage publish` instead of `pnpm publish`. This enables npm's staged publishing workflow, which uploads to staging and defers proof-of-presence (2FA) to a later point. This is useful for verifying release artifacts or smoke-testing before approving the final release to the live registry.

Version requirements for staged publishing:

- `pnpm >= 11.3.0` (required for `pnpm stage publish`)
- `Node.js >= 22.14.0` and `npm CLI >= 11.15.0` (required for npm staged publishing)

To use staged publishing:

```yaml
jobs:
  release:
    permissions:
      id-token: write
      contents: write
    uses: luxass/shared-workflows/.github/workflows/reusable-release-npm.yaml@v0.8.2
    with:
      stage: true
    secrets: inherit
```

## Jobs

| Job | Description |
| --- | --- |
| `release` | Builds and publishes the package or workspace packages to npm. |

The install, build, and publish arguments are passed to `pnpm` through `actions/run-pnpm` without shell re-interpretation.
