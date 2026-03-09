# 多租户架构重构计划

## 文档信息

- **创建时间**: 2026-03-09
- **最后更新**: 2026-03-09
- **负责人**: 开发团队
- **预估工时**: 4-6 小时
- **优先级**: 高

## 一、背景和问题

### 1.1 当前问题

**架构混淆**:

- `libs/tenancy` 混合了"多租户机制"和"租户管理"两个不同的关注点
- 多租户机制是横切关注点，应该作为基础设施
- 租户管理是业务领域，应该遵循 DDD + 六边形架构

**具体表现**:

```
libs/tenancy/src/
├── domain/                      # 业务领域
├── infrastructure/
│   ├── adapters/
│   │   ├── tenant-guard.ts      # ❌ 这是基础设施，不是领域
│   │   └── tenant-context.ts    # ❌ 这是基础设施，不是领域
│   └── persistence/
│       └── filters/             # ❌ 这是基础设施，不是领域
└── presentation/
    └── middleware/              # ❌ 这是基础设施，不是领域
```

### 1.2 目标

**分离关注点**:

1. **多租户机制** → `libs/core/multi-tenancy` (横切基础设施)
2. **租户管理** → `libs/iam/tenancy` (业务领域)

**架构原则**:

- 多租户机制：纯 NestJS Module，简单直接
- 租户管理：DDD + 六边形 + CQRS + EDA + Event Sourcing

## 二、架构设计

### 2.1 多租户机制 (`@oksai/multi-tenancy`)

**定位**: 横切关注点，基础设施层

**目录结构**:

```
libs/core/multi-tenancy/
├── src/
│   ├── context/                 # 租户上下文（AsyncLocalStorage）
│   │   ├── tenant-context.ts
│   │   └── tenant-context.service.ts
│   ├── middleware/              # NestJS Middleware
│   │   └── tenant-identification.middleware.ts
│   ├── guards/                  # NestJS Guards
│   │   ├── tenant.guard.ts
│   │   └── quota.guard.ts
│   ├── decorators/              # NestJS Decorators
│   │   ├── tenant-optional.decorator.ts
│   │   ├── skip-tenant.decorator.ts
│   │   └── check-quota.decorator.ts
│   ├── interceptors/            # NestJS Interceptors
│   │   └── tenant-context.interceptor.ts
│   ├── filters/                 # MikroORM Filters
│   │   └── tenant.filter.ts
│   ├── interfaces/              # 接口定义
│   │   ├── tenant-aware.interface.ts
│   │   └── tenant-config.interface.ts
│   ├── multi-tenancy.module.ts  # NestJS Module
│   └── index.ts
├── package.json
└── README.md
```

**技术栈**:

- NestJS Guards, Middleware, Interceptors, Decorators
- MikroORM Filters
- AsyncLocalStorage
- Express types

**不使用**:

- ❌ DDD
- ❌ 六边形架构
- ❌ CQRS
- ❌ Event Sourcing

**示例代码**:

```typescript
// 使用方式 - 简单直接
@Module({
  imports: [MultiTenancyModule],
  controllers: [OrganizationController],
})
export class OrganizationModule {}

// Controller 中使用
@Controller('organizations')
@UseGuards(TenantGuard)
export class OrganizationController {
  constructor(private readonly tenantContext: TenantContextService) {}

  @Get()
  async list() {
    const tenantId = this.tenantContext.getTenantId();
    // 自动过滤当前租户的数据
  }
}
```

### 2.2 租户管理 (`@oksai/iam-tenancy`)

**定位**: 业务限界上下文，领域层

**目录结构**:

