# specs/tenancy/examples 架构规范符合性分析

**分析日期**: 2026-03-09  
**基于规范**: `docs/02-architecture/spec/`  
**分析对象**: `specs/tenancy/examples/` 中的代码示例

---

## 执行摘要

经过对照 `docs/02-architecture/spec` 架构规范，发现 `specs/tenancy/examples` 中的代码示例在**类命名**上符合规范，但在**文件组织**和**文件命名**上存在重大偏差。

**符合度评估**:

- ✅ **类命名**: 100% 符合
- ❌ **文件组织**: 0% 符合（所有内容合并在一个文件中）
- ❌ **文件命名**: 0% 符合（使用 `.example.ts` 后缀，而非按规范拆分）

**总体评分**: ⚠️ **部分符合（需要重大重构）**

---

## 一、架构规范要求

### 1.1 文件命名规范（kebab-case + 类型后缀）

根据 `spec.md` 和 `spec-02-domain.md`：

| 组件类型   | 文件命名模式                  | 示例                             |
| ---------- | ----------------------------- | -------------------------------- |
| 聚合根     | `[name].aggregate.ts`         | `tenant.aggregate.ts`            |
| 值对象     | `[name].vo.ts`                | `tenant-plan.vo.ts`              |
| 领域事件   | `[name].domain-event.ts`      | `tenant-created.domain-event.ts` |
| 仓储接口   | `[name].repository.ts`        | `tenant.repository.ts`           |
| 仓储实现   | `[tech]-[name].repository.ts` | `mikro-orm-tenant.repository.ts` |
| 命令       | `[name].command.ts`           | `create-tenant.command.ts`       |
| 命令处理器 | `[name].handler.ts`           | `create-tenant.handler.ts`       |

### 1.2 类命名规范

| 组件     | 规范                  | 示例                  |
| -------- | --------------------- | --------------------- |
| 聚合根   | PascalCase，无后缀    | `Tenant`              |
| 值对象   | PascalCase，无后缀    | `TenantPlan`          |
| 领域事件 | `[实体][过去式]Event` | `TenantCreatedEvent`  |
| 命令     | `[动作][目标]Command` | `CreateTenantCommand` |
| 处理器   | `[动作][目标]Handler` | `CreateTenantHandler` |

---

## 二、当前代码示例分析

### 2.1 `tenant.aggregate.example.ts`

**当前状态**:

- ✅ **类命名正确**: `Tenant`, `TenantPlan`, `TenantStatus`, `TenantQuota`
- ✅ **领域事件命名正确**: `TenantCreatedEvent`, `TenantActivatedEvent` 等
- ❌ **文件组织错误**: 所有内容（聚合根、值对象、领域事件）合并在一个文件中
- ❌ **文件命名错误**: 使用 `.example.ts` 后缀，不符合规范

**实际文件结构**:

```
tenant.aggregate.example.ts (10,409 字节，438 行)
├── 值对象（TenantPlan, TenantStatus, TenantQuota）
├── 领域事件（5 个事件）
└── 聚合根（Tenant）
```

**应该的文件结构**:

```
domain/
├── tenant/
│   ├── tenant.aggregate.ts              # 聚合根
│   ├── tenant-plan.vo.ts                # 值对象
│   ├── tenant-status.vo.ts              # 值对象
│   ├── tenant-quota.vo.ts               # 值对象
│   └── events/
│       ├── tenant-created.domain-event.ts
│       ├── tenant-activated.domain-event.ts
│       ├── tenant-suspended.domain-event.ts
│       ├── tenant-plan-changed.domain-event.ts
│       └── tenant-quota-updated.domain-event.ts
```

### 2.2 `tenant.repository.example.ts`

**当前状态**:

- ✅ **类命名正确**: `TenantRepository`
- ⚠️ **文件命名部分正确**: 应该包含技术标识（如 `mikro-orm-`）
- ❌ **继承方式**: 直接继承 `EventSourcedRepository`，应该实现接口

**实际文件**:

```typescript
// tenant.repository.example.ts
export class TenantRepository extends EventSourcedRepository<Tenant> {
  // ...
}
```

**应该的文件**:

```typescript
// domain/tenant.repository.ts（接口）
export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  save(tenant: Tenant): Promise<void>;
}

// infrastructure/persistence/mikro-orm-tenant.repository.ts（实现）
export class MikroOrmTenantRepository
  extends EventSourcedRepository<Tenant>
  implements ITenantRepository {
  // ...
}
```

### 2.3 `create-tenant.handler.example.ts`

**当前状态**:

- ✅ **Command 类命名正确**: `CreateTenantCommand`
- ✅ **Handler 类命名正确**: `CreateTenantHandler`
- ❌ **文件组织错误**: Command 和 Handler 在同一个文件中
- ❌ **文件命名错误**: 使用 `.example.ts` 后缀

