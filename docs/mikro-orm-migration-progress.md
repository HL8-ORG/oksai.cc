# MikroORM 迁移进度 - Phase 1 基础设施

**更新日期**: 2026-03-05  
**执行阶段**: Phase 1 - 基础设施（Week 1-3）**✅ 已完成**

---

## 📊 完成进度

### ✅ Phase 1 Week 1: 核心集成（已完成）

#### 1. MikroORM 依赖安装
- ✅ 安装核心包：`@mikro-orm/core`, `@mikro-orm/postgresql`, `@mikro-orm/reflection`
- ✅ 安装 NestJS 集成：`@mikro-orm/nestjs`
- ✅ 安装 CLI 工具：`@mikro-orm/cli`, `@mikro-orm/migrations`

#### 2. MikroORM 配置
- ✅ 创建配置文件：`libs/database/src/mikro-orm.config.ts`
- ✅ 配置 PostgreSQL 连接
- ✅ 配置实体路径
- ✅ 配置迁移工具

#### 3. BaseEntity 定义
- ✅ 创建 `libs/database/src/entities/base.entity.ts`
- ✅ 包含 id (UUID), createdAt, updatedAt 字段
- ✅ 使用 MikroORM 装饰器

#### 4. NestJS 模块
- ✅ 创建 `libs/database/src/mikro-orm.module.ts`
- ✅ 配置 autoLoadEntities
- ✅ 配置 registerRequestContext

#### 5. 示例 Entity - Tenant
- ✅ 创建 `libs/database/src/entities/tenant.entity.ts`
- ✅ 继承 BaseEntity
- ✅ 实现领域事件收集（混入 AggregateRoot 功能）
- ✅ 添加生命周期钩子（@BeforeCreate, @AfterUpdate）
- ✅ 实现业务方法（activate）
- ✅ 创建相关领域事件：TenantCreatedEvent, TenantUpdatedEvent, TenantActivatedEvent

---

### ✅ Phase 1 Week 2: Event Store 实现（已完成）

#### 1. DomainEventEntity
- ✅ 创建 `libs/database/src/entities/domain-event.entity.ts`
- ✅ 定义事件存储结构
- ✅ 添加索引优化（aggregateId, eventType）
- ✅ 支持 JSON 负载和元数据

#### 2. Event Store 库
- ✅ 创建新库：`@oksai/event-store`
- ✅ 定义 DomainEvent 接口
- ✅ 定义 EventStore 接口（append, load, loadFromVersion）
- ✅ 实现 MikroOrmEventStore 类
- ✅ 使用 MikroORM EntityManager 进行数据库操作

#### 3. Repository 基类
- ✅ 创建新库：`@oksai/repository`
- ✅ 实现 EventSourcedRepository 基类
- ✅ 提供 save 方法（自动持久化实体和事件）
- ✅ 提供 findById 方法
- ✅ 集成 Event Store

---

### ✅ Phase 1 Week 3: 测试框架（已完成）

#### 1. Testing 库创建
- ✅ 创建新库：`@oksai/testing`
- ✅ 配置 Vitest 测试框架
- ✅ 配置 NestJS 测试环境

#### 2. RepositoryTestBase 基类
- ✅ 创建 `libs/testing/src/repository-test.base.ts`
- ✅ 提供 setup 方法（初始化数据库和 Schema）
- ✅ 提供 teardown 方法（清理数据库和连接）
- ✅ 提供 clearDatabase 方法（清空数据）
- ✅ 提供 em getter（访问 EntityManager）

#### 3. 单元测试
- ✅ 创建 Tenant Entity 单元测试
  - ✅ 测试创建租户和事件生成
  - ✅ 测试激活租户功能
  - ✅ 测试聚合根功能
- ✅ 创建 Event Store 类型测试
  - ✅ 测试事件结构定义
  - ✅ 测试 metadata 可选字段

---

### 📦 新增库结构

```
libs/
├── database/
│   ├── src/
│   │   ├── entities/
│   │   │   ├── base.entity.ts           # BaseEntity 基类
│   │   │   ├── tenant.entity.ts         # 租户实体
│   │   │   ├── domain-event.entity.ts   # 领域事件实体
│   │   │   ├── tenant.entity.spec.ts    # 租户实体测试
│   │   │   └── index.ts
│   │   ├── events/
│   │   │   ├── tenant.events.ts         # 租户相关事件
│   │   │   └── index.ts
│   │   ├── mikro-orm.config.ts          # MikroORM 配置
│   │   ├── mikro-orm.module.ts          # NestJS 模块
│   │   └── index.ts
│   ├── package.json
│   └── tsconfig.json
│
├── testing/
│   ├── src/
│   │   ├── repository-test.base.ts      # 测试基类
│   │   └── index.ts
│   ├── package.json
│   ├── tsconfig.json
│   └── vitest.config.ts
│
└── shared/
    ├── event-store/
    │   ├── src/
    │   │   ├── types.ts                    # 类型定义
    │   │   ├── types.spec.ts               # 类型测试
    │   │   ├── mikro-orm-event-store.ts    # Event Store 实现
    │   │   └── index.ts
    │   ├── package.json
    │   └── tsconfig.json
    │
    └── repository/
        ├── src/
        │   ├── event-sourced.repository.ts  # Repository 基类
        │   └── index.ts
        ├── package.json
        └── tsconfig.json
```

