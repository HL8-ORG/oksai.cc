---
description: oksai.cc 项目宪章
globs:
alwaysApply: true
---

<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# 一、General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

## 二、项目架构

### 2.1 项目愿景

**Oksai** 是一个面向现代企业的多租户 SaaS 平台，为中小企业提供：

- 🔐 **统一认证中心** - 多租户、多登录方式、RBAC 权限管理
- 🤖 **AI 集成** - LLM 对话、向量搜索、AI Agent 编排
- 📢 **消息通知基础设施** - 邮件、短信、WebSocket、Webhook
- 📊 **数据治理和分析** - 日志、指标、审计追踪

### 2.2 技术栈

| 层级         | 技术选型                                    | 说明                    |
| ------------ | ------------------------------------------- | ----------------------- |
| **前端**     | React 18 + TanStack Router/Query + radix-ui | TanStack Start 全栈框架 |
| **后端**     | NestJS 10 + TypeScript 5.x                  | ESM 模块系统            |
| **数据库**   | PostgreSQL 16 + MikroORM 6.x + pgvector     | 主数据库 + 向量扩展     |
| **缓存**     | Redis 7.x                                   | 缓存 + 会话存储         |
| **消息队列** | RabbitMQ 3.x                                | 事件驱动架构            |
| **对象存储** | MinIO                                       | S3 兼容存储             |
| **认证**     | Better Auth 1.x                             | 现代认证框架            |
| **构建工具** | Nx 22.x + pnpm 9.x                          | Monorepo 管理           |
| **测试**     | Vitest                                      | 单元测试 + E2E          |
| **部署**     | Docker Compose                              | 容器化部署              |

### 2.3 整体架构设计

#### 架构原则

1. **Monorepo 架构** - Nx 管理多应用和共享库
2. **领域驱动设计 (DDD)** - 分层架构，业务逻辑与技术实现分离
3. **事件驱动架构 (EDA)** - 领域事件 + 事件溯源
4. **CQRS 模式** - 读写分离，查询优化
5. **多租户架构** - 租户隔离，数据安全

#### 系统架构图

```
┌─────────────────────────────────────────────────────────────┐
│                      前端应用层                              │
├─────────────────────────────────────────────────────────────┤
│  web-admin (TanStack Start)  │  web-auth  │  web-marketing │
│  - 管理后台                    │  - 认证UI  │  - 营销官网     │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      API 网关层                              │
├─────────────────────────────────────────────────────────────┤
│  gateway (NestJS)                                            │
│  - 路由分发  - 认证授权  - 租户隔离  - 限流熔断             │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      业务服务层                              │
├─────────────────────────────────────────────────────────────┤
│  IAM Domain    │  Tenancy    │  Notification │  AI Service  │
│  - 用户管理    │  - 租户管理  │  - 邮件/短信   │  - LLM对话   │
│  - 权限控制    │  - 配额管理  │  - WebSocket  │  - 向量搜索  │
└─────────────────────────────────────────────────────────────┘
                              ↓
┌─────────────────────────────────────────────────────────────┐
│                      基础设施层                              │
├─────────────────────────────────────────────────────────────┤
│  Database  │  Cache  │  Message Queue  │  Event Store       │
│  PostgreSQL│  Redis  │  RabbitMQ       │  Event Sourcing   │
└─────────────────────────────────────────────────────────────┘
```

### 2.4 Monorepo 项目结构

```
oksai.cc/
├── apps/                          # 应用层
│   ├── gateway/                   # API 网关 (NestJS)
│   │   ├── src/
│   │   │   ├── auth/             # 认证模块
│   │   │   ├── tenant/           # 租户模块
│   │   │   ├── common/           # 公共模块
│   │   │   ├── health/           # 健康检查
│   │   │   ├── examples/         # 示例代码
│   │   │   ├── app.module.ts     # 根模块
│   │   │   └── main.ts           # 入口文件
│   │   ├── test/                 # 测试文件
│   │   ├── docs/                 # 文档
│   │   └── public/               # 静态资源
│   │
│   └── web-admin/                 # 管理后台 (TanStack Start)
│       ├── src/
│       │   ├── routes/           # 路由页面
│       │   ├── components/       # UI 组件
│       │   ├── hooks/            # 自定义 Hooks
│       │   ├── lib/              # 工具库
│       │   └── styles.css        # 样式文件
│       └── e2e/                  # E2E 测试
│
├── libs/                          # 共享库层
│   ├── shared/                    # 共享基础设施库
│   │   ├── kernel/               # DDD 核心基类
│   │   │   - Entity, AggregateRoot, ValueObject
│   │   │   - DomainEvent, Result, Guard
│   │   ├── event-store/          # 事件存储
│   │   │   - StoredEvent, EventStream
│   │   │   - EventSourcedRepository
│   │   ├── cqrs/                 # CQRS 模式
│   │   │   - Command, Query, Handler
│   │   ├── eda/                  # 事件驱动架构
│   │   │   - EventBus, EventPublisher
│   │   ├── database/             # MikroORM 配置
│   │   │   - EntityManager, Migrations
│   │   ├── cache/                # Redis 缓存
│   │   ├── logger/               # 日志系统
│   │   ├── config/               # 配置管理
│   │   ├── context/              # 上下文管理
│   │   ├── exceptions/           # 异常处理
│   │   ├── types/                # 类型定义
│   │   ├── utils/                # 工具函数
│   │   ├── constants/            # 常量定义
│   │   ├── nestjs-utils/         # NestJS 工具
│   │   └── contracts/            # 契约定义
│   │
│   ├── iam/                       # 身份和访问管理
│   │   ├── domain/               # 领域层（纯 TS）
│   │   │   - Tenant 聚合根
│   │   │   - 值对象（Plan, Quota, Status）
│   │   │   - 领域事件
│   │   ├── infrastructure/       # 基础设施层
│   │   │   - MikroORM 实体
│   │   │   - 仓储实现
│   │   │   - 映射器
│   │   ├── better-auth-mikro-orm/ # Better Auth MikroORM 适配器
│   │   └── nestjs-better-auth/    # Better Auth NestJS 模块
│   │
│   ├── tenancy/                   # 多租户管理
│   │   ├── domain/               # 租户领域模型
│   │   ├── application/          # 应用服务
│   │   └── infrastructure/       # 基础设施
│   │
│   ├── notification/              # 通知服务
│   │   └── email/                # 邮件发送
│   │
│   ├── testing/                   # 测试工具
│   │
│   └── tsconfig/                  # TypeScript 配置包
│       ├── base.json             # 基础配置
│       ├── nestjs-esm.json       # NestJS ESM 配置
│       ├── node-library.json     # Node.js 库配置
│       ├── react-library.json    # React 库配置
│       └── tanstack-start.json   # TanStack Start 配置
│
├── docs/                          # 文档
│   ├── 02-architecture/          # 架构文档
│   ├── 03-guides/                # 开发指南
│   ├── 04-migration/             # 迁移文档
│   ├── 05-features/              # 功能文档
│   ├── 06-operations/            # 运维文档
│   └── 07-assessment/            # 评估文档
│
├── specs/                         # Spec 优先开发文档
│   └── [功能名称]/
│       ├── design.md             # 设计文档
│       ├── implementation.md     # 实现进度
│       ├── decisions.md          # 技术决策
│       └── docs/                 # 文档截图
│
├── docker/                        # Docker 配置
│   ├── docker-compose.yml        # 生产环境
│   └── docker-compose.dev.yml    # 开发环境
│
└── scripts/                       # 工具脚本
    ├── esm/                      # ESM 迁移工具
    └── *.ts                      # 其他脚本
```

