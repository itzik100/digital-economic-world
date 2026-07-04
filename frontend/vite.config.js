import { defineConfig } from 'vite';

export default defineConfig({
  root: 'src',
  server: {
    port: 3000,
    proxy: {
      '/api/': 'http://localhost:4000',
      '/esri-tiles': {
        target: 'https://server.arcgisonline.com',
        changeOrigin: true,
        rewrite: path => path.replace(/^\/esri-tiles/, '')
      }
    }
  },
  build: {
    outDir: '../dist'
  }
});
