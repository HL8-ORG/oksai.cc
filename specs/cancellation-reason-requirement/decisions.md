# 取消原因必填规则决策

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
import { DomainException } from "@oksai/exceptions";

// ❌ 避免
import { Logger } from "@nestjs/common";
```

### UDR-002：文档管理规范

**决策**
当需要创建开发文档时，优先在当前项目的 `docs` 目录下创建。

**文档组织：**
- 功能文档：`specs/{feature}/docs/`
- 应用文档：`apps/{app}/docs/`
- 库文档：`libs/{lib}/docs/`

**示例：**
```
# ✅ 推荐
specs/cancellation-reason-requirement/docs/field-validation.md
apps/web-admin/docs/booking-cancellation.md

# ❌ 避免
docs/cancellation-reason.md  # 应在 spec 或 app 的 docs 目录
```

---

## 功能特定决策

## ADR-001：存储在数据库列还是 Metadata JSON

### 背景

需要在 EventType 上存储“取消原因必填规则”配置。

### 备选方案

1. **新增枚举数据库列** —— 需要迁移，类型安全，查询更清晰
2. **使用 Metadata JSON 字段** —— 不需要迁移，但对于核心设置类型安全较弱

### 决策

使用专用数据库列，并配合 Prisma 枚举（`CancellationReasonRequirement`）。

理由：
- 这是核心预订流程设置，类似 `disableCancelling` 和 `requiresConfirmation`
- 数据库层类型安全
- 在取消校验逻辑中查询更清晰
- 与类似设置（`disableCancelling`、`disableRescheduling`）的存储方式一致

### 影响

- 需要数据库迁移
- 枚举值具备类型安全
- 查询时可直接访问列（无需解析 JSON）
