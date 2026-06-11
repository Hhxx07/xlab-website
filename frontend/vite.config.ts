import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  server: {
    host: '0.0.0.0',
    port: 5173,
    strictPort: true,
    watch: {
      usePolling: process.env.CHOKIDAR_USEPOLLING === 'true',
    },
    proxy: {
      '/api': {
        // Docker 内通过 VITE_API_BASE_URL=http://api:8080 注入；本地开发默认 localhost
        target: process.env.VITE_API_BASE_URL || 'http://localhost:8080',
        changeOrigin: true,
      },
    },
  },
})
