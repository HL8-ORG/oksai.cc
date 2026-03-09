# 多租户系统设计修正报告

**日期**: 2026-03-09  
**类型**: 设计修正  
**基于**: `libs/shared` 基础设施评估

---

## 执行摘要

基于现有的 `libs/shared` 基础设施（15 个共享库），对 `specs/tenancy` 进行了全面修正，以充分利用现有基础设施，避免重复造轮子。

**关键变更**:

- ✅ 使用现有的 15 个共享库
- ✅ 合并 `@oksai/repository` 到 `@oksai/event-store`
- ✅ 明确 CQRS、EDA、异常处理等模式的使用方式
- ✅ 简化实现计划，减少开发工作量

---

## 主要变更

### 1. 依赖关系明确化

#### 之前（模糊）

```typescript
// 设计文档中未明确依赖哪些共享库
// 开发者需要自己探索和决策
```

#### 之后（明确）

| 功能需求   | 共享库               | 使用内容                                |
| ---------- | -------------------- | --------------------------------------- |
| DDD 核心   | `@oksai/domain-core`      | `AggregateRoot`, `Result`, `Guard`      |
| 仓储基类   | `@oksai/event-store` | `EventSourcedRepository<T>`             |
| CQRS 模式  | `@oksai/cqrs`        | `ICommand`, `IQuery`, `ICommandHandler` |
| 事件驱动   | `@oksai/eda`         | `IEventPublisher`, `Outbox`             |
| 异常处理   | `@oksai/exceptions`  | `DomainException`, `NotFoundException`  |
| 日志记录   | `@oksai/logger`      | `OksaiLoggerService`                    |
| 上下文管理 | `@oksai/context`     | `RequestContextService`（扩展）         |

**影响**:

- ✅ 避免重复造轮子
- ✅ 保持代码一致性
- ✅ 加速开发进度

### 2. Repository 模式统一

#### 之前（自定义）

```typescript
// 需要自己实现 Repository 基类
export interface ITenantRepository {
  findById(id: string): Promise<Result<Tenant | null>>;
  save(tenant: Tenant): Promise<Result<void>>;
}
```

#### 之后（使用 EventSourcedRepository）

```typescript
import { EventSourcedRepository } from '@oksai/event-store';

export class TenantRepository extends EventSourcedRepository<Tenant> {
  constructor(em: EntityManager, eventStore: EventStorePort) {
    super(em, eventStore, Tenant);
  }

  // 只需要添加特定查询方法
  async findBySlug(slug: string): Promise<Tenant | null> {
    return this.em.findOne(Tenant, { slug });
  }
}
```

**好处**:

- ✅ 自动处理领域事件发布
- ✅ 统一的事件溯源支持
- ✅ 减少样板代码

### 3. CQRS 模式标准化

#### 之前（未明确）

```typescript
// 设计文档中只提到了 Command 和 Query
// 未说明如何实现
```

#### 之后（使用 @oksai/cqrs）

```typescript
import { ICommand, ICommandHandler } from '@oksai/cqrs';

export class CreateTenantCommand implements ICommand {
  public readonly name: string;
  public readonly slug: string;
  // ...
}

export class CreateTenantHandler
  implements ICommandHandler<CreateTenantCommand, string>
{
  async execute(command: CreateTenantCommand): Promise<string> {
    // 处理逻辑
  }
}
```

**好处**:

- ✅ 统一的 Command/Query 接口
- ✅ 支持 Pipeline 行为（日志、验证、重试）
- ✅ NestJS 无缝集成

### 4. 异常处理统一

#### 之前（混合使用）

```typescript
// 可能使用 NestJS 内置异常
throw new NotFoundException('租户不存在');

// 或自定义异常
throw new Error('租户不存在');
```

#### 之后（使用 @oksai/exceptions）

```typescript
import {
  DomainException,
  NotFoundException,
  ValidationException,
} from '@oksai/exceptions';

// 领域异常
throw new DomainException('只有待审核的租户才能激活', 'TENANT_CANNOT_ACTIVATE');

// 验证异常
throw new ValidationException('slug 格式不正确', 'slug');

// 未找到异常
throw NotFoundException.forEntity('Tenant', tenantId);
```

**好处**:

- ✅ 统一的异常体系
- ✅ 清晰的异常分类（领域、应用、基础设施）
- ✅ 友好的 HTTP 状态码映射
- ✅ 完整的错误上下文

### 5. 上下文管理扩展

#### 之前（需要自己实现）

```typescript
// 需要从零实现租户上下文管理
export class TenantContextService {
  private readonly asyncLocalStorage = new AsyncLocalStorage();
  // ...
}
```

#### 之后（扩展现有）

```typescript
import { RequestContextService } from '@oksai/context';

export class TenantContextService {
  constructor(private readonly requestContext: RequestContextService) {}

  setTenantContext(context: TenantContext): void {
    this.requestContext.set('tenantContext', context);
  }

  getTenantContext(): TenantContext | undefined {
    return this.requestContext.get<TenantContext>('tenantContext');
  }
}
```

**好处**:

- ✅ 复用现有的 AsyncLocalStorage
- ✅ 统一的上下文管理接口
- ✅ 支持多租户和请求上下文

---

