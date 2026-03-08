# @oksai/database 重构方案 A：完全分离

**日期**: 2026-03-09  
**方案**: 方案 A - 完全分离（推荐）  
**状态**: 进行中

## 一、重构目标

将 `@oksai/database` 从"大而全"的包拆分为职责清晰的领域包：

1. **@oksai/database** - 纯数据库连接管理（~200行）
2. **@oksai/iam/domain** - IAM 领域模型（聚合、值对象、领域事件、仓储接口）
3. **@oksai/iam/infrastructure** - IAM 基础设施层（实体、仓储实现、映射器、过滤器）
4. **保留现有 OAuth 和 Webhook 实体** - 后续可继续拆分

## 二、当前结构分析

### 2.1 @oksai/database 当前内容

```
libs/shared/database/src/
├── domain/                      # ❌ 迁移到 @oksai/iam/domain
│   ├── tenant/                  # Tenant 聚合根 + 值对象 (1908 行)
│   └── events/                  # 领域事件
├── entities/                    # ⚠️ 需要拆分
│   ├── user.entity.ts           # → @oksai/iam/infrastructure
│   ├── tenant.entity.ts         # → @oksai/iam/infrastructure
│   ├── session.entity.ts        # → @oksai/iam/infrastructure
│   ├── account.entity.ts        # → @oksai/iam/infrastructure
│   ├── api-key.entity.ts        # → @oksai/iam/infrastructure
│   ├── domain-event.entity.ts   # → @oksai/iam/infrastructure
│   ├── oauth-*.entity.ts (4)    # → @oksai/oauth/infrastructure (后续)
│   └── webhook*.entity.ts (2)   # → @oksai/webhook/infrastructure (后续)
├── events/                      # ❌ 迁移到 @oksai/iam/domain
├── filters/                     # ❌ 迁移到 @oksai/iam/infrastructure
│   └── tenant.filter.ts
├── migrations/                  # ✅ 保留或按领域拆分
├── mikro-orm.config.ts          # ✅ 保留
└── mikro-orm.module.ts          # ✅ 保留
```

### 2.2 职责分布

| 组件                         | 行数  | 迁移目标                      |
| ---------------------------- | ----- | ----------------------------- |
| Domain Models (Tenant + VOs) | ~1908 | @oksai/iam/domain             |
| IAM Entities (6个)           | ~800  | @oksai/iam/infrastructure     |
| OAuth Entities (4个)         | ~400  | @oksai/oauth/infrastructure   |
| Webhook Entities (2个)       | ~200  | @oksai/webhook/infrastructure |
| Tenant Filter                | ~50   | @oksai/iam/infrastructure     |
| Migrations                   | ~200  | 保留或按领域拆分              |
| Database Config + Module     | ~100  | 保留在 @oksai/database        |

## 三、新包结构

### 3.1 @oksai/iam/domain

```
libs/iam/domain/
├── package.json                 # @oksai/iam/domain
├── tsconfig.json
├── tsconfig.build.json
├── src/
│   ├── index.ts                 # 导出所有领域模型
│   ├── tenant/                  # Tenant 聚合
│   │   ├── tenant.aggregate.ts
│   │   ├── tenant.repository.ts # 仓储接口
│   │   ├── tenant-plan.vo.ts
│   │   ├── tenant-quota.vo.ts
│   │   └── tenant-status.vo.ts
│   ├── user/                    # User 聚合（未来）
│   └── events/                  # 领域事件
│       ├── tenant-created.event.ts
│       ├── tenant-activated.event.ts
│       ├── tenant-suspended.event.ts
│       └── tenant-quota-updated.event.ts
└── dist/
```

**依赖**:

- `@oksai/kernel` (Result, Entity, DomainEvent)
- TypeScript-only (无 NestJS, 无 MikroORM)

### 3.2 @oksai/iam/infrastructure

```
libs/iam/infrastructure/
├── package.json                 # @oksai/iam/infrastructure
├── tsconfig.json
├── tsconfig.build.json
├── src/
│   ├── index.ts
│   ├── entities/                # MikroORM 实体
│   │   ├── user.entity.ts
│   │   ├── tenant.entity.ts
│   │   ├── session.entity.ts
│   │   ├── account.entity.ts
│   │   ├── api-key.entity.ts
│   │   └── domain-event.entity.ts
│   ├── repositories/            # 仓储实现
│   │   └── tenant.repository.impl.ts
│   ├── mappers/                 # 领域模型映射器
│   │   └── tenant.mapper.ts
│   ├── filters/                 # MikroORM 过滤器
│   │   └── tenant.filter.ts
│   └── migrations/              # IAM 相关迁移（可选）
└── dist/
```