```
libs/iam/tenancy/
├── src/
│   ├── domain/                  # 领域层（纯 TypeScript）
│   │   ├── model/               # 聚合根 + 实体 + 值对象
│   │   │   ├── tenant.aggregate.ts
│   │   │   ├── tenant-plan.vo.ts
│   │   │   ├── tenant-quota.vo.ts
│   │   │   └── tenant-status.vo.ts
│   │   ├── events/              # 领域事件
│   │   │   ├── tenant-created.event.ts
│   │   │   ├── tenant-activated.event.ts
│   │   │   ├── tenant-suspended.event.ts
│   │   │   └── tenant-plan-changed.event.ts
│   │   ├── services/            # 领域服务
│   │   │   └── tenant-pricing.service.ts
│   │   ├── repositories/        # 仓储接口
│   │   │   └── tenant.repository.ts
│   │   └── rules/               # 业务规则
│   │       └── tenant-validation.rules.ts
│   │
│   ├── application/             # 应用层（CQRS）
│   │   ├── commands/            # 命令
│   │   │   ├── create-tenant.command.ts
│   │   │   ├── activate-tenant.command.ts
│   │   │   ├── suspend-tenant.command.ts
│   │   │   ├── change-plan.command.ts
│   │   │   └── update-quota.command.ts
│   │   ├── commands/handlers/   # 命令处理器
│   │   │   ├── create-tenant.handler.ts
│   │   │   ├── activate-tenant.handler.ts
│   │   │   └── ...
│   │   ├── queries/             # 查询
│   │   │   ├── get-tenant.query.ts
│   │   │   ├── list-tenants.query.ts
│   │   │   └── check-quota.query.ts
│   │   ├── queries/handlers/    # 查询处理器
│   │   │   └── ...
│   │   ├── services/            # 应用服务
│   │   │   └── tenant-application.service.ts
│   │   └── dto/                 # DTO
│   │       └── tenant.dto.ts
│   │
│   ├── infrastructure/          # 基础设施层（六边形适配器）
│   │   ├── persistence/         # 持久化适配器
│   │   │   ├── entities/        # MikroORM 实体
│   │   │   │   └── tenant.entity.ts
│   │   │   ├── repositories/    # 仓储实现（Event Sourced）
│   │   │   │   └── event-sourced-tenant.repository.ts
│   │   │   └── mappers/         # 领域模型映射器
│   │   │       └── tenant.mapper.ts
│   │   ├── adapters/            # 端口适配器
│   │   │   ├── primary/         # 驱动适配器（入站）
│   │   │   │   └── nest/
│   │   │   │       └── tenant-command.adapter.ts
│   │   │   └── secondary/       # 被驱动适配器（出站）
│   │   │       ├── event-store.adapter.ts
│   │   │       └── email-notification.adapter.ts
│   │   ├── projections/         # 投影器（读模型）
│   │   │   ├── tenant.projector.ts
│   │   │   └── handlers/
│   │   │       ├── tenant-created.handler.ts
│   │   │       └── tenant-activated.handler.ts
│   │   └── consumers/           # 事件消费者
│   │       └── tenant-event.consumer.ts
│   │
│   └── presentation/            # 表现层（REST API）
│       └── nest/
│           ├── controllers/
│           │   ├── tenant.controller.ts
│           │   └── tenant-quota.controller.ts
│           ├── dto/
│           │   ├── create-tenant.request.ts
│           │   └── tenant.response.ts
│           └── tenant.module.ts
│
├── package.json
└── README.md
```

**技术栈**:

- DDD (Domain-Driven Design)
- 六边形架构 (Hexagonal Architecture)
- CQRS (Command Query Responsibility Segregation)
- EDA (Event-Driven Architecture)
- Event Sourcing
- MikroORM
- @oksai/domain-core
- @oksai/event-store

**示例代码**:

