// Contributor attribution adapted from changelogithub v15.0.5. See THIRD-PARTY-NOTICES.md.
const botName = /\[bot\]|dependabot|\(bot\)/i;

async function readGitHubJson({ apiUrl, path, token, fetchJson, lookupBudget }) {
  try {
    const response = await fetchJson(new URL(path, apiUrl + '/'), {
      headers: { Accept: 'application/vnd.github+json', Authorization: `Bearer ${token}` },
      signal: AbortSignal.any([lookupBudget, AbortSignal.timeout(5000)]),
    });
    if (response.ok) return await response.json();
  } catch {
    // A contributor lookup failure should not prevent generating release notes.
  }
}

async function findContributorLogin({ contributor, repository, ...request }) {
  const query = new URLSearchParams({ q: `${contributor.email} type:user in:email` });
  const search = await readGitHubJson({ ...request, path: `search/users?${query}` });
  if (search?.items?.[0]?.login) return search.items[0].login;
  if (!contributor.commit || request.lookupBudget.aborted) return;

  const path = `repos/${repository}/commits/${contributor.commit}`;
  const commit = await readGitHubJson({ ...request, path });
  return commit?.author?.login;
}

/** Resolves GitHub logins when a token is available and keeps Git author names on lookup failure. */
export async function resolveReleaseContributors({ commits, repository, apiUrl, token, fetchJson = fetch }) {
  const contributors = new Map();
  const commitsWithContributors = commits.map(commit => {
    const authors = commit.authors.flatMap(({ name, email }, index) => {
      if (!name || !email || botName.test(name)) return [];
      if (!contributors.has(email)) contributors.set(email, { name, email });
      const contributor = contributors.get(email);
      if (index === 0) contributor.commit ??= commit.shortHash;
      return [contributor];
    });
    return { ...commit, authors };
  });

  if (token) {
    const lookupBudget = AbortSignal.timeout(30_000);
    for (const contributor of contributors.values()) {
      if (lookupBudget.aborted) break;
      contributor.login = await findContributorLogin({ contributor, repository, apiUrl, token, fetchJson, lookupBudget });
    }
    if (process.env.GITHUB_ACTIONS === 'true' && [...contributors.values()].some(contributor => !contributor.login)) {
      console.log('::debug::Some contributor GitHub handles were unavailable. Using Git author names.');
    }
  }
  return commitsWithContributors;
}
