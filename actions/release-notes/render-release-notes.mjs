// Markdown formatting adapted from changelogithub v15.0.5 (src/style/markdown.ts,
// src/utils.ts, and the defaults in src/config.ts). See THIRD-PARTY-NOTICES.md.
import { expandReleaseNoteEmoji } from './release-note-emoji.mjs';

const releaseNoteTypes = [
  ['feat', '🚀 Features'],
  ['fix', '🐞 Bug Fixes'],
  ['perf', '🏎 Performance'],
];

const htmlEscapes = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
};

function joinReleaseNoteReferences(items) {
  if (items.length < 2) return items[0] ?? '';
  return `${items.slice(0, -1).join(', ')} and ${items.at(-1)}`;
}

function formatReleaseNoteLine(commit, repositoryUrl) {
  const authorRefs = (commit.authors ?? []).map(({ name, login }) => login ? `@${login}` : `**${name}**`);
  const issueRefs = commit.issues.map(issue => `${repositoryUrl}/issues/${issue.slice(1)}`);
  const authors = joinReleaseNoteReferences([...new Set(authorRefs)]).trim();
  const issues = joinReleaseNoteReferences(issueRefs).trim();
  const { description, shortHash } = commit;
  const hash = shortHash && `[<samp>(${shortHash.slice(0, 5)})</samp>](${repositoryUrl}/commit/${shortHash})`;
  const refs = [authors && `by ${authors}`, issues && `in ${issues}`, hash].filter(Boolean).join(' ');
  const capitalizedDescription = description.charAt(0).toUpperCase() + description.slice(1);
  const escapedDescription = expandReleaseNoteEmoji(capitalizedDescription)
    .replace(/[&<>"']/g, char => htmlEscapes[char]);

  return [escapedDescription, refs && `&nbsp;-&nbsp; ${refs}`].filter(part => part.trim()).join(' ');
}

function groupReleaseNoteCommits(commits, getKey) {
  const groups = new Map();
  for (const commit of commits) {
    const key = getKey(commit);
    if (!groups.has(key)) groups.set(key, []);
    groups.get(key).push(commit);
  }
  return groups;
}

function appendReleaseNoteSection(lines, commits, title, repositoryUrl) {
  if (!commits.length) return;

  lines.push('', `### &nbsp;&nbsp;&nbsp;${title}`, '');

  const scopes = groupReleaseNoteCommits(commits, commit => commit.scope ?? '');
  // If a named scope repeats, nest the entries for every named scope in this section.
  const groupScopes = [...scopes].some(([scope, items]) => scope && items.length > 1);
  for (const scope of [...scopes.keys()].sort()) {
    const nested = scope && groupScopes;
    if (nested) lines.push(`- **${scope}**:`);
    const bullet = nested ? '  - ' : '- ';
    const prefix = scope && !nested ? `**${scope}**: ` : '';

    // Each scope has its own array, so reversing it leaves the input order intact.
    for (const commit of scopes.get(scope).reverse()) {
      lines.push(`${bullet}${prefix}${formatReleaseNoteLine(commit, repositoryUrl)}`);
    }
  }
}

/** Renders GitHub release notes from newest-first Git commits, with no final newline. */
export function renderReleaseNotes({ commits, repositoryUrl, from, to }) {
  const repositoryBaseUrl = repositoryUrl.replace(/\/+$/, '');
  const breaking = [];
  const changes = [];
  for (const commit of commits) {
    if (commit.isBreaking) breaking.push(commit);
    else changes.push(commit);
  }

  const lines = [];
  appendReleaseNoteSection(lines, breaking, '🚨 Breaking Changes', repositoryBaseUrl);
  const changesByType = groupReleaseNoteCommits(changes, commit => commit.type);
  for (const [type, title] of releaseNoteTypes) {
    appendReleaseNoteSection(lines, changesByType.get(type) ?? [], title, repositoryBaseUrl);
  }

  if (!lines.length) lines.push('*No significant changes*');

  const compareUrl = `${repositoryBaseUrl}/compare/${from}...${to}`;
  lines.push('', `##### &nbsp;&nbsp;&nbsp;&nbsp;[View changes on GitHub](${compareUrl})`);
  return lines.join('\n').trim();
}
