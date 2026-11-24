# Release (npm staging)

This workflow stages one public root package on npm. A staged package is not available to install until a maintainer approves it on npm. The workflow waits for npm to serve the package with provenance that matches the staged run and commit. It then creates the Git tag and GitHub release.

The existing tag-triggered npm release workflow does not change.

## Usage

Copy [the caller example](../../examples/release-npm-staged.yaml) into your public repository. Use a ref that contains this workflow. Keep the caller's `concurrency` group so a new dispatch does not interrupt a run that waits for approval. Commit the next version in the root `package.json` before dispatch. Dispatch from the default branch in GitHub or through the Actions API.

This workflow does not bump versions. If you use `bumpp`, let it update the manifest but leave tag creation to this workflow. If you switch from a version that only exists on npm, add a baseline Git tag to its source commit so the next changelog has a starting point.

The workflow uses Node.js 24. Pin pnpm 11.3 or newer in `packageManager` and commit the lockfile. Use an npm package that already exists and which you maintain.

Configure two separate GitHub environments:

| Environment | Rules |
| --- | --- |
| `npm-registry` (default) | Allow only the default branch. Require a reviewer before staging. |
| `release-approval` (default) | Allow only the default branch. Require a reviewer to resume the workflow after npm approval. |

Set up [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) for the caller repository, caller workflow filename, and your staging environment. In **Allowed actions**, leave `npm stage publish` enabled. Leave `npm publish` and `npm dist-tag` disabled. The workflow does not use npm tokens or any caller secrets. Make sure that tag rules allow the GitHub Actions token to create `v*` tags.

If you switch from tag-triggered publishing, finish any outstanding releases first. Update the trusted publisher if the caller filename or staging environment changes. Replace the old publish trigger. Tags that this workflow creates with `GITHUB_TOKEN` do not start another workflow on a `push` event.

For an automated dispatch, pass the SHA of the commit that contains the version bump:

```fish
gh workflow run release.yaml --ref main -f expected-sha=(git rev-parse HEAD)
```

In this example the caller file is `release.yaml`, and `HEAD` is already pushed to `main`.

## Inputs and permissions

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `release-notes` | string | Empty | Optional Markdown to add above the generated release notes. |
| `expected-sha` | string | Empty | Exact commit SHA required for an automated dispatch. Leave empty for a dispatch without a commit check. |
| `build` | boolean | `true` | Run `pnpm run build` before staging. |
| `environment` | string | `npm-registry` | GitHub environment for the staging approval and npm trusted publisher. |
| `approval-environment` | string | `release-approval` | GitHub environment that resumes the run after npm approval. |

Grant the caller job `contents: write` and `id-token: write`. The staging job uses repository read access and npm trusted publishing. Notes generation uses a read-only token for contributor links. Only the final job can create tags and GitHub releases.

## Jobs

1. `validate` requires a dispatch from the default branch. If the caller provides `expected-sha`, the run must target that exact commit.
2. `stage` checks out the dispatched commit, installs dependencies, and builds the package. It refuses an already published version. It stages with provenance and uses `latest` for stable versions and `next` for prereleases. The job summary links to npm and shows the stage ID to approve with 2FA.
3. `prepare-release` waits for a GitHub environment reviewer. It compares the staged and published tarball digests. It also checks that npm's provenance matches that digest, the staging run attempt, and the dispatched commit. The [release notes action](../../actions/release-notes/README.md) then writes Markdown from Conventional Commits. It uses the `changelogithub` format without installing packages during the release.
4. `publish-release` creates a lightweight tag on the dispatched commit and publishes the notes. It stops if the tag points elsewhere or if a draft release already exists for that tag.

The staging, verification, and release steps use the [Stage npm Packages](../../actions/stage-npm-packages/README.md), [Verify npm Packages](../../actions/verify-npm-packages/README.md), and [Create GitHub Releases](../../actions/create-github-releases/README.md) actions. [Release workspace (npm staging)](reusable-release-npm-staged-workspace.md) uses the same actions.

The polling log shows each attempt and what npm has not served or what did not match. If npm is still processing approval when polling ends, wait for npm and choose **Re-run failed jobs** in the same run. Do not choose **Re-run all jobs** or dispatch a new run to finalize a staged version. The workflow refuses to stage on a rerun. If staging itself fails, inspect npm for the stage ID before starting a new run. npm can return `409 Conflict` for a version that is already staged but not public. Do not approve a stage left by a failed run that cannot finalize it. GitHub approval does not approve the package on npm.
