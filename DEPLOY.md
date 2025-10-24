# GitHub Pages 部署指南

## 前提条件
1. 安装 Git: https://git-scm.com/download/win
2. 拥有 GitHub 账户

## 部署步骤

### 方法一：使用 GitHub Actions 自动部署（推荐）

1. **创建 GitHub 仓库**
   ```bash
   # 在项目目录中初始化 Git 仓库
   git init
   git add .
   git commit -m "Initial commit"
   
   # 添加远程仓库（替换为您的仓库地址）
   git remote add origin https://github.com/YOUR_USERNAME/ai-quality-inspection-platform.git
   git branch -M main
   git push -u origin main
   ```

2. **配置 GitHub Pages**
   - 进入 GitHub 仓库设置页面
   - 找到 "Pages" 选项
   - Source 选择 "GitHub Actions"

3. **更新 base 路径**
   - 在 `vite.config.ts` 中，将 `base: '/ai-quality-inspection-platform/'` 替换为您的实际仓库名

4. **推送代码**
   ```bash
   git add .
   git commit -m "Add GitHub Pages deployment"
   git push
   ```

### 方法二：手动部署

1. **安装依赖**
   ```bash
   npm install
   ```

2. **构建项目**
   ```bash
   npm run build
   ```

3. **部署到 GitHub Pages**
   ```bash
   npm run deploy
   ```

## 访问地址
部署成功后，您的网站将在以下地址可用：
`https://YOUR_USERNAME.github.io/REPOSITORY_NAME/`

## 注意事项
1. 确保 `vite.config.ts` 中的 `base` 路径与您的仓库名匹配
2. 如果使用自定义域名，需要在仓库根目录添加 `CNAME` 文件
3. 首次部署可能需要几分钟时间生效

## 故障排除
- 如果页面显示空白，检查浏览器控制台是否有资源加载错误
- 确认 `base` 路径配置正确
- 检查 GitHub Actions 构建日志是否有错误