# ShedDesign - AI 智能花园棚屋设计系统

一个 AI 驱动的网页应用，帮助用户在花园中规划放置棚屋（Shed）的最佳位置。

## 快速开始

### 前置条件
- Node.js 18+
- npm 9+
- Google Gemini API 密钥

### 安装和运行

1. 克隆仓库并安装依赖：
```bash
cd i:\AI\ShedDesign
npm install
```

2. 配置环境变量：
```bash
cp .env.example .env.local
# 编辑 .env.local，添加你的 Gemini API 密钥
```

3. 启动开发服务器：
```bash
npm run dev
```

前端：http://localhost:5173
后端：http://localhost:5000

## 项目结构

- `frontend/` - React 前端应用
- `backend/` - Node.js Express 后端
- `docs/` - 项目文档

## 功能

- 📸 上传花园图纸或照片
- 🤖 AI 自动分析花园布局
- 💬 交互式问卷收集用户需求
- 🎨 AI 生成最优 Shed 位置建议
- 🏗️ 3D 可视化和交互编辑
- 💾 保存和导出设计方案

## 技术栈

### 前端
- React 18 + TypeScript
- Three.js + React Three Fiber
- Vite
- React Hook Form

### 后端
- Node.js + Express
- TypeScript
- Google Gemini API

## 许可证

MIT
