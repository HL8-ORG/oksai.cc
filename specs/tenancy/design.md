# 多租户系统设计

## 概述

多租户（Multi-tenancy）是 SaaS 平台的核心能力，提供租户隔离、资源配额、租户上下文管理等完整解决方案。本包将多租户作为独立的、可复用的模块开发和维护。

## 问题陈述

### 当前痛点

1. **代码分散**：租户相关代码分散在 `libs/iam/domain/tenant` 和 `libs/shared/context` 中，缺乏统一组织
2. **职责不清**：租户领域逻辑与基础设施代码混杂，难以维护和扩展
3. **复用性差**：无法在其他项目中独立使用多租户能力
4. **测试困难**：多租户逻辑散落各处，难以进行全面测试

### 为什么需要独立包

- ✅ **单一职责**：多租户是一个独立的领域，应该有自己的边界上下文
- ✅ **可复用性**：其他项目可以直接引入 `@oksai/tenancy` 包
- ✅ **可维护性**：统一的代码组织，便于理解和修改
- ✅ **可测试性**：独立的测试策略和覆盖率目标
- ✅ **清晰依赖**：明确多租户的核心依赖（kernel、context）

## 用户故事

### 主用户故事

```gherkin
作为 SaaS 平台开发者
我想要一个独立的多租户包
以便于快速集成租户管理能力到任何项目
```

### 验收标准（INVEST 原则）

| 原则            | 说明   | 检查点                                   |
| :-------------- | :----- | :--------------------------------------- |
| **I**ndependent | 独立性 | ✅ 包可以独立开发、测试、发布            |
| **N**egotiable  | 可协商 | ✅ API 设计可以根据需求调整              |
| **V**aluable    | 有价值 | ✅ 提供完整的多租户解决方案              |
| **E**stimable   | 可估算 | ✅ 基于 IAM 模块的现有实现，工作量可估算 |
| **S**mall       | 足够小 | ✅ 聚焦多租户核心功能，不包含业务逻辑    |
| **T**estable    | 可测试 | ✅ 有明确的测试策略和覆盖率目标          |

### 相关用户故事

- 作为开发者，我希望轻松集成租户上下文到 NestJS 应用，以便自动管理租户隔离
- 作为开发者，我希望通过装饰器声明租户隔离策略，以便灵活控制数据访问
- 作为运维，我希望监控租户资源使用情况，以便及时发现和解决配额问题
- 作为产品经理，我希望支持租户套餐升级/降级，以便灵活调整计费策略

## BDD 场景设计

### 正常流程（Happy Path）

```gherkin
Scenario: 创建新租户
  Given 用户填写租户注册表单
  When 提交租户信息（名称、slug、套餐）
  Then 系统创建租户聚合根
  And 设置初始配额
  And 发布 TenantCreated 领域事件
  And 返回租户 ID

Scenario: 租户激活
  Given 租户处于 PENDING 状态
  When 管理员审核通过
  Then 租户状态变更为 ACTIVE
  And 发布 TenantActivated 领域事件
  And 租户可以正常访问系统

Scenario: 租户上下文切换
  Given 请求携带租户标识（X-Tenant-Id 或子域名）
  When 请求进入应用
  Then 自动解析租户信息
  And 设置租户上下文
  And 后续操作自动使用租户上下文
```

### 异常流程（Error Cases）

```gherkin
Scenario: 租户配额超限
  Given 租户已达到组织数量上限
  When 用户尝试创建新组织
  Then 拒绝创建操作
  And 返回配额超限错误

Scenario: 租户状态异常
  Given 租户处于 SUSPENDED 状态
  When 用户尝试访问租户资源
  Then 拒绝访问
  And 返回租户已停用错误

Scenario: 无效的租户标识
  Given 请求携带无效的租户标识
  When 请求进入应用
  Then 返回 401 未授权错误
  And 记录安全日志
```

### 边界条件（Edge Cases）

```gherkin
Scenario: 租户 slug 已存在
  Given 数据库中已存在 slug 为 "company-a" 的租户
  When 尝试创建相同 slug 的租户
  Then 返回 slug 重复错误
  And 建议使用不同的 slug

Scenario: 租户套餐降级
  Given 租户当前有 50 个组织
  And 目标套餐最多支持 10 个组织
  When 尝试降级套餐
  Then 拒绝降级操作
  And 提示需要先删除多余组织

Scenario: 并发创建租户
  Given 两个请求同时创建相同 slug 的租户
  When 数据库唯一约束生效
  Then 只有一个请求成功
  And 另一个请求返回重复错误
```