### 2.5 应用层架构

#### 2.5.1 Gateway (API 网关)

**技术栈**: NestJS 10 + TypeScript (ESM)

**职责**:

- API 路由分发和版本管理
- 认证授权和权限校验
- 租户隔离和上下文管理
- 限流、熔断、降级
- 请求验证和响应转换
- 日志记录和审计追踪

**模块结构**:

```typescript
// apps/gateway/src/
├── app.module.ts              # 根模块
├── auth/                      # 认证模块
│   ├── decorators/           # 装饰器
│   ├── guards/               # 守卫
│   ├── strategies/           # 策略
│   └── dto/                  # DTO
├── tenant/                    # 租户模块
│   ├── tenant.module.ts
│   ├── tenant.controller.ts
│   └── tenant.service.ts
├── common/                    # 公共模块
│   ├── filters/              # 异常过滤器
│   ├── interceptors/         # 拦截器
│   └── pipes/                # 管道
└── health/                    # 健康检查
```

#### 2.5.2 Web Admin (管理后台)

**技术栈**: TanStack Start + React 18 + TanStack Router/Query

**职责**:

- 管理员后台界面
- 租户管理和配置
- 用户权限管理
- 系统监控和日志查看
- 数据统计和报表

**目录结构**:

```typescript
// apps/web-admin/src/
├── routes/                    # 路由页面
│   ├── __root.tsx            # 根布局
│   ├── index.tsx             # 首页
│   ├── dashboard/            # 仪表盘
│   ├── tenants/              # 租户管理
│   └── users/                # 用户管理
├── components/                # UI 组件
│   ├── ui/                   # 基础组件
│   └── features/             # 业务组件
├── hooks/                     # 自定义 Hooks
├── lib/                       # 工具库
│   ├── api/                  # API 客户端
│   └── utils/                # 工具函数
└── styles.css                 # 全局样式
```

### 2.6 库层架构

#### 2.6.1 共享基础设施库 (@oksai/shared/\*)

**核心设计原则**:

- 框架无关：核心库不依赖特定框架
- 高度可测试：纯函数和可预测行为
- 类型安全：完整的 TypeScript 类型定义
- 性能优化：Tree-shaking 和代码分割

**核心库说明**:

| 库名         | 包名                | 职责         | 关键类/函数                                             |
| ------------ | ------------------- | ------------ | ------------------------------------------------------- |
| kernel       | @oksai/kernel       | DDD 核心基类 | Entity, AggregateRoot, ValueObject, DomainEvent, Result |
| event-store  | @oksai/event-store  | 事件溯源     | StoredEvent, EventStream, EventSourcedRepository        |
| cqrs         | @oksai/cqrs         | CQRS 模式    | Command, Query, CommandHandler, QueryHandler            |
| eda          | @oksai/eda          | 事件驱动     | EventBus, EventPublisher, EventHandler                  |
| database     | @oksai/database     | 数据库       | MikroORM 配置, Migrations                               |
| cache        | @oksai/cache        | 缓存         | Redis 客户端, 缓存装饰器                                |
| logger       | @oksai/logger       | 日志         | 结构化日志, 上下文日志                                  |
| config       | @oksai/config       | 配置         | 环境变量, 配置加载                                      |
| context      | @oksai/context      | 上下文       | 请求上下文, 租户上下文                                  |
| exceptions   | @oksai/exceptions   | 异常         | 业务异常, 基础设施异常                                  |
| types        | @oksai/types        | 类型         | 公共类型定义                                            |
| utils        | @oksai/utils        | 工具         | 通用工具函数                                            |
| constants    | @oksai/constants    | 常量         | 业务常量, 状态码                                        |
| nestjs-utils | @oksai/nestjs-utils | NestJS 工具  | 装饰器, 拦截器, 过滤器                                  |
| contracts    | @oksai/contracts    | 契约         | API 契约, 类型契约                                      |

#### 2.6.2 业务域库 (@oksai/iam, @oksai/tenancy)

**领域驱动设计 (DDD) 分层**:

```
┌─────────────────────────────────────────┐
│          应用层 (Application)           │
│  - Application Services                 │
│  - Use Cases / Orchestration            │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│           领域层 (Domain)               │
│  - Aggregates / Entities                │
│  - Value Objects                        │
│  - Domain Events                        │
│  - Repository Interfaces                │
│  - Domain Services                      │
└─────────────────────────────────────────┘
                    ↓
┌─────────────────────────────────────────┐
│       基础设施层 (Infrastructure)        │
│  - Repository Implementations           │
│  - ORM Entities / Mappers               │
│  - External Services                    │
│  - Persistence                          │
└─────────────────────────────────────────┘
```

