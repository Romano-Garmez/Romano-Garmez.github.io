/**
 * Bakes each project's popularity number into the bundle at build time.
 *
 * Runs as npm's `prebuild`, so `npm run build` and `npm run deploy` pick it up
 * with no extra step. The page still refreshes these live on load; baking them
 * means the first paint is already correct and a visitor who is offline, rate
 * limited, or looking at a page served while a server is down still sees a
 * number instead of a blank badge.
 *
 * Never fails the build: anything it cannot fetch keeps the value already in
 * projectCounts.json, so a flaky network costs freshness, not a deploy.
 *
 * GITHUB_TOKEN is used if the environment has one, which raises GitHub's
 * 60-an-hour anonymous limit. It is only ever read here, at build time, and
 * never reaches the bundle -- a token in the published JS would be public.
 */
import { readFileSync, writeFileSync, existsSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

import { projects } from '../src/data/projectsData.js';

const here = dirname(fileURLToPath(import.meta.url));
const OUTPUT = join(here, '..', 'src', 'data', 'projectCounts.json');
const TIMEOUT_MS = 10000;

const previous = existsSync(OUTPUT) ? JSON.parse(readFileSync(OUTPUT, 'utf8')) : {};

const headers = { Accept: 'application/vnd.github+json' };
if (process.env.GITHUB_TOKEN) {
  headers.Authorization = `Bearer ${process.env.GITHUB_TOKEN}`;
}

const get = (url, extraHeaders = {}) =>
  fetch(url, { headers: { ...extraHeaders }, signal: AbortSignal.timeout(TIMEOUT_MS) });

const githubUrlOf = (project) =>
  project.githubUrl || project.githubUrls?.[0]?.url || null;

async function starsFor(project) {
  // Mirrors the page: a project that reports its own users is ranked and
  // badged by those, so its stars are never read.
  if (project.userCount) return null;

  const url = githubUrlOf(project);
  const match = url?.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;

  const [, owner, repo] = match;
  const response = await get(`https://api.github.com/repos/${owner}/${repo}`, headers);
  if (!response.ok) {
    throw new Error(`GitHub answered ${response.status} for ${owner}/${repo}`);
  }

  const data = await response.json();
  return typeof data.stargazers_count === 'number' ? data.stargazers_count : null;
}

async function usersFor(project) {
  if (!project.userCount) return null;

  const response = await get(project.userCount.url);
  if (!response.ok) {
    throw new Error(`${project.userCount.url} answered ${response.status}`);
  }

  const value = (await response.json())?.[project.userCount.field];
  return typeof value === 'number' ? value : null;
}

// Keep whatever was baked last time when a lookup fails, so one unreachable
// host cannot blank a badge that was working yesterday.
async function resolve(project, read) {
  try {
    return { value: await read(project), stale: false };
  } catch (error) {
    console.warn(`  ${project.id}: ${error.message}`);
    return { value: null, stale: true };
  }
}

const counts = {};
let failures = 0;

for (const project of projects) {
  const [users, stars] = await Promise.all([
    resolve(project, usersFor),
    resolve(project, starsFor),
  ]);

  const kept = previous[project.id] ?? {};
  failures += Number(users.stale) + Number(stars.stale);

  const entry = {
    users: users.stale ? (kept.users ?? null) : users.value,
    stars: stars.stale ? (kept.stars ?? null) : stars.value,
  };

  // Only projects with something to show need an entry.
  if (entry.users !== null || entry.stars !== null) {
    counts[project.id] = entry;
  }
}

writeFileSync(OUTPUT, `${JSON.stringify(counts, null, 2)}\n`);

const baked = Object.keys(counts).length;
console.log(
  `Baked counts for ${baked}/${projects.length} projects` +
    (failures ? ` (${failures} lookup(s) failed, kept the previous value)` : '')
);