```typescript
// 领域层 - 纯 TypeScript
export class Tenant extends AggregateRoot<TenantProps> {
  public activate(): Result<void> {
    if (!this.props.status.isPending()) {
      return Result.fail('只有待审核的租户才能激活');
    }

    this.props.status = TenantStatus.active();
    this.addDomainEvent(new TenantActivatedEvent(this.id));
    return Result.ok();
  }

  public static create(props: TenantProps): Result<Tenant> {
    const tenant = new Tenant(props);
    tenant.addDomainEvent(new TenantCreatedEvent(tenant.id));
    return Result.ok(tenant);
  }
}

// 应用层 - CQRS
@CommandHandler(ActivateTenantCommand)
export class ActivateTenantHandler
  implements ICommandHandler<ActivateTenantCommand>
{
  constructor(
    private readonly tenantRepo: ITenantRepository,
    private readonly eventPublisher: EventPublisher,
  ) {}

  async execute(command: ActivateTenantCommand): Promise<Result<void>> {
    const tenant = await this.tenantRepo.findById(command.tenantId);
    if (!tenant) {
      return Result.fail('租户不存在');
    }

    const result = tenant.activate();
    if (result.isFail()) {
      return result;
    }

    await this.tenantRepo.save(tenant);
    return Result.ok();
  }
}

// 基础设施层 - Event Sourced Repository
export class EventSourcedTenantRepository implements ITenantRepository {
  constructor(
    private readonly eventStore: EventStorePort,
    private readonly em: EntityManager,
  ) {}

  async save(tenant: Tenant): Promise<void> {
    const events = tenant.getDomainEvents();
    await this.eventStore.append(tenant.id, events);
    // 投影器会处理事件并更新读模型
  }
}
```

### 2.3 架构对比

| 维度         | 多租户机制       | 租户管理                       |
| ------------ | ---------------- | ------------------------------ |
| **定位**     | 基础设施（横切） | 业务领域                       |
| **架构风格** | NestJS Module    | DDD + 六边形 + CQRS + EDA + ES |
| **复杂度**   | 简单             | 复杂                           |
| **代码量**   | ~500 行          | ~5000 行                       |
| **依赖**     | NestJS, MikroORM | @oksai/domain-core, 事件存储   |
| **测试策略** | 集成测试为主     | 单元测试（领域）+ 集成测试     |
| **变更频率** | 低（稳定）       | 高（业务变化）                 |
| **复用范围** | 所有模块         | 仅租户管理                     |

### 2.4 依赖关系

```
apps/gateway
├── @oksai/multi-tenancy        # 租户机制（Guard, Middleware）
└── @oksai/iam-tenancy          # 租户管理（Controller, Service）

libs/organization
└── @oksai/multi-tenancy        # 只需要租户机制（数据隔离）

libs/project
└── @oksai/multi-tenancy        # 只需要租户机制（数据隔离）

libs/invoice
└── @oksai/multi-tenancy        # 只需要租户机制（数据隔离）

libs/iam/tenancy
├── @oksai/domain-core          # DDD 基础类
├── @oksai/event-store          # 事件存储
└── @oksai/multi-tenancy        # 也会用到租户机制
```

## 三、重构步骤

### 阶段 1: 创建 multi-tenancy 包 (1.5 小时)

**目标**: 创建独立的多租户基础设施包

**步骤**:

