# Spec Decisions 模板更新总结

## 更新日期

2026-03-06

## 更新内容

### 1. 更新 `specs/_templates/decisions.md` 模板

在模板中添加了**通用决策（Universal Decisions）** 部分，包含：

#### UDR-001：优先使用共享模块

**目的：** 统一项目中的共享模块使用规范，避免重复实现。

**内容：**
- 列出了 `libs/shared` 下的核心共享模块
- 说明了每个模块的使用场景
- 提供了正确和错误的使用示例

**共享模块清单：**

| 功能类型 | 共享模块 | 使用场景 |
|---------|---------|---------|
| 日志 | `@oksai/logger` | 统一日志记录、结构化日志 |
| 异常 | `@oksai/exceptions` | 统一异常处理、DDD 分层异常 |
| 契约 | `@oksai/constants` | 错误码、事件名称、API 契约 |
| 配置 | `@oksai/config` | 环境配置、配置验证 |
| 上下文 | `@oksai/context` | 租户上下文、请求上下文 |

**示例代码：**
```typescript
// ✅ 推荐：使用共享模块
import { OksaiLoggerService } from "@oksai/logger";
import { DomainException } from "@oksai/exceptions";
import { ExceptionCode } from "@oksai/constants";

// ❌ 避免：自己实现
import { Logger } from "@nestjs/common";  // 不统一
import { CustomError } from "./custom-error";  // 重复造轮子
```

### 2. 更新所有现有 Spec 的 decisions.md

为以下 5 个现有 spec 的 decisions.md 添加了通用决策部分：

1. ✅ `specs/nestjs-better-auth/decisions.md`
2. ✅ `specs/authentication/decisions.md`
3. ✅ `specs/better-auth-mikro-orm-optimization/decisions.md`
4. ✅ `specs/cancellation-reason-requirement/decisions.md`
5. ✅ `specs/workflow-translation/decisions.md`

## 决策编号规范

为了区分通用决策和功能特定决策，引入了新的编号规范：

### 通用决策（Universal Decisions）
- **编号前缀：** `UDR-XXX`（Universal Decision Record）
- **位置：** `specs/_templates/decisions.md` 和所有 spec 的 decisions.md 顶部
- **特点：** 适用于所有功能，无需重复记录

### 功能特定决策（Feature Decisions）
- **编号前缀：** `ADR-XXX`（Architecture Decision Record）
- **位置：** 各个 spec 的 decisions.md 中
- **特点：** 特定于某个功能的架构决策

## 文件结构示例

更新后的 `decisions.md` 文件结构：

```markdown
# {功能名称} 决策

## 通用决策

以下是适用于所有功能的通用决策：

### UDR-001：优先使用共享模块

{共享模块列表和使用说明}

---

## 功能特定决策

以下是该功能特有的架构决策记录（ADR）：

## ADR-001：{决策标题}

{具体决策内容}
```

## 使用建议

### 创建新 Spec

1. 使用 `/spec new <feature>` 创建新 spec
2. 自动包含 UDR-001 通用决策
3. 在"功能特定决策"部分添加该功能的 ADR

### 现有 Spec 维护

- ✅ 已更新所有现有 spec
- ✅ 通用决策已在顶部添加
- ✅ 原有决策保持不变（仅添加编号前缀区分）

### 决策记录最佳实践

1. **通用决策（UDR）**
   - 自动继承自模板
   - 无需重复记录
   - 定期更新模板以反映新的共享模块

2. **功能决策（ADR）**
   - 只记录该功能特有的决策
   - 遵循 ADR 格式（背景、备选方案、决策、影响）
   - 编号使用 `ADR-XXX` 前缀

3. **决策引用**
   - 在代码中可以引用决策编号
   - 例如：`// 参考 ADR-002：使用事务包装器`

## 影响范围

### 受影响的文件

1. ✅ `specs/_templates/decisions.md` - 模板更新
2. ✅ `specs/nestjs-better-auth/decisions.md` - 添加通用决策
3. ✅ `specs/authentication/decisions.md` - 添加通用决策
4. ✅ `specs/better-auth-mikro-orm-optimization/decisions.md` - 添加通用决策
5. ✅ `specs/cancellation-reason-requirement/decisions.md` - 添加通用决策
6. ✅ `specs/workflow-translation/decisions.md` - 添加通用决策

### 向后兼容性

- ✅ 向后兼容，不影响现有内容
- ✅ 只在顶部添加通用决策部分
- ✅ 原有决策内容保持不变

## 验证清单

- [x] 模板文件已更新
- [x] 通用决策已添加到模板
- [x] 所有现有 spec 已更新
- [x] 决策编号规范已定义
- [x] 使用示例已提供
- [x] 文档格式正确

## 后续工作

### 建议优化

1. 考虑添加更多通用决策（如：
   - UDR-002：数据库迁移策略
   - UDR-003：API 版本管理
   - UDR-004：错误处理规范

2. 创建决策索引文档
   - 列出所有 UDR 和 ADR
   - 提供搜索和查询功能

3. 添加决策模板工具
   - `/spec add-decision <feature>` - 添加新决策
   - `/spec list-decisions <feature>` - 列出所有决策

## 示例对比

### 更新前

```markdown
# NestJS Better Auth 集成决策

## ADR-001：使用 ConfigurableModuleBuilder 构建动态模块
...
```

### 更新后

```markdown
# NestJS Better Auth 集成决策

## 通用决策

以下是适用于所有功能的通用决策：

### UDR-001：优先使用共享模块

{共享模块使用说明}

---

## 功能特定决策

## ADR-001：使用 ConfigurableModuleBuilder 构建动态模块
...
```

## 总结

本次更新：
1. ✅ 在模板中添加了通用决策（UDR-001）
2. ✅ 统一了共享模块的使用规范
3. ✅ 更新了所有现有 spec 的 decisions.md
4. ✅ 引入了清晰的决策编号规范（UDR vs ADR）
5. ✅ 提供了使用示例和最佳实践指南

这样确保了所有功能都遵循统一的共享模块使用规范，避免重复造轮子，提高代码一致性和可维护性。