## 技术设计

### 领域层

**聚合根**：

- `Tenant`: 租户聚合根，管理租户生命周期和业务规则

**值对象**：

- `TenantPlan`: 租户套餐（FREE/STARTER/PRO/ENTERPRISE）
- `TenantStatus`: 租户状态（PENDING/ACTIVE/SUSPENDED/DELETED）
- `TenantQuota`: 租户配额（组织数、成员数、存储空间）
- `TenantContext`: 租户上下文（当前租户 ID、slug、名称）

**领域事件**：

- `TenantCreatedEvent`: 租户创建事件
- `TenantActivatedEvent`: 租户激活事件
- `TenantSuspendedEvent`: 租户停用事件
- `TenantQuotaUpdatedEvent`: 租户配额更新事件
- `TenantPlanChangedEvent`: 租户套餐变更事件（新增）

**业务规则**：

- 只有 PENDING 状态的租户才能激活
- 只有 ACTIVE 状态的租户才能停用
- 套餐降级时不能超过新套餐的配额限制
- slug 必须全局唯一且符合格式要求（3-100 字符，小写字母/数字/连字符）

### 应用层

**Command**：

- `CreateTenantCommand`: 创建租户
- `ActivateTenantCommand`: 激活租户
- `SuspendTenantCommand`: 停用租户
- `UpdateTenantQuotaCommand`: 更新配额
- `ChangeTenantPlanCommand`: 变更套餐

**Query**：

- `GetTenantByIdQuery`: 根据 ID 查询租户
- `GetTenantBySlugQuery`: 根据 slug 查询租户
- `ListTenantsByOwnerQuery`: 查询用户的所有租户
- `CheckTenantQuotaQuery`: 检查租户配额使用情况

**Handler**：

- `CreateTenantHandler`: 创建租户，验证 slug 唯一性，设置初始配额
- `ActivateTenantHandler`: 激活租户，验证状态转换规则
- `SuspendTenantHandler`: 停用租户，记录停用原因
- `UpdateTenantQuotaHandler`: 更新配额，发布事件通知其他模块
- `ChangeTenantPlanHandler`: 变更套餐，验证配额限制

### 基础设施层

**Repository**：

- `TenantRepository`: 租户持久化（MikroORM 实现）
  - `findById(id: string)`: 根据 ID 查找
  - `findBySlug(slug: string)`: 根据 slug 查找
  - `findByOwnerId(ownerId: string)`: 根据所有者查找
  - `save(tenant: Tenant)`: 保存/更新
  - `delete(id: string)`: 删除租户

**Adapter**：

- `TenantContextAdapter`: 租户上下文适配器
  - 从请求中提取租户标识（Header、子域名、Cookie）
  - 设置租户上下文到 AsyncLocalStorage
  - 提供租户上下文访问接口

**NestJS 集成**：

- `TenancyModule`: 多租户模块
- `TenantGuard`: 租户守卫，验证租户访问权限
- `TenantInterceptor`: 租户拦截器，自动注入租户过滤条件
- `@RequireTenant()`: 装饰器，要求租户上下文

### 数据库变更

**租户表（已存在，需迁移）**：

```sql
-- 从 iam 数据库迁移到 tenancy 数据库
CREATE TABLE tenant (
  id UUID PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  slug VARCHAR(100) UNIQUE NOT NULL,
  plan VARCHAR(50) NOT NULL,
  status VARCHAR(50) NOT NULL,
  owner_id UUID NOT NULL,
  quota JSONB NOT NULL,
  settings JSONB DEFAULT '{}',
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP NOT NULL,
  updated_at TIMESTAMP NOT NULL
);

-- 索引优化
CREATE INDEX idx_tenant_slug ON tenant(slug);
CREATE INDEX idx_tenant_owner_id ON tenant(owner_id);
CREATE INDEX idx_tenant_status ON tenant(status);
```

**迁移脚本**：