**IAM 模块 (@oksai/iam)**:

```
libs/iam/
├── domain/                      # 领域层（纯 TypeScript）
│   ├── tenant/
│   │   ├── tenant.aggregate.ts    # Tenant 聚合根
│   │   ├── tenant.repository.ts   # 仓储接口
│   │   ├── tenant-plan.vo.ts      # 计划值对象
│   │   ├── tenant-quota.vo.ts     # 配额值对象
│   │   └── tenant-status.vo.ts    # 状态值对象
│   └── events/                    # 领域事件
│
├── infrastructure/               # 基础设施层
│   ├── entities/                  # MikroORM 实体
│   ├── repositories/              # 仓储实现
│   ├── mappers/                   # 领域模型映射器
│   └── filters/                   # MikroORM 过滤器
│
├── better-auth-mikro-orm/        # Better Auth 适配器
│   ├── adapter.ts                 # MikroORM 适配器
│   └── schema.ts                  # 数据库 Schema
│
└── nestjs-better-auth/            # NestJS 集成模块
    ├── better-auth.module.ts      # NestJS 模块
    ├── decorators/                # 装饰器
    └── guards/                    # 守卫
```

**设计优势**:

1. **关注点分离**: 业务逻辑与技术实现解耦
2. **可测试性**: 领域模型可独立测试，无需数据库
3. **可维护性**: 修改持久化实现不影响业务规则
4. **可扩展性**: 未来可支持多种持久化方案

### 2.7 领域模型设计

#### 2.7.1 聚合根设计原则

```typescript
// ✅ 好的聚合根设计
export class Tenant extends AggregateRoot<TenantProps> {
  // 业务方法
  public activate(): Result<void> {
    if (this.props.status === TenantStatus.ACTIVE) {
      return Result.fail('租户已激活');
    }
    this.props.status = TenantStatus.ACTIVE;
    this.addDomainEvent(new TenantActivatedEvent(this.id));
    return Result.ok();
  }

  // 工厂方法
  public static create(props: TenantProps): Result<Tenant> {
    // 验证逻辑
    const guardResult = Guard.againstNullOrUndefined(props.name, 'name');
    if (!guardResult.succeeded) {
      return Result.fail(guardResult.message);
    }

    // 创建实例
    const tenant = new Tenant({
      id: new UniqueEntityID(),
      props: {
        name: props.name,
        slug: props.slug,
        status: TenantStatus.PENDING,
        plan: TenantPlan.FREE,
      },
    });

    // 添加领域事件
    tenant.addDomainEvent(new TenantCreatedEvent(tenant.id));
    return Result.ok(tenant);
  }
}
```

#### 2.7.2 值对象设计原则

```typescript
// ✅ 不可变值对象
export class TenantPlan extends ValueObject<{ value: PlanType }> {
  // 预定义实例
  public static readonly FREE = new TenantPlan({ value: 'free' });
  public static readonly PRO = new TenantPlan({ value: 'pro' });
  public static readonly ENTERPRISE = new TenantPlan({ value: 'enterprise' });

  // 业务方法
  public get limits(): QuotaLimits {
    switch (this.props.value) {
      case 'free':
        return { users: 5, storage: 1GB };
      case 'pro':
        return { users: 50, storage: 100GB };
      case 'enterprise':
        return { users: -1, storage: -1 }; // 无限制
    }
  }

  public canUpgrade(): boolean {
    return this.props.value !== 'enterprise';
  }
}
```

#### 2.7.3 仓储设计原则

```typescript
// 领域层：仓储接口
export interface ITenantRepository {
  findById(id: string): Promise<Tenant | null>;
  findBySlug(slug: string): Promise<Tenant | null>;
  save(tenant: Tenant): Promise<void>;
  delete(id: string): Promise<void>;
}

// 基础设施层：仓储实现
@Injectable()
export class TenantRepository implements ITenantRepository {
  constructor(private readonly em: EntityManager) {}

  async findById(id: string): Promise<Tenant | null> {
    const entity = await this.em.findOne(TenantEntity, { id });
    return entity ? TenantMapper.toDomain(entity) : null;
  }

  async save(tenant: Tenant): Promise<void> {
    const entity = TenantMapper.toPersistence(tenant);
    await this.em.persistAndFlush(entity);
  }
}
```

### 2.8 技术特性

#### 2.8.1 事件溯源 (Event Sourcing)

```typescript
// 使用 EventSourcedRepository
export class OrderRepository extends EventSourcedRepository<Order> {
  constructor(em: EntityManager, eventStore: EventStorePort) {
    super(em, eventStore, Order);
  }

  // 保存订单（自动发布领域事件）
  async save(order: Order): Promise<void> {
    await super.save(order); // 自动处理事件
  }
}

// 领域事件自动持久化
const order = Order.create({ customerId: '123', items: [] });
await orderRepository.save(order);
// 自动保存：
// 1. Order 实体到数据库
// 2. OrderCreated 事件到事件存储
// 3. 发布事件到事件总线
```

#### 2.8.2 CQRS 模式

```typescript
// Command（写操作）
export class CreateTenantCommand implements ICommand {
  constructor(
    public readonly name: string,
    public readonly slug: string,
    public readonly ownerId: string,
  ) {}
}

@CommandHandler(CreateTenantCommand)
export class CreateTenantHandler
  implements ICommandHandler<CreateTenantCommand>
{
  async execute(command: CreateTenantCommand): Promise<Result<string>> {
    const tenant = Tenant.create({
      name: command.name,
      slug: command.slug,
      ownerId: command.ownerId,
    });
    await this.tenantRepository.save(tenant);
    return Result.ok(tenant.id);
  }
}

// Query（读操作）
export class GetTenantQuery implements IQuery {
  constructor(public readonly id: string) {}
}

@QueryHandler(GetTenantQuery)
export class GetTenantHandler implements IQueryHandler<GetTenantQuery> {
  async execute(query: GetTenantQuery): Promise<TenantDto | null> {
    // 直接查询读模型，不走领域逻辑
    return this.tenantReadRepository.findById(query.id);
  }
}
```

#### 2.8.3 多租户架构

