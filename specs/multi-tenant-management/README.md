# 多租户管理 Spec

## 📋 概述

本 spec 定义了完整的多租户（Multi-tenancy）隔离机制的实现，包括租户识别、自动数据隔离、权限检查和配额管理。

**评估日期**：2026-03-08  
**当前状态**：🔴 未开始  
**优先级**：P0（高优先级）  

## 🎯 目标

- ✅ 实现自动数据隔离，防止数据泄露
- ✅ 实现租户识别中间件
- ✅ 实现租户权限检查
- ✅ 实现配额管理系统
- ✅ 明确 Tenant vs Organization 关系
- ✅ 满足数据保护法规要求（GDPR）

## 📚 核心文档

| 文档 | 说明 | 必读 |
|------|------|:---:|
| [design.md](./design.md) | 技术设计（Source of Truth） | ✅ |
| [implementation.md](./implementation.md) | 实现进度跟踪 | ✅ |
| [AGENTS.md](./AGENTS.md) | AI 助手开发指南 | ✅ |
| [decisions.md](./decisions.md) | 架构决策记录（ADR） | ✅ |
| [testing.md](./testing.md) | 测试计划 | ⭕ |
| [workflow.md](./workflow.md) | 开发工作流程 | ⭕ |

## 🔍 当前评估

基于 `docs/evaluations/multi-tenant-evaluation.md` 的评估结果：

**整体成熟度**：⚠️ 40%（早期阶段）

### ✅ 已实现（40%）
- 租户上下文基础设施（90%）
- Tenant 实体基础（60%）
- Organization 管理（90%，基于 Better Auth）
- 数据模型支持（23%，3/13 实体有 tenantId）

### ❌ 缺失（60%）
- **自动化数据隔离**（0%）- 🔴 高风险
- **租户识别中间件**（0%）- 🔴 高风险
- **租户权限检查**（0%）- 🔴 高风险
- **Tenant-Org 关系混乱**（0%）- 🟡 中风险
- **配额管理**（0%）- 🟡 中风险

### 🔴 关键风险

1. **数据泄露风险**：缺少自动租户过滤，容易遗漏 `WHERE tenantId = ?`
2. **越权访问风险**：缺少租户级别权限检查，用户可能访问其他租户资源
3. **架构混乱**：Tenant 和 Organization 关系不明确
4. **配额无限制**：租户可以无限制使用资源

## 📅 实施计划

### Phase 0: 架构决策（1 天）

- [x] 创建 Spec 文档
- [ ] 明确 Tenant vs Organization 关系（ADR-001）
- [ ] 确定隔离策略（ADR-002）
- [ ] 设计租户识别策略（ADR-003）

### Phase 1: 基础隔离（Sprint 1 - 2 周）- 🔴 P0

**目标**：实现基本的数据隔离，防止数据泄露

- [ ] 增强 Tenant 实体（添加 slug、ownerId、quota 字段）
- [ ] 为所有实体添加 tenantId（10 个缺失实体）
- [ ] 实现 MikroORM 租户过滤器（TenantFilter）
- [ ] 实现租户中间件（TenantMiddleware）
- [ ] 实现租户守卫（TenantGuard）
- [ ] 编写集成测试（数据隔离测试）
- [ ] 数据库迁移脚本

### Phase 2: 租户管理（Sprint 2 - 2 周）- 🟡 P1

**目标**：完善租户管理功能

- [ ] 实现 TenantService（CRUD、激活、停用）
- [ ] 实现 TenantController（管理员 API）
- [ ] 实现配额检查装饰器（@CheckQuota）
- [ ] 实现配额守卫（QuotaGuard）
- [ ] Organization 添加 tenantId 关联
- [ ] 数据迁移脚本（Organization → Tenant）

### Phase 3: 增强功能（Sprint 3 - 1 周）- 🟢 P2

**目标**：增强租户功能

- [ ] 租户统计数据服务（TenantStatsService）
- [ ] 租户配置管理（TenantSettingsService）
- [ ] 租户域名识别（子域名、自定义域名）
- [ ] 管理员后台 UI（租户管理页面）
- [ ] 租户使用情况 UI（配额卡片）
- [ ] 文档完善（API 文档、使用指南）

## 🚀 快速开始

### 开始开发

1. **阅读设计文档**：
   ```bash
   # 技术设计
   cat specs/multi-tenant-management/design.md
   
   # 架构决策
   cat specs/multi-tenant-management/decisions.md
   ```

2. **查看当前进度**：
   ```bash
   cat specs/multi-tenant-management/implementation.md
   ```

3. **开始 TDD 开发**：
   ```bash
   # 启动测试监听
   pnpm vitest watch
   
   # 🔴 Red: 编写失败的测试
   # 🟢 Green: 编写最简实现
   # 🔵 Refactor: 优化代码
   ```

### 相关资源

