import { defineConfig } from 'vite';

// The figures are read straight from the Line Illustration project, so the dev server may serve its folder.
export default defineConfig({
  esbuild: { jsx: 'automatic' },
  server: { fs: { allow: ['..'] } },
});
