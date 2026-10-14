import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { createServer, defineConfig, loadEnv, type Plugin } from 'vite';

/**
 * Each tab's figure files are a chunk of their own (src/sources/), loaded when the tab opens. So that the one a page
 * needs doesn't wait for the main script, the built page starts fetching it at once: a tiny script picks the chunk
 * from the address (Fintech pages get Fintech; the rest of the gallery, Marketing) and adds a modulepreload for it.
 */
function preloadTab(): Plugin {
  return {
    name: 'compo-preload-tab',
    apply: 'build',
    transformIndexHtml: {
      order: 'post',
      handler(html, ctx) {
        const chunks: Record<string, string> = {};
        for (const file of Object.values(ctx.bundle ?? {})) {
          if (file.type === 'chunk' && (file.name === 'marketing' || file.name === 'fintech')) chunks[file.name] = `/${file.fileName}`;
        }
        if (!chunks.marketing || !chunks.fintech) return html;
        const script = `<script>(()=>{const c=${JSON.stringify(chunks)},p=location.pathname;const l=document.createElement('link');l.rel='modulepreload';l.href=/(^|\\/)fintech(\\/|$)/.test(p)?c.fintech:c.marketing;document.head.appendChild(l)})()</script>`;
        return html.replace('</head>', `${script}\n</head>`);
      },
    },
  };
}

/**
 * The request form's function (api/request.ts) on the dev server too, so the form works on localhost. Keys come from
 * .env.local (RESEND_API_KEY, REQUEST_TO, REQUEST_FROM); without them it refuses ("not connected") and prints the request here.
 */
function devApi(): Plugin {
  return {
    name: 'compo-dev-api',
    apply: 'serve',
    configureServer(server) {
      Object.assign(process.env, loadEnv('development', process.cwd(), ''));
      server.middlewares.use('/api/request', async (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.setHeader('allow', 'POST'); res.end(); return; }
        const chunks: Buffer[] = [];
        for await (const c of req) chunks.push(c as Buffer);
        const mod = await server.ssrLoadModule('/api/request.ts');
        const out: Response = await mod.POST(new Request(`http://${req.headers.host}/api/request`, {
          method: 'POST', headers: { 'content-type': String(req.headers['content-type'] ?? '') }, body: Buffer.concat(chunks),
        }));
        res.statusCode = out.status;
        out.headers.forEach((v, k) => res.setHeader(k, v));
        res.end(await out.text());
      });
    },
  };
}

/**
 * A page of HTML per address, each with its own title, description and share image (src/meta.ts), so link previews
 * and search engines see them without running the app: dist/illustrations.html, illustrations/fintech.html,
 * illustrations/fintech/coin-tube.html… (served at their clean addresses, see vercel.json's cleanUrls). Image and page
 * addresses are absolute: SITE_URL, or Vercel's production domain.
 */
function pages(): Plugin {
  let outDir = 'dist', root = process.cwd();
  return {
    name: 'compo-pages',
    apply: 'build',
    configResolved(c) { outDir = resolve(c.root, c.build.outDir); root = c.root; },
    async closeBundle() {
      const vercel = process.env.VERCEL_PROJECT_PRODUCTION_URL;
      const origin = (process.env.SITE_URL || (vercel ? `https://${vercel}` : '')).replace(/\/$/, '');
      const server = await createServer({ root, configFile: false, logLevel: 'silent', server: { middlewareMode: true }, appType: 'custom' });
      try {
        const { metaFor, metaTags } = await server.ssrLoadModule('/src/meta.ts');
        const { CATEGORIES } = await server.ssrLoadModule('/src/figures.ts');
        const shell = readFileSync(resolve(outDir, 'index.html'), 'utf8');
        const write = (file: string, page: object) => {
          const html = shell.replace(/<!-- meta[\s\S]*?<!-- \/meta -->/, `<!-- meta -->\n${metaTags(metaFor(page), origin)}\n<!-- /meta -->`);
          mkdirSync(dirname(resolve(outDir, file)), { recursive: true });
          writeFileSync(resolve(outDir, file), html);
        };
        write('index.html', { category: CATEGORIES[0].key });
        write('illustrations.html', { category: CATEGORIES[0].key });
        for (const c of CATEGORIES) {
          write(`illustrations/${c.key}.html`, { category: c.key });
          for (const e of c.entries) write(`illustrations/${c.key}/${e.slug}.html`, { entry: e });
        }
        write('404.html', { missing: true });
      } finally {
        await server.close();
      }
    },
  };
}

// Self-contained: the figures are vendored in src/vendor/figures, so the site builds from this folder alone (Vercel).
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  plugins: [preloadTab(), devApi(), pages()],
});