- **评估报告**：`docs/evaluations/multi-tenant-evaluation.md`
- **架构指南**：`guidelines/archi/archi-06-multi-tenant.md`
- **租户上下文**：`libs/shared/context/src/lib/tenant-context.service.ts`
- **租户实体**：`libs/shared/database/src/entities/tenant.entity.ts`
- **组织管理**：`apps/gateway/src/auth/organization.service.ts`

## 📊 测试覆盖率目标

| 层级 | 目标 | 实际 | 状态 |
|------|:---:|:---:|:---:|
| 领域层 | >95% | -% | ⏳ |
| 应用层 | >90% | -% | ⏳ |
| 基础设施层 | >85% | -% | ⏳ |
| 总体 | >85% | -% | ⏳ |

## 🎓 参考资料

- [MikroORM Filters](https://mikro-orm.io/docs/filters)
- [NestJS Multi-tenancy](https://docs.nestjs.com/fundamentals/multi-tenancy)
- [Better Auth Organization Plugin](https://better-auth.com/docs/plugins/organization)
- [Multi-tenant Architecture Patterns](https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations)

## 📝 更新日志

### 2026-03-08 - Spec 创建
- 基于 `docs/evaluations/multi-tenant-evaluation.md` 创建此 spec
- 定义技术设计和实施计划
- 编写 3 个架构决策记录（ADR-001/002/003）
- 设置 BDD 场景和测试计划

## 🧩 @oksai/domain-core 集成

本功能**必须**充分利用 `@oksai/domain-core` 提供的 DDD 基础设施：

| Kernel 类 | 使用场景 | 优势 |
|----------|---------|------|
| **AggregateRoot** | Tenant 聚合根 | ✅ 自动管理领域事件 |
| **ValueObject** | TenantQuota, TenantPlan, TenantStatus | ✅ 不可变性、值对象相等性 |
| **Result** | 工厂方法返回值 | ✅ 函数式错误处理 |
| **Guard** | 参数验证 | ✅ 组合验证、清晰错误 |
| **DomainEvent** | 领域事件 | ✅ 类型安全、事件溯源 |

**详细指南**：[docs/kernel-integration.md](./docs/kernel-integration.md)

### 重构示例

#### ❌ 当前实现（不推荐）

```typescript
// 继承 MikroORM BaseEntity，自己管理事件
@Entity()
export class Tenant extends BaseEntity {
  private _domainEvents: DomainEvent[] = [];
  
  activate(): void {
    if (this.status !== 'pending') {
      throw new Error('只有待审核的租户才能激活'); // ❌ 抛出异常
    }
    this.status = 'active';
    this._domainEvents.push(new TenantActivatedEvent(...)); // ❌ 手动管理
  }
}
```

#### ✅ 推荐实现（使用 kernel）

```typescript
// 继承 AggregateRoot，自动管理事件
export class Tenant extends AggregateRoot<TenantProps> {
  // ✅ 返回 Result，避免异常
  activate(): Result<void, Error> {
    if (!this.props.status.isPending()) {
      return Result.fail(new Error('只有待审核的租户才能激活'));
    }
    
    this.props.status = TenantStatus.active();
    this.addDomainEvent(new TenantActivatedEvent(...)); // ✅ 自动管理
    
    return Result.ok(undefined);
  }
  
  // ✅ 使用 Guard 验证参数
  static create(props: {...}): Result<Tenant, Error> {
    const guardResult = Guard.combine([
      Guard.againstEmpty('name', props.name),
      Guard.againstEmpty('slug', props.slug),
    ]);
    
    if (guardResult.isFail()) {
      return Result.fail(new Error(guardResult.error[0].message));
    }
    
    const tenant = new Tenant({...});
    tenant.addDomainEvent(new TenantCreatedEvent(...));
    
    return Result.ok(tenant);
  }
}
```

### 核心值对象

```typescript
// ✅ TenantQuota 值对象（不可变）
export class TenantQuota extends ValueObject<TenantQuotaProps> {
  isWithinLimit(resource: string, currentUsage: number): boolean {
    return currentUsage < this.props.maxMembers;
  }
  
  // 返回新实例（不可变）
  increase(resource: string, amount: number): TenantQuota {
    return new TenantQuota({...this.props, maxMembers: this.props.maxMembers + amount});
  }
}

// ✅ TenantStatus 值对象（类型安全）
export class TenantStatus extends ValueObject<{value: string}> {
  isPending(): boolean { return this.props.value === 'PENDING'; }
  isActive(): boolean { return this.props.value === 'ACTIVE'; }
  
  static pending(): TenantStatus { return new TenantStatus({value: 'PENDING'}); }
  static active(): TenantStatus { return new TenantStatus({value: 'ACTIVE'}); }
}
```

**完整示例**：[docs/kernel-integration.md](./docs/kernel-integration.md)