**实际文件结构**:

```
create-tenant.handler.example.ts
├── CreateTenantCommand（命令）
└── CreateTenantHandler（处理器）
```

**应该的文件结构**:

```
application/
├── commands/
│   ├── create-tenant.command.ts         # 命令定义
│   └── create-tenant.handler.ts         # 命令处理器
├── queries/
│   ├── get-tenant.query.ts              # 查询定义
│   └── get-tenant.handler.ts            # 查询处理器
└── dto/
    └── tenant.dto.ts                    # DTO 定义
```

---

## 三、不符合规范的详细分析

### 3.1 文件组织问题

#### 问题 1: 单文件包含多个类型

**当前**:

```typescript
// tenant.aggregate.example.ts (438 行)
export type PlanType = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
export class TenantPlan {
  /* ... */
}
export class TenantStatus {
  /* ... */
}
export class TenantQuota {
  /* ... */
}
export class TenantCreatedEvent {
  /* ... */
}
export class Tenant {
  /* ... */
}
```

**问题**:

- ❌ 违反单一职责原则
- ❌ 文件过大，难以维护
- ❌ 不符合 DDD 模块化原则

**规范要求**（spec-02-domain.md）:

> 每个值对象、领域事件应该有独立的文件

**应该**:

```typescript
// domain/tenant/tenant-plan.vo.ts
export class TenantPlan extends ValueObject<TenantPlanProps> {
  // ...
}

// domain/tenant/tenant-status.vo.ts
export class TenantStatus extends ValueObject<TenantStatusProps> {
  // ...
}

// domain/tenant/tenant.aggregate.ts
export class Tenant extends AggregateRoot<TenantProps> {
  // 只包含聚合根逻辑，引用其他文件中的值对象
}
```

#### 问题 2: 命名空间污染

**当前**:

```typescript
// 所有导出在全局命名空间
export class TenantPlan {}
export class TenantStatus {}
export class TenantQuota {}
```

**问题**:

- ❌ 容易命名冲突
- ❌ 依赖关系不清晰

**应该**:

```typescript
// 使用 index.ts 组织导出
// domain/tenant/index.ts
export { Tenant } from './tenant.aggregate.js';
export { TenantPlan } from './tenant-plan.vo.js';
export { TenantStatus } from './tenant-status.vo.js';
export { TenantQuota } from './tenant-quota.vo.js';
export * from './events/index.js';
```

### 3.2 文件命名问题

#### 问题 1: 使用 `.example.ts` 后缀

**当前**:

```
tenant.aggregate.example.ts
tenant.repository.example.ts
create-tenant.handler.example.ts
```

**问题**:

- ❌ 不符合架构规范的命名模式
- ❌ 无法直接用于实际实现
- ❌ 混淆示例代码和正式代码

**规范要求**（spec-02-domain.md）:

```
# 领域模型
job.aggregate.ts
job-item.entity.ts
job-id.vo.ts
job-title.vo.ts

# 领域事件
job-created.domain-event.ts
job-started.domain-event.ts
```

**应该**:

```
domain/tenant/tenant.aggregate.ts
infrastructure/persistence/mikro-orm-tenant.repository.ts
application/commands/create-tenant.command.ts
application/commands/create-tenant.handler.ts
```

**示例代码应该放在哪里？**

```
specs/tenancy/examples/
├── README.md                              # 示例说明
├── domain/
│   ├── tenant.aggregate.example.md        # 聚合根示例（Markdown）
│   ├── tenant-plan.vo.example.md          # 值对象示例
│   └── events/
│       └── tenant-created.domain-event.example.md
├── infrastructure/
│   └── mikro-orm-tenant.repository.example.md
└── application/
    ├── create-tenant.command.example.md
    └── create-tenant.handler.example.md
```

### 3.3 依赖注入问题

#### 问题: Handler 直接依赖具体实现

**当前**:

```typescript
export class CreateTenantHandler {
  constructor(
    private readonly tenantRepository: TenantRepository, // ❌ 具体实现
    private readonly logger: OksaiLoggerService,
  ) {}
}
```

**问题**:

- ❌ 违反依赖倒置原则
- ❌ 无法替换实现
- ❌ 难以测试

**应该**:

```typescript
// domain/tenant.repository.ts（接口）
export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  save(tenant: Tenant): Promise<void>;
}

// application/commands/create-tenant.handler.ts
export class CreateTenantHandler {
  constructor(
    private readonly tenantRepository: ITenantRepository, // ✅ 依赖接口
    private readonly logger: ILogger, // ✅ 依赖接口
  ) {}
}
```

---

## 四、规范符合性检查表

### 4.1 领域层规范（spec-02-domain.md）

