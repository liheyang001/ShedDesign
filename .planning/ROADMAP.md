# ShedDesign 开发路线图

## 交接规则

每完成一个 Phase，Claude 会：
1. 说明该 Phase 已完成及做了什么
2. 提示：**请关闭当前对话框，重新打开新的 Claude Code 对话框，告知"继续开发 Phase Xa"**
3. 新会话从下一 Phase 第一个小点开始，保持上下文干净

---

## Phase 6 — 认证系统

- [x] **6a** 后端：用户模型 + 密码哈希（bcrypt）+ JWT 签发/验证
- [x] **6b** 后端：注册/登录/刷新 Token 接口
- [x] **6c** 前端：AuthContext + useAuth hook
- [x] **6d** 前端：LoginPage / SignupPage UI
- [x] **6e** 前端：ProtectedRoute + App.tsx 路由整合

## Phase 7 — 问卷表单

- [x] **7a** 类型定义：UserPreferences schema
- [x] **7b** 后端：`POST /api/questionnaire` 接口
- [x] **7c** 前端：React Hook Form 多步骤问卷页面

## Phase 8 — AI 推荐引擎

- [x] **8a** Gemini Chat prompt 设计 + 后端 `POST /api/generate-recommendation`
- [x] **8b** 前端：结果页布局 + DesignRecommendation 展示

## Phase 9 — 3D 可视化

- [x] **9a** Three.js + React Three Fiber 安装与基础场景搭建
- [x] **9b** 花园地面 + 边界渲染
- [x] **9c** 棚屋模型放置 + 相机控制

## Phase 10 — 3D 交互编辑

- [x] **10a** 拖拽放置棚屋
- [ ] **10b** 旋转 / 缩放控制

## Phase 10.5 — 数据库迁移（Supabase）

> **决策**：Phase 9 完成后，将文件存储（JSON）迁移至 Supabase（PostgreSQL）
>
> - [ ] **10.5a** Supabase 项目创建 + 环境变量配置
> - [ ] **10.5b** Prisma schema 定义（users、questionnaires、projects 表）
> - [ ] **10.5c** 替换 `userStore.ts` → Prisma client
> - [ ] **10.5d** 替换 `questionnaireController.ts` → Prisma client
> - [ ] **10.5e** 可选：替换自写 JWT Auth → Supabase Auth

## Phase 11 — 保存与导出

- [ ] **11a** 后端：保存项目接口
- [ ] **11b** 前端：导出为图片 / PDF
