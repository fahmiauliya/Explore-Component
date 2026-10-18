// Finds the best image for a GitHub repo: the first real showcase image in the
// README (at least 600px wide, wider than tall), or the repo's social preview.
import sharp from 'sharp';

const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';
const SKIP = /shields\.io|badge|badgen|\/workflows\/|codecov|travis|\.svg(\?|$)|npm|bundlephobia/i;
const TIMEOUT = 15_000;

function headers(token, accept) {
  const h = { 'user-agent': UA, accept: accept || 'application/vnd.github+json' };
  if (token) h.authorization = `Bearer ${token}`;
  return h;
}

async function get(url, opts = {}) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    return await fetch(url, { ...opts, redirect: 'follow', signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

// Image URLs from a README, in order of appearance. Dark-mode <source>s are skipped.
export function readmeImages(markdown) {
  const found = [];
  const push = (index, url) => url && found.push({ index, url: url.trim() });
  for (const m of markdown.matchAll(/!\[[^\]]*\]\(\s*<?([^\s)>]+)>?(?:\s+"[^"]*")?\s*\)/g)) push(m.index, m[1]);
  for (const m of markdown.matchAll(/<img\b[^>]*?\bsrc=["']([^"']+)["']/gi)) push(m.index, m[1]);
  for (const m of markdown.matchAll(/<source\b[^>]*>/gi)) {
    const tag = m[0];
    if (/prefers-color-scheme:\s*dark/i.test(tag)) continue;
    const src = tag.match(/\bsrcset=["']([^"',\s]+)/i);
    if (src) push(m.index, src[1]);
  }
  found.sort((a, b) => a.index - b.index);
  const seen = new Set();
  return found.map((f) => f.url).filter((u) => !seen.has(u) && seen.add(u));
}

export function resolveImageUrl(url, owner, repo, branch) {
  if (/^https?:\/\//i.test(url)) {
    // github.com/.../blob/... serves HTML; ask for the raw file.
    if (/^https?:\/\/github\.com\/[^/]+\/[^/]+\/blob\//i.test(url) && !/[?&]raw=true/.test(url)) return `${url}${url.includes('?') ? '&' : '?'}raw=true`;
    return url;
  }
  const path = url.replace(/^\.?\//, '');
  return `https://raw.githubusercontent.com/${owner}/${repo}/${branch}/${path}`;
}

async function downloadImage(url, token) {
  const res = await get(url, { headers: { 'user-agent': UA, accept: 'image/*,*/*' } });
  if (!res.ok) throw new Error(`${res.status}`);
  const buf = Buffer.from(await res.arrayBuffer());
  const meta = await sharp(buf, { pages: 1 }).metadata();
  if (!['png', 'jpeg', 'webp', 'gif'].includes(meta.format)) throw new Error(`not an image (${meta.format || 'unknown'})`);
  return { buf, width: meta.width, height: meta.height, format: meta.format };
}

export async function fetchRepoImage(owner, repo, token) {
  const info = await get(`https://api.github.com/repos/${owner}/${repo}`, { headers: headers(token) });
  if (info.status === 404) throw new Error('repo not found');
  if (info.status === 403 || info.status === 429) throw new Error('GitHub API rate limit (set GITHUB_TOKEN)');
  if (!info.ok) throw new Error(`GitHub API ${info.status}`);
  const { default_branch: branch } = await info.json();

  // 1. README image
  const readme = await get(`https://api.github.com/repos/${owner}/${repo}/readme`, { headers: headers(token, 'application/vnd.github.raw') });
  if (readme.ok) {
    const text = await readme.text();
    const candidates = readmeImages(text).filter((u) => !SKIP.test(u)).map((u) => resolveImageUrl(u, owner, repo, branch));
    for (const url of candidates.slice(0, 12)) {
      try {
        const img = await downloadImage(url, token);
        if (img.width >= 600 && img.width > img.height) return { ...img, source: 'readme', url };
      } catch {
        /* try the next one */
      }
    }
  }

  // 2. Social preview (custom if the repo has one, otherwise GitHub's generated card)
  const page = await get(`https://github.com/${owner}/${repo}`, { headers: { 'user-agent': UA, accept: 'text/html' } });
  const html = page.ok ? await page.text() : '';
  const og = html.match(/<meta\s+property=["']og:image["']\s+content=["']([^"']+)["']/i) || html.match(/<meta\s+content=["']([^"']+)["']\s+property=["']og:image["']/i);
  const ogUrl = og ? og[1] : `https://opengraph.githubassets.com/1/${owner}/${repo}`;
  const img = await downloadImage(ogUrl, token);
  return { ...img, source: 'social', url: ogUrl };
}

// For an owner-only URL: the owner's most starred repo, as a suggestion.
export async function suggestRepo(owner, token) {
  for (const kind of ['orgs', 'users']) {
    const res = await get(`https://api.github.com/${kind}/${owner}/repos?per_page=100&sort=updated`, { headers: headers(token) });
    if (!res.ok) continue;
    const repos = await res.json();
    if (!Array.isArray(repos) || !repos.length) continue;
    const best = repos.filter((r) => !r.fork).sort((a, b) => b.stargazers_count - a.stargazers_count)[0];
    if (best) return best.html_url;
  }
  return null;
}
