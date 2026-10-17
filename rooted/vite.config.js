import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Plain Vite + React setup. The dev server port is fixed so the link stays the same.
export default defineConfig({
  plugins: [react()],
});