- 从 `libs/iam/domain` 迁移租户相关代码到 `libs/tenancy`
- 更新所有依赖租户的模块的 import 路径
- 保持向后兼容，`@oksai/iam-domain` 导出 `@oksai/tenancy` 的内容（过渡期）

### API 变更

**新增接口**：

- `POST /api/tenants`: 创建租户（内部 API，仅供注册流程调用）
- `GET /api/tenants/:id`: 查询租户信息
- `GET /api/tenants/slug/:slug`: 根据 slug 查询租户
- `PATCH /api/tenants/:id/activate`: 激活租户（管理员）
- `PATCH /api/tenants/:id/suspend`: 停用租户（管理员）
- `PATCH /api/tenants/:id/quota`: 更新配额（管理员）
- `PATCH /api/tenants/:id/plan`: 变更套餐

**请求/响应结构**：

```typescript
// 创建租户请求
interface CreateTenantRequest {
  name: string;
  slug: string;
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  ownerId: string;
  metadata?: Record<string, unknown>;
}

// 租户响应
interface TenantResponse {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  ownerId: string;
  quota: {
    maxOrganizations: number;
    maxMembers: number;
    maxStorageGB: number;
  };
  createdAt: string;
  updatedAt: string;
}

// 配额检查响应
interface QuotaCheckResponse {
  resource: 'organizations' | 'members' | 'storage';
  limit: number;
  current: number;
  available: number;
  exceeded: boolean;
}
```

### UI 变更

**管理后台**（Phase 2）：

- 租户管理页面：列表、搜索、筛选
- 租户详情页面：基本信息、配额使用、操作日志
- 租户审核页面：待审核列表、审核通过/拒绝

**用户界面**（Phase 2）：

- 租户切换组件：多租户环境下切换当前租户
- 租户设置页面：租户信息、套餐管理

**用户流程**：

1. 用户注册时自动创建租户
2. 管理员审核租户激活
3. 用户登录后进入租户上下文
4. 用户可以切换租户（如果有多个）

## 边界情况

需要处理的重要边界情况：

- **slug 冲突**：数据库唯一约束 + 应用层双重检查
- **配额验证**：修改操作前验证配额限制
- **状态转换**：严格的状态机验证，防止非法转换
- **并发创建**：数据库唯一约束保证，优雅处理冲突错误
- **套餐降级**：降级前检查当前使用量是否超过新套餐限制
- **租户删除**：软删除，保留历史数据，关联数据处理策略

## 范围外

该包明确不包含的内容：

- ❌ 用户认证和授权（由 `@oksai/better-auth` 负责）
- ❌ 组织管理（由 `@oksai/iam` 负责）
- ❌ 计费和支付（由 `@oksai/billing` 负责，后续独立包）
- ❌ 租户特定的业务逻辑（各业务模块自行实现）
- ❌ UI 组件（Phase 2 再实现）

## 测试策略

### 单元测试（70%）

**领域层测试**：

- Tenant 创建和验证（name、slug、plan 校验）
- TenantStatus 状态转换（PENDING → ACTIVE → SUSPENDED）
- TenantQuota 配额检查和验证
- TenantPlan 套餐变更和配额关联
- 领域事件发布验证

**应用层测试**：

- CreateTenantHandler 处理逻辑（slug 唯一性验证）
- ActivateTenantHandler 状态转换验证
- SuspendTenantHandler 停用原因验证
- UpdateTenantQuotaHandler 配额更新
- ChangeTenantPlanHandler 套餐降级验证

**基础设施层测试**：

- TenantRepository CRUD 操作
- TenantContextAdapter 上下文设置和访问

### 集成测试（20%）

- Repository 与 MikroORM 集成测试（真实数据库）
- TenantGuard 和 TenantInterceptor 与 NestJS 集成
- 多租户上下文切换和隔离验证
- 并发创建租户测试（数据库唯一约束）

### E2E 测试（10%）

- 租户创建 → 激活 → 使用 → 停用完整流程
- 租户上下文自动注入和过滤
- 配额超限拒绝访问
- 租户隔离验证（跨租户数据隔离）

### 测试覆盖率目标

- 领域层：>95%（核心业务逻辑，必须高覆盖）
- 应用层：>90%（Command/Query 处理逻辑）
- 基础设施层：>85%（Repository 和适配器）
- 总体：>90%

---

## 风险评估