```typescript
// 租户上下文管理
@Injectable()
export class TenantContextService {
  private readonly currentTenantId = new AsyncLocalStorage<string>();

  setCurrentTenant(tenantId: string): void {
    this.currentTenantId.enterWith(tenantId);
  }

  getCurrentTenant(): string | undefined {
    return this.currentTenantId.getStore();
  }
}

// MikroORM 租户过滤器
@Filter({
  name: 'tenant',
  cond: { tenantId: ctx.tenantId },
  default: true,
})
export class TenantEntity {
  @Property()
  tenantId!: string;
}

// 自动租户隔离
@Controller('tenants')
@UseGuards(TenantGuard)
export class TenantController {
  @Get()
  async getTenants() {
    // 自动过滤当前租户数据
    return this.tenantService.findAll();
  }
}
```

#### 2.8.4 Better Auth 集成

```typescript
// NestJS 集成
@Module({
  imports: [
    BetterAuthModule.forRoot({
      database: MikroORMAdapter({
        entityManager: EntityManager,
      }),
      emailAndPassword: {
        enabled: true,
        requireEmailVerification: true,
      },
      socialProviders: {
        github: {
          clientId: process.env.GITHUB_CLIENT_ID,
          clientSecret: process.env.GITHUB_CLIENT_SECRET,
        },
      },
    }),
  ],
})
export class AuthModule {}

// 使用装饰器
@Controller('users')
export class UserController {
  @Get('me')
  @RequireAuth()
  async getCurrentUser(@CurrentUser() user: User) {
    return user;
  }

  @Get('admin')
  @RequireRoles('admin')
  async getAdminData() {
    return { data: 'sensitive' };
  }
}
```

### 2.9 数据流向

```
┌──────────┐    HTTP     ┌───────────┐
│  Client  │ ──────────> │  Gateway  │
└──────────┘             └───────────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
               ┌────▼────┐          ┌────▼────┐
               │   Auth  │          │ Tenant  │
               │  Guard  │          │ Context │
               └────┬────┘          └────┬────┘
                    │                     │
                    └──────────┬──────────┘
                               │
                         ┌─────▼─────┐
                         │  Handler  │
                         │ (CQRS)    │
                         └─────┬─────┘
                               │
                    ┌──────────┴──────────┐
                    │                     │
               ┌────▼────┐          ┌────▼────┐
               │Command  │          │  Query  │
               │Handler  │          │ Handler │
               └────┬────┘          └────┬────┘
                    │                     │
               ┌────▼────┐          ┌────▼────┐
               │ Domain  │          │  Read   │
               │ Service │          │  Model  │
               └────┬────┘          └────┬────┘
                    │                     │
               ┌────▼────┐          ┌────▼────┐
               │  Repo   │          │  Cache  │
               │ (Write) │          │ (Read)  │
               └────┬────┘          └────┬────┘
                    │                     │
                    └──────────┬──────────┘
                               │
                         ┌─────▼─────┐
                         │    DB     │
                         │ PostgreSQL│
                         └───────────┘
```

### 2.10 开发约定

#### 2.10.1 包命名规范

| 类型   | 命名规范                | 示例                                         |
| ------ | ----------------------- | -------------------------------------------- |
| 应用   | @oksai/[app-name]       | @oksai/gateway, @oksai/web-admin             |
| 共享库 | @oksai/[lib-name]       | @oksai/kernel, @oksai/database               |
| 领域库 | @oksai/[domain]-[layer] | @oksai/iam-domain, @oksai/iam-infrastructure |
| 测试库 | @oksai/testing          | @oksai/testing                               |
| 配置库 | @oksai/tsconfig         | @oksai/tsconfig                              |

#### 2.10.2 依赖方向规则

```
应用层 (apps/*)
    ↓
业务域层 (libs/iam, libs/tenancy)
    ↓
共享基础设施层 (libs/shared/*)
    ↓
核心基础层 (libs/shared/kernel)
```

**禁止循环依赖**：

- 应用层不能被库层依赖
- 领域层不能依赖基础设施层
- 共享库之间避免相互依赖

#### 2.10.3 模块导入规则

```typescript
// ✅ 正确的导入顺序
import { Controller } from '@nestjs/common'; // 1. Node.js / 外部包
import { TenantService } from '@oksai/tenancy'; // 2. Workspace 包
import type { User } from '~/types/user.js'; // 3. 别名路径（type）
import { AuthService } from './auth.service.js'; // 4. 相对路径 + .js
```

### 2.11 关键技术决策

#### 决策 1: 为什么选择 MikroORM 而不是 TypeORM？

- ✅ **更好的 TypeScript 支持**: 类型推断更准确
- ✅ **性能优势**: Unit of Work 模式，批量操作优化
- ✅ **领域驱动设计**: 更贴近 DDD 理念
- ✅ **事件溯源**: 内置事件存储支持

#### 决策 2: 为什么分离 domain 和 infrastructure？

- ✅ **关注点分离**: 业务逻辑与技术实现解耦
- ✅ **可测试性**: 领域模型可独立测试
- ✅ **可维护性**: 修改持久化不影响业务规则
- ✅ **可扩展性**: 支持多种持久化方案

#### 决策 3: 为什么使用 Better Auth 而不是 Passport.js？

- ✅ **现代化设计**: 专为现代 Web 应用设计
- ✅ **更好的 TypeScript**: 完整的类型支持
- ✅ **更少样板代码**: 开箱即用的解决方案
- ✅ **内置功能**: MFA, OAuth, Session 管理等

#### 决策 4: 为什么采用 ESM 而不是 CommonJS？

- ✅ **标准化**: Node.js 官方推荐标准
- ✅ **Tree-shaking**: 更好的代码优化
- ✅ **未来兼容**: 为 NestJS 12 做准备
- ✅ **更好的循环依赖检测**

### 2.12 相关文档

