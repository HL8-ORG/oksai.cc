# 多租户管理 - 下一步行动

## 📅 Phase 0: 架构决策与 Kernel 集成（2 天）

### 第 1 天：架构决策

#### 上午（2 小时）

1. **阅读评估报告**：
   ```bash
   cat docs/evaluations/multi-tenant-evaluation.md
   ```

2. **确认架构决策**：
   - ✅ ADR-001: Tenant 包含多个 Organization
   - ✅ ADR-002: 行级隔离策略
   - ✅ ADR-003: JWT Token 优先识别
   - 详细决策：`specs/multi-tenant-management/decisions.md`

3. **理解现有实现**：
   ```bash
   # 租户实体（需要重构）
   cat libs/shared/database/src/entities/tenant.entity.ts
   
   # 租户上下文（已实现）
   cat libs/shared/context/src/lib/tenant-context.service.ts
   
   # 组织管理（Better Auth）
   cat apps/gateway/src/auth/organization.service.ts
   ```

#### 下午（3 小时）

4. **学习 @oksai/kernel**：
   ```bash
   # 阅读 kernel 源码
   cat libs/shared/kernel/src/index.ts
   cat libs/shared/kernel/src/lib/aggregate-root.aggregate.ts
   cat libs/shared/kernel/src/lib/value-object.vo.ts
   cat libs/shared/kernel/src/lib/result.ts
   cat libs/shared/kernel/src/lib/guard.ts
   ```

5. **阅读集成指南**：
   ```bash
   cat specs/multi-tenant-management/docs/kernel-integration.md
   ```

6. **运行现有测试**：
   ```bash
   # 测试 kernel
   pnpm vitest run libs/shared/kernel/src/spec
   
   # 测试现有租户代码
   pnpm vitest run libs/shared/database/src/entities/tenant.entity.spec.ts
   ```

### 第 2 天：领域层实现

#### 上午（3 小时）- 创建值对象

1. **创建 TenantPlan 值对象**：
   ```bash
   touch libs/shared/database/src/domain/tenant/tenant-plan.vo.ts
   touch libs/shared/database/src/domain/tenant/tenant-plan.vo.spec.ts
   ```
   
   实现：
   - ✅ 继承 `ValueObject<{value: TenantPlanValue}>`
   - ✅ 工厂方法：`free()`, `starter()`, `pro()`, `enterprise()`
   - ✅ 业务方法：`supportsFeature()`, `isHigherThan()`
   - ✅ 参数验证：使用 `Guard`

2. **创建 TenantStatus 值对象**：
   ```bash
   touch libs/shared/database/src/domain/tenant/tenant-status.vo.ts
   touch libs/shared/database/src/domain/tenant/tenant-status.vo.spec.ts
   ```
   
   实现：
   - ✅ 继承 `ValueObject<{value: TenantStatusValue}>`
   - ✅ 状态检查：`isPending()`, `isActive()`, `isSuspended()`
   - ✅ 状态转换：`canBeActivated()`, `canBeSuspended()`

3. **创建 TenantQuota 值对象**：
   ```bash
   touch libs/shared/database/src/domain/tenant/tenant-quota.vo.ts
   touch libs/shared/database/src/domain/tenant/tenant-quota.vo.spec.ts
   ```
   
   实现：
   - ✅ 继承 `ValueObject<TenantQuotaProps>`
   - ✅ 配额检查：`isWithinLimit()`
   - ✅ 配额操作：`increase()`, `decrease()`
   - ✅ 工厂方法：`createForPlan()`

#### 下午（4 小时）- 重构 Tenant 聚合根

4. **创建新的 Tenant 聚合根**（使用 AggregateRoot）：
   ```bash
   # 创建新文件
   mkdir -p libs/shared/database/src/domain/tenant
   touch libs/shared/database/src/domain/tenant/tenant.aggregate.ts
   touch libs/shared/database/src/domain/tenant/tenant.aggregate.spec.ts
   ```
   
   实现：
   - ✅ 继承 `AggregateRoot<TenantProps>`
   - ✅ 私有构造函数
   - ✅ Getter 方法
   - ✅ 业务方法：
     - `activate(): Result<void, Error>`
     - `suspend(reason: string): Result<void, Error>`
     - `checkQuota(): boolean`
     - `updateQuota(): Result<void, Error>`
   - ✅ 工厂方法：
     - `create(): Result<Tenant, Error>`
     - `reconstitute(): Tenant`

5. **创建领域事件**：
   ```bash
   mkdir -p libs/shared/database/src/domain/events
   touch libs/shared/database/src/domain/events/tenant-created.event.ts
   touch libs/shared/database/src/domain/events/tenant-activated.event.ts
   touch libs/shared/database/src/domain/events/tenant-suspended.event.ts
   touch libs/shared/database/src/domain/events/tenant-quota-updated.event.ts
   ```
   
   实现：
   - ✅ 继承 `DomainEvent<Payload>`
   - ✅ 定义事件名称、版本
   - ✅ 类型安全的负载

6. **编写测试**：
   ```bash
   pnpm vitest watch libs/shared/database/src/domain/tenant
   ```
   
   测试覆盖：
   - ✅ 创建租户（成功/失败）
   - ✅ 激活租户（状态转换）
   - ✅ 配额检查
   - ✅ 领域事件生成
   - ✅ Guard 验证

