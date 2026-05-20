# ShedDesign 自动化 Agent 工作流

## 架构总览

```
dev_agent（主编排器）
    │
    ├── 读 ROADMAP.md → 找下一个 [ ] 任务
    │
    ├── ① 派发 task_agent（实现 + 测试）
    │       │
    │       └── task_agent
    │               1. 读相关文件
    │               2. 实现功能
    │               3. 写单元测试
    │               4. npx tsc --noEmit  ← FAIL 自修复（最多 3 次）
    │               5. npx vitest run    ← FAIL 自修复（最多 3 次）
    │               6. 返回结构化报告
    │
    ├── 验收 ts_check=PASS + tests=PASS
    │   （FAIL → 追加修复指令重新派发 task_agent，最多 3 次）
    │
    ├── ② 派发 qa_agent（代码审查）
    │       │
    │       └── qa_agent
    │               1. 读所有 files_changed
    │               2. 审查：功能/错误处理/安全/TS质量/测试覆盖
    │               3. 返回 verdict: PASS | ISSUES_FOUND
    │
    ├── verdict = PASS
    │       → 更新 ROADMAP [x]
    │       → 进入下一个任务
    │
    ├── verdict = ISSUES_FOUND
    │       → 把 QA 报告作为修复 brief 重新派发 task_agent（步骤①）
    │       → 修复后再走一次 QA（步骤②）
    │       → 最多 2 轮 QA；仍失败 → 暂停报告用户
    │
    └── 循环直到 ROADMAP 全部 [x]
```

## 完整循环示意

```
任务 PhaseXa
  ├── task_agent #1 → ts:PASS tests:PASS
  ├── qa_agent #1   → ISSUES_FOUND (2 MAJOR)
  ├── task_agent #2 → 修复 QA 问题 → ts:PASS tests:PASS
  ├── qa_agent #2   → PASS
  └── ROADMAP 标记 [x] → 进入 PhaseXb
```

## 启动方式

在 Claude Code 中说：
```
你现在是 agents/dev_agent.md 描述的主编排器。
读取 .planning/ROADMAP.md，从第一个 [ ] 任务开始，
为每个任务依次派发 task_agent 和 qa_agent，
全程不需要人工确认，直到所有任务完成。
```

## 单任务触发

```
你现在是 agents/dev_agent.md 描述的主编排器。
只执行 Phase 8b，完成 task_agent + qa_agent 完整循环。
```

## 测试命令参考

```bash
# 后端单文件测试
cd backend && npx vitest run src/__tests__/<file>.test.ts

# 前端单文件测试
cd frontend && npx vitest run src/__tests__/<Component>.test.tsx

# 全量测试
cd backend && npx vitest run
cd frontend && npx vitest run

# 类型检查
cd backend && npx tsc --noEmit
cd frontend && npx tsc --noEmit
```

## 测试文件约定

```
backend/src/__tests__/
  auth.test.ts
  imageAnalyzer.test.ts
  recommendationEngine.test.ts
  questionnaire.test.ts

frontend/src/__tests__/
  LoginPage.test.tsx
  SignupPage.test.tsx
  QuestionnairePage.test.tsx
```

## 例外（必须暂停等待人工）

| 情况 | 原因 |
|------|------|
| Phase 10.5 任何子任务 | 数据库迁移需确认表结构 |
| task_agent 连续 3 次测试失败 | 可能是环境或依赖问题 |
| qa_agent 连续 2 轮 ISSUES_FOUND | 需要人工判断是否接受妥协 |
| 缺少必要环境变量 | 如 ANTHROPIC_API_KEY 未配置 |
