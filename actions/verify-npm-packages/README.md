# Verify npm Packages

This action waits until npm serves staged packages, and checks each one. The published tarball digest must match the staged digest. npm's provenance must name that digest, the staging run attempt, the repository, the Git ref, and the commit. The staged release workflows use this action after npm approval.

Pass `packages` as the `packages` output of [Stage npm Packages](../stage-npm-packages/README.md), and `invocation-id` as its `invocation-id` output. The action checks npm up to `max-attempts` times, `retry-seconds` apart (default: 20 times, 15 seconds apart).

The `verified` output lists the entries that npm serves with matching provenance. The `missing` output lists the others. The action does not fail when packages are missing, so the caller can release the verified packages and fail for the rest.

The `repository`, `ref`, and `sha` inputs default to the current run. Override them only to test against a package from another repository.