---

## 🔧 配置更新

### 1. tsconfig.base.json
已添加新库的 paths 映射：
```json
"@oksai/event-store": ["libs/shared/event-store/src/index.ts"],
"@oksai/repository": ["libs/shared/repository/src/index.ts"]
```

### 2. libs/database/package.json
已添加依赖：
```json
{
  "dependencies": {
    "@mikro-orm/core": "catalog:",
    "@mikro-orm/nestjs": "^6.1.1",
    "@mikro-orm/postgresql": "^6.6.8",
    "@nestjs/common": "catalog:",
    "@oksai/kernel": "workspace:*"
  }
}
```

### 3. TypeScript 配置优化
所有新库使用统一的配置模式：
- extends `tsconfig.base.json`
- 启用装饰器支持
- 配置 composite 和 references

---

## 📈 代码统计

| 模块 | 文件数 | 代码行数 | 说明 |
|:---|:---:|:---:|:---|
| database/entities | 4 | ~180 | BaseEntity, Tenant, DomainEventEntity + 测试 |
| database/events | 1 | ~70 | 租户领域事件定义 |
| event-store | 3 | ~150 | 类型定义、实现和测试 |
| repository | 1 | ~50 | Repository 基类 |
| testing | 1 | ~50 | 测试基类 |
| **总计** | **10** | **~500** | **Phase 1 完整代码** |

---

## ✨ 核心特性

### 1. 自动事件管理
```typescript
// Entity 自动收集领域事件
@Entity()
export class Tenant extends BaseEntity {
  @BeforeCreate()
  beforeCreate() {
    this.addDomainEvent(new TenantCreatedEvent(...));
  }
}
```

### 2. Unit of Work
```typescript
// MikroORM 自动管理事务
const tenant = em.create(Tenant, { name: 'Test', plan: 'basic' });
await em.flush(); // 自动提交事务
```

### 3. Event Sourcing 支持
```typescript
// Repository 自动持久化事件
await repository.save(tenant);
// 自动保存：实体 + 领域事件
```

---

## ⚠️ 待解决问题

### 1. TypeScript 编译警告
- [ ] 修复 ESM imports 文件扩展名问题
- [ ] 修复 rootDir 跨目录引用问题
- [ ] 解决 `The inferred type of 'default' cannot be named` 警告

### 2. 配置优化
- [ ] 配置 MikroORM CLI 命令到根 package.json
- [ ] 创建数据库迁移脚本
- [ ] 配置测试数据库

---

## 🎯 下一步计划

### Phase 2: 试点迁移（OAuth 2.0 领域）**待开始**
- [ ] 创建 OAuth Client Entity (MikroORM)
- [ ] 创建 OAuth Authorization Code Entity (MikroORM)
- [ ] 创建 OAuth Access Token Entity (MikroORM)
- [ ] 迁移 OAuth Service 层
- [ ] 迁移 OAuth Repository 层
- [ ] 编写集成测试
- [ ] 对比性能（Drizzle vs MikroORM）

### Phase 3: 扩展迁移
- [ ] 用户认证领域迁移
- [ ] 租户管理领域迁移
- [ ] Webhook 领域迁移
- [ ] 移除 Drizzle 依赖

---

## 📚 参考文档

- [MikroORM 官方文档](https://mikro-orm.io/)
- [MikroORM NestJS 集成](https://mikro-orm.io/docs/nestjs)
- [MikroORM DDD 实践](https://mikro-orm.io/docs/ddd)
- [迁移计划详情](./mikro-orm-migration-plan.md)

---

## 💡 经验总结

### 1. Entity 设计
- ✅ 使用 MikroORM 装饰器定义实体
- ✅ 混入 AggregateRoot 功能（而非继承）以避免与 BaseEntity 冲突
- ✅ 使用生命周期钩子自动收集事件

### 2. 架构设计
- ✅ 分离关注点：Entity（数据库层）、Event（领域层）、Repository（持久化层）
- ✅ 使用 TypeScript project references 管理依赖
- ✅ 使用 workspace 协议管理 monorepo 内部依赖

### 3. 配置管理
- ✅ 统一 TypeScript 配置（extends base）
- ✅ 统一 package.json 依赖版本（使用 catalog）
- ✅ 配置文件与环境变量分离

---

**进度**: ✅ **Phase 1 完成（100%）**  
**完成时间**: 2026-03-05  
**下一步**: Phase 2 - OAuth 2.0 领域试点迁移
