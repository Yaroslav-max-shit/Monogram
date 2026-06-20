import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5174,
    proxy: {
      '/auth': { target: 'http://localhost:8001', changeOrigin: true },
      '/accounts': { target: 'http://localhost:8001', changeOrigin: true },
      '/transfer': { target: 'http://localhost:8001', changeOrigin: true },
      '/settings': { target: 'http://localhost:8001', changeOrigin: true },
      '/connect': { target: 'http://localhost:8001', changeOrigin: true },
      '/premium': { target: 'http://localhost:8001', changeOrigin: true },
      '/notifications': { target: 'http://localhost:8001', changeOrigin: true },
      '/admin': { target: 'http://localhost:8001', changeOrigin: true },
      '/api': { target: 'http://localhost:8001', changeOrigin: true }
    }
  }
})
