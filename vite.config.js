import { defineConfig } from 'vite';

// Vite config: plain ES modules, no framework.
export default defineConfig({
  server: { host: true, port: 5173 },
  build: {
    target: 'es2019',
    chunkSizeWarningLimit: 900,
    rollupOptions: {
      output: {
        // Keep the heavy libraries in their own cacheable chunks.
        manualChunks: {
          three: ['three'],
          gsap: ['gsap'],
          howler: ['howler']
        }
      }
    }
  }
});
