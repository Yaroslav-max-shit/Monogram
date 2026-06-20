import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import viteCompression from 'vite-plugin-compression'

export default defineConfig({
  plugins: [
    react(),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 1024,
    }),
    {
      name: 'cache-assets',
      configureServer(server) {
        server.middlewares.use('/assets/', (_req, res, next) => {
          res.setHeader('Cache-Control', 'public, max-age=31536000, immutable');
          next();
        });
      },
    },
  ],
  server: {
    port: 5173,
    host: true,
    strictPort: false,
    hmr: {
      protocol: 'ws',
      host: 'localhost',
      port: 5173,
      overlay: false,
      timeout: 120000
    },
    proxy: {
      '/api': { target: 'http://localhost:8000', changeOrigin: true },
      '/auth': { target: 'http://localhost:8000', changeOrigin: true },
      '/users': { target: 'http://localhost:8000', changeOrigin: true },
      '/chats': { target: 'http://localhost:8000', changeOrigin: true },
      '/messages': { target: 'http://localhost:8000', changeOrigin: true },
      '/uploads': { target: 'http://localhost:8000', changeOrigin: true },
      '/admin': { target: 'http://localhost:8000', changeOrigin: true },
      '/settings': { target: 'http://localhost:8000', changeOrigin: true },
      '/premium': { target: 'http://localhost:8000', changeOrigin: true },
      '/payment': { target: 'http://localhost:8000', changeOrigin: true },
      '/stickers': { target: 'http://localhost:8000', changeOrigin: true },
      '/search': { target: 'http://localhost:8000', changeOrigin: true },
      '/e2ee': { target: 'http://localhost:8000', changeOrigin: true },
      '/bots': { target: 'http://localhost:8000', changeOrigin: true },
      '/drafts': { target: 'http://localhost:8000', changeOrigin: true },
      '/archive': { target: 'http://localhost:8000', changeOrigin: true },
      '/folders': { target: 'http://localhost:8000', changeOrigin: true },
      '/saved': { target: 'http://localhost:8000', changeOrigin: true },
      '/polls': { target: 'http://localhost:8000', changeOrigin: true },
      '/ws': { target: 'ws://localhost:8000', ws: true }
    }
  },
  build: {
    rollupOptions: {
      output: {
        manualChunks: {
          'vendor': ['react', 'react-dom'],
          'chat': ['./src/components/ChatWindow.tsx', './src/components/Sidebar.tsx'],
        }
      }
    }
  },
  preview: {
    port: 5173,
    host: true
  }
})
