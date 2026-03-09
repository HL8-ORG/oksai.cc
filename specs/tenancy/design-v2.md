# 多租户系统设计（基于现有基础设施）

**修订日期**: 2026-03-09  
**版本**: v2.0  
**基于**: `libs/shared` 基础设施评估报告

---

## 变更摘要

本文档基于现有 `libs/shared` 基础设施进行了以下修正：

### 主要变更

1. ✅ **依赖关系明确化**：使用现有的 15 个共享库
2. ✅ **Repository 模式**：使用 `@oksai/event-store` 的 `EventSourcedRepository`
3. ✅ **CQRS 模式**：使用 `@oksai/cqrs` 而不是自定义实现
4. ✅ **事件驱动架构**：使用 `@oksai/eda` 和 `@oksai/event-store`
5. ✅ **异常处理**：使用 `@oksai/exceptions` 的统一异常体系
6. ✅ **日志记录**：使用 `@oksai/logger` 的结构化日志
7. ✅ **上下文管理**：扩展现有的 `@oksai/context`

---

## 概述

多租户（Multi-tenancy）是 SaaS 平台的核心能力，提供租户隔离、资源配额、租户上下文管理等完整解决方案。本包将多租户作为独立的、可复用的模块开发和维护。

**关键原则**：

- 优先使用现有基础设施，避免重复造轮子
- 遵循 DDD 和 Clean Architecture 原则
- 保持领域层纯净，不依赖框架

---

## 现有基础设施映射

### 可直接使用的共享库

| 功能需求     | 共享库               | 使用方式                                                      |
| ------------ | -------------------- | ------------------------------------------------------------- |
| DDD 核心基类 | `@oksai/domain-core`      | `AggregateRoot`, `Entity`, `ValueObject`, `Result`, `Guard`   |
| 仓储基类     | `@oksai/event-store` | `EventSourcedRepository<T>`                                   |
| CQRS 模式    | `@oksai/cqrs`        | `ICommand`, `IQuery`, `ICommandHandler`, `IQueryHandler`      |
| 事件驱动     | `@oksai/eda`         | `IEventPublisher`, `Outbox`, `Inbox`                          |
| 事件存储     | `@oksai/event-store` | `EventStorePort`, `StoredEvent`, `EventStream`                |
| 异常处理     | `@oksai/exceptions`  | `DomainException`, `ValidationException`, `NotFoundException` |
| 日志记录     | `@oksai/logger`      | `OksaiLoggerService`（Pino + 多租户上下文）                   |
| 请求上下文   | `@oksai/context`     | `RequestContextService`（需扩展）                             |
| 数据库       | `@oksai/database`    | MikroORM 连接管理                                             |
| 缓存         | `@oksai/cache`       | Redis 缓存抽象                                                |

### 需要扩展的功能

| 功能需求   | 现有库             | 扩展内容                                               |
| ---------- | ------------------ | ------------------------------------------------------ |
| 租户上下文 | `@oksai/context`   | 添加 `TenantContextService`（管理租户 ID、slug、配额） |
| 服务契约   | `@oksai/contracts` | 添加租户相关的事件和接口定义                           |

---

## 技术设计（修订版）

### 领域层

#### 聚合根

**Tenant**: 租户聚合根（继承 `@oksai/domain-core` 的 `AggregateRoot`）

