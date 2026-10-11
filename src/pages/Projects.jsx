import { useEffect, useState } from 'react';
import { projects } from '../data/projectsData';
// Written at build time by scripts/fetch-counts.js, so the first paint already
// has the right numbers and the right order. The lookups below refresh them.
import bakedCounts from '../data/projectCounts.json';
import Footer from '../components/Footer';
import './Projects.css';

// Cache configuration (matches blog post cache duration)
const COUNT_CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

// A badge is a nice-to-have, so give up quickly rather than leaving the page
// waiting on the browser's own (much longer) timeout when a server is down.
const COUNT_TIMEOUT_MS = 5000;

const timedFetch = (url) => fetch(url, { signal: AbortSignal.timeout(COUNT_TIMEOUT_MS) });

// A failure is remembered too, for less time. Without this a page that has run
// into GitHub's rate limit re-fires every request on every reload, which is
// what keeps the limit pinned at zero instead of letting it recover.
const FAILURE_CACHE_DURATION = 10 * 60 * 1000; // 10 minutes

// Shared by the GitHub stars and user count lookups. Counts are public,
// slow-moving numbers, so they live in localStorage rather than sessionStorage:
// a repeat visitor and a second tab then reuse the same cache instead of
// spending another seven calls against GitHub's hourly limit.
// Returns undefined for a miss and null for a remembered failure.
const readCache = (cacheKey) => {
  try {
    const raw = localStorage.getItem(cacheKey);
    if (!raw) return undefined;

    const { value, expires } = JSON.parse(raw);
    if (!expires || Date.now() >= expires) {
      localStorage.removeItem(cacheKey);
      return undefined;
    }

    return value;
  } catch {
    // Unreadable or written by an older build; treat it as a miss
    return undefined;
  }
};

const writeCache = (cacheKey, value, duration) => {
  try {
    localStorage.setItem(cacheKey, JSON.stringify({ value, expires: Date.now() + duration }));
  } catch (error) {
    console.error('Error caching count:', error);
  }
};

// StrictMode runs effects twice in development, and the cache is only written
// once a request comes back, so without this every lookup goes out twice and
// burns twice the rate limit.
const inFlight = new Map();

const dedupe = (cacheKey, run) => {
  const existing = inFlight.get(cacheKey);
  if (existing) return existing;

  const request = run().finally(() => inFlight.delete(cacheKey));
  inFlight.set(cacheKey, request);
  return request;
};

// Helper to get GitHub URL from project
const getProjectGithubUrl = (project) => {
  if (project.githubUrl) return project.githubUrl;
  if (project.githubUrls && project.githubUrls[0]) return project.githubUrls[0].url;
  return null;
};

// GitHub allows 60 unauthenticated calls an hour per IP and answers 403 once
// that runs out. It tells us when the window resets, so wait exactly that long
// rather than guessing.
const RATE_LIMIT_CAP = 60 * 60 * 1000;

const backoffFor = (response) => {
  if (response.status !== 403 && response.status !== 429) return FAILURE_CACHE_DURATION;

  const reset = Number(response.headers.get('x-ratelimit-reset'));
  if (!reset) return FAILURE_CACHE_DURATION;

  return Math.min(Math.max(reset * 1000 - Date.now(), 0) + 1000, RATE_LIMIT_CAP);
};

const fetchStars = async (githubUrl) => {
  if (!githubUrl) return null;

  // Extract owner and repo from GitHub URL
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;

  const [, owner, repo] = match;
  const cacheKey = `github_stars_${owner}_${repo}`;

  const cached = readCache(cacheKey);
  if (cached !== undefined) return cached;

  return dedupe(cacheKey, async () => {
    try {
      const response = await timedFetch(`https://api.github.com/repos/${owner}/${repo}`);

      if (!response.ok) {
        writeCache(cacheKey, null, backoffFor(response));
        return null;
      }

      const data = await response.json();
      if (data.stargazers_count !== undefined) {
        writeCache(cacheKey, data.stargazers_count, COUNT_CACHE_DURATION);
        return data.stargazers_count;
      }
    } catch {
      // Offline or timed out; will sort by date instead
    }

    writeCache(cacheKey, null, FAILURE_CACHE_DURATION);
    return null;
  });
};

