# MikroORM 迁移计划

**计划日期**: 2026-03-04  
**迁移范围**: 从 Drizzle ORM 迁移到 MikroORM  
**执行团队**: 2 人  
**预计周期**: 8-12 周  

---

## 📅 迁移进度

### ✅ 已完成
- [x] **Phase 0 准备**：Better Auth MikroORM 适配器（2026-03-04）
  - ✅ 已创建 `@oksai/better-auth-mikro-orm` 库
  - ✅ 32 个测试用例全部通过
  - ✅ TypeScript 配置优化完成（简化为 2 个配置文件）
  - ✅ 项目结构优化（将 `libs/auth/nestjs-better-auth` 迁移到 `libs/shared/nestjs-better-auth`）

### 🔄 进行中
- [ ] **Phase 1 基础设施**：核心集成
  - [ ] Event Store 实现
  - [ ] 测试框架完善

### 📋 待开始
- [ ] **Phase 2 试点迁移**：OAuth 2.0 领域
- [ ] **Phase 3 扩展迁移**：其他领域
- [ ] **Phase 4 稳定优化**：性能和文档

---

## 📋 执行摘要

### 迁移目标

**从 Drizzle ORM 迁移到 MikroORM，为 Event Sourcing 架构提供更好的支持。**

### 核心收益

```
✅ 原生 Unit of Work       - 自动变更追踪和事务管理
✅ Identity Map            - 自动缓存，避免重复查询
✅ 生命周期钩子            - 自动事件收集和发布
✅ 更好的 DDD 支持         - 聚合根、实体、值对象
✅ 减少 60% 样板代码       - 提高开发效率
✅ 社区支持完善            - 文档、示例、生态
```

### 预计成本

```
人力投入：80-120 人天 (2 人团队，8-12 周)
风险等级：🟡 中等 (可控制)
业务影响：🟢 低 (渐进式迁移，不影响现有功能)
```

---

## 一、迁移策略

### 1.1 渐进式迁移策略 ⭐⭐⭐⭐⭐

**原则**：不一次性重构，渐进式迁移，持续交付

```
阶段划分：
  Phase 0: 准备阶段 (1 周)
    ├── 技术调研
    ├── 团队培训
    └── 环境搭建

  Phase 1: 基础设施 (2-3 周)
    ├── MikroORM 集成
    ├── Event Store 实现
    └── 测试框架

  Phase 2: 试点领域 (3-4 周)
    ├── OAuth 2.0 领域迁移
    ├── 验证可行性
    └── 积累经验

  Phase 3: 扩展迁移 (3-4 周)
    ├── 其他领域迁移
    ├── Drizzle 完全移除
    └── 性能优化

  Phase 4: 稳定优化 (持续)
    ├── 监控完善
    ├── 文档补充
    └── 团队分享
```

### 1.2 双写策略（过渡期）

```
过渡期：Phase 2-3 (4-6 周)

策略：
  1. 新功能使用 MikroORM
  2. 旧功能保持 Drizzle
  3. 数据同步（如果需要）

优点：
  ✅ 风险可控
  ✅ 可回滚
  ✅ 不影响现有功能

缺点：
  ⚠️ 短期维护两套 ORM
  ⚠️ 代码库复杂度暂时增加
```

### 1.3 回滚策略

```
触发条件：
  - 迁移后发现严重 Bug
  - 性能下降 > 30%
  - 团队无法适应

回滚步骤：
  1. 保留 Drizzle 依赖和 Schema
  2. 保留原有代码分支
  3. 使用 Git revert 回滚
  4. 数据库无需回滚（Schema 兼容）

回滚成本：< 1 天
```

---

## 二、Phase 0: 准备阶段 (1 周)

### 2.0 现有 MikroORM 集成 ✅ 已完成

#### 2.0.1 Better Auth MikroORM 适配器

项目已完成 Better Auth 的 MikroORM 适配器实现：

**位置**：`libs/shared/better-auth-mikro-orm/`

**结构**：
```
libs/shared/better-auth-mikro-orm/
├── src/
│   ├── adapter.ts                    # MikroORM 适配器主实现
│   ├── utils/
│   │   ├── adapterUtils.ts           # 适配器工具函数
│   │   └── createAdapterError.ts     # 错误处理
│   ├── spec/
│   │   ├── adapter.spec.ts           # 适配器测试 (7 tests)
│   │   └── utils/
│   │       ├── adapter-utils.spec.ts # 工具函数测试 (20 tests)
│   │       └── create-adapter-error.spec.ts (5 tests)
│   └── index.ts                      # 导出
├── package.json
├── tsconfig.json
└── README.md
```

**包名**：`@oksai/better-auth-mikro-orm`

**功能特性**：
```typescript
✅ MikroORM 适配器实现
✅ 自动 EntityManager fork 管理
✅ CRUD 操作完整支持
✅ 复杂查询支持（WHERE, JOIN, pagination）
✅ 32 个测试用例全部通过
✅ TypeScript 类型完整
✅ Better Auth 1.5.x API 兼容
```

**使用示例**：
```typescript
import { mikroOrmAdapter } from '@oksai/better-auth-mikro-orm';
import { betterAuth } from 'better-auth';
import { orm } from './orm';

export const auth = betterAuth({
  database: mikroOrmAdapter(orm, {
    debugLogs: false,
    supportsJSON: true,
  }),
});
```

