import { defineConfig } from 'vite';

export default defineConfig({
  server: {
    port: Math.floor(Math.random() * 9000) + 1000,
    host: true,
  },
  build: {
    target: 'ES2020',
  },
});