// These servers only allow romangarms.com as a CORS origin, so in development
// the request goes through the matching Vite proxy instead (vite.config.js).
const DEV_PROXIES = {
  'https://autox.romangarms.com': '/api/autox',
};

const requestUrl = (url) => {
  if (!import.meta.env.DEV) return url;

  const origin = Object.keys(DEV_PROXIES).find(o => url.startsWith(o));
  return origin ? url.replace(origin, DEV_PROXIES[origin]) : url;
};

// Read a live user count from the project's own API (see the `userCount` field
// in projectsData). The endpoint answers aggregate counts only.
const fetchUsers = async (userCount) => {
  if (!userCount) return null;

  // Keyed on the canonical URL so the dev proxy doesn't split the cache
  const cacheKey = `user_count_${userCount.url}_${userCount.field}`;

  const cached = readCache(cacheKey);
  if (cached !== undefined) return cached;

  return dedupe(cacheKey, async () => {
    try {
      const response = await timedFetch(requestUrl(userCount.url));

      if (response.ok) {
        const data = await response.json();
        const value = data?.[userCount.field];

        if (typeof value === 'number') {
          writeCache(cacheKey, value, COUNT_CACHE_DURATION);
          return value;
        }
      }
    } catch {
      // Server unreachable or too slow, the badge just stays hidden
    }

    writeCache(cacheKey, null, FAILURE_CACHE_DURATION);
    return null;
  });
};

// A project's popularity is its user count when it reports one, and its GitHub
// stars otherwise. An app that lives on the App Store rather than on GitHub is
// measured by the people using it, not by a star count that never reflected it.
const fetchProjectCounts = async (project) => {
  const [users, stars] = await Promise.all([
    fetchUsers(project.userCount),
    project.userCount ? null : fetchStars(getProjectGithubUrl(project)),
  ]);

  // A lookup that failed falls back to what was baked in rather than blanking
  // a badge that was fine at build time.
  const baked = bakedCounts[project.id] ?? {};

  return {
    id: project.id,
    users: users ?? baked.users ?? null,
    stars: stars ?? baked.stars ?? null,
  };
};

const getPopularity = (counts, project) => {
  const row = counts[project.id];
  return row?.users ?? row?.stars ?? -1;
};

// Unknown counts come out as -1 and tie, so they fall through to the date
// ordering the page used before any of this existed.
const sortByPopularity = (counts) =>
  [...projects].sort((a, b) => {
    const difference = getPopularity(counts, b) - getPopularity(counts, a);
    if (difference !== 0) {
      return difference;
    }

    return new Date(b.date) - new Date(a.date);
  });

// Badge showing a repository's GitHub stars
function GitHubStars({ stars }) {
  if (stars === null || stars === undefined) return null;

  return (
    <span className="github-stars">
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 .25a.75.75 0 01.673.418l1.882 3.815 4.21.612a.75.75 0 01.416 1.279l-3.046 2.97.719 4.192a.75.75 0 01-1.088.791L8 12.347l-3.766 1.98a.75.75 0 01-1.088-.79l.72-4.194L.818 6.374a.75.75 0 01.416-1.28l4.21-.611L7.327.668A.75.75 0 018 .25z" />
      </svg>
      {stars.toLocaleString()}
    </span>
  );
}

// Badge showing how many people use the project
function UserCount({ count, label }) {
  if (count === null || count === undefined) return null;

  return (
    <span className="project-users">
      <svg viewBox="0 0 16 16" xmlns="http://www.w3.org/2000/svg">
        <path d="M8 8a3 3 0 100-6 3 3 0 000 6zM12.735 14c.618 0 1.093-.561.872-1.139a6.002 6.002 0 00-11.215 0c-.22.578.254 1.139.872 1.139h9.47z" />
      </svg>
      {count.toLocaleString()} {label}
    </span>
  );
}