**收益**：
- ✅ 为 Better Auth 提供 MikroORM 支持
- ✅ 为 OAuth 2.0 迁移奠定基础
- ✅ 验证了 MikroORM 集成的可行性
- ✅ 提供了可复用的模式

**下一步扩展**：
- 基于此适配器模式实现其他领域
- 复用工具函数和测试策略
- 扩展到 Event Sourcing 实现

#### 2.0.2 TypeScript 配置优化

项目已简化 TypeScript 配置结构：

**之前（3 层继承）**：
```
tsconfig.base.json → tsconfig.nest.json → tsconfig.json
```

**现在（2 层继承）**：
```
tsconfig.base.json (基础配置)
├── 通用配置（strict、ES2022、paths）
└── 所有项目共享

tsconfig.json (项目根配置)
├── extends tsconfig.base.json
└── references（项目管理）

各库 tsconfig.json (独立配置)
├── NestJS 库：内联装饰器配置
└── 其他库：继承 base
```

**配置示例**：

NestJS 库（`libs/shared/*/tsconfig.json`）：
```json
{
  "extends": "../../../tsconfig.base.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src",
    "declaration": true,
    "declarationMap": true,
    "composite": true,
    "emitDecoratorMetadata": true,      // NestJS 必需
    "experimentalDecorators": true,      // NestJS 必需
    "module": "nodenext",
    "moduleResolution": "nodenext"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "src/**/*.spec.ts"]
}
```

**paths 映射**（`tsconfig.base.json`）：
```json
{
  "compilerOptions": {
    "baseUrl": ".",
    "paths": {
      "@oksai/better-auth-mikro-orm": ["libs/shared/better-auth-mikro-orm/src/index.ts"],
      "@oksai/database": ["libs/database/src/index.ts"],
      "@oksai/config": ["libs/shared/config/src/index.ts"],
      "@oksai/constants": ["libs/shared/constants/src/index.ts"],
      "@oksai/context": ["libs/shared/context/src/index.ts"],
      "@oksai/kernel": ["libs/shared/kernel/src/index.ts"],
      "@oksai/logger": ["libs/shared/logger/src/index.ts"],
      "@oksai/nestjs-better-auth": ["libs/shared/nestjs-better-auth/src/index.ts"],
      "@oksai/types": ["libs/shared/types/src/index.ts"],
      "@oksai/utils": ["libs/shared/utils/src/index.ts"],
      "@oksai/email": ["libs/notification/email/src/index.ts"]
    }
  }
}
```

**优势**：
- ✅ 更简单的配置层次
- ✅ 更清晰的依赖关系
- ✅ 更容易维护
- ✅ 各库可独立调整

---

### 2.1 技术调研 (2 天)

#### 2.1.1 MikroORM 特性确认

```typescript
// 核心特性验证
✅ Unit of Work          - 自动变更追踪
✅ Identity Map          - 自动缓存
✅ 生命周期钩子          - @BeforeCreate, @AfterUpdate
✅ 聚合根支持            - 方便 DDD 实现
✅ PostgreSQL 支持       - 原生支持
✅ TypeScript 支持       - 完整类型推断
✅ 迁移工具              - CLI 工具完善
✅ 事件溯源支持          - 社区有实践案例
```

#### 2.1.2 性能基准测试

```bash
# 性能测试项目
1. 简单查询 (SELECT)
2. 复杂查询 (JOIN + WHERE)
3. 批量插入 (INSERT 1000 条)
4. 事务性能 (TRANSACTION)
5. 聚合根加载 (多表关联)

# 对比目标
- Drizzle: 基准线
- MikroORM: < 10% 性能下降可接受
```

#### 2.1.3 兼容性检查

```typescript
// 检查项
✅ Node.js 20+ 支持
✅ TypeScript 5.x 支持
✅ NestJS 11 集成
✅ pnpm workspace 支持
✅ PostgreSQL 15+ 支持
✅ Redis 集成（缓存）
```

### 2.2 团队培训 (3 天)

#### 2.2.1 学习资源

```
官方文档：
  - MikroORM 官方文档 (https://mikro-orm.io/)
  - NestJS 集成指南
  - DDD 实践案例

书籍：
  - 《领域驱动设计》 (回顾 DDD 概念)
  - MikroORM 深入浅出

视频：
  - MikroORM 作者演讲
  - DDD + MikroORM 实战

实践：
  - 官方示例项目
  - Todo App 练习
  - Event Sourcing 示例
```

#### 2.2.2 培训计划

```
Day 1: 基础概念
  ├── ORM 基础回顾
  ├── MikroORM 核心概念
  │   - EntityManager
  │   - Entity
  │   - Repository
  │   - Unit of Work
  └── 动手练习：Todo App

Day 2: DDD 集成
  ├── 聚合根设计
  ├── 实体和值对象
  ├── 生命周期钩子
  └── 动手练习：订单领域

Day 3: Event Sourcing
  ├── 事件存储实现
  ├── 事件发布
  ├── 投影器
  └── 动手练习：Event Sourcing 示例
```

### 2.3 环境搭建 (2 天)