```bash
# 1.1 创建目录结构
mkdir -p libs/core/multi-tenancy/src/{context,middleware,guards,decorators,interceptors,filters,interfaces}

# 1.2 创建 package.json
cat > libs/core/multi-tenancy/package.json << 'EOF'
{
  "name": "@oksai/multi-tenancy",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "lint": "biome check --write .",
    "clean": "pnpm exec rimraf dist coverage"
  },
  "dependencies": {
    "@nestjs/common": "catalog:",
    "@nestjs/core": "catalog:",
    "@mikro-orm/core": "catalog:",
    "@oksai/context": "workspace:*"
  },
  "devDependencies": {
    "@types/express": "catalog:",
    "typescript": "catalog:"
  }
}
EOF

# 1.3 创建 tsconfig.json
cat > libs/core/multi-tenancy/tsconfig.json << 'EOF'
{
  "extends": "@oksai/tsconfig/node-library.json",
  "compilerOptions": {
    "outDir": "./dist",
    "rootDir": "./src"
  },
  "include": ["src/**/*"],
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
EOF

# 1.4 创建 tsconfig.build.json
cat > libs/core/multi-tenancy/tsconfig.build.json << 'EOF'
{
  "extends": "./tsconfig.json",
  "compilerOptions": {
    "composite": false,
    "declaration": true,
    "declarationMap": true
  },
  "exclude": ["node_modules", "dist", "**/*.spec.ts"]
}
EOF

# 1.5 创建 project.json
cat > libs/core/multi-tenancy/project.json << 'EOF'
{
  "name": "@oksai/multi-tenancy",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/core/multi-tenancy/src",
  "projectType": "library",
  "tags": ["type:lib", "scope:core", "layer:infrastructure"],
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{projectRoot}/dist"],
      "options": {
        "main": "libs/core/multi-tenancy/src/index.ts",
        "tsConfig": "libs/core/multi-tenancy/tsconfig.build.json",
        "outputPath": "libs/core/multi-tenancy/dist"
      }
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc --noEmit",
        "cwd": "libs/core/multi-tenancy"
      }
    },
    "test": {
      "executor": "nx:run-commands",
      "options": {
        "command": "vitest run",
        "cwd": "libs/core/multi-tenancy"
      }
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "biome check --write .",
        "cwd": "libs/core/multi-tenancy"
      }
    },
    "clean": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm exec rimraf dist coverage",
        "cwd": "libs/core/multi-tenancy"
      }
    }
  }
}
EOF
```

**迁移文件**:

```bash
# 1.6 迁移租户上下文
cp apps/gateway/src/tenant/tenant.context.ts \
   libs/core/multi-tenancy/src/context/tenant-context.ts

# 1.7 迁移租户中间件
cp apps/gateway/src/tenant/tenant.middleware.ts \
   libs/core/multi-tenancy/src/middleware/tenant-identification.middleware.ts

# 1.8 迁移租户守卫
cp apps/gateway/src/tenant/tenant.guard.ts \
   libs/core/multi-tenancy/src/guards/tenant.guard.ts

cp apps/gateway/src/tenant/guards/quota.guard.ts \
   libs/core/multi-tenancy/src/guards/quota.guard.ts

# 1.9 迁移租户过滤器
cp libs/iam/identity/src/infrastructure/persistence/filters/tenant.filter.ts \
   libs/core/multi-tenancy/src/filters/tenant.filter.ts

# 1.10 迁移装饰器
cp apps/gateway/src/tenant/decorators/*.ts \
   libs/core/multi-tenancy/src/decorators/
```

**创建模块**:

```typescript
// libs/core/multi-tenancy/src/multi-tenancy.module.ts
import { Module, Global } from '@nestjs/common';
import { TenantContextService } from './context/tenant-context.service.js';
import { TenantGuard } from './guards/tenant.guard.js';
import { QuotaGuard } from './guards/quota.guard.js';

@Global()
@Module({
  providers: [TenantContextService, TenantGuard, QuotaGuard],
  exports: [TenantContextService, TenantGuard, QuotaGuard],
})
export class MultiTenancyModule {}

// libs/core/multi-tenancy/src/index.ts
export * from './context/tenant-context.service.js';
export * from './middleware/tenant-identification.middleware.js';
export * from './guards/tenant.guard.js';
export * from './guards/quota.guard.js';
export * from './decorators/index.js';
export * from './filters/tenant.filter.js';
export * from './multi-tenancy.module.js';
```

**验证**:

```bash
# 1.11 编译和测试
cd libs/core/multi-tenancy
pnpm build
pnpm test
```

### 阶段 2: 重命名和清理 tenancy 包 (1 小时)

**目标**: 将 `libs/tenancy` 重命名为 `libs/iam/tenancy` 并删除基础设施代码

**步骤**:

```bash
# 2.1 创建目标目录
mkdir -p libs/iam/tenancy

# 2.2 移动所有文件
mv libs/tenancy/* libs/iam/tenancy/
mv libs/tenancy/.* libs/iam/tenancy/ 2>/dev/null || true

# 2.3 删除旧目录
rmdir libs/tenancy

# 2.4 删除基础设施代码（已迁移到 multi-tenancy）
rm -rf libs/iam/tenancy/src/infrastructure/adapters/tenant-context.service.ts
rm -rf libs/iam/tenancy/src/infrastructure/adapters/tenant-guard.ts
rm -rf libs/iam/tenancy/src/infrastructure/persistence/filters

# 2.5 更新 package.json
cat > libs/iam/tenancy/package.json << 'EOF'
{
  "name": "@oksai/iam-tenancy",
  "version": "0.1.0",
  "type": "module",
  "main": "./dist/index.js",
  "types": "./dist/index.d.ts",
  "exports": {
    ".": {
      "types": "./dist/index.d.ts",
      "import": "./dist/index.js"
    }
  },
  "scripts": {
    "build": "tsc -p tsconfig.build.json",
    "typecheck": "tsc --noEmit",
    "test": "vitest run",
    "lint": "biome check --write .",
    "clean": "pnpm exec rimraf dist coverage"
  },
  "dependencies": {
    "@mikro-orm/core": "catalog:",
    "@nestjs/common": "catalog:",
    "@oksai/domain-core": "workspace:*",
    "@oksai/event-store": "workspace:*",
    "@oksai/multi-tenancy": "workspace:*"
  },
  "devDependencies": {
    "@types/express": "catalog:",
    "typescript": "catalog:"
  }
}
EOF

# 2.6 更新 project.json
cat > libs/iam/tenancy/project.json << 'EOF'
{
  "name": "@oksai/iam-tenancy",
  "$schema": "../../node_modules/nx/schemas/project-schema.json",
  "sourceRoot": "libs/iam/tenancy/src",
  "projectType": "library",
  "tags": ["type:lib", "scope:iam", "layer:domain"],
  "targets": {
    "build": {
      "executor": "@nx/js:tsc",
      "outputs": ["{projectRoot}/dist"],
      "options": {
        "main": "libs/iam/tenancy/src/index.ts",
        "tsConfig": "libs/iam/tenancy/tsconfig.build.json",
        "outputPath": "libs/iam/tenancy/dist"
      },
      "dependsOn": ["^build"]
    },
    "typecheck": {
      "executor": "nx:run-commands",
      "options": {
        "command": "tsc --noEmit",
        "cwd": "libs/iam/tenancy"
      }
    },
    "test": {
      "executor": "nx:run-commands",
      "outputs": ["{projectRoot}/coverage"],
      "options": {
        "command": "vitest run",
        "cwd": "libs/iam/tenancy"
      },
      "dependsOn": ["^build"]
    },
    "lint": {
      "executor": "nx:run-commands",
      "options": {
        "command": "biome check --write .",
        "cwd": "libs/iam/tenancy"
      }
    },
    "clean": {
      "executor": "nx:run-commands",
      "options": {
        "command": "pnpm exec rimraf dist coverage",
        "cwd": "libs/iam/tenancy"
      }
    }
  }
}
EOF

# 2.7 更新所有导入路径
find libs/iam/tenancy/src -name "*.ts" -exec \
  sed -i 's|from "@oksai/tenancy"|from "@oksai/iam-tenancy"|g' {} \;

find libs/iam/tenancy/src -name "*.ts" -exec \
  sed -i 's|from "\./infrastructure/adapters/tenant-|from "@oksai/multi-tenancy"|g' {} \;
```

**验证**:

```bash
# 2.8 编译和测试
cd libs/iam/tenancy
pnpm build
pnpm test
```

### 阶段 3: 更新 Gateway 依赖 (1 小时)

**目标**: 更新 gateway 的导入，使用新的包结构

**步骤**:

```bash
# 3.1 更新 package.json
cd apps/gateway
pnpm remove @oksai/tenancy
pnpm add @oksai/multi-tenancy@workspace:* @oksai/iam-tenancy@workspace:*
```