- **架构设计**: `docs/02-architecture/ARCHITECTURE.md`
- **认证系统架构**: `docs/02-architecture/AUTHENTICATION_ARCHITECTURE.md`
- **Better Auth 集成**: `docs/05-features/BETTER_AUTH_INTEGRATION.md`
- **MikroORM 使用**: `docs/03-guides/mikro-orm-usage-guide.md`
- **Entity 设计**: `docs/03-guides/entity-design-guide.md`
- **事件溯源**: `libs/shared/event-store/README.md`
- **DDD 核心**: `libs/shared/kernel/src/index.ts`

## 三、核心原则

### 3.1 Spec 优先开发

`monorepo`下的`specs`目录包含正在开发功能的设计文档。AI 助手应当读取这些文档来理解要构建的内容并跟踪进度。

**工作方式**：

1. **在实现功能前**，先创建包含设计文档的 spec 文件夹
2. **AI 助手先读设计**，再编写代码
3. **进度记录**在 `implementation.md`，用于会话连续性
4. **决策记录**在 `decisions.md`，用于后续参考
5. 功能完成后会**生成带截图的文档**

**具体阅读`specs/README.md`**

### 3.2 中文优先原则

- 所有代码注释、技术文档、错误消息、日志输出及用户界面文案**必须使用中文**
- Git 提交信息**必须使用英文描述**
- 代码变量命名**保持英文**，但必须配有中文注释说明业务语义

### 3.3 代码即文档原则

**必须编写 TSDoc 的场景：** 公共 API、NestJS Controller/Service、类型定义/接口

**TSDoc 必须覆盖：** 功能描述、业务规则、使用场景、前置条件、后置条件、异常抛出及注意事项

## 四、Build/Lint/Test Commands

### Build Commands

```bash
# Build all projects
pnpm build
pnpm nx run-many -t build

# Build specific project
pnpm nx build @oksai/gateway
pnpm nx build @oksai/web-admin

# Build with dependencies
pnpm nx build @oksai/gateway --with-deps
```

**Nx Cloud 状态**: 已永久禁用（`neverConnectToCloud: true`），无需处理连接警告

### Lint Commands (Biome)

```bash
# Lint all files
pnpm lint

# Lint and auto-fix
pnpm lint:fix

# Format code
pnpm format

# Check formatting without changes
pnpm format:check

# Full check (lint + format)
pnpm check

# Full check with auto-fix
pnpm check:fix

# Check specific file
pnpm biome check apps/gateway/src/main.ts
pnpm biome lint --write apps/gateway/src/main.ts
```

### Test Commands

**注意：项目已统一使用 Vitest 测试框架（2026-03-03 迁移完成）**

```bash
# Run all tests
pnpm test

# Run tests for specific project
pnpm nx test @oksai/nestjs-better-auth

# Run single test file (Vitest)
pnpm vitest run libs/auth/nestjs-better-auth/src/decorators.spec.ts
pnpm vitest run path/to/file.spec.ts

# Run single test with pattern
pnpm vitest run -t "test name pattern"

# Run tests in watch mode
pnpm vitest watch

# Run tests with UI
pnpm vitest --ui

# Run tests with coverage
pnpm vitest run --coverage

# Run specific describe block
pnpm vitest run -t "Decorators"
```

**迁移说明：**

- ✅ 已从 Jest 迁移到 Vitest
- ✅ 所有测试文件使用 `vi.fn()` 替代 `jest.fn()`
- ✅ 兼容 Jest API，迁移成本低
- ⚡ 更快的测试运行速度和 watch 模式
- 📚 详见 `docs/migration/vitest-migration.md`

**测试最佳实践：**

- 使用 `vi.fn()` 创建 mock 函数
- 使用 `vi.mock()` mock 模块
- 使用 `vi.importActual()` 获取真实模块
- 优先使用 async/await 而非 done() callback

````

### Database Commands