#### 2.3.1 依赖安装

```bash
# 1. 安装 MikroORM 核心包
pnpm add @mikro-orm/core @mikro-orm/postgresql @mikro-orm/reflection -w

# 2. 安装 NestJS 集成
pnpm add @mikro-orm/nestjs -w

# 3. 安装 CLI 工具
pnpm add -D @mikro-orm/cli -w

# 4. 安装迁移工具
pnpm add -D @mikro-orm/migrations -w
```

#### 2.3.2 配置文件

```typescript
// libs/database/mikro-orm.config.ts
import { defineConfig } from '@mikro-orm/postgresql';
import { TsMorphMetadataProvider } from '@mikro-orm/reflection';

export default defineConfig({
  entities: ['./dist/**/*.entity.js'],
  entitiesTs: ['./src/**/*.entity.ts'],
  dbName: process.env.DB_NAME || 'oksai',
  host: process.env.DB_HOST || 'localhost',
  port: Number(process.env.DB_PORT) || 5432,
  user: process.env.DB_USER || 'oksai',
  password: process.env.DB_PASSWORD || 'oksai_dev_password',
  debug: process.env.NODE_ENV === 'development',
  metadataProvider: TsMorphMetadataProvider,
  migrations: {
    path: './dist/migrations',
    pathTs: './src/migrations',
    glob: '!(*.d).{js,ts}',
  },
});
```

#### 2.3.3 NestJS 模块

```typescript
// libs/database/src/mikro-orm.module.ts
import { Module } from '@nestjs/common';
import { MikroOrmModule } from '@mikro-orm/nestjs';

@Module({
  imports: [
    MikroOrmModule.forRoot({
      autoLoadEntities: true,
      registerRequestContext: true,
    }),
  ],
  exports: [MikroOrmModule],
})
export class DatabaseModule {}
```

---

## 三、Phase 1: 基础设施 (2-3 周)

### 3.1 Week 1: 核心集成

#### 3.1.1 Entity 定义规范

```typescript
// libs/database/src/entities/base.entity.ts
import { PrimaryKey, Property } from '@mikro-orm/core';
import { v4 } from 'uuid';

export abstract class BaseEntity {
  @PrimaryKey()
  id: string = v4();

  @Property()
  createdAt: Date = new Date();

  @Property({ onUpdate: () => new Date() })
  updatedAt: Date = new Date();
}
```

#### 3.1.2 聚合根基类

```typescript
// libs/shared/kernel/src/lib/aggregate-root.aggregate.ts
import { DomainEvent } from './domain-event';

export abstract class AggregateRoot<T> {
  private _domainEvents: DomainEvent[] = [];

  protected addDomainEvent(event: DomainEvent): void {
    this._domainEvents.push(event);
  }

  public getDomainEvents(): DomainEvent[] {
    return this._domainEvents;
  }

  public clearEvents(): void {
    this._domainEvents = [];
  }

  abstract get id(): string;
}
```

#### 3.1.3 示例 Entity

```typescript
// libs/database/src/entities/tenant.entity.ts
import { Entity, Property, BeforeCreate, AfterUpdate } from '@mikro-orm/core';
import { AggregateRoot } from '@oksai/kernel';
import { TenantCreatedEvent } from '../events';

@Entity()
export class Tenant extends AggregateRoot<TenantProps> {
  @Property()
  name: string;

  @Property()
  plan: string;

  @Property()
  status: string;

  // 生命周期钩子：创建前
  @BeforeCreate()
  beforeCreate() {
    this.status = 'pending';
    this.addDomainEvent(new TenantCreatedEvent(this));
  }

  // 生命周期钩子：更新后
  @AfterUpdate()
  afterUpdate() {
    this.addDomainEvent(new TenantUpdatedEvent(this));
  }

  // 业务方法
  activate(): void {
    if (this.status !== 'pending') {
      throw new Error('只有待审核的租户才能激活');
    }
    this.status = 'active';
  }
}
```

### 3.2 Week 2: Event Store 实现

#### 3.2.1 Event Entity

```typescript
// libs/database/src/entities/domain-event.entity.ts
import { Entity, Property, PrimaryKey, Index } from '@mikro-orm/core';

@Entity()
@Index({ properties: ['aggregateId', 'version'] })
export class DomainEventEntity {
  @PrimaryKey()
  id: string;

  @Property()
  @Index()
  eventType: string;

  @Property()
  @Index()
  aggregateId: string;

  @Property()
  aggregateType: string;

  @Property()
  version: number;

  @Property({ type: 'json' })
  payload: Record<string, any>;

  @Property({ type: 'json' })
  metadata: {
    tenantId?: string;
    userId?: string;
    correlationId?: string;
    timestamp: Date;
  };

  @Property()
  createdAt: Date = new Date();
}
```

#### 3.2.2 Event Store 实现

