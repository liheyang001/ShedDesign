# ShedDesign 系统架构

## 系统组成

### 前端（frontend/）
React + TypeScript 应用，处理用户界面和 3D 可视化。

**主要功能：**
- 上传管理页面
- 交互式问卷表单
- 3D 模型展示和交互
- 方案管理界面

**主要库：**
- React Three Fiber - Three.js 集成
- Drei - 3D 组件库
- React Hook Form - 表单管理

### 后端（backend/）
Node.js Express 服务器，提供 REST API。

**主要功能：**
- 图片上传处理
- Gemini API 集成（图像分析和设计推荐）
- 项目数据管理
- 导出功能

### 数据流

```
前端上传图片
  ↓
后端存储图片，调用 Gemini Vision 分析
  ↓
返回分析结果到前端
  ↓
用户填表问卷
  ↓
提交问卷到后端
  ↓
后端调用 Gemini Chat 生成建议
  ↓
返回建议到前端
  ↓
前端用 Three.js 渲染 3D 模型
  ↓
用户调整，最终保存
```

## API 接口

### POST /api/upload
上传花园图片

### POST /api/analyze-image
分析图片（调用 Gemini Vision）

### POST /api/questionnaire
保存用户问卷

### POST /api/generate-recommendation
生成设计建议（调用 Gemini Chat）

### GET/PUT/DELETE /api/projects/:id
项目管理

## 部署

推荐使用 Railway 部署前后端。