**MikroORM (推荐使用)**:
```bash
# MikroORM 命令
pnpm mikro-orm schema:update   # 更新 Schema（开发环境）
pnpm mikro-orm migration:create # 创建迁移文件
pnpm mikro-orm migration:up     # 运行迁移
pnpm mikro-orm migration:down   # 回滚迁移
pnpm mikro-orm migration:pending # 查看待执行迁移
````

**Drizzle (已废弃)**:

```bash
# Drizzle 命令（已移除，仅供参考）
# pnpm db:generate  # Generate Drizzle schema migrations
# pnpm db:migrate   # Run migrations
# pnpm db:push      # Push schema changes directly
# pnpm db:studio    # Open Drizzle Studio
```

**说明**:

- ✅ 项目已完成从 Drizzle 到 MikroORM 的迁移（2026-03-06）
- ✅ Better Auth 已使用 MikroORM 适配器
- ✅ 所有数据库操作统一使用 MikroORM
- 📚 迁移详情：`docs/migration/drizzle-to-mikro-orm.md`
- 📊 进度报告：`docs/drizzle-removal-phase4-complete.md`

### Development Commands

```bash
pnpm dev          # Start gateway (NestJS)
pnpm dev:web      # Start web-admin (TanStack Start)
```

## 五、Code Style Guidelines

### Import Organization (ESM)

Biome automatically organizes imports in this order:

1. Node.js builtins with `node:` protocol (`import { join } from "node:path"`)
2. External packages (`@nestjs/common`, `react`, etc.)
3. Internal workspace packages (`@oksai/**`)
4. Path aliases (`~/**`)
5. Relative imports with `.js` extension (`./module.js`, `../utils/index.js`)

**ESM Rules:**

- ✅ Always use `node:` protocol for Node.js builtins
- ✅ Use `import type` for type-only imports
- ✅ Include `.js` extension for all local imports
- ✅ Group imports logically with blank lines between groups

**ESM Import Examples:**

```typescript
// ✅ 正确的 ESM 导入示例
import { fileURLToPath } from 'node:url'; // Node.js 内置模块
import { join, dirname } from 'node:path'; // Node.js 内置模块
import { Controller, Get } from '@nestjs/common'; // 第三方包
import { ConfigService } from '@oksai/config'; // Workspace 包
import type { User } from '~/types/user.js'; // 别名路径 + type
import { AuthService } from './auth.service.js'; // 相对路径 + .js
import { UserModule } from '../user/index.js'; // 父级路径 + index.js
```

**CommonJS 到 ESM 迁移要点:**

```typescript
// ❌ CommonJS 方式
import { AppModule } from './app.module';
const crypto = require('node:crypto');
const __dirname = __dirname;

// ✅ ESM 方式
import { AppModule } from './app.module.js';
import { pbkdf2Sync } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
```

### Formatting (Biome)

- **Line width**: 110 characters
- **Indent**: 2 spaces
- **Quotes**: Double quotes (`"`) for JavaScript/TypeScript
- **Semicolons**: Always
- **Trailing commas**: ES5 compatible
- **Arrow parentheses**: Always `(x) => x`
- **Bracket spacing**: `true` (`{ key: value }`)

### TypeScript

- **Strict mode**: Enabled
- **Explicit types**: Preferred for function returns, public APIs, and complex logic
- **Type imports**: Use `import type { X }` for type-only imports
- **Avoid `any`**: Use `unknown` or specific types instead
- **Non-null assertions**: Avoid `!` operator; use nullish coalescing `??` or optional chaining `?.`

### Naming Conventions

```typescript
// 文件命名
user.service.ts        // 服务文件：小写.功能.ts
auth.guard.ts          // 守卫文件：小写.功能.ts
user.interface.ts      // 接口文件：小写.interface.ts

// 类命名
export class UserService { }  // 类：PascalCase
export class AuthGuard { }    // 守卫：PascalCase + Guard 后缀

// 接口命名
export interface IUser { }    // 接口：I + PascalCase
export type UserRole = ...    // 类型别名：PascalCase

// 变量和函数
const userService = ...       // 变量：camelCase
function validateUser() { }   // 函数：camelCase

// 常量
export const MAX_RETRY = 3;   // 常量：UPPER_SNAKE_CASE
export const userRoles = ...  // 配置对象：camelCase

// 私有成员
private readonly configService  // 私有属性：无下划线
```

### Error Handling

```typescript
// 使用 NestJS 内置异常
import {
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common';

// 抛出标准异常
if (!user) {
  throw new NotFoundException('用户不存在');
}

// 验证失败
if (!email) {
  throw new BadRequestException('邮箱地址不能为空');
}

// 权限错误
if (!hasPermission) {
  throw new UnauthorizedException('您没有权限执行此操作');
}

// 使用 try-catch 处理异步错误
try {
  await this.userService.create(data);
} catch (error) {
  console.error('创建用户失败：', error);
  throw new InternalServerErrorException('创建用户失败，请稍后重试');
}
```

### NestJS Best Practices

- **装饰器顺序**: Class decorators → Property decorators → Method decorators → Parameter decorators
- **Dependency injection**: Use constructor injection with `readonly`
- **Modules**: Keep modules focused and cohesive
- **Guards**: Prefer globally enabled guards with decorators to opt-out

### React/TanStack Start

- Use functional components with hooks
- Prefer `import type` for component props
- Use path alias `~/` for imports from `src/`

## 六、TypeScript Configuration Rules

> **重要**: 完整配置文档请参考：
>
> - 配置包：`libs/tsconfig/`（已与 Novu 对齐）
> - 配置模板：`docs/templates/tsconfig-templates.md`
> - 迁移指南：`docs/guides/tsconfig-migration-guide.md`
>
> **配置策略**：与 Novu 对齐，使用独立的 tsconfig 共享包（`@oksai/tsconfig`）

### 6.0 配置策略概览

#### 新的配置方式（与 Novu 对齐）

从 2026-03-07 开始，项目使用独立的 TypeScript 配置包 `@oksai/tsconfig`，与 Novu 保持一致。

**配置包结构**：

```
libs/tsconfig/
├── base.json              # 基础配置（最严格）
├── nestjs-esm.json        # NestJS ESM 应用配置（推荐）
├── nestjs.json            # NestJS CommonJS 配置（已废弃）
├── node-library.json      # Node.js 库配置
├── react-library.json     # React 库配置
├── tanstack-start.json    # TanStack Start 应用配置
└── build.json             # 构建配置（用于 tsconfig.build.json）
```

libs/shared/tsconfig/
├── base.json # 基础配置（最严格）
├── nestjs.json # NestJS 应用配置
├── node-library.json # Node.js 库配置
├── react-library.json # React 库配置
├── tanstack-start.json # TanStack Start 应用配置
└── build.json # 构建配置（用于 tsconfig.build.json）

````

#### 使用方式

**Node.js 库**：

```json
{
  "extends": "@oksai/tsconfig/node-library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  }
}
````

**NestJS 应用**：

```json
{
  "extends": "@oksai/tsconfig/nestjs-esm.json",
  "compilerOptions": {
    "outDir": "./dist",
    "baseUrl": "./"
  }
}
```

**说明**：项目已完成 ESM 迁移（2026-03-08），使用 `nestjs-esm.json` 配置。

**构建配置**：

```json
{
  "extends": [
    "@oksai/tsconfig/node-library.json",
    "@oksai/tsconfig/build.json"
  ],
  "compilerOptions": {
    "outDir": "./dist",
    "composite": false
  }
}
```

#### 分层配置原则

```
@oksai/tsconfig/base.json        # 根配置：最严格（ES2022 + Strict Mode）
├── @oksai/tsconfig/nestjs.json  # NestJS 应用
├── @oksai/tsconfig/node-library.json  # Node.js 库
├── @oksai/tsconfig/react-library.json # React 库
└── @oksai/tsconfig/tanstack-start.json # TanStack Start 应用
```

#### 关键配置说明

| 配置项                  | base    | nestjs-esm | node-library | react-library |
| ----------------------- | ------- | ---------- | ------------ | ------------- |
| `strict`                | ✅ true | ✅ true    | ✅ true      | ✅ true       |
| `module`                | ES2022  | ES2022     | ESNext       | ESNext        |
| `moduleResolution`      | Bundler | Bundler    | Bundler      | Bundler       |
| `composite`             | false   | -          | true         | -             |
| `emitDecoratorMetadata` | true    | true       | -            | -             |
| `noUnusedLocals`        | true    | true       | true         | true          |

**⚠️ ESM 迁移说明**（2026-03-08 完成）：

- ✅ 项目已从 CommonJS 迁移到 ESM
- ✅ NestJS 应用使用 `nestjs-esm.json` 配置
- ✅ 所有模块使用 ES2022 + Bundler 模式
- 📚 迁移详情：`docs/migration/ESM-MIGRATION-SUMMARY.md`

#### Nx 构建优化

```json
// nx.json targetDefaults 配置
{
  "build": {
    "dependsOn": ["^build"],
    "inputs": ["production", "^production"],
    "cache": true,
    "outputs": ["{projectRoot}/dist", "{projectRoot}/.tsbuildinfo"]
  },
  "test": {
    "dependsOn": ["^build"],
    "inputs": ["default", "^production"],
    "cache": true
  }
}
```

**好处**：

- ✅ 自动处理依赖构建顺序
- ✅ 缓存优化，避免重复构建
- ✅ 增量构建，只构建受影响的项目
- ✅ 与 Novu 配置对齐，便于引入 Novu 模块

### 6.1 添加依赖

在使用新配置前，需要在 `package.json` 中添加依赖：

```json
{
  "devDependencies": {
    "@oksai/tsconfig": "workspace:*"
  }
}
```

然后运行：

```bash
pnpm install
```

### 6.2 Import Type 使用规则

**⚠️ 关键规则**: 在 NestJS 中，构造函数注入的服务**禁止**使用 `import type`

```typescript
// ❌ 错误 - 会导致依赖注入元数据丢失
import type { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {} // ❌ 运行时错误
}

// ✅ 正确
import { AppService } from './app.service';

@Controller()
export class AppController {
  constructor(private readonly appService: AppService) {} // ✅ 正常工作
}
```

**规则总结：**

| 场景                   | 是否可以用 `import type` | 原因                                          |
| ---------------------- | ------------------------ | --------------------------------------------- |
| 构造函数注入的 Service | ❌ **禁止**              | 需要 `emitDecoratorMetadata` 生成运行时元数据 |
| 方法参数类型           | ✅ 可以                  | 纯类型，不需要运行时                          |
| 返回值类型             | ✅ 可以                  | 纯类型，不需要运行时                          |
| 接口/DTO               | ✅ 可以                  | 纯类型，不需要运行时                          |
| 类装饰器               | ❌ **禁止**              | 需要运行时引用                                |

**快速检查命令：**

```bash
# 检查所有可能有问题的 import type
grep -rn "import type.*Service" apps/gateway/src --include="*.ts"
```

### 6.3 库构建配置

#### 构建工具选择

- **使用 `tsc` 构建**：简单库，不需要打包（如 `@oksai/kernel`, `@oksai/context`）
- **使用 `tsup` 构建**：需要多格式输出或打包（如 `@oksai/logger`, `@oksai/database`）

#### composite 配置规则

**⚠️ 关键**: 为避免增量编译缓存导致构建产物不更新

```json
// tsconfig.json (开发配置)
{
  "compilerOptions": {
    "composite": true  // ✅ 启用，用于项目引用和 IDE
  }
}

// tsconfig.build.json (构建配置)
{
  "compilerOptions": {
    "composite": false  // ⚠️ 必须禁用，确保生成构建产物
  }
}
```

**适用范围：**

- ✅ 所有使用 `tsc` 构建的库
- ❌ 使用 `tsup` 构建的库不需要此配置

#### 构建命令标准

```bash
# 清理所有构建缓存和产物
find libs apps -name "*.tsbuildinfo" -delete
pnpm nx run-many -t clean --all
pnpm nx reset

# 重新构建所有项目
pnpm build

# 构建特定项目（自动处理依赖）
pnpm nx build @oksai/gateway
```

### 6.4 ESM Import 规范

**⚠️ 关键规则**: ESM 模式下，本地导入必须包含 `.js` 后缀

```typescript
// ❌ 错误 - ESM 规范要求文件扩展名
import { AppModule } from './app.module';
import { AuthService } from './auth/service';

// ✅ 正确 - 包含 .js 后缀
import { AppModule } from './app.module.js';
import { AuthService } from './auth/service/index.js';
```

**规则说明**：

| 导入类型         | 必须包含 .js | 示例               |
| ---------------- | ------------ | ------------------ |
| 相对路径导入     | ✅ 是        | `./module.js`      |
| 目录导入         | ✅ 是        | `./utils/index.js` |
| Node.js 内置模块 | ❌ 否        | `node:path`        |
| 第三方包         | ❌ 否        | `@nestjs/common`   |
| Workspace 包     | ❌ 否        | `@oksai/config`    |

**快速修复命令**：

```bash
# 查找缺少 .js 后缀的导入
grep -rn 'from "\./[^"]*[^.js]"' apps/gateway/src --include="*.ts"

# 批量添加 .js 后缀
sed -i 's/from "\(\.\/[^"]*\)"/from "\1.js"/g' **/*.ts
```

**参考工具**：

- 自动化脚本：`scripts/esm/add-js-extensions.ts`
- 迁移文档：`docs/migration/ESM-MIGRATION-SUMMARY.md`

### 6.5 依赖注入元数据问题排查

**症状：**

```
Error: Nest can't resolve dependencies of the AppController (?).
Please make sure that the argument Function at index [0] is available.
```

**诊断步骤：**

1. **检查编译后的元数据**

```bash
cat apps/gateway/dist/src/app.controller.js | grep -A 3 "__metadata"

