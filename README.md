# AI质量检测平台

一个专门用于对话质量标注和质检的系统，支持多维度质量评估和灵活的标注项目配置。

## 🚀 功能特性

### 核心功能
- **任务中心**：创建和管理质检任务
- **标注工作台**：高效的对话标注界面
- **动态标注配置**：支持预定义和自定义标注类型
- **相似会话推荐**：智能推荐相似对话，支持批量标注
- **实时进度跟踪**：任务进度和倒计时提醒

### 标注类型支持
- 错误码分类（语法、逻辑、事实、情感错误等）
- 消息场景分类（闲聊、攻略、消费、投诉、咨询等）
- 人设对话质量评估（好、中、差）
- 情感倾向分析（正面、中性、负面）
- 自定义标注类型（输入框/下拉选择）

## 🛠️ 技术栈

- **前端框架**：React 18 + TypeScript
- **样式方案**：Tailwind CSS
- **构建工具**：Vite
- **UI组件**：自定义组件库
- **图标库**：Lucide React
- **通知组件**：Sonner

## 📦 快速开始

### 环境要求
- Node.js 18+
- npm 或 yarn

### 安装依赖
```bash
npm install
```

### 启动开发服务器
```bash
npm run dev
```

### 构建生产版本
```bash
npm run build
```

### 预览生产版本
```bash
npm run preview
```

## 📁 项目结构

```
src/
├── components/          # 可复用组件
│   ├── ui/             # 基础UI组件
│   └── task-creation-dialog.tsx  # 任务创建对话框
├── pages/              # 页面组件
│   ├── annotation-workbench.tsx  # 标注工作台
│   ├── task-center.tsx           # 任务中心
│   └── standard-config.tsx       # 质检标准配置
├── lib/                # 工具函数
└── App.tsx            # 主应用组件
```

## 🎯 主要页面

### 1. 任务中心 (`/task-center`)
- 任务列表管理
- 任务创建和配置
- 任务状态跟踪
- 标注员分配

### 2. 标注工作台 (`/annotation-workbench`)
- 对话内容展示
- 多维度标注操作
- 相似会话管理
- 实时进度更新

### 3. 质检标准配置 (`/standard-config`)
- 错误码管理
- 质检标准配置
- 标准搜索功能

## 🔧 核心功能说明

### 动态标注配置
系统支持在创建任务时配置标注项目：

1. **预定义标注类型**：
   - 错误码、场景分类、质量评估等
   - 每种类型都有预设的选项

2. **自定义标注类型**：
   - 支持添加项目特定的标注需求
   - 可选择输入方式（文本输入/下拉选择）
   - 灵活配置选项内容

### 相似会话推荐
- 基于内容相似度算法推荐相关对话
- 支持批量选择和同步标注
- 大幅提高标注效率

### 任务进度管理
- 实时显示任务完成进度
- 倒计时提醒功能
- 多状态管理（未标注/已标注/待定）

## 📊 数据结构

### 任务配置
```typescript
interface TaskConfig {
  annotationConfig: {
    predefinedTypes: string[]  // 预定义标注类型
    customTypes: CustomAnnotationType[]  // 自定义标注类型
  }
}
```

### 标注数据
```typescript
interface AnnotationData {
  errorCodes: string[]  // 错误码
  annotations: Record<string, any>  // 标注值
  timestamp: string  // 标注时间
}
```

## 🚀 部署说明

### CloudStudio部署
1. 将项目导入CloudStudio
2. 安装依赖：`npm install`
3. 启动开发服务器：`npm run dev`
4. 构建生产版本：`npm run build`

### 生产环境部署
1. 构建项目：`npm run build`
2. 将`dist`目录部署到静态文件服务器
3. 配置路由重定向到`index.html`

## 📝 开发指南

### 添加新的标注类型
1. 在`predefinedAnnotationTypes`中添加配置
2. 在任务创建对话框中添加选项
3. 在标注工作台中添加渲染逻辑

### 自定义UI组件
- 所有UI组件位于`src/components/ui/`
- 使用Tailwind CSS进行样式定制
- 遵循统一的设计规范

## 🤝 贡献指南

1. Fork项目
2. 创建功能分支
3. 提交更改
4. 发起Pull Request

## 📄 许可证

MIT License

## 📞 联系方式

如有问题或建议，请通过以下方式联系：
- 项目Issues
- 邮件联系

---

**注意**：本项目为演示版本，实际使用时需要配置后端API接口和数据持久化功能。