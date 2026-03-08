# @oksai/iam - Identity and Access Management

身份和访问管理模块，采用领域驱动设计（DDD）分层架构。

## 包结构

```
libs/iam/
├── domain/                    # 领域层（纯 TypeScript，无框架依赖）
│   ├── src/
│   │   ├── tenant/           # Tenant 聚合根和值对象
│   │   │   ├── tenant.aggregate.ts
│   │   │   ├── tenant.repository.ts  # 仓储接口
│   │   │   ├── tenant-plan.vo.ts
│   │   │   ├── tenant-quota.vo.ts
│   │   │   └── tenant-status.vo.ts
│   │   ├── events/           # 领域事件
│   │   └── index.ts
│   └── package.json          # @oksai/iam/domain
│
├── infrastructure/            # 基础设施层（MikroORM + NestJS）
│   ├── src/
│   │   ├── entities/         # MikroORM 实体
│   │   ├── repositories/     # 仓储实现（待添加）
│   │   ├── mappers/          # 领域模型映射器（待添加）
│   │   ├── filters/          # MikroORM 过滤器
│   │   └── index.ts
│   └── package.json          # @oksai/iam/infrastructure
│
├── better-auth-mikro-orm/    # Better Auth MikroORM 适配器
├── nestjs-better-auth/       # Better Auth NestJS 模块
└── package.json              # @oksai/iam (父包)
```

## 设计原则

### 1. 领域层（domain）

- **职责**：定义业务规则和领域模型
- **依赖**：仅依赖 `@oksai/kernel`（Result, Entity, ValueObject 等）
- **特点**：
  - 纯 TypeScript，无框架依赖
  - 包含聚合根、值对象、领域事件、仓储接口
  - 高度可测试

### 2. 基础设施层（infrastructure）

- **职责**：实现领域层的持久化和外部集成
- **依赖**：`@oksai/iam/domain`, `@mikro-orm/core`, `@nestjs/common`
- **特点**：
  - 包含 MikroORM 实体、仓储实现、映射器
  - 实现领域接口，处理数据库操作
  - 与 NestJS 集成

## 使用示例

### 领域层（业务逻辑）

```typescript
import { Tenant } from '@oksai/iam/domain';
import { TenantPlan } from '@oksai/iam/domain';

// 创建租户
const result = Tenant.create({
  name: 'Acme Corp',
  slug: 'acme-corp',
  ownerId: 'user-123',
  plan: TenantPlan.pro(),
});

if (result.isSuccess()) {
  const tenant = result.value;

  // 激活租户
  tenant.activate();

  // 获取领域事件
  const events = tenant.domainEvents;
}
```

### 基础设施层（持久化）

```typescript
import { Tenant as TenantEntity } from '@oksai/iam/infrastructure';
import { EntityManager } from '@mikro-orm/core';

// 在 NestJS Service 中使用
async function saveTenant(tenant: Tenant, em: EntityManager) {
  const entity = new TenantEntity();
  entity.id = tenant.id;
  entity.name = tenant.name;
  // ...映射其他字段

  em.persist(entity);
  await em.flush();
}
```

## 架构决策记录

### 为什么分离 domain 和 infrastructure？

1. **关注点分离**：业务逻辑与技术实现解耦
2. **可测试性**：领域模型可独立测试，无需数据库
3. **可维护性**：修改持久化实现不影响业务规则
4. **可扩展性**：未来可支持多种持久化方案

### 为什么不把所有代码放在一个包里？

1. **依赖隔离**：领域层不需要 MikroORM 依赖
2. **编译优化**：独立的包可独立编译和缓存
3. **团队协作**：不同团队可独立开发领域和基础设施
4. **符合 DDD**：遵循领域驱动设计的分层原则

## 迁移进度

- [x] 创建 `@oksai/iam/domain` 包结构
- [x] 迁移 Tenant 聚合和值对象
- [x] 创建 `@oksai/iam/infrastructure` 包结构
- [x] 迁移 IAM 实体
- [ ] 实现 TenantRepository
- [ ] 实现 TenantMapper
- [ ] 精简 `@oksai/database`
- [ ] 更新 gateway 依赖
- [ ] 运行测试验证

## 相关文档

- [重构计划](../../docs/refactoring/database-refactoring-plan-a.md)
- [DDD 分层架构](https://www.domainlanguage.com/)
- [项目宪章](../../AGENTS.md)