# 正确: tslib_1.__metadata("design:paramtypes", [app_service_1.AppService])
# 错误: tslib_1.__metadata("design:paramtypes", [Function])
```

2. **批量修复命令**

```bash
# 修复所有使用 import type 导入 Service 的文件
find apps/gateway/src -name "*.ts" -exec \
  sed -i 's/import type { \([^}]*Service[^}]*\) }/import { \1 }/g' {} \;
```

3. **验证修复**

```bash
# 确保没有遗漏
grep -rn "import type.*Service" apps/gateway/src --include="*.ts"
```

### 6.6 项目配置模板

#### tsc 构建的库

```json
// libs/shared/lib-name/tsconfig.build.json
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": false,
    "module": "node16",
    "moduleResolution": "node16",
    "declaration": true,
    "declarationMap": true,
    "sourceMap": true,
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
```

#### tsup 构建的库

```typescript
// libs/shared/lib-name/tsup.config.ts
import { type Options } from 'tsup';

const config: Options = {
  entry: ['src/index.ts'],
  format: ['cjs', 'esm'],
  dts: true,
  sourcemap: true,
  clean: true,
  external: ['@nestjs/common', '@oksai/config'],
};

export default config;
```

### 6.7 常见问题快速修复

#### 问题 1: 类型声明文件找不到

```bash
# 清理并重新构建
find libs -name "*.tsbuildinfo" -delete
pnpm nx reset
pnpm build
```

#### 问题 2: rimraf: not found

```bash
# 已统一使用 pnpm exec rimraf
# 所有 package.json 的 clean 脚本应使用：
"clean": "pnpm exec rimraf dist coverage"
```

#### 问题 3: Nx Cloud 已禁用

**说明**: 项目已在 `nx.json` 中配置 `neverConnectToCloud: true`，无需任何操作

### 6.8 新库创建清单

创建新的共享库时，确保：

```markdown
- [ ] 创建 `tsconfig.json` (extends tsconfig.base.json)
- [ ] 创建 `tsconfig.build.json` (composite: false)
- [ ] 在 `tsconfig.base.json` 添加路径映射
- [ ] 选择构建工具 (tsc/tsup)
- [ ] 配置 `package.json` 构建脚本
- [ ] 添加到 `apps/gateway/project.json` 的 dependsOn（如果被使用）
```

### 6.9 完整清理和重建流程

**⚠️ 当遇到任何构建或类型问题时，执行此流程：**

```bash
# 1. 清理所有构建产物和缓存
find libs apps -name "*.tsbuildinfo" -delete
pnpm nx run-many -t clean --all

