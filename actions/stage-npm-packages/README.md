# Stage npm Packages

This action stages npm packages with provenance. A staged package is not available to install until a maintainer approves it on npm with 2FA. The staged release workflows use this action, and you can use it in a job that has `id-token: write` and npm trusted publishing.

Pass `packages` as a JSON array. Each entry needs `name`, `version`, `directory` (relative to the workspace), `npm-package-path` (the URL-encoded name), and `dist-tag`. Check out the repository, set up pnpm and Node.js, and install dependencies first.

The action checks that npm returns 404 for each version before staging it. It stages each package from its own directory with `pnpm stage publish`. The `packages` output adds `stage-id` and `integrity` (the tarball digest) to each entry. The `invocation-id` output is the run attempt that npm records in the provenance. The job summary lists each stage ID to approve.

The action stops at the first failure. The job summary then lists the packages that the run staged before the failure, so nobody approves stages that the run cannot finalize.