```typescript
// libs/shared/event-store/src/mikro-orm-event-store.ts
import { EntityManager } from '@mikro-orm/core';
import { DomainEventEntity } from '@oksai/database';
import type { DomainEvent, EventStore } from './types';

export class MikroOrmEventStore implements EventStore {
  constructor(private em: EntityManager) {}

  async append(event: DomainEvent): Promise<void> {
    const eventEntity = this.em.create(DomainEventEntity, {
      id: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      version: event.version,
      payload: event.payload,
      metadata: event.metadata,
    });

    this.em.persist(eventEntity);
  }

  async load(aggregateId: string): Promise<DomainEvent[]> {
    const entities = await this.em.find(
      DomainEventEntity,
      { aggregateId },
      { orderBy: { version: 'ASC' } }
    );

    return entities.map(this.toDomainEvent);
  }

  async loadFromVersion(
    aggregateId: string,
    version: number
  ): Promise<DomainEvent[]> {
    const entities = await this.em.find(
      DomainEventEntity,
      { aggregateId, version: { $gt: version } },
      { orderBy: { version: 'ASC' } }
    );

    return entities.map(this.toDomainEvent);
  }

  private toDomainEvent(entity: DomainEventEntity): DomainEvent {
    return {
      eventId: entity.id,
      eventType: entity.eventType,
      aggregateId: entity.aggregateId,
      aggregateType: entity.aggregateType,
      version: entity.version,
      payload: entity.payload,
      metadata: entity.metadata,
    };
  }
}
```

#### 3.2.3 Repository 基类

```typescript
// libs/shared/repository/src/event-sourced.repository.ts
import { EntityManager } from '@mikro-orm/core';
import type { AggregateRoot } from '@oksai/kernel';
import type { EventStore } from '@oksai/event-store';

export abstract class EventSourcedRepository<T extends AggregateRoot<any>> {
  constructor(
    protected em: EntityManager,
    protected eventStore: EventStore,
    protected entityClass: new () => T
  ) {}

  async save(aggregate: T): Promise<void> {
    // 1. 持久化聚合根状态
    this.em.persist(aggregate);

    // 2. 持久化领域事件
    const events = aggregate.getDomainEvents();
    for (const event of events) {
      await this.eventStore.append(event);
    }

    // 3. 清空事件
    aggregate.clearEvents();

    // 4. 提交事务（由 Unit of Work 自动管理）
  }

  async findById(id: string): Promise<T | null> {
    // 1. 加载聚合根
    const aggregate = await this.em.findOne(this.entityClass, { id });

    if (!aggregate) {
      return null;
    }

    // 2. 加载事件（如果需要重放）
    // const events = await this.eventStore.load(id);
    // for (const event of events) {
    //   aggregate.apply(event);
    // }

    return aggregate;
  }
}
```

### 3.3 Week 3: 测试框架

#### 3.3.1 测试基类

```typescript
// libs/testing/src/repository-test.base.ts
import { MikroORM } from '@mikro-orm/core';
import { Test } from '@nestjs/testing';

export abstract class RepositoryTestBase {
  protected orm: MikroORM;

  async setup() {
    const module = await Test.createTestingModule({
      imports: [
        MikroOrmModule.forRoot({
          type: 'postgresql',
          dbName: 'test_db',
          debug: false,
        }),
      ],
    }).compile();

    this.orm = module.get(MikroORM);

    // 创建 Schema
    const generator = this.orm.getSchemaGenerator();
    await generator.createSchema();
  }

  async teardown() {
    // 清理 Schema
    const generator = this.orm.getSchemaGenerator();
    await generator.dropSchema();

    await this.orm.close();
  }

  protected get em() {
    return this.orm.em;
  }
}
```

#### 3.3.2 单元测试示例

```typescript
// libs/database/src/entities/tenant.entity.spec.ts
import { Tenant } from './tenant.entity';

describe('Tenant', () => {
  it('应该创建租户并生成事件', async () => {
    const em = this.orm.em.fork();

    const tenant = em.create(Tenant, {
      name: '测试公司',
      plan: 'basic',
    });

    await em.flush();

    expect(tenant.id).toBeDefined();
    expect(tenant.status).toBe('pending');
    expect(tenant.getDomainEvents()).toHaveLength(1);
    expect(tenant.getDomainEvents()[0].eventType).toBe('TenantCreated');
  });

  it('应该激活租户并生成事件', async () => {
    const em = this.orm.em.fork();

    const tenant = em.create(Tenant, {
      name: '测试公司',
      plan: 'basic',
    });

    await em.flush();
    tenant.clearEvents();

    tenant.activate();
    await em.flush();

    expect(tenant.status).toBe('active');
    expect(tenant.getDomainEvents()).toHaveLength(1);
  });
});
```

---

## 四、Phase 2: 试点领域迁移 (3-4 周)

### 4.1 选择试点领域：OAuth 2.0

**选择理由**：
```
✅ 业务复杂度适中 - 适合验证架构
✅ 需要 Event Sourcing - 完整审计追踪
✅ 影响范围可控 - 不影响核心业务
✅ 已有 Drizzle 实现 - 可对比效果
```

### 4.2 Week 4: Schema 迁移

#### 4.2.1 Drizzle Schema 分析

```typescript
// 现有 Drizzle Schema (libs/database/src/schema/oauth.schema.ts)
export const oauthClients = pgTable("oauth_clients", {
  id: text("id").primaryKey(),
  name: text("name").notNull(),
  clientId: text("client_id").notNull().unique(),
  clientSecret: text("client_secret"),
  // ... 其他字段
});
```