## 📅 Phase 1: 基础隔离（Sprint 1 - 2 周）

### Week 1

#### Day 3-4: 数据库设计

1. **创建迁移脚本**：
   ```bash
   # 增强 tenant 表
   pnpm mikro-orm migration:create
   
   # 为所有实体添加 tenantId
   pnpm mikro-orm migration:create
   ```

2. **迁移内容**：
   - ✅ `tenant` 表添加字段：`slug`, `owner_id`, `max_organizations`, `max_members`, `max_storage`, `settings`, `metadata`
   - ✅ 10 个缺失实体添加 `tenant_id` 列
   - ✅ 创建索引

#### Day 5-7: 基础设施层

1. **实现 TenantFilter**（MikroORM）：
   ```bash
   touch libs/shared/database/src/filters/tenant.filter.ts
   touch libs/shared/database/src/filters/tenant.filter.spec.ts
   ```

2. **实现 TenantMiddleware**（NestJS）：
   ```bash
   touch apps/gateway/src/tenant/tenant.middleware.ts
   touch apps/gateway/src/tenant/tenant.middleware.spec.ts
   ```

3. **实现 TenantGuard**（NestJS）：
   ```bash
   touch apps/gateway/src/tenant/tenant.guard.ts
   touch apps/gateway/src/tenant/tenant.guard.spec.ts
   ```

### Week 2

#### Day 8-10: 集成与测试

1. **集成测试**：
   ```bash
   touch apps/gateway/src/tenant/tenant.isolation.spec.ts
   ```
   
   测试场景：
   - ✅ 租户 A 无法访问租户 B 的数据
   - ✅ 租户切换不影响数据隔离
   - ✅ 超级管理员可以跨租户操作

2. **端到端测试**：
   ```bash
   touch apps/gateway/src/tenant/tenant.e2e-spec.ts
   ```

#### Day 11-14: 应用层

1. **实现 TenantService**：
   ```bash
   touch apps/gateway/src/tenant/tenant.service.ts
   touch apps/gateway/src/tenant/tenant.service.spec.ts
   ```

2. **实现 TenantController**：
   ```bash
   touch apps/gateway/src/tenant/tenant.controller.ts
   touch apps/gateway/src/tenant/tenant.controller.spec.ts
   ```

## 🎯 立即执行

### 现在就开始

```bash
# 1. 阅读评估报告
cat docs/evaluations/multi-tenant-evaluation.md

# 2. 阅读技术设计
cat specs/multi-tenant-management/design.md

# 3. 阅读架构决策
cat specs/multi-tenant-management/decisions.md

# 4. 阅读 kernel 集成指南
cat specs/multi-tenant-management/docs/kernel-integration.md

# 5. 开始编写第一个值对象
code libs/shared/database/src/domain/tenant/tenant-plan.vo.ts
```

### 开发环境

```bash
# 启动测试监听
pnpm vitest watch

# 启动开发服务器
pnpm dev

# 运行 lint
pnpm lint

# 运行格式化
pnpm format
```

## ✅ 验收标准

### Phase 0 完成标准

- [ ] 阅读 `docs/evaluations/multi-tenant-evaluation.md`
- [ ] 理解 3 个架构决策（ADR-001/002/003）
- [ ] 理解 `@oksai/kernel` 核心类
- [ ] 创建 `TenantPlan` 值对象 + 测试
- [ ] 创建 `TenantStatus` 值对象 + 测试
- [ ] 创建 `TenantQuota` 值对象 + 测试
- [ ] 重构 `Tenant` 聚合根 + 测试
- [ ] 创建 4 个领域事件
- [ ] 测试覆盖率 > 95%

### Phase 1 完成标准

- [ ] 数据库迁移脚本（tenant 表增强 + 10 个实体添加 tenantId）
- [ ] `TenantFilter` 实现 + 测试
- [ ] `TenantMiddleware` 实现 + 测试
- [ ] `TenantGuard` 实现 + 测试
- [ ] 数据隔离集成测试通过
- [ ] `TenantService` 实现 + 测试
- [ ] `TenantController` 实现 + 测试
- [ ] E2E 测试通过
- [ ] 总体测试覆盖率 > 85%

## 📚 参考资料

### 项目内文档

- [技术设计](./design.md)
- [实现进度](./implementation.md)
- [架构决策](./decisions.md)
- [Kernel 集成](./docs/kernel-integration.md)
- [AI 助手指南](./AGENTS.md)

### 外部资源

- [MikroORM Filters](https://mikro-orm.io/docs/filters)
- [NestJS Multi-tenancy](https://docs.nestjs.com/fundamentals/multi-tenancy)
- [Better Auth Organization Plugin](https://better-auth.com/docs/plugins/organization)
- [DDD - Domain Events](https://martinfowler.com/eaaDev/DomainEvent.html)
- [DDD - Value Object](https://martinfowler.com/bliki/ValueObject.html)
- [DDD - Aggregate Root](https://martinfowler.com/bliki/DDD_Aggregate.html)

## 🚀 开始开发

```bash
# 打开 VS Code
code .

# 打开技术设计
code specs/multi-tenant-management/design.md

# 打开 kernel 集成指南
code specs/multi-tenant-management/docs/kernel-integration.md

# 开始编码！
```

**祝开发顺利！** 🎉
