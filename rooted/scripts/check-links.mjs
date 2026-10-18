// Checks every URL in src/data/references.js and prints a table:
// status, final URL after redirects, name. It only reports; nothing is changed.
//
//   npm run check-links
//
// ⚠︎ marks anything that isn't 2xx, or a redirect that lands on another domain.

import { tabs } from '../src/data/references.js';

const TIMEOUT = 15_000;
const UA = 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/129.0.0.0 Safari/537.36';

const items = [];
const seen = new Set();
for (const tab of tabs) for (const section of tab.sections) for (const item of section.items) {
  if (seen.has(item.url)) continue;
  seen.add(item.url);
  items.push(item);
}

const host = (url) => new URL(url).hostname.replace(/^www\./, '');

async function request(url, method) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), TIMEOUT);
  try {
    return await fetch(url, { method, redirect: 'follow', headers: { 'user-agent': UA, accept: 'text/html,*/*' }, signal: controller.signal });
  } finally {
    clearTimeout(timer);
  }
}

async function check(item) {
  try {
    let res = await request(item.url, 'HEAD');
    if (res.status === 405 || res.status === 403 || res.status === 404 || res.status >= 500) res = await request(item.url, 'GET');
    const finalUrl = res.url || item.url;
    const crossDomain = host(finalUrl) !== host(item.url);
    const ok = res.status >= 200 && res.status < 300 && !crossDomain;
    return { name: item.name, url: item.url, status: res.status, finalUrl, flag: ok ? '' : '⚠︎' };
  } catch (err) {
    return { name: item.name, url: item.url, status: 'ERR', finalUrl: err.name === 'AbortError' ? 'timed out' : err.message, flag: '⚠︎' };
  }
}

const results = [];
const queue = [...items];
await Promise.all(Array.from({ length: 6 }, async () => {
  while (queue.length) results.push(await check(queue.shift()));
}));
results.sort((a, b) => items.findIndex((i) => i.url === a.url) - items.findIndex((i) => i.url === b.url));

const pad = (s, n) => String(s).padEnd(n);
console.log(`${pad('', 2)} ${pad('Status', 7)} ${pad('Name', 22)} Final URL`);
for (const r of results) {
  const moved = r.finalUrl !== r.url && r.finalUrl.replace(/\/$/, '') !== r.url.replace(/\/$/, '');
  console.log(`${pad(r.flag, 2)} ${pad(r.status, 7)} ${pad(r.name, 22)} ${moved ? `${r.finalUrl}  (from ${r.url})` : r.url}`);
}
const flagged = results.filter((r) => r.flag);
console.log(`\n${results.length} links checked, ${flagged.length} flagged.`);
