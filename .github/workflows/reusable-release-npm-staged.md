# Experimental Release (npm staging)

This workflow stages one public root package on npm. A staged package is not available to install until a maintainer approves it on npm. The workflow creates a Git tag and a GitHub release only after npm serves the exact version.

The existing tag-triggered npm release workflow does not change.

## Usage

Copy [the caller example](../../examples/release-npm-staged.yaml) into your repository. Use a ref that contains this workflow. Run the caller from the default branch and provide release notes. Set the next version in the root `package.json` before dispatch. Run one release at a time for a package.

The workflow uses Node.js 24. Pin pnpm 11.3 or newer in `packageManager` and commit the lockfile. Use an npm package that already exists and which you maintain.

Configure two GitHub environments:

| Environment | Rules |
| --- | --- |
| `npm-registry` | Allow only the default branch. Require a reviewer before staging. |
| `release-approval` | Allow only the default branch. Require a reviewer to resume the workflow after npm approval. |

Set up [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) for the caller repository, caller workflow filename, and `npm-registry` environment. Allow staging only. The workflow does not use npm tokens or any caller secrets. Make sure that tag rules allow the GitHub Actions token to create `v*` tags.

## Inputs and permissions

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `release-notes` | string | Required | Markdown for the GitHub release. It must not be blank. |
| `build` | boolean | `true` | Run `pnpm run build` before staging. |

Grant the caller job `contents: write` and `id-token: write`. The staging job uses repository read access and npm trusted publishing. Only the final job can create tags and GitHub releases.

## Jobs

1. `validate` rejects requests outside a manual dispatch from the default branch. It also rejects blank release notes.
2. `stage` checks out the dispatched commit, installs dependencies, and builds the package. It refuses an already published version. It stages with provenance, using the `latest` npm dist-tag for stable versions and `next` for prereleases. The job summary links to npm. Approve the staged package on npm with 2FA.
3. `finish` waits for a GitHub environment reviewer. After approval, it polls npm for the exact package version. It creates a lightweight tag on the dispatched commit and publishes the supplied release notes. If the tag exists but does not point directly to that commit, the job fails without moving it.

If npm does not serve the version before polling ends, wait for npm and rerun failed jobs. Do not dispatch a new run to finalize an already staged version. GitHub environment approval does not approve the package on npm.
