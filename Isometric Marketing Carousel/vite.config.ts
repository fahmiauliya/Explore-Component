import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const SETTINGS = fileURLToPath(new URL('./settings.json', import.meta.url));

/** The save button's endpoint: writes the DialKit panel and timeline values to settings.json (dev server only). */
function saveSettings(): Plugin {
  return {
    name: 'save-settings',
    configureServer(server) {
      server.middlewares.use('/__save-settings', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
        let body = '';
        req.on('data', (chunk) => { body += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const isMap = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v);
            if (!isMap(data) || !isMap(data.panel) || !isMap(data.timeline)) throw new Error('expected { panel, timeline }');
            writeFileSync(SETTINGS, JSON.stringify({ savedAt: new Date().toISOString(), panel: data.panel, timeline: data.timeline }, null, 2) + '\n');
            res.setHeader('content-type', 'application/json');
            res.end('{"ok":true}');
          } catch (e) {
            res.statusCode = 400;
            res.end(JSON.stringify({ ok: false, error: e instanceof Error ? e.message : String(e) }));
          }
        });
      });
    },
  };
}

// The figures are read straight from the Line Illustration project, so the dev server may serve its folder.
export default defineConfig({ plugins: [saveSettings()], server: { fs: { allow: ['..'] } } });