#### 4.2.2 MikroORM Entity 定义

```typescript
// libs/database/src/entities/oauth-client.entity.ts
import {
  Entity,
  Property,
  Unique,
  BeforeCreate,
  AfterUpdate,
} from '@mikro-orm/core';
import { BaseEntity } from './base.entity';
import { OAuthClientCreatedEvent } from '../events';

@Entity()
@Unique({ properties: ['clientId'] })
export class OAuthClient extends BaseEntity {
  @Property()
  name: string;

  @Property()
  clientId: string;

  @Property({ nullable: true })
  clientSecret?: string;

  @Property()
  clientType: 'confidential' | 'public' = 'confidential';

  @Property({ type: 'text[]' })
  redirectUris: string[] = [];

  @Property({ type: 'text[]' })
  allowedScopes: string[] = [];

  @Property({ nullable: true })
  description?: string;

  @Property({ nullable: true })
  homepageUrl?: string;

  @Property({ nullable: true })
  logoUrl?: string;

  @Property({ nullable: true })
  privacyPolicyUrl?: string;

  @Property({ nullable: true })
  termsOfServiceUrl?: string;

  @Property()
  isActive: boolean = true;

  @Property({ nullable: true })
  createdBy?: string;

  // 生命周期钩子
  @BeforeCreate()
  beforeCreate() {
    this.addDomainEvent(new OAuthClientCreatedEvent(this));
  }

  @AfterUpdate()
  afterUpdate() {
    this.addDomainEvent(new OAuthClientUpdatedEvent(this));
  }

  // 业务方法
  deactivate(): void {
    if (!this.isActive) {
      throw new Error('客户端已停用');
    }
    this.isActive = false;
  }

  activate(): void {
    if (this.isActive) {
      throw new Error('客户端已激活');
    }
    this.isActive = true;
  }

  rotateSecret(newSecret: string): void {
    this.clientSecret = newSecret;
    this.addDomainEvent(new OAuthClientSecretRotatedEvent(this));
  }
}
```

#### 4.2.3 其他 OAuth Entity

```typescript
// libs/database/src/entities/oauth-authorization-code.entity.ts
@Entity()
export class OAuthAuthorizationCode extends BaseEntity {
  @Property({ unique: true })
  code: string;

  @Property()
  clientId: string;

  @Property()
  userId: string;

  @Property()
  redirectUri: string;

  @Property()
  scope: string;

  @Property({ nullable: true })
  codeChallenge?: string;

  @Property({ nullable: true })
  codeChallengeMethod?: string;

  @Property()
  expiresAt: Date;

  @Property()
  usedAt?: Date;

  @BeforeCreate()
  beforeCreate() {
    this.addDomainEvent(new OAuthAuthorizationCodeCreatedEvent(this));
  }
}

// libs/database/src/entities/oauth-access-token.entity.ts
@Entity()
export class OAuthAccessToken extends BaseEntity {
  @Property({ unique: true })
  token: string;

  @Property()
  clientId: string;

  @Property()
  userId: string;

  @Property()
  scope: string;

  @Property()
  expiresAt: Date;

  @Property()
  revokedAt?: Date;

  @Property()
  revokedBy?: string;

  isExpired(): boolean {
    return new Date() > this.expiresAt;
  }

  isRevoked(): boolean {
    return !!this.revokedAt;
  }

  revoke(revokedBy: string): void {
    if (this.isRevoked()) {
      throw new Error('令牌已撤销');
    }
    this.revokedAt = new Date();
    this.revokedBy = revokedBy;
    this.addDomainEvent(new OAuthAccessTokenRevokedEvent(this));
  }
}
```

### 4.3 Week 5: Repository 迁移

#### 4.3.1 Drizzle Repository (原有)

```typescript
// apps/gateway/src/auth/oauth.repository.ts (Drizzle 版本)
export class OAuthRepository {
  constructor(private db: NodePgDatabase) {}

  async findClientByClientId(clientId: string): Promise<OAuthClient | null> {
    const clients = await this.db
      .select()
      .from(oauthClients)
      .where(eq(oauthClients.clientId, clientId))
      .limit(1);

    return clients[0] ?? null;
  }

  async saveClient(client: OAuthClient): Promise<void> {
    await this.db
      .insert(oauthClients)
      .values(client)
      .onConflictDoUpdate({
        target: oauthClients.id,
        set: client,
      });
  }

  // ... 其他方法
}
```

#### 4.3.2 MikroORM Repository (新版本)

```typescript
// libs/oauth/src/infrastructure/repository/oauth.repository.ts
import { EntityManager } from '@mikro-orm/core';
import { OAuthClient } from '@oksai/database';
import { EventSourcedRepository } from '@oksai/event-store';

export class OAuthRepository extends EventSourcedRepository<OAuthClient> {
  constructor(em: EntityManager, eventStore: EventStore) {
    super(em, eventStore, OAuthClient);
  }

  async findByClientId(clientId: string): Promise<OAuthClient | null> {
    return this.em.findOne(OAuthClient, { clientId });
  }

  async findActiveClients(): Promise<OAuthClient[]> {
    return this.em.find(OAuthClient, { isActive: true });
  }

  async findClientsByUserId(userId: string): Promise<OAuthClient[]> {
    return this.em.find(OAuthClient, { createdBy: userId });
  }
}
```

