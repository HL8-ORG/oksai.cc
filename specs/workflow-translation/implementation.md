# Workflow 翻译实现

## 状态：已完成

## 已完成

- [x] 数据库 schema：新增 `WorkflowStepAutoTranslatedField` 枚举
- [x] 数据库 schema：新增 `WorkflowStepTranslation` 模型
- [x] 数据库 schema：在 WorkflowStep 新增 `autoTranslateEnabled`、`sourceLocale`、`translations`
- [x] 创建 `WorkflowStepTranslationRepository`（使用 DI/Prisma 构造注入）
- [x] 创建 `translateWorkflowStepData` tasker 任务
- [x] 在 `EmailWorkflowService` 集成翻译查询
- [x] 在 `smsReminderManager` 集成翻译查询
- [x] 在 `whatsappReminderManager` 集成翻译查询
- [x] 更新 workflow update handler，在内容变更时触发翻译
- [x] 在 `WorkflowStepContainer` 增加 UI 开关
- [x] 新增单元测试
- [x] 创建带 DI 的共享 `TranslationService`

## 变更文件

### 新增文件

- `packages/features/translation/services/TranslationService.ts` - 共享翻译服务
- `packages/features/translation/services/ITranslationService.ts` - 接口
- `packages/features/translation/di/tokens.ts` - DI token
- `packages/features/di/modules/TranslationService.ts` - DI 模块
- `packages/features/di/containers/TranslationService.ts` - DI 容器
- `packages/features/ee/workflows/repositories/WorkflowStepTranslationRepository.ts`
- `packages/features/ee/workflows/di/WorkflowStepTranslationRepository.module.ts` - DI 模块
- `packages/features/ee/workflows/di/WorkflowStepTranslationRepository.container.ts` - DI 容器
- `packages/features/tasker/tasks/translateWorkflowStepData.ts`
- `packages/features/tasker/tasks/translateWorkflowStepData.test.ts`

### 修改文件

- `packages/prisma/schema.prisma` - 新增 `WorkflowStepTranslation` 模型及 WorkflowStep 字段
- `packages/features/tasker/tasker.ts` - 注册 `translateWorkflowStepData` 任务
- `packages/features/tasker/tasks/index.ts` - 导出 `translateWorkflowStepData`
- `packages/features/ee/workflows/lib/service/EmailWorkflowService.ts` - 发送时翻译查询
- `packages/features/ee/workflows/lib/service/EmailWorkflowService.test.ts` - 自动翻译测试
- `packages/features/ee/workflows/lib/reminders/smsReminderManager.ts` - 翻译查询
- `packages/features/ee/workflows/lib/reminders/emailReminderManager.ts` - 透传 `autoTranslateEnabled/sourceLocale`
- `packages/features/ee/workflows/lib/scheduleBookingReminders.ts` - 向 `scheduleEmailReminder` 透传字段
- `packages/features/ee/workflows/lib/types.ts` - 在 WorkflowStep 类型新增 `autoTranslateEnabled/sourceLocale`
- `packages/features/ee/workflows/lib/getAllWorkflows.ts` - 在 `workflowSelect` 新增字段
- `packages/features/ee/workflows/lib/schema.ts` - 在 `formSchema` 新增字段
- `packages/features/ee/workflows/lib/test/workflows.test.ts` - 在测试 select 新增字段
- `packages/features/ee/workflows/repositories/WorkflowReminderRepository.ts` - 在 `findByIdIncludeStepAndWorkflow` 新增字段
- `packages/trpc/server/routers/viewer/workflows/update.schema.ts` - 在 step schema 新增字段
- `packages/trpc/server/routers/viewer/workflows/update.handler.ts` - 组织用户限制并触发翻译任务
- `apps/web/modules/ee/workflows/components/WorkflowStepContainer.tsx` - UI 开关
- `apps/web/public/static/locales/en/common.json` - 翻译文案

## 验证

- [ ] 运行 `yarn workspace @calcom/prisma db-migrate`
- [ ] 运行 `yarn prisma generate`
- [ ] 运行 `yarn type-check:ci --force`
