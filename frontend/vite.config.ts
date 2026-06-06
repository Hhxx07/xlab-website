import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// https://vite.dev/config/
export default defineConfig({
  plugins: [react()],

  // ---------------------------------------------------------------------------
  // 开发服务器配置
  // ---------------------------------------------------------------------------
  server: {
    // 监听所有网络接口（Docker 中需要）
    host: '0.0.0.0',
    port: 5173,

    // API 代理 — 将 /api 请求转发到 Go 后端
    // 开发时无需处理 CORS，生产由 Nginx/Caddy 反向代理
    proxy: {
      '/api': {
        // 本地开发直接连 localhost，Docker 中连 api 容器
        target: process.env.VITE_API_BASE_URL || 'http://api:8080',
        changeOrigin: true,
        // 不重写路径，保持 /api/xxx → /api/xxx
      },
    },
  },
})
