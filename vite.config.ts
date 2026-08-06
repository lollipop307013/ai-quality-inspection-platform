import path from "path"
import { defineConfig } from "vite"
import react from "@vitejs/plugin-react"

export default defineConfig({
  plugins: [react()],
  // 默认以项目站点形式部署（带仓库名前缀）。
  // 若要以用户级站点（裸域名 lollipop307013.github.io）部署，构建时设置 BASE_PATH=/
  base: process.env.BASE_PATH || '/ai-quality-inspection-platform/',
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  server: {
    host: "0.0.0.0",
    allowedHosts: true
  }
})