```typescript
import { AggregateRoot, Result, UniqueEntityID } from '@oksai/domain-core';
import type { DomainEvent } from '@oksai/domain-core';

export interface TenantProps {
  name: string;
  slug: string;
  plan: TenantPlan;
  status: TenantStatus;
  ownerId: string;
  quota: TenantQuota;
  settings: Record<string, unknown>;
  metadata: Record<string, unknown>;
}

export class Tenant extends AggregateRoot<TenantProps> {
  private constructor(props: TenantProps, id?: UniqueEntityID) {
    super(props, id);
  }

  // Getter 方法
  get name(): string {
    return this.props.name;
  }

  get slug(): string {
    return this.props.slug;
  }

  get plan(): TenantPlan {
    return this.props.plan;
  }

  get status(): TenantStatus {
    return this.props.status;
  }

  get quota(): TenantQuota {
    return this.props.quota;
  }

  // 业务方法
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

  public suspend(reason: string): Result<void, DomainException> {
    if (!this.props.status.canBeSuspended()) {
      return Result.fail(
        new DomainException('只有活跃的租户才能停用', 'TENANT_CANNOT_SUSPEND'),
      );
    }

    this.props.status = TenantStatus.suspended();
    this.addDomainEvent(
      new TenantSuspendedEvent(this.id, {
        tenantId: this.id.toString(),
        reason,
      }),
    );

    return Result.ok(undefined);
  }

  public changePlan(newPlan: TenantPlan): Result<void, DomainException> {
    // 验证降级限制
    if (newPlan.isDowngradeFrom(this.props.plan)) {
      const validation = this.validateQuotaForDowngrade(newPlan);
      if (validation.isFail()) {
        return validation;
      }
    }

    const oldPlan = this.props.plan;
    this.props.plan = newPlan;
    this.props.quota = newPlan.defaultQuota();

    this.addDomainEvent(
      new TenantPlanChangedEvent(this.id, {
        tenantId: this.id.toString(),
        oldPlan: oldPlan.value,
        newPlan: newPlan.value,
      }),
    );

    return Result.ok(undefined);
  }

  public updateQuota(newQuota: TenantQuota): Result<void, DomainException> {
    this.props.quota = newQuota;
    this.addDomainEvent(
      new TenantQuotaUpdatedEvent(this.id, {
        tenantId: this.id.toString(),
        quota: newQuota.toJSON(),
      }),
    );
    return Result.ok(undefined);
  }

  // 工厂方法
  public static create(
    props: CreateTenantProps,
    id?: UniqueEntityID,
  ): Result<Tenant, DomainException> {
    // 验证
    const guardResult = Guard.combine([
      Guard.againstEmpty('name', props.name),
      Guard.againstEmpty('slug', props.slug),
      Guard.againstEmpty('ownerId', props.ownerId),
    ]);

    if (guardResult.isFail()) {
      return Result.fail(
        new DomainException(
          guardResult.error?.[0]?.message || '验证失败',
          'VALIDATION_ERROR',
        ),
      );
    }

    // 验证 slug 格式
    if (!Tenant.isValidSlug(props.slug)) {
      return Result.fail(
        new DomainException(
          'slug 必须是 3-100 字符的小写字母、数字或连字符',
          'INVALID_SLUG_FORMAT',
        ),
      );
    }

    // 创建租户
    const plan = TenantPlan.create(props.plan);
    const quota = plan.defaultQuota();

    const tenant = new Tenant(
      {
        name: props.name,
        slug: props.slug,
        plan,
        status: TenantStatus.pending(),
        ownerId: props.ownerId,
        quota,
        settings: props.settings ?? {},
        metadata: props.metadata ?? {},
      },
      id,
    );

    // 发布领域事件
    tenant.addDomainEvent(
      new TenantCreatedEvent(tenant.id, {
        tenantId: tenant.id.toString(),
        name: tenant.name,
        slug: tenant.slug,
        plan: tenant.plan.value,
      }),
    );

    return Result.ok(tenant);
  }

  private static isValidSlug(slug: string): boolean {
    return /^[a-z0-9-]{3,100}$/.test(slug);
  }

  private validateQuotaForDowngrade(
    newPlan: TenantPlan,
  ): Result<void, DomainException> {
    // 实现配额降级验证逻辑
    // ...
    return Result.ok(undefined);
  }
}
```

#### 值对象

**TenantPlan**: 租户套餐（继承 `@oksai/domain-core` 的 `ValueObject`）

```typescript
import { ValueObject, Result } from '@oksai/domain-core';

export class TenantPlan extends ValueObject<{ value: PlanType }> {
  private static readonly PLANS = {
    FREE: { maxOrganizations: 1, maxMembers: 5, maxStorageGB: 5 },
    STARTER: { maxOrganizations: 5, maxMembers: 20, maxStorageGB: 50 },
    PRO: { maxOrganizations: 20, maxMembers: 100, maxStorageGB: 500 },
    ENTERPRISE: { maxOrganizations: -1, maxMembers: -1, maxStorageGB: -1 },
  } as const;

  public get value(): PlanType {
    return this.props.value;
  }

  public static create(value: PlanType): TenantPlan {
    return new TenantPlan({ value });
  }

  public defaultQuota(): TenantQuota {
    const limits = TenantPlan.PLANS[this.props.value];
    return TenantQuota.create(limits);
  }

  public isDowngradeFrom(other: TenantPlan): boolean {
    const order = ['FREE', 'STARTER', 'PRO', 'ENTERPRISE'];
    return order.indexOf(this.props.value) < order.indexOf(other.value);
  }
}

export type PlanType = 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
```

**TenantStatus**: 租户状态

