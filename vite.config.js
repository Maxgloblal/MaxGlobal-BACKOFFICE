import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    host: true
  },
  test: {
    include: ['src/**/*.{test,spec}.{js,jsx,ts,tsx}', 'scripts/**/*.{test,spec}.{js,mjs,ts}'],
    fileParallelism: false,
    maxWorkers: 1,
    minWorkers: 1,
    testTimeout: 20000
  }
});

