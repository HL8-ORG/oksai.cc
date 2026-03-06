# {功能名称} 决策

## 通用决策

以下是适用于所有功能的通用决策，无需重复记录：

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

### UDR-002：文档管理规范

**背景**
项目文档分散在各处，需要统一的文档组织方式，便于查找和维护。

**决策**
当需要创建开发文档时，优先在当前项目的 `docs` 目录下创建。

**文档组织规范**

| 文档类型 | 存放位置 | 说明 |
|---------|---------|------|
| 功能设计文档 | `specs/{feature}/docs/` | 带截图的功能文档 |
| 技术指南 | `apps/{app}/docs/` 或 `libs/{lib}/docs/` | 特定应用/库的技术文档 |
| 项目文档 | `docs/` | 跨项目共享文档、最佳实践 |
| API 文档 | Swagger/Scalar | 自动生成，无需手动维护 |

**理由**
- ✅ 文档就近原则，易于查找
- ✅ 保持项目结构清晰
- ✅ 便于文档版本管理
- ✅ 避免文档分散混乱

**示例**
```
# ✅ 推荐：在当前项目 docs 目录创建
apps/gateway/docs/exception-integration.md
libs/shared/exceptions/docs/usage-guide.md
specs/authentication/docs/api-reference.md

# ❌ 避免：在错误位置创建
docs/gateway-exception.md  # 应该在 apps/gateway/docs/ 下
README.md  # 不要把详细文档放在 README
```

**文档命名规范**
- 使用小写字母和连字符：`exception-integration.md`
- 使用英文命名，中文内容
- 包含 `.md` 扩展名
- 文件名清晰表达内容：`{topic}-{type}.md`

---

## 功能特定决策

以下是该功能特有的架构决策记录（ADR）：

## ADR-001：{决策标题}

### 背景

{什么情况需要做这个决策？}

### 备选方案

1. {方案 A} — {优缺点}
2. {方案 B} — {优缺点}

### 决策

{最终决定了什么，为什么}

### 影响

- {该决策带来的影响}
