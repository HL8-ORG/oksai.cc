# Workflow 翻译决策

## 通用决策

以下是适用于所有功能的通用决策：

### UDR-001：优先使用共享模块

当需要使用以下功能时，优先使用 `libs/shared` 目录下的共享模块：

| 功能类型 | 共享模块 | 使用场景 |
|---------|---------|---------|
| 日志 | `@oksai/logger` | 统一日志记录、结构化日志 |
| 异常 | `@oksai/exceptions` | 统一异常处理、DDD 分层异常 |
| 契约 | `@oksai/constants` | 错误码、事件名称、API 契约 |
| 配置 | `@oksai/config` | 环境配置、配置验证 |
| 上下文 | `@oksai/context` | 租户上下文、请求上下文 |

**示例：**
```typescript
// ✅ 推荐
import { OksaiLoggerService } from "@oksai/logger";
import { InfrastructureException } from "@oksai/exceptions";

// ❌ 避免
import { Logger } from "@nestjs/common";
```

### UDR-002：文档管理规范

**决策**
当需要创建开发文档时，优先在当前项目的 `docs` 目录下创建。

**文档结构：**
- 功能文档：`specs/{feature}/docs/`
- 应用文档：`apps/{app}/docs/`
- 库文档：`libs/{lib}/docs/`

**示例：**
```
# ✅ 推荐
specs/workflow-translation/docs/translation-flow.md
libs/shared/i18n/docs/multi-language-support.md

# ❌ 避免
docs/workflow-translation.md  # 应在 spec 的 docs 目录
```

---

## 功能特定决策

## ADR-001：预翻译 vs 按需翻译

### 背景

需要决定翻译生成时机：在 workflow 保存时生成，还是发送时生成。

### 备选方案

1. **发送时按需翻译** —— 向参会人发送时翻译，并缓存复用
   - 优点：API 调用更少，不会产生未使用翻译
   - 缺点：首次发送到新语言时会有轻微延迟

2. **保存时预翻译** —— workflow 保存时一次性翻译到 19 种语言
   - 优点：发送时无延迟，且与 event type 模式一致
   - 缺点：前期 API 调用更多

### 决策

采用保存时预翻译（方案 2），以对齐现有 event type 翻译模式，并保证发送通知时无延迟。

### 影响

- workflow step 保存后，通过异步 tasker 任务生成翻译
- 每个 workflow step 约 36 次 API 调用（18 种语言 × 2 个字段）
- 数据库预先存储所有翻译

## ADR-002：仅面向组织用户

### 背景

需要决定该功能是面向所有用户开放，还是受限开放。

### 决策

仅组织用户可用，与 event type 自动翻译功能保持一致。

### 影响

- UI 开关仅对组织用户显示
- handler 在触发翻译前检查 `ctx.user.organizationId`
