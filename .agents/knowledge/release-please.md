# Release Please Notes

Release Please is configured by:

- `release-please-config.json`
- `.release-please-manifest.json`

The root package releases the reusable workflow version tags, such as `v0.4.4`. The `actions/setup` package releases component tags, such as `actions/setup/v0.1.1`.

The `extra-files` entries in `release-please-config.json` currently point to example workflow files. Those paths only need to change if files under `examples/` are renamed or moved.

When updating example workflow references, keep the `# x-release-please-version` comments on the same lines as the reusable workflow `uses:` references.
