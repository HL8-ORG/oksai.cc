# AGENTS.md — Workflow 翻译

## 项目背景

使用 lingo.dev 为 workflow 的正文和主题增加自动翻译能力，并对齐现有 event type 翻译模式。

## 开始前

1. 阅读 `specs/workflow-translation/design.md`
2. 查看 `specs/workflow-translation/implementation.md` 了解当前进度
3. 研究以下现有模式：
   - `packages/features/tasker/tasks/translateEventTypeData.ts`
   - `packages/features/eventTypeTranslation/repositories/EventTypeTranslationRepository.ts`
   - `packages/lib/server/service/lingoDotDev.ts`

## 代码模式

**Repository 模式**：数据库操作参考 `EventTypeTranslationRepository`

**Tasker 模式**：异步翻译任务参考 `translateEventTypeData.ts`

**翻译查询**：在 email/SMS 服务中，于 `customTemplate()` 调用前查询翻译

## 参考文件

| 用途 | 文件 |
|------|------|
| Lingo.dev 服务 | `packages/lib/server/service/lingoDotDev.ts` |
| Event type 翻译任务 | `packages/features/tasker/tasks/translateEventTypeData.ts` |
| Event type 翻译仓储 | `packages/features/eventTypeTranslation/repositories/EventTypeTranslationRepository.ts` |
| Email workflow 服务 | `packages/features/ee/workflows/lib/service/EmailWorkflowService.ts` |
| SMS 管理器 | `packages/features/ee/workflows/lib/reminders/smsReminderManager.ts` |
| Workflow 更新处理器 | `packages/trpc/server/routers/viewer/workflows/update.handler.ts` |

## 不要做

- 不要翻译默认模板（`REMINDER`、`RATING`），它们已使用 i18n
- 不要支持非 attendee action（无法获得 locale）
- 不要添加 `design.md` 之外的功能
- 每完成一部分都不要忘记更新 `implementation.md`