**代码量对比**：
```
Drizzle:  ~100 行
MikroORM: ~30 行

减少：70% 代码量
```

### 4.4 Week 6: Service 层迁移

#### 4.4.1 Drizzle Service (原有)

```typescript
// apps/gateway/src/auth/oauth.service.ts (Drizzle 版本)
export class OAuthService {
  constructor(
    private db: NodePgDatabase,
    private oauthRepository: OAuthRepository,
    private cacheService: CacheService
  ) {}

  async createClient(dto: CreateClientDto): Promise<OAuthClient> {
    return this.db.transaction(async (tx) => {
      // 1. 创建客户端
      const client = {
        id: generateId(),
        name: dto.name,
        clientId: generateClientId(),
        clientSecret: generateClientSecret(),
        redirectUris: dto.redirectUris,
        allowedScopes: dto.allowedScopes,
        isActive: true,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      await tx.insert(oauthClients).values(client);

      // 2. 发布事件（手动）
      await tx.insert(domainEvents).values({
        eventType: 'OAuthClientCreated',
        aggregateId: client.id,
        payload: client,
      });

      return client;
    });
  }
}
```

#### 4.4.2 MikroORM Service (新版本)

```typescript
// libs/oauth/src/application/services/oauth.service.ts
import { EntityManager } from '@mikro-orm/core';
import { OAuthClient } from '@oksai/database';
import { OAuthRepository } from '../infrastructure/repository';

export class OAuthService {
  constructor(
    private em: EntityManager,
    private oauthRepository: OAuthRepository
  ) {}

  async createClient(dto: CreateClientDto): Promise<OAuthClient> {
    // 1. 创建客户端（自动生成事件）
    const client = this.em.create(OAuthClient, {
      name: dto.name,
      clientId: this.generateClientId(),
      clientSecret: this.generateClientSecret(),
      redirectUris: dto.redirectUris,
      allowedScopes: dto.allowedScopes,
    });

    // 2. 持久化（自动保存事件）
    await this.oauthRepository.save(client);

    // 3. 自动 flush（Unit of Work）
    await this.em.flush();

    return client;
  }

  async revokeToken(tokenId: string, revokedBy: string): Promise<void> {
    const token = await this.em.findOneOrFail(OAuthAccessToken, { id: tokenId });

    token.revoke(revokedBy);

    await this.em.flush();
  }

  private generateClientId(): string {
    return `client_${generateRandomString(32)}`;
  }

  private generateClientSecret(): string {
    return generateRandomString(64);
  }
}
```

**优势对比**：
```
MikroORM:
  ✅ 自动事务管理
  ✅ 自动事件收集
  ✅ 自动变更追踪
  ✅ 代码简洁 60%
```

### 4.5 Week 7: 测试与验证

#### 4.5.1 集成测试

```typescript
// libs/oauth/src/application/services/oauth.service.spec.ts
import { Test } from '@nestjs/testing';
import { MikroOrmModule } from '@mikro-orm/nestjs';
import { OAuthService } from './oauth.service';
import { OAuthClient, OAuthAccessToken } from '@oksai/database';

describe('OAuthService', () => {
  let service: OAuthService;
  let em: EntityManager;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [
        MikroOrmModule.forRoot({
          type: 'postgresql',
          dbName: 'test_oauth',
          entities: [OAuthClient, OAuthAccessToken],
        }),
      ],
      providers: [OAuthService, OAuthRepository],
    }).compile();

    service = module.get(OAuthService);
    em = module.get(EntityManager);
  });

  describe('createClient', () => {
    it('应该创建 OAuth 客户端并生成事件', async () => {
      const dto = {
        name: 'Test App',
        redirectUris: ['http://localhost:3000/callback'],
        allowedScopes: ['read', 'write'],
      };

      const client = await service.createClient(dto);

      expect(client.id).toBeDefined();
      expect(client.clientId).toMatch(/^client_/);
      expect(client.clientSecret).toHaveLength(64);
      expect(client.isActive).toBe(true);

      // 验证事件
      const events = client.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('OAuthClientCreated');
    });
  });

  describe('revokeToken', () => {
    it('应该撤销令牌并生成事件', async () => {
      // 1. 创建令牌
      const token = em.create(OAuthAccessToken, {
        token: 'test_token',
        clientId: 'client_id',
        userId: 'user_id',
        scope: 'read',
        expiresAt: new Date(Date.now() + 3600000),
      });

      await em.flush();

      // 2. 撤销令牌
      await service.revokeToken(token.id, 'admin');

      // 3. 验证
      expect(token.revokedAt).toBeDefined();
      expect(token.revokedBy).toBe('admin');

      const events = token.getDomainEvents();
      expect(events).toHaveLength(1);
      expect(events[0].eventType).toBe('OAuthAccessTokenRevoked');
    });
  });
});
```

#### 4.5.2 E2E 测试

