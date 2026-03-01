# Workflow 翻译设计

## 概述

使用 lingo.dev 将 workflow 的 `reminderBody` 和 `emailSubject` 翻译为访问者浏览器语言。该方案沿用现有 event type 标题/描述翻译模式。

## 问题陈述

当前 workflow 通知会以编写时语言发送，而不是参会人语言。组织需要让参会人以其偏好语言接收通知。

## 用户故事

- 作为组织管理员，我希望 workflow 通知能翻译为参会人语言，以便国际参会人理解内容
- 作为参会人，我希望以浏览器语言接收预订通知

## 技术设计

### 数据库变更

在 `schema.prisma` 中新增：

```prisma
enum WorkflowStepAutoTranslatedField {
  REMINDER_BODY
  EMAIL_SUBJECT
}

model WorkflowStepTranslation {
  uid            String   @id @default(cuid())
  workflowStep   WorkflowStep @relation(fields: [workflowStepId], references: [id], onDelete: Cascade)
  workflowStepId Int
  field          WorkflowStepAutoTranslatedField
  sourceLocale   String
  targetLocale   String
  translatedText String   @db.Text
  sourceHash     String
  createdAt      DateTime @default(now())
  updatedAt      DateTime @updatedAt

  @@unique([workflowStepId, field, targetLocale])
  @@index([workflowStepId, field, targetLocale])
}
```

在 WorkflowStep 中新增：
- `autoTranslateEnabled: Boolean @default(false)`
- `sourceLocale: String?`
- `translations: WorkflowStepTranslation[]`

### API 变更

**Workflow 更新处理器**（`packages/trpc/server/routers/viewer/workflows/update.handler.ts`）：
- 接收 `autoTranslateEnabled` 和 `sourceLocale` 字段
- 当内容变化时触发 `translateWorkflowStepData` tasker 任务

**新增 tasker 任务**（`packages/features/tasker/tasks/translateWorkflowStepData.ts`）：

- 使用 `TranslationService` 将 body/subject 翻译为 19 个目标语言
- 通过 repository 将翻译存入 `WorkflowStepTranslation` 表

### TranslationService

共享服务位于 `packages/features/translation/services/TranslationService.ts`：

- `translateText()` - 使用 `LingoDotDevService` 将文本翻译为所有支持语言
- `getWorkflowStepTranslations()` - 查询 workflow step 的缓存翻译
- `getEventTypeTranslations()` - 查询 event type 的缓存翻译
- 使用 DI 模式，通过构造函数注入 repositories

### 发送时集成

**EmailWorkflowService**（`generateEmailPayloadForEvtWorkflow`）：

- 使用 `TranslationService.getWorkflowStepTranslations()` 查询翻译
- 若未找到翻译则回退到原文

**smsReminderManager** / **whatsappReminderManager**：

- 使用相同模式：通过 TranslationService 按 attendee locale 查询

### UI 变更

**WorkflowStepContainer.tsx**：
- 增加 “Auto-translate for attendees” 开关
- 仅对组织用户且面向 attendee 的 actions 显示

## 支持语言

共 19 种语言（与 event types 一致）：
en, es, de, pt, pt-BR, fr, it, ar, ru, zh-CN, zh-TW, ko, ja, nl, sv, da, is, lt, nb

## 范围

**支持的 action**：EMAIL_ATTENDEE、SMS_ATTENDEE、WHATSAPP_ATTENDEE

**不支持**：EMAIL_HOST、EMAIL_ADDRESS、SMS_NUMBER（无法获得 attendee locale）

## 范围外

- 表单类 workflows（`FORM_SUBMITTED` 触发器）
- `CAL_AI_PHONE_CALL` action
- 默认模板翻译（已使用 i18n）