| 风险                       | 影响 | 概率 | 缓解措施                                  |
| :------------------------- | :--: | :--: | :---------------------------------------- |
| 代码迁移影响现有功能       |  高  |  中  | 分阶段迁移，保持向后兼容，完整测试覆盖    |
| 租户隔离不彻底导致数据泄露 |  高  |  低  | 严格的代码审查，E2E 隔离测试，安全审计    |
| 性能影响（上下文切换开销） |  中  |  低  | 性能基准测试，优化 AsyncLocalStorage 使用 |
| 配额计算复杂导致性能问题   |  中  |  低  | 缓存配额信息，异步更新使用量              |

### 回滚计划

1. **代码回滚**：保留 `libs/iam/domain/tenant` 代码，通过 feature flag 控制使用新旧实现
2. **数据回滚**：租户数据未迁移，仍在原数据库，回滚无数据风险
3. **配置回滚**：通过环境变量切换到旧的租户上下文实现

---

## 依赖关系

### 内部依赖

- `@oksai/kernel`：基础设施（AggregateRoot、Result、Guard、UniqueEntityID）
- `@oksai/context`：租户上下文管理（AsyncLocalStorage、TenantContext）
- `@oksai/exceptions`：领域异常（DomainException、NotFoundException）
- `@oksai/logger`：日志记录（OksaiLoggerService）

### 外部依赖

- `@nestjs/common`：NestJS 核心模块（Module、Guard、Interceptor）
- `@mikro-orm/core`：ORM 核心功能
- `@mikro-orm/postgresql`：PostgreSQL 适配器

### 被依赖

- `@oksai/iam`：IAM 模块依赖租户聚合根
- `apps/gateway`：网关应用使用租户守卫和拦截器
- `apps/web-admin`：管理后台使用租户管理 API

## 实现计划

### Phase 1: 包初始化和代码迁移（1-2 天）

- [ ] 创建 `libs/tenancy` 包结构
- [ ] 配置 tsconfig、package.json、project.json
- [ ] 从 `libs/iam/domain/tenant` 迁移代码到 `libs/tenancy/domain`
- [ ] 从 `libs/shared/context` 迁移租户上下文代码到 `libs/tenancy/application`
- [ ] 更新 import 路径，确保所有测试通过
- [ ] 在 `@oksai/iam-domain` 中添加重导出（向后兼容）

### Phase 2: 领域层增强（2-3 天）

- [ ] 增强 Tenant 聚合根（添加新业务方法）
- [ ] 实现 ChangeTenantPlan 业务逻辑（含降级验证）
- [ ] 添加 TenantPlanChangedEvent 领域事件
- [ ] 完善值对象（TenantPlan、TenantQuota）
- [ ] 编写完整的领域层单元测试（覆盖率 >95%）

### Phase 3: 应用层实现（2-3 天）

- [ ] 实现 CQRS Command/Query
- [ ] 实现所有 Handler
- [ ] 集成租户上下文管理
- [ ] 编写应用层单元测试（覆盖率 >90%）

### Phase 4: 基础设施层和 NestJS 集成（2-3 天）

- [ ] 实现 MikroORM Repository
- [ ] 实现 TenantContextAdapter
- [ ] 实现 TenancyModule、TenantGuard、TenantInterceptor
- [ ] 实现 @RequireTenant() 装饰器
- [ ] 编写集成测试（覆盖率 >85%）

### Phase 5: API 层和文档（1-2 天）

- [ ] 实现 RESTful API 接口
- [ ] 编写 API 文档（Swagger）
- [ ] 编写使用指南和最佳实践文档
- [ ] 编写 E2E 测试（覆盖率 >90%）

### Phase 6: 清理和发布（1 天）

- [ ] 移除 `@oksai/iam-domain` 中的重导出（完成迁移）
- [ ] 更新所有依赖包的 import 路径
- [ ] 发布 `@oksai/tenancy@1.0.0`
- [ ] 更新项目文档和 CHANGELOG

## 参考资料

- [开发工作流程](./workflow.md)
- [测试指南](../../specs-testing/README.md)
- [DDD 分层架构](../../docs/architecture/ddd-layers.md)
- [MikroORM 最佳实践](../../docs/database/mikro-orm-best-practices.md)
- [NestJS 多租户模式](https://docs.nestjs.com/techniques/performance)