```typescript
import { ValueObject } from '@oksai/domain-core';

export class TenantStatus extends ValueObject<{ value: StatusType }> {
  public get value(): StatusType {
    return this.props.value;
  }

  public static pending(): TenantStatus {
    return new TenantStatus({ value: 'PENDING' });
  }

  public static active(): TenantStatus {
    return new TenantStatus({ value: 'ACTIVE' });
  }

  public static suspended(): TenantStatus {
    return new TenantStatus({ value: 'SUSPENDED' });
  }

  public static deleted(): TenantStatus {
    return new TenantStatus({ value: 'DELETED' });
  }

  public canBeActivated(): boolean {
    return this.props.value === 'PENDING';
  }

  public canBeSuspended(): boolean {
    return this.props.value === 'ACTIVE';
  }
}

export type StatusType = 'PENDING' | 'ACTIVE' | 'SUSPENDED' | 'DELETED';
```

**TenantQuota**: 租户配额

```typescript
import { ValueObject, Result } from '@oksai/domain-core';

export class TenantQuota extends ValueObject<TenantQuotaProps> {
  public get maxOrganizations(): number {
    return this.props.maxOrganizations;
  }

  public get maxMembers(): number {
    return this.props.maxMembers;
  }

  public get maxStorageGB(): number {
    return this.props.maxStorageGB;
  }

  public static create(props: TenantQuotaProps): TenantQuota {
    return new TenantQuota(props);
  }

  public toJSON(): Record<string, unknown> {
    return {
      maxOrganizations: this.maxOrganizations,
      maxMembers: this.maxMembers,
      maxStorageGB: this.maxStorageGB,
    };
  }
}

export interface TenantQuotaProps {
  maxOrganizations: number;
  maxMembers: number;
  maxStorageGB: number;
}
```

#### 领域事件

**继承 `@oksai/domain-core` 的 `DomainEvent`**：

```typescript
import { DomainEvent, UniqueEntityID } from '@oksai/domain-core';

export class TenantCreatedEvent extends DomainEvent<TenantCreatedPayload> {
  constructor(aggregateId: UniqueEntityID, payload: TenantCreatedPayload) {
    super({
      eventName: 'TenantCreated',
      aggregateId,
      payload,
      eventVersion: 1,
    });
  }
}

export class TenantActivatedEvent extends DomainEvent<TenantActivatedPayload> {
  constructor(aggregateId: UniqueEntityID, payload: TenantActivatedPayload) {
    super({
      eventName: 'TenantActivated',
      aggregateId,
      payload,
      eventVersion: 1,
    });
  }
}

// ... 其他事件
```

### 应用层（使用 @oksai/cqrs）

#### Command 示例

```typescript
import { ICommand } from '@oksai/cqrs';
import type { PlanType } from '../domain/tenant-plan.vo';

export class CreateTenantCommand implements ICommand {
  public readonly name: string;
  public readonly slug: string;
  public readonly plan: PlanType;
  public readonly ownerId: string;
  public readonly metadata?: Record<string, unknown>;

  constructor(props: CreateTenantCommandProps) {
    this.name = props.name;
    this.slug = props.slug;
    this.plan = props.plan;
    this.ownerId = props.ownerId;
    this.metadata = props.metadata;
  }
}
```

#### CommandHandler 示例

```typescript
import { ICommandHandler } from '@oksai/cqrs';
import { CreateTenantCommand } from './create-tenant.command';
import { Tenant } from '../domain/tenant.aggregate';
import type { TenantRepository } from '../infrastructure/tenant.repository';
import { DomainException } from '@oksai/exceptions';
import type { OksaiLoggerService } from '@oksai/logger';

export class CreateTenantHandler
  implements ICommandHandler<CreateTenantCommand, string>
{
  constructor(
    private readonly tenantRepository: TenantRepository,
    private readonly logger: OksaiLoggerService,
  ) {}

  async execute(command: CreateTenantCommand): Promise<string> {
    this.logger.info('创建租户', { slug: command.slug, plan: command.plan });

    // 验证 slug 唯一性
    const existingTenant = await this.tenantRepository.findBySlug(command.slug);
    if (existingTenant) {
      throw new DomainException('slug 已存在', 'TENANT_SLUG_EXISTS');
    }

    // 创建租户聚合根
    const result = Tenant.create({
      name: command.name,
      slug: command.slug,
      plan: command.plan,
      ownerId: command.ownerId,
      metadata: command.metadata,
    });

    if (result.isFail()) {
      throw result.error;
    }

    const tenant = result.value;

    // 保存租户（自动发布领域事件）
    await this.tenantRepository.save(tenant);

    this.logger.info('租户创建成功', { tenantId: tenant.id.toString() });

    return tenant.id.toString();
  }
}
```

### 基础设施层

#### Repository（使用 @oksai/event-store）

