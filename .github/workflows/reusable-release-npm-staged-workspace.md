# Release workspace (npm staging)

This workflow stages the public packages of a pnpm workspace on npm. It stages only the package versions that npm does not serve yet. A staged package is not available to install until a maintainer approves it on npm. The workflow waits until npm serves each package with provenance that matches the staged run and commit. It then creates a Git tag and a GitHub release for each package.

For a repository that publishes one root package, use [Release (npm staging)](reusable-release-npm-staged.md).

## Usage

Copy [the caller example](../../examples/release-npm-staged-workspace.yaml) into your public repository. Use a ref that contains this workflow. Keep the caller's `concurrency` group so a new run does not interrupt a run that waits for approval. Start the run from a push or dispatch on the default branch.

This workflow does not bump versions. Commit the new package versions and changelogs first, for example with Changesets. The plan job compares every public workspace package with npm. If npm already serves every version, the run ends without asking for approval.

The workflow uses Node.js 24. Pin pnpm 11.3 or newer in `packageManager` and commit the lockfile. Each package must already exist on npm and you must maintain it. Publish the first version of a new package another way before the workflow stages its later versions.

Configure two separate GitHub environments:

| Environment | Rules |
| --- | --- |
| `npm-registry` (default) | Allow only the default branch. Require a reviewer before staging. |
| `release-approval` (default) | Allow only the default branch. Require a reviewer to resume the workflow after npm approval. |

Set up [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) for each package. Use the caller repository, caller workflow filename, and staging environment. In **Allowed actions**, leave `npm stage publish` enabled. Leave `npm publish` and `npm dist-tag` disabled. The workflow does not use npm tokens or any caller secrets. Make sure that tag rules allow the GitHub Actions token to create tags in the `<name>@<version>` format, for example `@scope/package@1.2.0`.

### With Changesets

Keep the Changesets version job, and replace the publish job with a call to this workflow. Use the same ref as in the example:

```yaml
  publish:
    needs: select-mode
    if: ${{ needs.select-mode.outputs.mode == 'publish' }}
    permissions:
      contents: write
      id-token: write
    uses: luxass/shared-workflows/.github/workflows/reusable-release-npm-staged-workspace.yaml@<ref>
```

Do not run `changeset publish` or `changeset git-tag` in the caller. This workflow creates the tags after npm verification, in the same format as Changesets. The release notes are the package's changelog section for the version, so they match the GitHub releases that Changesets creates.

Changesets selects `publish` only when it finds package versions that npm does not serve. npm does not serve a staged version until you approve it. So a push while a run waits for npm approval can select `publish` again for the same versions. The caller's `concurrency` group holds that run until the earlier run ends. If it then asks for staging approval for a version that the earlier run staged, reject it. npm returns `409 Conflict` for a version that is already staged.

## Inputs and permissions

| Input | Type | Default | Description |
| --- | --- | --- | --- |
| `expected-sha` | string | Empty | Exact commit SHA required for an automated dispatch. Leave empty for a run without a commit check. |
| `build` | boolean | `true` | Run `pnpm --recursive --if-present run build` before staging. This runs the `build` script of each workspace package that has one, but not the root script. |
| `environment` | string | `npm-registry` | GitHub environment for the staging approval and the npm trusted publishers. |
| `approval-environment` | string | `release-approval` | GitHub environment that resumes the run after npm approval. |

Grant the caller job `contents: write` and `id-token: write`. The plan and staging jobs use repository read access, and staging uses npm trusted publishing. Only the final job can create tags and GitHub releases.

## Jobs

1. `validate` requires a push or dispatch on the default branch and a public repository. If the caller provides `expected-sha`, the run must target that exact commit.
2. `plan` lists the public workspace packages with `pnpm --recursive list`, without installing dependencies. It rejects packages with a publish directory or registry override. It plans each version that npm does not serve, and puts each package after the planned packages that it depends on.
3. `stage` waits for a reviewer in the staging environment. It installs dependencies, optionally builds, and checks again that npm does not serve each planned version. It stages each package from its own directory with provenance. It uses `latest` for stable versions and `next` for prereleases. The job summary lists each stage ID to approve on npm with 2FA.
4. `prepare-release` waits for a reviewer in the approval environment. For each staged package, it compares the staged and published tarball digests. It also checks that npm's provenance matches that digest, the staging run attempt, and the release commit. It then reads the `## <version>` section of the package's `CHANGELOG.md` as the release notes. If that section does not exist, the notes link to the changelog.
5. `publish-release` creates a lightweight tag at the release commit for each verified package, and publishes its notes. It marks prereleases as prereleases that are not the latest release. It skips a package that already has a GitHub release. It reports an error for a package whose tag points elsewhere or that has a draft release, and continues with the other packages.

The staging, verification, and release steps use the [Stage npm Packages](../../actions/stage-npm-packages/README.md), [Verify npm Packages](../../actions/verify-npm-packages/README.md), and [Create GitHub Releases](../../actions/create-github-releases/README.md) actions. [Release (npm staging)](reusable-release-npm-staged.md) uses the same actions.

A staging approval covers the whole batch, but npm requires a separate approval with 2FA for each staged package. Approve the packages on npm in the order of the job summary, so no package becomes public before its workspace dependencies. Then approve the approval environment in the run.

The polling log shows each attempt and what npm has not served or what did not match. If npm does not serve every staged package when polling ends, `prepare-release` fails, and `publish-release` releases the packages that npm already serves. Approve the remaining stages on npm, and choose **Re-run failed jobs** in the same run. The rerun verifies the remaining packages and skips the packages that already have a release. Do not choose **Re-run all jobs** or start a new run to finalize a staged version.

The workflow refuses to stage on a rerun. If staging fails partway, the job summary lists the packages that the run staged before the failure. Do not approve those stages on npm, because the run cannot finalize them. Inspect npm before starting a new run. npm can return `409 Conflict` for a version that is already staged but not public. GitHub approval does not approve a package on npm.