| 检查项           | 规范要求                 | 当前状态                      | 符合度 |
| ---------------- | ------------------------ | ----------------------------- | ------ |
| 聚合根文件命名   | `[name].aggregate.ts`    | `tenant.aggregate.example.ts` | ❌     |
| 聚合根类命名     | PascalCase，无后缀       | `Tenant`                      | ✅     |
| 值对象文件命名   | `[name].vo.ts`           | 与聚合根在同一文件            | ❌     |
| 值对象类命名     | PascalCase，无后缀       | `TenantPlan`, `TenantStatus`  | ✅     |
| 领域事件文件命名 | `[name].domain-event.ts` | 与聚合根在同一文件            | ❌     |
| 领域事件类命名   | `[实体][过去式]Event`    | `TenantCreatedEvent`          | ✅     |
| 文件分离         | 每个类型独立文件         | 所有类型合并                  | ❌     |

**领域层总体符合度**: ⚠️ **42%** (3/7)

### 4.2 应用层规范（spec-03-application.md）

| 检查项           | 规范要求                | 当前状态              | 符合度 |
| ---------------- | ----------------------- | --------------------- | ------ |
| Command 文件命名 | `[name].command.ts`     | 与 Handler 在同一文件 | ❌     |
| Command 类命名   | `[动作][目标]Command`   | `CreateTenantCommand` | ✅     |
| Handler 文件命名 | `[name].handler.ts`     | 与 Command 在同一文件 | ❌     |
| Handler 类命名   | `[动作][目标]Handler`   | `CreateTenantHandler` | ✅     |
| 文件分离         | Command 和 Handler 分离 | 合并在同一文件        | ❌     |
| 依赖倒置         | 依赖接口而非实现        | 依赖具体类            | ❌     |

**应用层总体符合度**: ⚠️ **33%** (2/6)

### 4.3 基础设施层规范（spec-04-infrastructure.md）

| 检查项              | 规范要求                      | 当前状态                       | 符合度 |
| ------------------- | ----------------------------- | ------------------------------ | ------ |
| Repository 文件命名 | `[tech]-[name].repository.ts` | `tenant.repository.example.ts` | ❌     |
| Repository 类命名   | `[Tech][Name]Repository`      | `TenantRepository`             | ⚠️     |
| 实现接口            | 实现 `I[Name]Repository`      | 直接继承基类                   | ❌     |
| 技术标识            | 包含技术标识（如 `MikroOrm`） | 无技术标识                     | ❌     |

**基础设施层总体符合度**: ⚠️ **25%** (1/4)

---

## 五、修正建议

### 5.1 立即行动（必须）

#### 1. 拆分文件

**当前**:

```
specs/tenancy/examples/tenant.aggregate.example.ts (438 行)
```

**修正为**:

```
specs/tenancy/examples/domain/tenant/
├── tenant.aggregate.example.md          # 聚合根示例
├── tenant-plan.vo.example.md            # 值对象示例
├── tenant-status.vo.example.md          # 值对象示例
├── tenant-quota.vo.example.md           # 值对象示例
└── events/
    ├── tenant-created.domain-event.example.md
    ├── tenant-activated.domain-event.example.md
    ├── tenant-suspended.domain-event.example.md
    ├── tenant-plan-changed.domain-event.example.md
    └── tenant-quota-updated.domain-event.example.md
```

**理由**:

- ✅ 符合规范要求
- ✅ 提高可维护性
- ✅ 清晰的依赖关系

#### 2. 修改文件命名

**当前**:

```
tenant.aggregate.example.ts
```

**修正为**:

```
tenant.aggregate.example.md  # Markdown 格式的示例代码
# 或者在实际实现时：
libs/tenancy/domain/tenant/tenant.aggregate.ts
```

**理由**:

- ✅ 区分示例代码和正式代码
- ✅ 示例代码以 Markdown 格式提供完整说明
- ✅ 正式代码严格遵循命名规范

#### 3. 添加接口定义

**当前**:

```typescript
export class CreateTenantHandler {
  constructor(
    private readonly tenantRepository: TenantRepository, // ❌
  ) {}
}
```

**修正为**:

```typescript
// domain/tenant.repository.ts
export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  save(tenant: Tenant): Promise<void>;
}

// application/commands/create-tenant.handler.ts
export class CreateTenantHandler {
  constructor(
    private readonly tenantRepository: ITenantRepository, // ✅
  ) {}
}
```

**理由**:

- ✅ 遵循依赖倒置原则
- ✅ 提高可测试性
- ✅ 便于替换实现

### 5.2 中期行动（建议）

#### 1. 创建目录结构示例

**建议创建**:

