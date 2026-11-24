# Create GitHub Releases

This action creates a lightweight tag at the current commit and a GitHub release for each entry. The staged release workflows use it after npm serves the packages. The job needs `contents: write`.

Pass `releases` as a Base64-encoded JSON array. Each entry needs `tag`, `version`, and `notes` (Markdown). Versions with a prerelease part, such as `1.0.0-beta.1`, become prereleases that are not the latest release.

The action skips an entry that already has a published release. It reports an error for an entry that has a draft release or a tag at another commit, continues with the other entries, and then fails. You can rerun it safely after a partial failure.
