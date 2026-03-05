# Spec Decisions 通用决策完整更新总结

## 更新日期

2026-03-06

## 更新概述

在 `specs/_templates/decisions.md` 和所有现有 spec 的 `decisions.md` 中添加了两个通用决策（UDR）。

## 通用决策清单

### UDR-001：优先使用共享模块

**目的：** 统一共享模块使用规范，避免重复实现

**共享模块：**
| 功能类型 | 共享模块 | 使用场景 |
|---------|---------|---------|
| 日志 | `@oksai/logger` | 统一日志记录、结构化日志 |
| 异常 | `@oksai/exceptions` | 统一异常处理、DDD 分层异常 |
| 契约 | `@oksai/constants` | 错误码、事件名称、API 契约 |
| 配置 | `@oksai/config` | 环境配置、配置验证 |
| 上下文 | `@oksai/context` | 租户上下文、请求上下文 |

### UDR-002：文档管理规范

**目的：** 统一文档组织方式，便于查找和维护

**文档组织：**
| 文档类型 | 存放位置 | 说明 |
|---------|---------|------|
| 功能设计文档 | `specs/{feature}/docs/` | 带截图的功能文档 |
| 技术指南 | `apps/{app}/docs/` 或 `libs/{lib}/docs/` | 特定应用/库的技术文档 |
| 项目文档 | `docs/` | 跨项目共享文档、最佳实践 |
| API 文档 | Swagger/Scalar | 自动生成，无需手动维护 |

## 更新的文件

### 1. 模板文件

✅ `specs/_templates/decisions.md`
- 添加 UDR-001：优先使用共享模块
- 添加 UDR-002：文档管理规范

### 2. 现有 Spec 文件（5 个）

✅ `specs/nestjs-better-auth/decisions.md`
✅ `specs/authentication/decisions.md`
✅ `specs/better-auth-mikro-orm-optimization/decisions.md`
✅ `specs/cancellation-reason-requirement/decisions.md`
✅ `specs/workflow-translation/decisions.md`

### 3. 文档文件

✅ `docs/updates/decisions-template-shared-modules.md` - UDR-001 详细说明
✅ `docs/updates/decisions-template-documentation-management.md` - UDR-002 详细说明

## 文档结构示例

更新后的 `decisions.md` 统一结构：

```markdown
# {功能名称} 决策

## 通用决策

以下是适用于所有功能的通用决策：

### UDR-001：优先使用共享模块

**背景**
{说明}

**决策**
{共享模块清单}

**理由**
- ✅ 理由 1
- ✅ 理由 2

**示例**
```typescript
// ✅ 推荐
// ❌ 避免
```

### UDR-002：文档管理规范

**背景**
{说明}

**决策**
{文档组织规范}

**理由**
- ✅ 理由 1
- ✅ 理由 2

**示例**
```
# ✅ 推荐
# ❌ 避免
```

---

## 功能特定决策

以下是该功能特有的架构决策记录（ADR）：

## ADR-001：{决策标题}

{具体决策内容}
```

## 使用示例

### 正确使用共享模块

```typescript
// ✅ 推荐：使用共享模块
import { OksaiLoggerService } from "@oksai/logger";
import { DomainException } from "@oksai/exceptions";
import { ExceptionCode } from "@oksai/constants";

// ❌ 避免：自己实现
import { Logger } from "@nestjs/common";  // 不统一
import { CustomError } from "./custom-error";  // 重复造轮子
```

### 正确组织文档

```
# ✅ 推荐：在当前项目 docs 目录创建
apps/gateway/docs/exception-integration.md
libs/shared/exceptions/docs/usage-guide.md
specs/authentication/docs/api-reference.md

# ❌ 避免：在错误位置创建
docs/gateway-exception.md  # 应该在 apps/gateway/docs/ 下
README.md  # 不要把详细文档放在 README
```

## 决策编号规范

| 编号前缀 | 全称 | 用途 |
|---------|------|------|
| UDR-XXX | Universal Decision Record | 通用决策（适用于所有功能） |
| ADR-XXX | Architecture Decision Record | 架构决策（功能特定） |

## 验证清单

- [x] UDR-001 已添加到模板
- [x] UDR-002 已添加到模板
- [x] 所有现有 spec 已更新
- [x] 共享模块清单完整
- [x] 文档组织规范清晰
- [x] 示例代码正确
- [x] 文档格式统一

## 优势总结

### 1. 统一标准

- ✅ 所有功能遵循相同的共享模块使用规范
- ✅ 所有文档遵循统一的组织方式

### 2. 提高效率

- ✅ 避免重复造轮子
- ✅ 快速找到相关文档
- ✅ 自动继承通用决策

### 3. 易于维护

- ✅ 共享模块更新时，所有功能受益
- ✅ 文档就近原则，易于更新
- ✅ 决策集中管理，便于查询

### 4. 团队协作

- ✅ 新成员快速了解规范
- ✅ 代码审查有明确标准
- ✅ 文档编写有清晰指引

## 后续工作

### 短期（1 个月内）

1. **团队培训**
   - 向团队介绍两个通用决策
   - 分享示例和最佳实践

2. **代码审查**
   - 检查现有代码是否遵循 UDR-001
   - 检查现有文档是否在正确位置

3. **文档整理**
   - 移动位置不当的文档
   - 更新文档索引

### 中期（3 个月内）

1. **监控执行**
   - 定期检查新代码是否遵循规范
   - 定期检查新文档是否在正确位置

2. **收集反馈**
   - 收集团队对规范的反馈
   - 优化规范内容

### 长期（持续）

1. **定期审查**
   - 每季度审查通用决策
   - 根据项目发展更新规范

2. **扩展规范**
   - 考虑添加新的通用决策
   - 例如：测试规范、安全规范等

## 相关资源

### 文档

- [共享模块使用规范](./decisions-template-shared-modules.md)
- [文档管理规范](./decisions-template-documentation-management.md)
- [Spec 命令文档同步](./spec-command-templates-sync.md)

### 代码

- [共享模块目录](../../libs/shared/)
- [Spec 模板](../../specs/_templates/)
- [项目文档](../../docs/)

### 工具

- `/spec new <feature>` - 创建新 spec（自动包含通用决策）
- `/spec list` - 列出所有 spec

---

**更新者：** AI Assistant  
**版本：** 1.0  
**最后更新：** 2026-03-06  
**下次审查：** 2026-06-06