```typescript
// 3.2 更新 app.module.ts
// 之前
import { TenantMiddleware } from './tenant/tenant.middleware.js';
import { TenantModule } from './tenant/tenant.module.js';

// 之后
import {
  MultiTenancyModule,
  TenantIdentificationMiddleware,
} from '@oksai/multi-tenancy';
import { IamTenancyModule } from '@oksai/iam-tenancy';

@Module({
  imports: [
    MultiTenancyModule, // 多租户机制
    IamTenancyModule, // 租户管理
    // ...
  ],
})
export class AppModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(TenantIdentificationMiddleware).forRoutes('*');
  }
}
```

```typescript
// 3.3 更新 auth/organization.controller.ts
// 之前
import { TenantGuard } from '../tenant/tenant.guard.js';
import { QuotaGuard } from '../tenant/guards/quota.guard.js';

// 之后
import { TenantGuard, QuotaGuard } from '@oksai/multi-tenancy';
```

```bash
# 3.4 批量更新所有导入
find apps/gateway/src -name "*.ts" -exec \
  sed -i 's|from "\./tenant/tenant.guard.js"|from "@oksai/multi-tenancy"|g' {} \;

find apps/gateway/src -name "*.ts" -exec \
  sed -i 's|from "\./tenant/guards/quota.guard.js"|from "@oksai/multi-tenancy"|g' {} \;

find apps/gateway/src -name "*.ts" -exec \
  sed -i 's|from "\./tenant/decorators/|from "@oksai/multi-tenancy"|g' {} \;

find apps/gateway/src -name "*.ts" -exec \
  sed -i 's|from "\./tenant/tenant.middleware.js"|from "@oksai/multi-tenancy"|g' {} \;
```

**验证**:

```bash
# 3.5 编译和启动
cd apps/gateway
pnpm build
pnpm dev
```

### 阶段 4: 清理和测试 (1 小时)

**目标**: 清理旧代码，运行完整测试

**步骤**:

```bash
# 4.1 删除 gateway/src/tenant 中的基础设施代码（保留业务代码）
# 注意：如果 gateway/src/tenant 只有基础设施，可以完全删除
# 如果有业务逻辑，迁移到 @oksai/iam-tenancy

# 4.2 运行完整构建
pnpm nx reset
pnpm build

# 4.3 运行所有测试
pnpm test

# 4.4 运行 lint
pnpm lint

# 4.5 启动开发服务器
pnpm dev

# 4.6 测试 API
curl http://localhost:3000/api/health
curl http://localhost:3000/api/tenants
```

### 阶段 5: 文档和验收 (30分钟)

**目标**: 更新文档，确保架构清晰

**步骤**:

```bash
# 5.1 更新 README
cat > libs/core/multi-tenancy/README.md << 'EOF'
# @oksai/multi-tenancy

多租户基础设施包，提供租户识别、上下文管理和数据隔离能力。

## 功能

- **租户识别中间件**: 从 JWT/Header/子域名识别租户
- **租户上下文服务**: 基于 AsyncLocalStorage 的上下文管理
- **租户守卫**: 自动验证租户访问权限
- **配额守卫**: 检查租户资源配额
- **MikroORM 过滤器**: 自动过滤租户数据

## 使用方式

\`\`\`typescript
import { MultiTenancyModule, TenantGuard } from '@oksai/multi-tenancy';

@Module({
  imports: [MultiTenancyModule],
  controllers: [OrganizationController],
})
export class OrganizationModule {}
\`\`\`

## 装饰器

- `@SkipTenant()` - 跳过租户检查
- `@TenantOptional()` - 可选租户
- `@CheckQuota('organizations')` - 检查配额
EOF

cat > libs/iam/tenancy/README.md << 'EOF'
# @oksai/iam-tenancy

租户管理限界上下文，遵循 DDD + 六边形 + CQRS + EDA + Event Sourcing 架构。

## 架构

- **领域层**: 纯 TypeScript，无框架依赖
- **应用层**: CQRS 命令和查询
- **基础设施层**: 事件溯源、投影器、适配器
- **表现层**: NestJS REST API

## 功能

- 租户 CRUD
- 套餐和配额管理
- 租户激活/停用
- 租户设置和统计

## 使用方式

\`\`\`typescript
import { IamTenancyModule } from '@oksai/iam-tenancy';

@Module({
  imports: [IamTenancyModule],
})
export class GatewayModule {}
\`\`\`
EOF

# 5.2 更新 AGENTS.md
# 添加多租户包说明

# 5.3 创建架构图
# 使用 Mermaid 或其他工具绘制架构图
```