```typescript
import { EventSourcedRepository } from '@oksai/event-store';
import type { EventStorePort } from '@oksai/event-store';
import type { EntityManager } from '@mikro-orm/core';
import { Tenant } from '../domain/tenant.aggregate';

export class TenantRepository extends EventSourcedRepository<Tenant> {
  constructor(em: EntityManager, eventStore: EventStorePort) {
    super(em, eventStore, Tenant);
  }

  /**
   * 根据 slug 查找租户
   */
  async findBySlug(slug: string): Promise<Tenant | null> {
    const tenant = await this.em.findOne(Tenant, { slug });
    return tenant;
  }

  /**
   * 根据所有者 ID 查找租户
   */
  async findByOwnerId(ownerId: string): Promise<Tenant[]> {
    const tenants = await this.em.find(Tenant, { ownerId });
    return tenants;
  }

  /**
   * 检查 slug 是否存在
   */
  async existsBySlug(slug: string): Promise<boolean> {
    const count = await this.em.count(Tenant, { slug });
    return count > 0;
  }
}
```

#### TenantContextService（扩展 @oksai/context）

```typescript
import { RequestContextService } from '@oksai/context';
import { Injectable } from '@nestjs/common';

export interface TenantContext {
  tenantId: string;
  slug: string;
  name: string;
  plan: string;
  status: string;
}

@Injectable()
export class TenantContextService {
  private readonly TENANT_CONTEXT_KEY = 'tenantContext';

  constructor(private readonly requestContext: RequestContextService) {}

  /**
   * 设置租户上下文
   */
  setTenantContext(context: TenantContext): void {
    this.requestContext.set(this.TENANT_CONTEXT_KEY, context);
  }

  /**
   * 获取租户上下文
   */
  getTenantContext(): TenantContext | undefined {
    return this.requestContext.get<TenantContext>(this.TENANT_CONTEXT_KEY);
  }

  /**
   * 获取当前租户 ID
   */
  getTenantId(): string | undefined {
    const context = this.getTenantContext();
    return context?.tenantId;
  }

  /**
   * 检查是否在租户上下文中
   */
  hasTenantContext(): boolean {
    return this.getTenantContext() !== undefined;
  }
}
```

#### NestJS 集成

```typescript
import { Module, Global } from '@nestjs/common';
import { TenantRepository } from './infrastructure/tenant.repository';
import { TenantContextService } from './infrastructure/tenant-context.service';
import { TenantGuard } from './infrastructure/tenant.guard';
import { TenantInterceptor } from './infrastructure/tenant.interceptor';

@Global()
@Module({
  providers: [
    TenantRepository,
    TenantContextService,
    TenantGuard,
    TenantInterceptor,
  ],
  exports: [TenantRepository, TenantContextService],
})
export class TenancyModule {}
```

**TenantGuard**:

```typescript
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  UnauthorizedException,
} from '@nestjs/common';
import { TenantContextService } from './tenant-context.service';
import type { OksaiLoggerService } from '@oksai/logger';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly logger: OksaiLoggerService,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    // 从请求中提取租户标识（Header、子域名、Cookie）
    const tenantId = this.extractTenantId(request);

    if (!tenantId) {
      this.logger.warn('缺少租户标识');
      throw new UnauthorizedException('缺少租户标识');
    }

    // 设置租户上下文
    // TODO: 从数据库加载租户信息
    this.tenantContext.setTenantContext({
      tenantId,
      slug: 'unknown',
      name: 'Unknown Tenant',
      plan: 'FREE',
      status: 'ACTIVE',
    });

    return true;
  }

  private extractTenantId(request: any): string | undefined {
    // 1. 从 Header 中提取
    const headerTenantId = request.headers['x-tenant-id'];
    if (headerTenantId) {
      return headerTenantId;
    }

    // 2. 从子域名中提取
    const host = request.headers.host;
    if (host) {
      const subdomain = host.split('.')[0];
      if (subdomain && subdomain !== 'www' && subdomain !== 'api') {
        return subdomain; // 或通过 subdomain 查询数据库获取 tenantId
      }
    }

    // 3. 从 Cookie 中提取
    const cookieTenantId = request.cookies?.['tenant-id'];
    if (cookieTenantId) {
      return cookieTenantId;
    }

    return undefined;
  }
}
```

---

## 依赖关系（修订版）

### 内部依赖

