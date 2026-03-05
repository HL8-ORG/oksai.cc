# Decisions 模板更新 - 共享模块使用规范

## 更新日期

2026-03-06

## 更新目的

在所有功能 spec 的决策文档中添加通用决策：**优先使用 `libs/shared` 目录下的共享模块**。

## 更新范围

### 1. 模板文件

**文件：** `specs/_templates/decisions.md`

**更新内容：**
- 添加"通用决策"部分
- 添加 UDR-001：优先使用共享模块
- 包含共享模块清单表格
- 包含正确/错误使用示例

### 2. 现有 Spec 文件

为以下 5 个现有 spec 的 `decisions.md` 添加了通用决策：

| Spec 名称 | 文件路径 | 更新内容 |
|---------|---------|---------|
| NestJS Better Auth | `specs/nestjs-better-auth/decisions.md` | ✅ 已添加 UDR-001 |
| Authentication | `specs/authentication/decisions.md` | ✅ 已添加 UDR-001 |
| Better Auth MikroORM | `specs/better-auth-mikro-orm-optimization/decisions.md` | ✅ 已添加 UDR-001 |
| Cancellation Reason | `specs/cancellation-reason-requirement/decisions.md` | ✅ 已添加 UDR-001 |
| Workflow Translation | `specs/workflow-translation/decisions.md` | ✅ 已添加 UDR-001 |

## 通用决策内容

### UDR-001：优先使用共享模块

**背景**
项目中已有成熟的共享模块提供通用功能，避免重复实现。

**决策**
当需要使用以下功能时，优先使用 `libs/shared` 目录下的共享模块：

| 功能类型 | 共享模块 | 使用场景 |
|---------|---------|---------|
| 日志 | `@oksai/logger` | 统一日志记录、结构化日志 |
| 异常 | `@oksai/exceptions` | 统一异常处理、DDD 分层异常 |
| 契约 | `@oksai/constants` | 错误码、事件名称、API 契约 |
| 配置 | `@oksai/config` | 环境配置、配置验证 |
| 上下文 | `@oksai/context` | 租户上下文、请求上下文 |

**理由**
- ✅ 避免重复造轮子
- ✅ 保持一致性和可维护性
- ✅ 统一错误处理和日志格式
- ✅ 便于跨功能共享契约

**示例**
```typescript
// ✅ 推荐：使用共享模块
import { OksaiLoggerService } from "@oksai/logger";
import { DomainException } from "@oksai/exceptions";
import { ExceptionCode } from "@oksai/constants";

// ❌ 避免：自己实现
import { Logger } from "@nestjs/common";  // 不统一
import { CustomError } from "./custom-error";  // 重复造轮子
```

## 决策编号规范

### UDR (Universal Decision Record)

- **前缀：** `UDR-{编号}`
- **用途：** 适用于所有功能的通用决策
- **特点：** 在所有 spec 中保持一致，无需重复记录

### ADR (Architecture Decision Record)

- **前缀：** `ADR-{编号}`
- **用途：** 功能特定的架构决策
- **特点：** 每个功能独立编号，记录特定决策

## 文档结构

### 更新后的 decisions.md 结构

```markdown
# {功能名称} 决策

## 通用决策

以下是适用于所有功能的通用决策：

### UDR-001：优先使用共享模块
{通用决策内容}

---

## 功能特定决策

以下是该功能特有的架构决策记录（ADR）：

## ADR-001：{决策标题}
{功能特定决策内容}
```

## 使用指南

### 对于新功能

使用 `/spec new <feature>` 创建新 spec 时：
1. 自动复制 `specs/_templates/decisions.md`
2. 已包含通用决策部分
3. 无需重复添加 UDR-001

### 对于现有功能

已手动为所有现有 spec 添加通用决策部分。

### 添加新的通用决策

如需添加新的通用决策：
1. 更新 `specs/_templates/decisions.md`
2. 为现有 spec 手动添加（或创建迁移脚本）
3. 更新本文档

## 验证清单

- [x] 模板文件已更新
- [x] 所有现有 spec 已更新
- [x] 共享模块清单完整
- [x] 示例代码正确
- [x] 文档结构清晰

## 相关资源

- [共享模块目录](../../libs/shared/)
- [Spec 模板](../_templates/)
- [决策记录指南](https://adr.github.io/)

## 后续维护

### 添加新的共享模块时

1. 更新 `specs/_templates/decisions.md` 的模块清单表格
2. 通知团队成员新的共享模块可用
3. 考虑为现有 spec 批量更新（可选）

### 定期审查

每季度审查一次通用决策：
- 是否需要新增通用决策？
- 现有通用决策是否需要更新？
- 共享模块清单是否完整？

---

**更新者：** AI Assistant  
**版本：** 1.0  
**最后更新：** 2026-03-06