## 四、风险和缓解措施

### 4.1 风险识别

| 风险         | 概率 | 影响 | 缓解措施                     |
| ------------ | ---- | ---- | ---------------------------- |
| 导入路径错误 | 高   | 中   | 使用自动化脚本批量替换       |
| 构建失败     | 中   | 高   | 分阶段验证，每阶段后编译测试 |
| 测试失败     | 中   | 中   | 保留原测试，逐步迁移         |
| 运行时错误   | 低   | 高   | 在开发环境充分测试后再部署   |

### 4.2 回滚计划

```bash
# 如果重构失败，可以快速回滚
git checkout .
git clean -fd
pnpm install
pnpm build
```

## 五、验收标准

### 5.1 功能验收

- [ ] `@oksai/multi-tenancy` 包编译成功
- [ ] `@oksai/iam-tenancy` 包编译成功
- [ ] Gateway 编译成功
- [ ] Gateway 启动成功
- [ ] 租户识别功能正常
- [ ] 租户数据隔离功能正常
- [ ] 租户管理 API 正常

### 5.2 架构验收

- [ ] 多租户机制和租户管理完全分离
- [ ] `@oksai/multi-tenancy` 不包含业务逻辑
- [ ] `@oksai/iam-tenancy` 遵循 DDD + 六边形架构
- [ ] 依赖关系清晰合理
- [ ] 代码结构符合设计

### 5.3 测试验收

- [ ] 所有单元测试通过
- [ ] 所有集成测试通过
- [ ] Lint 检查通过
- [ ] TypeScript 类型检查通过

### 5.4 文档验收

- [ ] README 文档完整
- [ ] 架构设计文档更新
- [ ] API 文档更新
- [ ] AGENTS.md 更新

## 六、时间估算

| 阶段     | 任务                  | 预估时间   |
| -------- | --------------------- | ---------- |
| 1        | 创建 multi-tenancy 包 | 1.5 小时   |
| 2        | 重命名和清理 tenancy  | 1 小时     |
| 3        | 更新 Gateway 依赖     | 1 小时     |
| 4        | 清理和测试            | 1 小时     |
| 5        | 文档和验收            | 0.5 小时   |
| **总计** |                       | **5 小时** |

**缓冲时间**: +1 小时
**总预估**: 6 小时

## 七、后续优化

### 7.1 短期（1-2 周）

1. **完善测试**: 为 `@oksai/multi-tenancy` 添加完整的单元测试
2. **性能优化**: 优化租户上下文的性能
3. **监控集成**: 添加租户相关的监控指标

### 7.2 中期（1-2 月）

1. **租户管理完善**: 实现完整的 Event Sourcing
2. **投影器优化**: 优化读模型的性能
3. **文档完善**: 编写详细的使用指南

### 7.3 长期（3-6 月）

1. **微服务准备**: 为拆分微服务做好准备
2. **多租户策略**: 支持数据库级别的租户隔离
3. **审计日志**: 完善租户操作的审计追踪

## 八、参考资料

- [NestJS Modules](https://docs.nestjs.com/modules)
- [Domain-Driven Design](https://martinfowler.com/bliki/DomainDrivenDesign.html)
- [Hexagonal Architecture](https://alistair.cockburn.us/hexagonal-architecture/)
- [CQRS Pattern](https://martinfowler.com/bliki/CQRS.html)
- [Event Sourcing](https://martinfowler.com/eaaDev/EventSourcing.html)

## 九、联系和支持

如有问题，请联系：

- 技术负责人: [待定]
- 架构师: [待定]

---

**最后更新**: 2026-03-09
