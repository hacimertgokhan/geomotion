// Live GitHub stats for the site & studio header.
// Fills any element with [data-gh="stars" | "forks"]; cached for 30 min to stay under the API rate limit.
export const REPO = 'hacimertgokhan/geomotion';
const KEY = `geomotion.gh.${REPO}`;
const TTL = 30 * 60 * 1000;

export const ICONS = {
  github: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 0C3.58 0 0 3.58 0 8c0 3.54 2.29 6.53 5.47 7.59.4.07.55-.17.55-.38 0-.19-.01-.82-.01-1.49-2.01.37-2.53-.49-2.69-.94-.09-.23-.48-.94-.82-1.13-.28-.15-.68-.52-.01-.53.63-.01 1.08.58 1.23.82.72 1.21 1.87.87 2.33.66.07-.52.28-.87.51-1.07-1.78-.2-3.64-.89-3.64-3.95 0-.87.31-1.59.82-2.15-.08-.2-.36-1.02.08-2.12 0 0 .67-.21 2.2.82.64-.18 1.32-.27 2-.27.68 0 1.36.09 2 .27 1.53-1.04 2.2-.82 2.2-.82.44 1.1.16 1.92.08 2.12.51.56.82 1.27.82 2.15 0 3.07-1.87 3.75-3.65 3.95.29.25.54.73.54 1.48 0 1.07-.01 1.93-.01 2.2 0 .21.15.46.55.38A8.01 8.01 0 0 0 16 8c0-4.42-3.58-8-8-8Z"/></svg>',
  star: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M8 .25a.75.75 0 0 1 .67.42l1.88 3.81 4.2.61a.75.75 0 0 1 .42 1.28l-3.04 2.96.72 4.19a.75.75 0 0 1-1.09.79L8 12.33l-3.76 1.98a.75.75 0 0 1-1.09-.79l.72-4.19L.83 6.37a.75.75 0 0 1 .42-1.28l4.2-.61L7.33.67A.75.75 0 0 1 8 .25Z"/></svg>',
  fork: '<svg viewBox="0 0 16 16" aria-hidden="true"><path fill="currentColor" d="M5 5.37v.88c0 .41.34.75.75.75h4.5a.75.75 0 0 0 .75-.75v-.88a2.25 2.25 0 1 1 1.5 0v.88a2.25 2.25 0 0 1-2.25 2.25h-1.5v2.13a2.25 2.25 0 1 1-1.5 0V8.5h-1.5A2.25 2.25 0 0 1 3.5 6.25v-.88a2.25 2.25 0 1 1 1.5 0ZM5 3.25a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Zm6.75.75a.75.75 0 1 0 0-1.5.75.75 0 0 0 0 1.5Zm-3 8.75a.75.75 0 1 0-1.5 0 .75.75 0 0 0 1.5 0Z"/></svg>',
};

export const compact = (n) =>
  n >= 1e6 ? `${(n / 1e6).toFixed(1).replace(/\.0$/, '')}m` : n >= 1e3 ? `${(n / 1e3).toFixed(1).replace(/\.0$/, '')}k` : String(n);

function cached() {
  try {
    const c = JSON.parse(localStorage.getItem(KEY) ?? 'null');
    return c && Date.now() - c.t < TTL ? c : null;
  } catch { return null; }
}

export async function repoStats() {
  const hit = cached();
  if (hit) return hit;
  const r = await fetch(`https://api.github.com/repos/${REPO}`, { headers: { accept: 'application/vnd.github+json' } });
  if (!r.ok) throw new Error(`GitHub API ${r.status}`);
  const j = await r.json();
  const stats = { stars: j.stargazers_count, forks: j.forks_count, t: Date.now() };
  try { localStorage.setItem(KEY, JSON.stringify(stats)); } catch { /* private mode */ }
  return stats;
}

/** Injects icons into [data-icon] and live numbers into [data-gh]. */
export async function hydrateGitHub(root = document) {
  root.querySelectorAll('[data-icon]').forEach((el) => { el.innerHTML = ICONS[el.dataset.icon] ?? ''; });
  try {
    const s = await repoStats();
    root.querySelectorAll('[data-gh]').forEach((el) => {
      const n = s[el.dataset.gh] ?? 0;
      el.textContent = compact(n);
      const wrap = el.closest('[data-gh-wrap]');
      // data-gh-hide-zero: only reveal the counter once there is something to show
      if (wrap && !(wrap.hasAttribute('data-gh-hide-zero') && n === 0)) wrap.classList.add('has-stats');
    });
  } catch {
    // Offline or rate-limited: the buttons still work, the counters just stay hidden.
  }
}