```typescript
// apps/gateway/src/auth/oauth.controller.e2e.spec.ts
import { Test } from '@nestjs/testing';
import request from 'supertest';
import { AppModule } from '../../app.module';

describe('OAuth Controller (e2e)', () => {
  let app: INestApplication;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [AppModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  describe('POST /oauth/clients', () => {
    it('应该创建 OAuth 客户端', () => {
      return request(app.getHttpServer())
        .post('/oauth/clients')
        .send({
          name: 'Test App',
          redirectUris: ['http://localhost:3000/callback'],
          allowedScopes: ['read', 'write'],
        })
        .expect(201)
        .expect((res) => {
          expect(res.body.clientId).toMatch(/^client_/);
          expect(res.body.clientSecret).toBeDefined();
        });
    });
  });
});
```

---

## 五、Phase 3: 扩展迁移 (3-4 周)

### 5.1 迁移优先级

```
Week 8: 用户认证领域
  ├── User Entity
  ├── Session Entity
  └── API Key Entity

Week 9: 租户管理领域
  ├── Tenant Entity
  ├── Organization Entity
  └── Billing Entity

Week 10: Webhook 领域
  ├── Webhook Entity
  └── WebhookDelivery Entity

Week 11: 清理 Drizzle
  ├── 移除 Drizzle 依赖
  ├── 删除 Drizzle Schema
  └── 清理配置
```

### 5.2 迁移检查清单

每个 Entity 迁移需要完成：

```
✅ 1. MikroORM Entity 定义
  - Entity 装饰器
  - Property 定义
  - 索引和约束
  - 生命周期钩子

✅ 2. 领域事件定义
  - 事件类
  - 事件 payload
  - 事件 metadata

✅ 3. Repository 实现
  - 继承 EventSourcedRepository
  - 自定义查询方法

✅ 4. Service 层迁移
  - 使用 EntityManager
  - 移除手动事务管理
  - 使用 Unit of Work

✅ 5. 测试迁移
  - 单元测试
  - 集成测试
  - E2E 测试

✅ 6. 文档更新
  - API 文档
  - 架构文档
```

### 5.3 Drizzle 完全移除

#### 5.3.1 依赖清理

```bash
# 移除 Drizzle 依赖
pnpm remove drizzle-orm drizzle-kit

# 删除 Drizzle 配置
rm libs/database/drizzle.config.ts
rm -rf libs/database/drizzle/
```

#### 5.3.2 代码清理

```bash
# 搜索剩余的 Drizzle 引用
grep -r "from 'drizzle-orm'" apps/ libs/ --include="*.ts"

# 逐个确认并移除
```

#### 5.3.3 文档更新

```markdown
# 更新 AGENTS.md
## 三、Build/Lint/Test Commands

### Database Commands

```bash
# MikroORM 命令
pnpm mikro-orm schema:update   # 更新 Schema
pnpm mikro-orm migration:create # 创建迁移
pnpm mikro-orm migration:up     # 运行迁移
pnpm mikro-orm migration:down   # 回滚迁移
```
```

---

## 六、Phase 4: 稳定优化 (持续)

### 6.1 性能优化

#### 6.1.1 查询优化

```typescript
// 1. 使用 populate 预加载关联
const orders = await em.find(Order, {}, {
  populate: ['items', 'user'],
});

// 2. 使用索引
@Entity()
@Index({ properties: ['userId', 'status'] })
export class Order {
  // ...
}

// 3. 分页查询
const [orders, total] = await em.findAndCount(
  Order,
  { status: 'pending' },
  { limit: 20, offset: 0 }
);
```

#### 6.1.2 缓存策略

```typescript
// 1. 使用 Identity Map（自动）
const user1 = await em.findOne(User, { id: '1' });
const user2 = await em.findOne(User, { id: '1' });
// user1 === user2 (自动缓存)

// 2. 使用 Redis 缓存
@Entity()
export class User {
  @Property({ persist: false })
  cachedData?: any;
}
```

### 6.2 监控完善

#### 6.2.1 性能监控

```typescript
// 使用 MikroORM 的 logger
MikroOrmModule.forRoot({
  debug: true,
  logger: (message) => {
    // 发送到监控系统
    metrics.track('db_query', { message });
  },
});
```

#### 6.2.2 错误监控

```typescript
// 全局异常过滤器
@Catch()
export class MikroOrmExceptionFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    if (exception instanceof ValidationError) {
      // 处理验证错误
    } else if (exception instanceof OptimisticLockError) {
      // 处理并发冲突
    }
  }
}
```

### 6.3 文档完善

#### 6.3.1 架构文档

```markdown
# docs/architecture/mikro-orm-guide.md

## MikroORM 使用指南

### Entity 定义规范
### Repository 使用规范
### Service 层最佳实践
### 事件溯源实现
### 性能优化建议
```

#### 6.3.2 API 文档

```markdown
# docs/api/entities.md

## Entity 文档

### Tenant
- 字段说明
- 业务规则
- 事件定义

### OAuth Client
- 字段说明
- 业务规则
- 事件定义
```

---

## 七、风险与缓解

### 7.1 技术风险

| 风险 | 概率 | 影响 | 缓解措施 |
|:---|:---:|:---:|:---|
| **学习曲线陡峭** | 🟡 中 | 🟡 中 | 充分培训、结对编程 |
| **性能下降** | 🟢 低 | 🟡 中 | 基准测试、性能监控 |
| **迁移出错** | 🟡 中 | 🟡 中 | 充分测试、渐进迁移 |
| **并发问题** | 🟢 低 | 🔴 高 | 乐观锁、重试机制 |
| **数据丢失** | 🟢 极低 | 🔴 极高 | 备份、事务保护 |