**依赖**:

- `@oksai/iam/domain` (仓储接口、领域模型)
- `@mikro-orm/core`
- `@nestjs/common`

### 3.3 @oksai/database (精简后)

```
libs/shared/database/
├── package.json                 # @oksai/database
├── tsconfig.json
├── tsconfig.build.json
├── src/
│   ├── index.ts
│   ├── mikro-orm.config.ts      # 数据库连接配置
│   ├── mikro-orm.module.ts      # NestJS 模块
│   ├── migrations/              # 全局迁移（可选）
│   └── entities/                # 暂时保留 OAuth + Webhook
│       ├── oauth-*.entity.ts
│       └── webhook*.entity.ts
└── dist/
```

**依赖**:

- `@mikro-orm/core`
- `@nestjs/common`
- `@oksai/iam/infrastructure` (引用 IAM 实体)

## 四、迁移步骤

### Phase 1: 创建新包结构 (30分钟)

1. ✅ 创建 `libs/iam/domain/` 目录结构
2. ✅ 创建 `libs/iam/infrastructure/` 目录结构
3. ✅ 配置 package.json 和 tsconfig
4. ✅ 更新 pnpm-workspace.yaml（已包含）

### Phase 2: 迁移领域模型 (30分钟)

1. ✅ 复制 `domain/tenant/` → `libs/iam/domain/src/tenant/`
2. ✅ 复制 `domain/events/` → `libs/iam/domain/src/events/`
3. ✅ 创建 `tenant.repository.ts` 接口
4. ✅ 更新 import 路径
5. ✅ 构建测试

### Phase 3: 迁移基础设施 (30分钟)

1. ✅ 复制 IAM 实体到 `libs/iam/infrastructure/src/entities/`
2. ✅ 复制 tenant filter 到 `libs/iam/infrastructure/src/filters/`
3. ✅ 创建 TenantMapper 和 TenantRepositoryImpl
4. ✅ 更新 import 路径
5. ✅ 构建测试

### Phase 4: 精简 @oksai/database (20分钟)

1. ✅ 删除已迁移的 domain/ 目录
2. ✅ 删除已迁移的 entities/
3. ✅ 更新 index.ts 导出
4. ✅ 添加对 @oksai/iam/infrastructure 的依赖
5. ✅ 构建测试

### Phase 5: 更新依赖和测试 (20分钟)

1. ✅ 更新 apps/gateway 的依赖
2. ✅ 更新所有 import 路径
3. ✅ 运行构建测试
4. ✅ 运行单元测试
5. ✅ 启动开发服务器验证

## 五、影响范围

### 5.1 需要更新 import 的文件

```bash
# 查找所有从 @oksai/database 导入的文件
grep -r "from '@oksai/database'" apps/ libs/ --include="*.ts"
```

### 5.2 依赖关系变化

**之前**:

```
apps/gateway → @oksai/database (包含所有)
```

**之后**:

```
apps/gateway → @oksai/database (连接管理)
           → @oksai/iam/domain (领域模型)
           → @oksai/iam/infrastructure (实体、仓储)
```

## 六、验收标准

- [ ] 所有包独立构建成功
- [ ] 所有单元测试通过
- [ ] Gateway 应用启动成功
- [ ] 多租户功能正常（E2E 测试通过）
- [ ] 无循环依赖
- [ ] TypeScript 类型检查通过

## 七、回滚计划

如果重构失败，可以通过 git 回退：

```bash
git checkout -- libs/iam/domain libs/iam/infrastructure libs/shared/database
git checkout -- apps/gateway/src/**\*.ts
pnpm install
pnpm build
```

## 八、后续优化

1. **OAuth 领域拆分**: 创建 `@oksai/oauth/domain` 和 `@oksai/oauth/infrastructure`
2. **Webhook 领域拆分**: 创建 `@oksai/webhook/domain` 和 `@oksai/webhook/infrastructure`
3. **迁移文件拆分**: 按领域组织迁移文件
4. **仓储模式完善**: 为 User, Session 等创建完整仓储

## 九、参考资料

- [DDD 分层架构](https://www.domainlanguage.com/)
- [MikroORM 最佳实践](https://mikro-orm.io/docs/guide/)
- [NestJS 模块化设计](https://docs.nestjs.com/modules)
- 项目宪章: `AGENTS.md`