| 依赖库               | 用途       | 使用内容                                                                                     |
| -------------------- | ---------- | -------------------------------------------------------------------------------------------- |
| `@oksai/domain-core`      | DDD 核心   | `AggregateRoot`, `Entity`, `ValueObject`, `Result`, `Guard`, `UniqueEntityID`, `DomainEvent` |
| `@oksai/event-store` | 事件存储   | `EventSourcedRepository`, `EventStorePort`, `StoredEvent`                                    |
| `@oksai/cqrs`        | CQRS 模式  | `ICommand`, `IQuery`, `ICommandHandler`, `IQueryHandler`                                     |
| `@oksai/eda`         | 事件驱动   | `IEventPublisher`, `Outbox`（可选）                                                          |
| `@oksai/exceptions`  | 异常处理   | `DomainException`, `ValidationException`, `NotFoundException`                                |
| `@oksai/logger`      | 日志记录   | `OksaiLoggerService`                                                                         |
| `@oksai/context`     | 请求上下文 | `RequestContextService`（扩展为 `TenantContextService`）                                     |
| `@oksai/database`    | 数据库     | MikroORM 连接管理                                                                            |

### 外部依赖

| 依赖库                  | 用途              |
| ----------------------- | ----------------- |
| `@nestjs/common`        | NestJS 核心模块   |
| `@nestjs/core`          | NestJS 核心       |
| `@mikro-orm/core`       | ORM 核心功能      |
| `@mikro-orm/postgresql` | PostgreSQL 适配器 |

---

## 实现计划（修订版）

### Phase 1: 包初始化（1 天）

- [ ] 创建 `libs/tenancy` 包结构
- [ ] 配置 `tsconfig.json`（使用 `@oksai/tsconfig/node-library.json`）
- [ ] 配置 `package.json`（添加 `@oksai/*` 依赖）
- [ ] 配置 `project.json`（Nx 项目配置）

### Phase 2: 领域层实现（2-3 天）

- [ ] 实现 `Tenant` 聚合根（继承 `AggregateRoot`）
- [ ] 实现值对象（`TenantPlan`, `TenantStatus`, `TenantQuota`）
- [ ] 实现领域事件（继承 `DomainEvent`）
- [ ] 编写单元测试（覆盖率 >95%）

### Phase 3: 应用层实现（2-3 天）

- [ ] 实现 Command 和 Query（使用 `@oksai/cqrs`）
- [ ] 实现 CommandHandler 和 QueryHandler
- [ ] 编写单元测试（覆盖率 >90%）

### Phase 4: 基础设施层实现（2-3 天）

- [ ] 实现 `TenantRepository`（继承 `EventSourcedRepository`）
- [ ] 实现 `TenantContextService`（扩展 `RequestContextService`）
- [ ] 实现 NestJS 集成（`TenancyModule`, `TenantGuard`, `TenantInterceptor`）
- [ ] 编写集成测试（覆盖率 >85%）

### Phase 5: API 层和文档（1-2 天）

- [ ] 实现 RESTful API 接口
- [ ] 编写 API 文档（Swagger）
- [ ] 编写使用指南
- [ ] 编写 E2E 测试

### Phase 6: 发布和清理（1 天）

- [ ] 发布 `@oksai/tenancy@1.0.0`
- [ ] 更新文档和 CHANGELOG

---

## 测试策略（修订版）

### 单元测试（70%）

**领域层**：

- 使用 `@oksai/domain-core` 的 `Result` 模式
- 测试业务规则（状态转换、配额验证）
- 测试领域事件发布
- **覆盖率目标**: >95%

**应用层**：

- 使用 `vi.fn()` mock Repository
- 测试 Command/Query 处理逻辑
- 测试异常处理（使用 `@oksai/exceptions`）
- **覆盖率目标**: >90%

### 集成测试（20%）

- `TenantRepository` 与 MikroORM 集成
- `TenantGuard` 和 `TenantInterceptor` 与 NestJS 集成
- `EventSourcedRepository` 与 `EventStorePort` 集成
- **覆盖率目标**: >85%

### E2E 测试（10%）

- 租户创建 → 激活 → 使用 → 停用完整流程
- 租户隔离验证
- **覆盖率目标**: >80%

---

## 代码示例（完整）

### 完整的 Tenant 聚合根

参见：`specs/tenancy/examples/tenant.aggregate.example.ts`

### 完整的 CreateTenantHandler

参见：`specs/tenancy/examples/create-tenant.handler.example.ts`

### 完整的 TenantRepository

参见：`specs/tenancy/examples/tenant.repository.example.ts`

---

## 相关文档

- **基础设施评估**: `docs/reports/libs-shared-infrastructure-assessment.md`
- **事件存储文档**: `libs/shared/event-store/README.md`
- **CQRS 文档**: `libs/shared/cqrs/README.md` (待创建)
- **异常处理文档**: `libs/shared/exceptions/README.md`

---

**维护者**: oksai.cc 团队  
**最后更新**: 2026-03-09