### 7.2 业务风险

| 风险 | 概率 | 影响 | 缓解措施 |
|:---|:---:|:---:|:---|
| **功能回归** | 🟡 中 | 🟡 中 | E2E 测试、灰度发布 |
| **延期交付** | 🟡 中 | 🟡 中 | 预留 buffer、MVP 优先 |
| **用户体验下降** | 🟢 低 | 🟡 中 | 性能测试、监控告警 |

### 7.3 组织风险

| 风险 | 概率 | 影响 | 缓解措施 |
|:---|:---:|:---:|:---|
| **团队抗拒** | 🟢 低 | 🟡 中 | 培训、分享、渐进迁移 |
| **人员变动** | 🟢 低 | 🟡 中 | 文档完善、知识沉淀 |

---

## 八、成功标准

### 8.1 技术指标

```
✅ 迁移完成度
  - 100% Entity 迁移到 MikroORM
  - Drizzle 完全移除

✅ 代码质量
  - 减少 60% 样板代码
  - 测试覆盖率 > 80%

✅ 性能指标
  - 查询性能 < 10% 下降
  - 事务性能持平

✅ 稳定性
  - 0 次数据丢失
  - < 5 次 Bug
```

### 8.2 业务指标

```
✅ 功能完整性
  - 100% 功能可用
  - 无功能回退

✅ 用户体验
  - 响应时间无明显变化
  - 错误率 < 0.1%

✅ 交付质量
  - 按时交付 (8-12 周)
  - 无延期 > 1 周
```

### 8.3 团队指标

```
✅ 技能提升
  - 团队掌握 MikroORM
  - DDD 实践能力提升

✅ 效率提升
  - 开发效率提升 30%
  - Bug 修复时间减少 40%
```

---

## 九、回滚计划

### 9.1 回滚触发条件

```
🔴 立即回滚
  - 数据丢失
  - 性能下降 > 50%
  - 关键功能不可用

🟡 评估回滚
  - 性能下降 30-50%
  - 5 次以上严重 Bug
  - 团队无法适应
```

### 9.2 回滚步骤

```
Step 1: 停止新功能开发 (1 小时)
Step 2: Git revert 到迁移前版本 (1 小时)
Step 3: 恢复 Drizzle 依赖 (30 分钟)
Step 4: 数据库无需回滚 (Schema 兼容)
Step 5: 验证功能正常 (2 小时)

总回滚时间：< 5 小时
```

### 9.3 回滚成本

```
时间成本：< 1 天
人力成本：2 人 * 1 天 = 2 人天
业务影响：临时功能不可用 < 5 小时
```

---

## 十、总结

### 10.1 迁移价值

```
✅ 技术价值
  - 更好的 DDD 支持
  - 自动化事件管理
  - 代码质量提升

✅ 业务价值
  - 完整审计追踪
  - 事件溯源能力
  - 长期维护成本低

✅ 团队价值
  - 技能提升
  - 开发效率提升
  - 技术视野拓宽
```

### 10.2 关键成功因素

```
✅ 充分准备
  - 技术调研
  - 团队培训
  - 环境搭建

✅ 渐进迁移
  - 试点验证
  - 分阶段迁移
  - 持续交付

✅ 质量保证
  - 充分测试
  - 代码审查
  - 性能监控

✅ 文档完善
  - 架构文档
  - API 文档
  - 最佳实践
```

### 10.3 下一步行动

```
Week 1: 准备阶段
  ├── 技术调研 (2 天)
  ├── 团队培训 (3 天)
  └── 环境搭建 (2 天)

立即开始：
  - 安装 MikroORM 依赖
  - 配置开发环境
  - 开始团队培训
```

---

## 附录

### A. 参考资源

```
官方文档：
  - MikroORM: https://mikro-orm.io/
  - NestJS Integration: https://mikro-orm.io/docs/nestjs
  - DDD with MikroORM: https://mikro-orm.io/docs/ddd

社区资源：
  - GitHub Examples
  - Blog Posts
  - YouTube Tutorials

书籍：
  - 《领域驱动设计》
  - 《实现领域驱动设计》
```

### B. 工具和脚本

```bash
# 迁移辅助脚本
scripts/migrate-to-mikroorm.sh

# 性能测试脚本
scripts/benchmark-mikroorm.sh

# 数据验证脚本
scripts/validate-migration.sh
```

### C. 检查清单

```
迁移前检查：
  ☐ 备份数据库
  ☐ 创建迁移分支
  ☐ 团队培训完成
  ☐ 环境搭建完成

迁移中检查：
  ☐ Entity 定义完成
  ☐ Repository 迁移完成
  ☐ Service 迁移完成
  ☐ 测试通过

迁移后检查：
  ☐ 性能测试通过
  ☐ E2E 测试通过
  ☐ 文档更新完成
  ☐ Drizzle 移除完成
```

---

**文档版本**: 1.0  
**创建日期**: 2026-03-04  
**最后更新**: 2026-03-04  
**负责人**: Team Lead  
**下次评审**: 2026-03-11
