# GitHub Pages 部署完整指南

## 🎯 您的项目信息
- **GitHub 用户名**: lollipop307013
- **推荐仓库名**: ai-quality-inspection-platform
- **部署后访问地址**: https://lollipop307013.github.io/ai-quality-inspection-platform/

## 📋 接下来的步骤

### 1. 创建 GitHub 仓库
1. 打开 https://github.com/new
2. 仓库名填写: `ai-quality-inspection-platform`
3. 设置为 Public（GitHub Pages 免费版需要公开仓库）
4. **不要**勾选 "Add a README file"、"Add .gitignore"、"Choose a license"
5. 点击 "Create repository"

### 2. 推送代码到 GitHub
在当前项目目录中执行以下命令：

```bash
# 添加远程仓库
& "D:\Program Files\Git\bin\git.exe" remote add origin https://github.com/lollipop307013/ai-quality-inspection-platform.git

# 设置主分支名称
& "D:\Program Files\Git\bin\git.exe" branch -M main

# 推送代码
& "D:\Program Files\Git\bin\git.exe" push -u origin main
```

### 3. 配置 GitHub Pages
1. 进入您的仓库页面: https://github.com/lollipop307013/ai-quality-inspection-platform
2. 点击 "Settings" 选项卡
3. 在左侧菜单中找到 "Pages"
4. 在 "Source" 部分选择 "GitHub Actions"
5. 保存设置

### 4. 等待自动部署
- 推送代码后，GitHub Actions 会自动开始构建和部署
- 您可以在 "Actions" 选项卡中查看部署进度
- 首次部署通常需要 2-5 分钟

### 5. 访问您的网站
部署完成后，访问: https://lollipop307013.github.io/ai-quality-inspection-platform/

## 🔧 如果需要更新网站
每次修改代码后，只需要：
```bash
& "D:\Program Files\Git\bin\git.exe" add .
& "D:\Program Files\Git\bin\git.exe" commit -m "Update: 描述您的修改"
& "D:\Program Files\Git\bin\git.exe" push
```

## 🚨 常见问题解决

### 问题1: 页面显示空白
- 检查浏览器控制台是否有 404 错误
- 确认 `vite.config.ts` 中的 `base` 路径正确

### 问题2: 推送时要求登录
- 使用 GitHub Personal Access Token
- 或者使用 GitHub Desktop 客户端

### 问题3: Actions 构建失败
- 检查 `package.json` 中的依赖是否正确
- 查看 Actions 日志中的具体错误信息

## 📞 需要帮助？
如果遇到任何问题，请检查：
1. GitHub Actions 的构建日志
2. 浏览器开发者工具的控制台
3. 确认所有文件都已正确推送到仓库