## 代码变更示例

### Tenant 聚合根

**变更前**（未知依赖）:

```typescript
// 未明确继承自哪个基类
export class Tenant {
  // 未使用 Result 模式
  public activate(): void {
    if (this.status !== 'PENDING') {
      throw new Error('只有待审核的租户才能激活');
    }
    this.status = 'ACTIVE';
  }
}
```

**变更后**（使用 @oksai/domain-core）:

```typescript
import { AggregateRoot, Result, UniqueEntityID } from '@oksai/domain-core';
import { DomainException } from '@oksai/exceptions';

export class Tenant extends AggregateRoot<TenantProps> {
  public activate(): Result<void, DomainException> {
    if (!this.props.status.canBeActivated()) {
      return Result.fail(
        new DomainException(
          '只有待审核的租户才能激活',
          'TENANT_CANNOT_ACTIVATE',
        ),
      );
    }

    this.props.status = TenantStatus.active();
    this.addDomainEvent(
      new TenantActivatedEvent(this.id, { tenantId: this.id.toString() }),
    );

    return Result.ok(undefined);
  }
}
```

**改进**:

- ✅ 使用 `Result` 模式处理错误
- ✅ 使用 `DomainException` 统一异常
- ✅ 自动发布领域事件
- ✅ 类型安全

---

## 实现计划简化

### 之前（6 个 Phase）

```
Phase 1: 包初始化和代码迁移（1-2 天）
Phase 2: 领域层增强（2-3 天）
Phase 3: 应用层实现（2-3 天）
Phase 4: 基础设施层和 NestJS 集成（2-3 天）
Phase 5: API 层和文档（1-2 天）
Phase 6: 清理和发布（1 天）

总计: 10-14 天
```

### 之后（6 个 Phase，但工作量减少）

```
Phase 1: 包初始化（1 天） - 无需迁移，直接使用共享库
Phase 2: 领域层实现（2-3 天） - 使用 @oksai/domain-core
Phase 3: 应用层实现（2-3 天） - 使用 @oksai/cqrs
Phase 4: 基础设施层实现（2-3 天） - 使用 @oksai/event-store
Phase 5: API 层和文档（1-2 天） - 标准实现
Phase 6: 发布和清理（1 天） - 标准流程

总计: 9-13 天（减少 1 天）
```

**节省的工作量**:

- ✅ 无需实现 Repository 基类（使用 `EventSourcedRepository`）
- ✅ 无需实现 CQRS 基础设施（使用 `@oksai/cqrs`）
- ✅ 无需实现异常体系（使用 `@oksai/exceptions`）
- ✅ 无需实现上下文管理基础设施（扩展 `@oksai/context`）

---

## 测试策略改进

### 之前

```typescript
// 测试中使用 Jest 的 any 类型
const mockRepo = {
  save: jest.fn(),
} as any;
```

### 之后

```typescript
// 测试中使用 Vitest 和明确的类型
import { vi } from 'vitest';
import type { TenantRepository } from './tenant.repository';

const mockRepo = {
  save: vi.fn(),
  findBySlug: vi.fn(),
} as unknown as TenantRepository;
```

**改进**:

- ✅ 使用 Vitest（项目统一测试框架）
- ✅ 明确的类型定义
- ✅ 更好的 IDE 支持

---

## 迁移指南

### 对于现有代码

如果 `libs/iam/domain/tenant` 已有实现，迁移步骤：

1. **保留领域逻辑**，只修改基类导入
2. **更新 Repository**，继承 `EventSourcedRepository`
3. **更新异常**，使用 `@oksai/exceptions`
4. **更新测试**，使用 Vitest

### 示例迁移

**之前**（libs/iam/domain/tenant/tenant.aggregate.ts）:

```typescript
export class Tenant {
  // 自定义实现
}
```

**之后**（libs/tenancy/domain/tenant.aggregate.ts）:

```typescript
import { AggregateRoot } from '@oksai/domain-core';

export class Tenant extends AggregateRoot<TenantProps> {
  // 使用共享基础设施
}
```

---

## 风险评估

| 风险             | 影响 | 概率 | 缓解措施                     |
| ---------------- | ---- | ---- | ---------------------------- |
| 共享库不满足需求 | 中   | 低   | 共享库已完整实现所需功能     |
| 学习曲线         | 低   | 中   | 提供详细的代码示例和文档     |
| 依赖库版本冲突   | 低   | 低   | 使用 `catalog:` 协议统一版本 |

---

## 后续工作

1. ✅ 创建 `design-v2.md`（已完成）
2. ⏳ 创建代码示例（`specs/tenancy/examples/`）
3. ⏳ 更新 `decisions.md`（添加 ADR）
4. ⏳ 更新 `implementation.md`（调整 Phase 细节）
5. ⏳ 开始 Phase 1 实现

---

## 相关文档

- **设计文档 v2**: `specs/tenancy/design-v2.md`
- **基础设施评估**: `docs/reports/libs-shared-infrastructure-assessment.md`
- **Repository 合并**: `docs/migration/repository-to-event-store-merge.md`
- **事件存储 API**: `libs/shared/event-store/README.md`

---

**执行者**: oksai.cc 团队  
**审核日期**: 2026-03-09