```
specs/tenancy/examples/
├── README.md                              # 总体说明
├── directory-structure.example.md         # 目录结构示例
├── domain/
│   ├── tenant.aggregate.example.md        # 聚合根完整示例
│   ├── tenant-plan.vo.example.md          # 值对象示例
│   ├── tenant-status.vo.example.md
│   ├── tenant-quota.vo.example.md
│   └── events/
│       └── tenant-created.domain-event.example.md
├── application/
│   ├── commands/
│   │   ├── create-tenant.command.example.md
│   │   └── create-tenant.handler.example.md
│   └── queries/
│       ├── get-tenant.query.example.md
│       └── get-tenant.handler.example.md
└── infrastructure/
    ├── persistence/
    │   └── mikro-orm-tenant.repository.example.md
    └── adapters/
        └── tenant-context.adapter.example.md
```

#### 2. 更新示例格式

**当前**（TypeScript 文件）:

```typescript
// tenant.aggregate.example.ts
export class Tenant extends AggregateRoot<TenantProps> {
  // ...
}
```

**修正为**（Markdown 文档）:

```markdown
# Tenant 聚合根示例

## 文件路径

`libs/tenancy/domain/tenant/tenant.aggregate.ts`

## 完整代码

\`\`\`typescript
import { AggregateRoot, Result, UniqueEntityID } from '@oksai/domain-core';
import { TenantPlan } from './tenant-plan.vo.js';
import { TenantStatus } from './tenant-status.vo.js';
import { TenantCreatedEvent } from './events/tenant-created.domain-event.js';

/\*\*

- 租户聚合根
-
- @business-rule 只有 PENDING 状态的租户才能激活
- @business-rule 套餐降级时不能超过新套餐的配额限制
  \*/
  export class Tenant extends AggregateRoot<TenantProps> {
  // ... 完整代码
  }
  \`\`\`

## 关键点说明

1. 使用 `AggregateRoot` 基类
2. 使用 `Result` 模式处理错误
3. 自动发布领域事件
```

---

## 六、重构路线图

### Phase 1: 文档重构（1 天）

- [ ] 将 `.ts` 示例转换为 `.md` 格式
- [ ] 拆分单文件为多个独立文件
- [ ] 添加详细的说明文档
- [ ] 更新 `examples/README.md`

### Phase 2: 目录结构创建（0.5 天）

- [ ] 创建符合规范的目录结构示例
- [ ] 创建 `directory-structure.example.md`
- [ ] 标注每个文件的规范要求

### Phase 3: 接口定义补充（0.5 天）

- [ ] 创建 `ITenantRepository` 接口示例
- [ ] 更新 Handler 示例，使用接口
- [ ] 创建 Mock 实现示例（测试用）

---

## 七、总结

### 7.1 当前状态

| 方面     | 符合度     | 说明                    |
| -------- | ---------- | ----------------------- |
| 类命名   | ✅ 100%    | 完全符合规范            |
| 文件组织 | ❌ 0%      | 所有内容合并在单文件中  |
| 文件命名 | ❌ 0%      | 使用 `.example.ts` 后缀 |
| 依赖倒置 | ❌ 0%      | 依赖具体实现而非接口    |
| **总体** | ⚠️ **33%** | **需要重大重构**        |

### 7.2 关键问题

1. ❌ **文件组织**：所有类型合并在一个文件中，违反单一职责原则
2. ❌ **文件命名**：使用 `.example.ts` 后缀，不符合 kebab-case + 类型后缀规范
3. ❌ **依赖倒置**：Handler 依赖具体实现，违反 DIP 原则
4. ❌ **技术标识**：Repository 缺少技术标识（如 `MikroOrm`）

### 7.3 修正优先级

| 优先级 | 任务                 | 工作量 | 影响 |
| ------ | -------------------- | ------ | ---- |
| P0     | 拆分文件             | 1 天   | 高   |
| P0     | 修改文件命名         | 0.5 天 | 高   |
| P0     | 添加接口定义         | 0.5 天 | 高   |
| P1     | 转换为 Markdown 格式 | 1 天   | 中   |
| P2     | 创建目录结构示例     | 0.5 天 | 低   |

### 7.4 建议行动

**立即开始**：

1. ✅ 将 `.ts` 示例转换为 `.md` 格式（避免混淆）
2. ✅ 拆分单文件为多个独立文件
3. ✅ 添加 Repository 接口定义

**理由**：

- 当前的 TypeScript 示例文件会被误认为是正式实现
- 转换为 Markdown 格式可以更清晰地展示规范要求
- 独立文件更符合实际项目结构

---

## 八、相关文档

- **架构规范总览**: `docs/02-architecture/spec/spec.md`
- **领域层规范**: `docs/02-architecture/spec/spec-02-domain.md`
- **应用层规范**: `docs/02-architecture/spec/spec-03-application.md`
- **基础设施层规范**: `docs/02-architecture/spec/spec-04-infrastructure.md`

---

**分析者**: oksai.cc 团队  
**审核日期**: 2026-03-09  
**下次审核**: 修正完成后
