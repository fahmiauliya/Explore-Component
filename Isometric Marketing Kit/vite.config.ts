import { defineConfig } from 'vite';

// Self-contained: the figures are vendored in src/vendor/figures, so the site builds from this folder alone (Vercel).
export default defineConfig({
  esbuild: { jsx: 'automatic' },
});
