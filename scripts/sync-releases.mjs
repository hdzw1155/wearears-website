import { writeFile, rename, rm } from 'node:fs/promises';

const repo = 'https://api.github.com/repos/hdzw1155/WearEars';
const destination = new URL('../src/data/releases.json', import.meta.url);
const temporary = new URL('../src/data/releases.json.' + process.pid + '.tmp', import.meta.url);

try {
  const response = await fetch(repo + '/releases?per_page=8', {
    headers: { Accept: 'application/vnd.github+json' },
    signal: AbortSignal.timeout(12000),
  });
  if (!response.ok) throw new Error('GitHub returned HTTP ' + response.status);
  const releases = await response.json();
  if (!Array.isArray(releases)) throw new Error('Unexpected GitHub release format');

  const published = releases
    .filter((entry) => !entry.draft && entry.published_at)
    .map((entry) => {
      if (typeof entry.tag_name !== 'string' || typeof entry.html_url !== 'string'
          || !entry.html_url.startsWith('https://github.com/hdzw1155/WearEars/releases/tag/')
          || !Number.isFinite(Date.parse(entry.published_at))) {
        throw new Error('Invalid public release record');
      }
      return {
        tag: entry.tag_name,
        publishedAt: entry.published_at,
        url: entry.html_url,
        prerelease: Boolean(entry.prerelease),
      };
    })
    .sort((a, b) => Date.parse(b.publishedAt) - Date.parse(a.publishedAt));
  if (published.length === 0) throw new Error('No published releases returned');
  await writeFile(temporary, JSON.stringify(published, null, 2) + '\n', 'utf8');
  await rename(temporary, destination);
  console.log('Updated ' + published.length + ' public releases.');
} catch (error) {
  await rm(temporary, { force: true });
  console.error('Release sync failed. The existing snapshot is available. ' + error.message);
  process.exitCode = 1;
}
