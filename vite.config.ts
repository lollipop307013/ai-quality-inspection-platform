import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

const gbotTarget = process.env.GBOT_API_TARGET || 'https://gbot.qq.com'

export default defineConfig(({ command }) => ({
  plugins: [react()],
  // 本地开发使用根路径，确保可直接访问 /online-task-list。
  // 构建发布默认使用项目站点前缀；如需用户级站点，构建时传 BASE_PATH=/
  base: command === 'serve' ? '/' : (process.env.BASE_PATH || '/ai-quality-inspection-platform/'),
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    port: 5175,
    strictPort: true,
    allowedHosts: true,
    proxy: command === 'serve'
      ? {
          '/api/gbot': {
            target: gbotTarget,
            changeOrigin: true,
            secure: false,
            rewrite: (path) => path.replace(/^\/api\/gbot/, '/api'),
          },
        }
      : undefined,
  }
}))