function Projects() {
  const [sortedProjects, setSortedProjects] = useState(() => sortByPopularity(bakedCounts));
  const [counts, setCounts] = useState(bakedCounts);

  useEffect(() => {
    document.title = 'Projects | Roman Garms';
    return () => {
      document.title = 'Roman Garms';
    };
  }, []);

  useEffect(() => {
    let cancelled = false;

    // Each project's badge lands as soon as its own lookup returns, so one
    // unreachable server can't hold the others up. Only the re-sort waits for
    // the whole set, and every lookup is capped by COUNT_TIMEOUT_MS.
    const sortProjects = async () => {
      const settled = await Promise.allSettled(
        projects.map(async (project) => {
          const result = await fetchProjectCounts(project);
          if (!cancelled) {
            setCounts(previous => ({ ...previous, [project.id]: result }));
          }
          return result;
        })
      );

      if (cancelled) return;

      // Extract successful results
      const results = settled
        .filter(result => result.status === 'fulfilled')
        .map(result => result.value);

      const byId = Object.fromEntries(results.map(result => [result.id, result]));

      setSortedProjects(sortByPopularity(byId));
    };

    sortProjects();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="projects-page">
      <div className="projects-body">
        <div className="projects-header">
          <h1>Projects</h1>
          <p>A showcase of publicly available projects and applications</p>
        </div>

        <div className="projects-container">
          {sortedProjects.map((project) => (
            <div key={project.id} className="project-card">
              {/* Blurred background layer */}
              <div
                className="project-card-background"
                style={{ '--project-image': `url(${project.image})` }}
              />

              {/* Gradient overlay */}
              <div className="project-card-overlay" />

              {/* Card content */}
              <div className="project-card-content">
                {/* Left side - Image */}
                <div className="project-image-container">
                  <img
                    src={project.image}
                    alt={project.title}
                    className="project-image"
                  />
                </div>

                {/* Right side - Info */}
                <div className="project-info">
                  <h2 className="project-title">{project.title}</h2>

                  <div className="project-tags">
                    {project.status && (
                      <span className={`project-status ${project.status.toLowerCase()}`}>
                        {project.status}
                      </span>
                    )}
                    {project.userCount ? (
                      <UserCount
                        count={counts[project.id]?.users}
                        label={project.userCount.label}
                      />
                    ) : (
                      <GitHubStars stars={counts[project.id]?.stars} />
                    )}
                    {project.tags.map((tag) => (
                      <span key={tag} className="project-tag">{tag}</span>
                    ))}
                  </div>

                  <p className="project-description">
                    {project.description}
                    {project.blogPostUrl && (
                      <> <a href={project.blogPostUrl} className="read-more-link">(Read more)</a></>
                    )}
                    {project.blogPostUrls && project.blogPostUrls.map((post, index) => (
                      <span key={index}>
                        {' '}<a href={post.url} className="read-more-link">(Read more - {post.label})</a>
                      </span>
                    ))}
                  </p>

                  <div className="project-meta">
                    <span className="project-date">
                      {new Date(project.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        timeZone: 'UTC'
                      })}
                    </span>
                  </div>

                  <div className="project-actions">
                    {project.liveUrl && (
                      <a
                        href={project.liveUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="project-btn project-btn-primary"
                      >
                        View Live
                      </a>
                    )}
                    {project.downloadUrl && (
                      <a
                        href={project.downloadUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="project-btn project-btn-primary"
                      >
                        {project.downloadLabel || 'Download'}
                      </a>
                    )}
                    {project.githubUrl && (
                      <a
                        href={project.githubUrl}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="project-btn project-btn-secondary"
                      >
                        View on GitHub
                      </a>
                    )}
                    {project.githubUrls && project.githubUrls.map((repo, index) => (
                      <a
                        key={index}
                        href={repo.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="project-btn project-btn-secondary"
                      >
                        GitHub ({repo.label})
                      </a>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      <Footer />
    </div>
  );
}

export default Projects;
