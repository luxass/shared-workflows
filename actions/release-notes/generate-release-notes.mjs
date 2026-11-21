import { writeFile } from 'node:fs/promises';
import process from 'node:process';
import { parseArgs } from 'node:util';
import { readReleaseCommits } from './read-release-commits.mjs';
import { renderReleaseNotes } from './render-release-notes.mjs';
import { resolveReleaseContributors } from './resolve-release-contributors.mjs';

async function generateReleaseNotesFile({ from, to, output, repository, serverUrl, apiUrl, token }) {
  if (!to || !output) throw new Error('Missing release notes input: provide both to and output.');
  if (!/^[\w.-]+\/[\w.-]+$/.test(repository ?? '')) {
    throw new Error('Invalid release notes repository: expected owner/repo.');
  }

  const history = readReleaseCommits({ from, to });
  const commits = await resolveReleaseContributors({ commits: history.commits, repository, apiUrl, token });
  const markdown = renderReleaseNotes({ commits, repositoryUrl: `${serverUrl}/${repository}`, from: history.from, to });
  await writeFile(output, markdown, 'utf8');
}

try {
  const { values } = parseArgs({
    options: {
      from: { type: 'string' },
      to: { type: 'string' },
      output: { type: 'string' },
      repo: { type: 'string' },
    },
  });
  await generateReleaseNotesFile({
    from: values.from ?? process.env.INPUT_FROM?.trim(),
    to: values.to ?? process.env.INPUT_TO?.trim(),
    output: values.output ?? process.env.INPUT_OUTPUT?.trim(),
    repository: values.repo ?? process.env.GITHUB_REPOSITORY,
    serverUrl: process.env.GITHUB_SERVER_URL ?? 'https://github.com',
    apiUrl: process.env.GITHUB_API_URL ?? 'https://api.github.com',
    token: process.env['INPUT_GITHUB-TOKEN']?.trim() || process.env.GITHUB_TOKEN,
  });
} catch (error) {
  const message = `Release notes generation failed: ${error.message}`;
  if (process.env.GITHUB_ACTIONS === 'true') {
    const escaped = message.replaceAll('%', '%25').replaceAll('\r', '%0D').replaceAll('\n', '%0A');
    console.error(`::error::${escaped}`);
  } else {
    console.error(message);
  }
  process.exitCode = 1;
}
