import assert from 'node:assert/strict';
import { execFileSync } from 'node:child_process';
import { mkdtempSync, readFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import process from 'node:process';
import { test } from 'node:test';
import { fileURLToPath } from 'node:url';
import { expandReleaseNoteEmoji } from './release-note-emoji.mjs';
import { resolveReleaseContributors } from './resolve-release-contributors.mjs';

const generator = fileURLToPath(new URL('./generate-release-notes.mjs', import.meta.url));
const repository = 'example/release-fixture';
const serverUrl = `https://github.com/${repository}`;

function makeReleaseGitFixture(t) {
  const cwd = mkdtempSync(join(tmpdir(), 'release-notes-'));
  t.after(() => rmSync(cwd, { recursive: true, force: true }));
  const env = {
    PATH: process.env.PATH,
    HOME: cwd,
    GIT_CONFIG_NOSYSTEM: '1',
    TZ: 'UTC',
  };
  const git = (...args) => execFileSync('git', args, { cwd, env, encoding: 'utf8' }).trim();
  git('init', '--quiet', '--initial-branch=main');
  let head;
  let timestamp = 1_700_000_000;
  const commit = (subject, body, branch = 'main') => {
    const message = body ? `${subject}\n\n${body}\n` : `${subject}\n`;
    const ref = `refs/heads/${branch}`;
    const input = [
      `commit ${ref}`,
      `committer Example Maintainer <maintainer@example.invalid> ${timestamp++} +0000`,
      `data ${Buffer.byteLength(message)}`,
      `${message}${head ? `from ${head}\n` : ''}`,
    ].join('\n') + '\n';
    execFileSync('git', ['fast-import', '--quiet'], { cwd, env, input });
    if (branch === 'main') head = git('rev-parse', ref);
    return git('rev-parse', '--short', ref);
  };
  const notesPath = join(cwd, 'release-notes.md');
  const generate = (to, from, checkout = cwd) => {
    execFileSync(process.execPath, [generator], {
      cwd: checkout,
      stdio: 'pipe',
      env: { ...env, INPUT_TO: to, INPUT_FROM: from ?? '', INPUT_OUTPUT: notesPath, GITHUB_REPOSITORY: repository },
    });
    return readFileSync(notesPath, 'utf8');
  };
  return { cwd, git, commit, generate };
}

test('formats a stable release with breaking changes, grouped scopes, authors, and links', t => {
  const { git, commit, generate } = makeReleaseGitFixture(t);
  commit('feat: baseline');
  git('tag', 'v1.0.0');
  const first = commit('feat(schema): add owner & name (#12)', 'Co-authored-by: Example Reviewer <reviewer@example.invalid>');
  git('tag', 'v1.1.0-rc.1');
  const second = commit('feat(schema): expose viewer (closes #13)');
  const fix = commit('fix: correct the docs link');
  const breaking = commit('feat(api)!: remove the legacy endpoint');
  commit('chore: update the lockfile');
  git('tag', 'v1.1.0');

  const link = hash => `[<samp>(${hash.slice(0, 5)})</samp>](${serverUrl}/commit/${hash})`;
  assert.equal(generate('v1.1.0'), [
    '### &nbsp;&nbsp;&nbsp;🚨 Breaking Changes',
    '',
    `- **api**: Remove the legacy endpoint &nbsp;-&nbsp; by **Example Maintainer** ${link(breaking)}`,
    '',
    '### &nbsp;&nbsp;&nbsp;🚀 Features',
    '',
    '- **schema**:',
    `  - Add owner &amp; name &nbsp;-&nbsp; by **Example Maintainer** and **Example Reviewer** in ${serverUrl}/issues/12 ${link(first)}`,
    `  - Expose viewer &nbsp;-&nbsp; by **Example Maintainer** in ${serverUrl}/issues/13 ${link(second)}`,
    '',
    '### &nbsp;&nbsp;&nbsp;🐞 Bug Fixes',
    '',
    `- Correct the docs link &nbsp;-&nbsp; by **Example Maintainer** ${link(fix)}`,
    '',
    `##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](${serverUrl}/compare/v1.0.0...v1.1.0)`,
  ].join('\n'));
});

test('uses an explicit package-specific range and handles no significant changes', t => {
  const { git, commit, generate } = makeReleaseGitFixture(t);
  commit('feat: baseline');
  git('tag', 'pkg@1.0.0');
  commit('chore: prepare the package');
  git('tag', 'other@2.0.0');
  commit('docs: adjust the readme');
  git('tag', 'pkg@1.0.1');
  assert.equal(generate('pkg@1.0.1', 'pkg@1.0.0'), [
    '*No significant changes*',
    '',
    `##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](${serverUrl}/compare/pkg@1.0.0...pkg@1.0.1)`,
  ].join('\n'));
});

test('uses the previous prerelease tag when generating prerelease notes', t => {
  const { git, commit, generate } = makeReleaseGitFixture(t);
  commit('feat: baseline');
  git('tag', 'v1.0.0');
  commit('feat: add the first preview');
  git('tag', 'v1.1.0-rc.1');
  commit('fix: :bug: correct the preview');
  git('tag', 'v1.1.0-rc.2');

  const notes = generate('v1.1.0-rc.2');
  assert.match(notes, /🐛 correct the preview/);
  assert.doesNotMatch(notes, /Add the first preview/);
  assert.match(notes, /compare\/v1\.1\.0-rc\.1\.\.\.v1\.1\.0-rc\.2/);
});

test('includes the root in first-release notes and ignores tags at the target commit', t => {
  const { git, commit, generate } = makeReleaseGitFixture(t);
  commit('feat: add the initial package');
  git('tag', 'v1.0.0');
  git('tag', 'first-release');
  assert.match(generate('v1.0.0'), /Add the initial package/);
  assert.match(generate(git('rev-parse', 'HEAD')), /Add the initial package/);
});

test('ignores commits exclusive to the starting branch and detects breaking footers', t => {
  const { git, commit, generate } = makeReleaseGitFixture(t);
  commit('feat: add the baseline');
  const other = commit('feat: add a feature on another branch', undefined, 'other');
  commit('fix: change the API', 'BREAKING CHANGE: The old route no longer exists.');
  commit('Revert "feat: a reverted feature"');
  git('tag', 'v1.0.0');
  const notes = generate('v1.0.0', other);
  assert.match(notes, /🚨 Breaking Changes/);
  assert.match(notes, /Change the API/);
  assert.doesNotMatch(notes, /another branch|reverted feature|add the baseline/i);
});

test('rejects a shallow checkout with instructions to fetch full history', t => {
  const { cwd, git, commit, generate } = makeReleaseGitFixture(t);
  commit('feat: add the baseline');
  commit('fix: test shallow clones');
  const shallow = join(cwd, 'shallow');
  git('clone', '--quiet', '--depth=1', `file://${cwd}`, shallow);
  assert.throws(() => generate('HEAD', undefined, shallow), /shallow checkout\. Set fetch-depth: 0/);
});

test('expands known emoji shortcodes without changing spacing or embedded text', () => {
  const description = ':BUG:  fix `:bug:` https://example.invalid/:bug: :unknown: :rocket:';
  const expected = '🐛  fix `:bug:` https://example.invalid/:bug: :unknown: 🚀';
  assert.equal(expandReleaseNoteEmoji(description), expected);
});

test('resolves contributor links and falls back to author names without a live API', async () => {
  const commits = await resolveReleaseContributors({
    commits: [{
      shortHash: '1234567',
      authors: [
        { name: 'Example Maintainer', email: 'maintainer@example.invalid' },
        { name: 'Example Reviewer', email: 'reviewer@example.invalid' },
        { name: 'release[bot]', email: 'release@example.invalid' },
      ],
    }],
    repository,
    apiUrl: 'https://github.example.invalid/api/v3',
    token: 'test-token',
    fetchJson: async url => {
      assert.equal(url.hostname, 'github.example.invalid');
      assert.match(url.pathname, /^\/api\/v3\//);
      if (url.pathname.endsWith('/commits/1234567')) {
        return new Response(JSON.stringify({ author: { login: 'example-maintainer' } }));
      }
      return new Response(JSON.stringify({ items: [] }));
    },
  });
  assert.deepEqual(commits[0].authors.map(({ name, login }) => ({ name, login })), [
    { name: 'Example Maintainer', login: 'example-maintainer' },
    { name: 'Example Reviewer', login: undefined },
  ]);
});
