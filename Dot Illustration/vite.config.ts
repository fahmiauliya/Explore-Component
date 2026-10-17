import { writeFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { defineConfig, type Plugin } from 'vite';

const TUNING = fileURLToPath(new URL('./src/bird/dot-bird.tuning.json', import.meta.url));

/** "Save to file": writes the Dot Bird, Dot Sequence, Sky and Tracking panels' values and the timelines' to dot-bird.tuning.json. Dev server only. */
function saveTuning(): Plugin {
  return {
    name: 'save-tuning',
    configureServer(server) {
      server.middlewares.use('/__save-tuning', (req, res) => {
        if (req.method !== 'POST') { res.statusCode = 405; res.end(); return; }
        let body = '';
        req.on('data', chunk => { body += chunk; });
        req.on('end', () => {
          try {
            const data = JSON.parse(body);
            const isMap = (v: unknown) => !!v && typeof v === 'object' && !Array.isArray(v);
            if (!isMap(data) || !isMap(data.panel) || !isMap(data.timeline)) throw new Error('expected { panel, timeline }');
            writeFileSync(TUNING, JSON.stringify({ savedAt: new Date().toISOString(), panel: data.panel, timeline: data.timeline, sequence: isMap(data.sequence) ? data.sequence : {}, sequenceTimeline: isMap(data.sequenceTimeline) ? data.sequenceTimeline : {}, sky: isMap(data.sky) ? data.sky : {}, tracking: isMap(data.tracking) ? data.tracking : {} }, null, 2) + '\n');
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

export default defineConfig({
  plugins: [saveTuning()],
  esbuild: { jsx: 'automatic' },
  // DialKit's motion dependency carries "use client" directives; Rollup's notice about them is noise here.
  build: { rollupOptions: { onwarn: (warning, warn) => { if (warning.code !== 'MODULE_LEVEL_DIRECTIVE') warn(warning); } } },
});