# 2. 重置 Nx 缓存
pnpm nx reset

# 3. 重新安装依赖（可选）
pnpm install --force

# 4. 重新构建所有项目
pnpm build

# 5. 验证构建结果
pnpm test

# 6. 启动开发服务器
pnpm dev
```

## 七、Spec 优先开发

详细流程参见 `specs/README.md`。每个功能包含：`design.md`、`implementation.md`、`decisions.md`、`prompts.md`、`future-work.md`、`docs/`。

## 八、ESM 迁移最佳实践

### 8.0 迁移概述

**迁移状态**: ✅ 完成（2026-03-08）  
**迁移版本**: v2.0.0-esm  
**详细文档**: `docs/migration/ESM-MIGRATION-SUMMARY.md`

项目已从 CommonJS 成功迁移到 ESM，为 NestJS 12 做好准备。

### 8.1 Import 路径规范

**核心规则**: 所有本地导入必须包含 `.js` 后缀

```typescript
// ✅ 正确
import { AppModule } from './app.module.js';
import { AuthService } from './auth.service.js';
import { UserDto } from './dto/index.js';

// ❌ 错误
import { AppModule } from './app.module';
import { AuthService } from './auth.service';
import { UserDto } from './dto';
```

**自动化工具**: `scripts/esm/add-js-extensions.ts`

### 8.2 __dirname 替换方案

ESM 模式下不存在 `__dirname` 全局变量，需要手动创建：

```typescript
// ✅ ESM 标准方式
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const configPath = join(__dirname, '../config');
```

**自动化工具**: `scripts/esm/transform-dirname.ts`

### 8.3 require() 替换

ESM 不支持 `require()`，必须使用静态 `import`：

```typescript
// ❌ CommonJS
const crypto = require('node:crypto');
const { BetterAuthApiClient } = require('@oksai/nestjs-better-auth');

// ✅ ESM
import { pbkdf2Sync } from 'node:crypto';
import { BetterAuthApiClient } from '@oksai/nestjs-better-auth';
```

### 8.4 reflect-metadata 加载顺序

**关键**: `reflect-metadata` 必须在所有其他 import 之前加载

```typescript
// main.ts - 必须在第一行
import 'reflect-metadata';
// 其他 import...
```

### 8.5 测试 Mock 注意事项

ESM 模式下，Mock API 的参数格式可能与 CommonJS 不同：

```typescript
// 检查实际实现
await this.apiClient.enableTwoFactor({ password }, token);

// 更新测试 Mock
mockAuthAPI.enableTwoFactor.mockResolvedValue(result);
expect(mockAuthAPI.enableTwoFactor).toHaveBeenCalledWith(
  { password: dto.password },
  token,
);
```

### 8.6 故障排查

#### 问题 1: Cannot find module

**症状**: `Error: Cannot find module './app.module'`

**原因**: Import 路径缺少 `.js` 后缀

**解决**: 添加 `.js` 后缀或运行自动化脚本

#### 问题 2: \_\_dirname is not defined

**症状**: `ReferenceError: __dirname is not defined`

**原因**: ESM 模式下不存在 `__dirname`

**解决**: 使用 `fileURLToPath(import.meta.url)` 创建

#### 问题 3: 依赖注入失败

**症状**: `Nest can't resolve dependencies`

**原因**: `reflect-metadata` 未正确加载

**解决**:

1. 确保 `reflect-metadata` 在文件顶部
2. 检查 `tsconfig.json` 的 `emitDecoratorMetadata: true`
3. 不要对注入的 Service 使用 `import type`

### 8.7 迁移检查清单

新文件或迁移时的检查项：

- [ ] Import 路径包含 `.js` 后缀
- [ ] 目录导入使用 `index.js`
- [ ] `__dirname` 使用 ESM 方式
- [ ] 无 `require()` 调用
- [ ] `reflect-metadata` 在顶部
- [ ] 注入的 Service 不使用 `import type`
- [ ] 测试通过

### 8.8 相关文档

- **迁移总结**: `docs/migration/ESM-MIGRATION-SUMMARY.md`
- **迁移清单**: `docs/migration/esm-migration-checklist.md`
- **快速参考**: `docs/migration/ESM-MIGRATION-QUICK-REFERENCE.md`
- **测试结果**: `docs/migration/esm-phase2-test-results.md`

---

**文档版本**: v2.0  
**最后更新**: 2026-03-08  
**维护者**: oksai.cc 团队
