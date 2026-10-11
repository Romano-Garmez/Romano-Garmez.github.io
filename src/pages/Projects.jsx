import { useEffect, useState } from 'react';
import { projects } from '../data/projectsData';
import Footer from '../components/Footer';
import './Projects.css';

// Cache configuration (matches blog post cache duration)
const COUNT_CACHE_DURATION = 2 * 60 * 60 * 1000; // 2 hours

// A badge is a nice-to-have, so give up quickly rather than leaving the page
// waiting on the browser's own (much longer) timeout when a server is down.
const COUNT_TIMEOUT_MS = 5000;

const timedFetch = (url) => fetch(url, { signal: AbortSignal.timeout(COUNT_TIMEOUT_MS) });

// sessionStorage cache shared by the GitHub stars and user count lookups.
const getCachedCount = (cacheKey) => {
  try {
    const cachedCount = sessionStorage.getItem(cacheKey);
    const cacheTimestamp = sessionStorage.getItem(`${cacheKey}_timestamp`);

    if (!cachedCount || !cacheTimestamp) {
      return null;
    }

    // Check if cache is still fresh
    if (Date.now() - parseInt(cacheTimestamp, 10) < COUNT_CACHE_DURATION) {
      return parseInt(cachedCount, 10);
    }

    // Cache expired
    sessionStorage.removeItem(cacheKey);
    sessionStorage.removeItem(`${cacheKey}_timestamp`);
    return null;

  } catch (error) {
    console.error('Error reading count cache:', error);
    return null;
  }
};

const cacheCount = (cacheKey, count) => {
  try {
    sessionStorage.setItem(cacheKey, count.toString());
    sessionStorage.setItem(`${cacheKey}_timestamp`, Date.now().toString());
  } catch (error) {
    console.error('Error caching count:', error);
  }
};

// Helper to get GitHub URL from project
const getProjectGithubUrl = (project) => {
  if (project.githubUrl) return project.githubUrl;
  if (project.githubUrls && project.githubUrls[0]) return project.githubUrls[0].url;
  return null;
};

const fetchStars = async (githubUrl) => {
  if (!githubUrl) return null;

  // Extract owner and repo from GitHub URL
  const match = githubUrl.match(/github\.com\/([^/]+)\/([^/]+)/);
  if (!match) return null;

  const [, owner, repo] = match;
  const cacheKey = `github_stars_${owner}_${repo}`;

  const cached = getCachedCount(cacheKey);
  if (cached !== null) return cached;

  try {
    const response = await timedFetch(`https://api.github.com/repos/${owner}/${repo}`);
    const data = await response.json();

    if (data.stargazers_count !== undefined) {
      cacheCount(cacheKey, data.stargazers_count);
      return data.stargazers_count;
    }
  } catch {
    // Offline, timed out or rate limited; will sort by date instead
  }

  return null;
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

  const cached = getCachedCount(cacheKey);
  if (cached !== null) return cached;

  try {
    const response = await timedFetch(requestUrl(userCount.url));
    const data = await response.json();
    const value = data?.[userCount.field];

    if (typeof value === 'number') {
      cacheCount(cacheKey, value);
      return value;
    }
  } catch {
    // Server unreachable or too slow, the badge just stays hidden
  }

  return null;
};

// A project's popularity is its user count when it reports one, and its GitHub
// stars otherwise. An app that lives on the App Store rather than on GitHub is
// measured by the people using it, not by a star count that never reflected it.
const fetchProjectCounts = async (project) => {
  const [users, stars] = await Promise.all([
    fetchUsers(project.userCount),
    project.userCount ? null : fetchStars(getProjectGithubUrl(project)),
  ]);

  return { id: project.id, users, stars };
};

const getPopularity = (counts, project) => {
  const row = counts[project.id];
  return row?.users ?? row?.stars ?? -1;
};

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
  const [sortedProjects, setSortedProjects] = useState(projects);
  const [counts, setCounts] = useState({});

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

      // Check if we got any counts at all
      const hasCounts = results.some(r => r.users !== null || r.stars !== null);

      // Sort based on what data we have
      const sorted = [...projects].sort((a, b) => {
        if (hasCounts) {
          // Sort by popularity (descending), with unknown values at the end
          const difference = getPopularity(byId, b) - getPopularity(byId, a);
          if (difference !== 0) {
            return difference;
          }
        }

        // Fall back to date sorting (newer first)
        return new Date(b.date) - new Date(a.date);
      });

      setSortedProjects(sorted);
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
