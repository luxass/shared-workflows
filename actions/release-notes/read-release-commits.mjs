// Conventional commit parsing adapted from changelogen v0.5.7. See THIRD-PARTY-NOTICES.md.
import { execFileSync } from 'node:child_process';

const conventionalCommit = /^(?::[\w+-]+:|[\p{Extended_Pictographic}\uFE0F\u200D]+)? *(?<type>[a-z]+)(\((?<scope>[^)]+)\))?(?<breaking>!)?: +(?<description>.+)$/iu;
const breakingChange = /^BREAKING(?: |-)CHANGE: /m;
const pullRequestReference = /\([ a-z]*(#\d+)\s*\)/g;
const issueReference = /(#\d+)/g;
const coauthorTrailer = /co-authored-by:\s*(?<name>.+)(<(?<email>.+)>)/gim;
const stableVersion = /^v?\d+\.\d+\.\d+(?:\+[\w.-]+)?$/;

function readGit(args) {
  try {
    return execFileSync('git', args, { encoding: 'utf8', maxBuffer: 32 * 1024 * 1024 });
  } catch (error) {
    throw new Error(`Cannot read release Git history: ${error.stderr?.trim() || error.message}`, { cause: error });
  }
}

function resolveCommit(ref) {
  return readGit(['rev-parse', '--verify', '--end-of-options', `${ref}^{commit}`]).trim();
}

function findPreviousReleaseTag(to, target) {
  const tagsAtTarget = readGit(['tag', '--points-at', target]).trim().split('\n');
  const tags = Array.from(
    readGit(['log', '--decorate-refs=refs/tags/', '--format=%D', target, '--']).matchAll(/tag: ([^,)\n]+)/g),
    ([, tag]) => tag.trim(),
  ).filter(tag => !tagsAtTarget.includes(tag));

  if (stableVersion.test(to) || tagsAtTarget.some(tag => stableVersion.test(tag))) {
    return tags.find(tag => stableVersion.test(tag)) ?? tags[0];
  }
  return tags[0];
}

function parseReleaseCommit({ shortHash, authorName, authorEmail, subject, body }) {
  const match = subject.match(conventionalCommit);
  if (!match) return;

  const { type, scope = '', breaking, description } = match.groups;
  const issues = Array.from(description.matchAll(pullRequestReference), ([, issue]) => issue);
  for (const [, issue] of description.matchAll(issueReference)) {
    if (!issues.includes(issue)) issues.push(issue);
  }

  const authors = [{ name: authorName, email: authorEmail }];
  for (const { groups } of body.matchAll(coauthorTrailer)) {
    authors.push({ name: groups.name.trim(), email: groups.email.trim() });
  }

  return {
    shortHash,
    type: type.toLowerCase(),
    scope,
    isBreaking: Boolean(breaking) || breakingChange.test(body),
    description: description.replace(pullRequestReference, '').trim(),
    issues,
    authors,
  };
}

/** Reads conventional commits newest first and resolves the starting ref for the compare link. */
export function readReleaseCommits({ from, to }) {
  if (readGit(['rev-parse', '--is-shallow-repository']).trim() === 'true') {
    throw new Error('Cannot generate release notes from a shallow checkout. Set fetch-depth: 0.');
  }
  const target = resolveCommit(to);
  const previousTag = from || findPreviousReleaseTag(to, target);
  const revisionRange = previousTag ? `${resolveCommit(previousTag)}..${target}` : target;
  const start = previousTag || readGit(['rev-list', '--max-parents=0', target, '--']).trim().split('\n')[0];
  const records = readGit(['log', '-z', '--format=%h%x00%an%x00%ae%x00%s%x00%b', revisionRange, '--']).split('\0');
  const commits = [];
  for (let index = 0; index + 4 < records.length; index += 5) {
    const [shortHash, authorName, authorEmail, subject, body] = records.slice(index, index + 5);
    const commit = parseReleaseCommit({ shortHash, authorName, authorEmail, subject, body });
    if (commit) commits.push(commit);
  }
  return { from: start, commits };
}
