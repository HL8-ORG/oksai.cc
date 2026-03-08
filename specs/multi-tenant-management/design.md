# 多租户管理设计

## 概述

实现完整的多租户（Multi-tenancy）隔离机制，包括租户识别、自动数据隔离、权限检查和配额管理，确保不同租户的数据相互隔离，防止数据泄露和越权访问。

## 问题陈述

当前项目的多租户机制存在严重缺陷：

- **数据泄露风险高**：缺少自动租户过滤，开发人员容易遗漏 `WHERE tenantId = ?`
- **无法识别租户**：无租户识别中间件，无法从请求中提取租户信息
- **越权访问风险**：缺少租户级别的权限检查，用户可能访问其他租户的资源
- **架构混乱**：Tenant 和 Organization 关系不明确，数据隔离层次不一致
- **配额无限制**：未实现配额管理，租户可以无限制使用资源

这些问题违反数据保护法规（GDPR、个人信息保护法），不适合生产环境使用。

## 用户故事

### 主用户故事

```gherkin
作为 SaaS 平台的企业客户
我想要 确保我的数据与其他客户完全隔离
以便于 保护商业机密和用户隐私，满足数据保护法规要求
```

### 验收标准（INVEST 原则）

| 原则            | 说明   | 检查点                               |
| :-------------- | :----- | :----------------------------------- |
| **I**ndependent | 独立性 | ✅ 租户隔离机制独立于业务逻辑        |
| **N**egotiable  | 可协商 | ✅ 隔离策略可以根据需求调整          |
| **V**aluable    | 有价值 | ✅ 防止数据泄露，满足合规要求        |
| **E**stimable   | 可估算 | ✅ 基于标准实现模式，可估算工作量    |
| **S**mall       | 足够小 | ❌ 需要拆分为多个 Sprint（P0/P1/P2） |
| **T**estable    | 可测试 | ✅ 可通过集成测试验证隔离效果        |

### 相关用户故事

- 作为**系统管理员**，我希望**查看和管理所有租户**，以便**运营和维护平台**
- 作为**租户所有者**，我希望**为我的租户创建多个组织**，以便**按团队/部门隔离数据**
- 作为**开发人员**，我希望**自动应用租户过滤**，以便**避免手动过滤导致的数据泄露**
- 作为**租户所有者**，我希望**设置租户配额**，以便**控制资源使用和成本**

## BDD 场景设计

### 正常流程（Happy Path）

```gherkin
Scenario: 租户识别与数据隔离
  Given 用户已登录，JWT Token 包含 tenantId = "tenant-123"
  And 租户状态为 "active"
  When 用户请求 GET /api/users
  Then 系统自动注入租户上下文 { tenantId: "tenant-123" }
  And 系统自动应用过滤器 WHERE tenant_id = "tenant-123"
  And 返回租户 "tenant-123" 的用户列表
  And 不包含其他租户的用户
```

```gherkin
Scenario: 创建租户并设置配额
  Given 系统管理员已登录
  When 管理员创建租户 { name: "企业A", plan: "PRO", maxMembers: 100 }
  Then 系统创建 Tenant 实体
  And 系统设置配额 { maxMembers: 100, maxOrganizations: 10 }
  And 发布 TenantCreatedEvent 领域事件
  And 租户状态为 "pending"
```

```gherkin
Scenario: 租户激活
  Given 租户 "tenant-123" 状态为 "pending"
  When 系统管理员激活租户
  Then 租户状态变为 "active"
  And 发布 TenantActivatedEvent 领域事件
```

```gherkin
Scenario: 检查租户配额
  Given 租户 "tenant-123" 配额 { maxMembers: 100, currentMembers: 99 }
  When 邀请新成员
  Then 系统检查配额：99 < 100
  And 允许邀请
```

### 异常流程（Error Cases）

```gherkin
Scenario: 无效租户访问
  Given 用户请求中缺少租户标识
  When 用户访问任何需要租户的 API
  Then 返回 400 Bad Request
  And 错误信息："缺少租户标识"
```

```gherkin
Scenario: 租户已停用
  Given 用户已登录，租户状态为 "suspended"
  When 用户请求任何 API
  Then 返回 403 Forbidden
  And 错误信息："租户已被停用"
```

```gherkin
Scenario: 跨租户访问资源
  Given 用户属于租户 "tenant-123"
  And 资源属于租户 "tenant-456"
  When 用户尝试访问该资源
  Then TenantGuard 检查失败
  And 返回 403 Forbidden
  And 错误信息："无权访问其他租户的资源"
```

```gherkin
Scenario: 超过配额限制
  Given 租户 "tenant-123" 配额 { maxMembers: 100, currentMembers: 100 }
  When 邀请新成员
  Then 系统检查配额：100 >= 100
  And 返回 403 Forbidden
  And 错误信息："已达到配额限制，请升级套餐"
```

### 边界条件（Edge Cases）

```gherkin
Scenario: 租户 ID 不一致
  Given 用户 JWT Token 中 tenantId = "tenant-123"
  And 请求 Header 中 X-Tenant-ID = "tenant-456"
  When 系统验证租户标识
  Then 使用 JWT Token 中的 tenantId
  And 记录警告日志："租户 ID 不一致"
```

```gherkin
Scenario: 租户配额为零
  Given 租户 "tenant-123" 配额 { maxMembers: 0 }
  When 邀请新成员
  Then 返回 403 Forbidden
  And 错误信息："租户配额为零，请联系管理员"
```

```gherkin
Scenario: 租户切换组织
  Given 用户属于租户 "tenant-123"
  And 用户属于组织 "org-1" 和 "org-2"
  When 用户切换活动组织到 "org-2"
  Then 更新 JWT Token 中的 activeOrganizationId
  And 租户上下文保持不变 { tenantId: "tenant-123" }
```

## 技术设计

### 领域层

**聚合根**：

- `Tenant`：租户聚合根，管理租户生命周期和配额
  - 属性：id, name, slug, plan, status, ownerId, quota, settings
  - 方法：activate(), suspend(), checkQuota(), updateQuota()

**值对象**：

- `TenantPlan`：租户套餐（FREE/STARTER/PRO/ENTERPRISE）
- `TenantStatus`：租户状态（PENDING/ACTIVE/SUSPENDED/DELETED）
- `TenantQuota`：租户配额（maxOrganizations, maxMembers, maxStorage）
- `TenantSettings`：租户自定义配置

**领域事件**：

- `TenantCreatedEvent`：租户创建事件
- `TenantActivatedEvent`：租户激活事件
- `TenantSuspendedEvent`：租户停用事件
- `TenantQuotaExceededEvent`：配额超限事件
- `TenantUpdatedEvent`：租户更新事件

**业务规则**：

- BR1: 只有 `PENDING` 状态的租户才能被激活
- BR2: 只有 `ACTIVE` 状态的租户才能访问系统
- BR3: 租户配额检查必须在资源创建前执行
- BR4: 租户切换不影响租户隔离（始终基于 tenantId）
- BR5: 超级管理员可以跨租户操作（需要特殊权限）

### 应用层

**Command**：

- `CreateTenantCommand`：创建租户
- `ActivateTenantCommand`：激活租户
- `SuspendTenantCommand`：停用租户
- `UpdateTenantQuotaCommand`：更新配额
- `CheckTenantQuotaCommand`：检查配额

**Query**：

- `GetTenantByIdQuery`：根据 ID 查询租户
- `GetTenantBySlugQuery`：根据 Slug 查询租户
- `GetTenantUsageQuery`：查询租户使用情况
- `ListTenantsQuery`：列出所有租户（管理员）

**Handler**：

- `TenantCommandHandler`：处理租户相关命令
- `TenantQueryHandler`：处理租户相关查询

### 基础设施层

**Middleware**：

- `TenantMiddleware`：租户识别中间件
  - 从多种来源提取 tenantId（JWT/Header/域名）
  - 验证租户有效性
  - 注入到 TenantContextService

**Guard**：

- `TenantGuard`：租户权限守卫
  - 检查用户是否属于租户
  - 检查资源是否属于租户
  - 防止跨租户访问

**Filter**：

- `TenantFilter`：MikroORM 全局过滤器
  - 自动为所有查询添加 `WHERE tenantId = ?`
  - 支持动态启用/禁用（超级管理员）

**Repository**：

- `TenantRepository`：租户仓储
  - findById(id: string): Promise<Tenant>
  - findBySlug(slug: string): Promise<Tenant>
  - save(tenant: Tenant): Promise<void>
  - delete(id: string): Promise<void>

**Adapter**：

- `TenantScopedRepositoryAdapter`：租户作用域仓储适配器
  - 包装任何 Repository，自动注入租户过滤

### 数据库变更

#### 1. 增强 Tenant 实体

```sql
-- 迁移：增强 tenant 表
ALTER TABLE tenant ADD COLUMN slug VARCHAR(100) UNIQUE;
ALTER TABLE tenant ADD COLUMN owner_id VARCHAR(36);
ALTER TABLE tenant ADD COLUMN max_organizations INTEGER DEFAULT 1;
ALTER TABLE tenant ADD COLUMN max_members INTEGER DEFAULT 10;
ALTER TABLE tenant ADD COLUMN max_storage BIGINT DEFAULT 1073741824; -- 1GB
ALTER TABLE tenant ADD COLUMN settings JSONB DEFAULT '{}';
ALTER TABLE tenant ADD COLUMN metadata JSONB DEFAULT '{}';

CREATE INDEX idx_tenant_slug ON tenant(slug);
CREATE INDEX idx_tenant_owner ON tenant(owner_id);
CREATE INDEX idx_tenant_status ON tenant(status);
```

#### 2. 为所有实体添加 tenantId

```sql
-- 迁移：为缺失的实体添加 tenantId
ALTER TABLE webhook ADD COLUMN tenant_id VARCHAR(36);
ALTER TABLE session ADD COLUMN tenant_id VARCHAR(36);
ALTER TABLE account ADD COLUMN tenant_id VARCHAR(36);
ALTER TABLE api_key ADD COLUMN tenant_id VARCHAR(36);
ALTER TABLE oauth_client ADD COLUMN tenant_id VARCHAR(36);
ALTER TABLE oauth_access_token ADD COLUMN tenant_id VARCHAR(36);
ALTER TABLE oauth_refresh_token ADD COLUMN tenant_id VARCHAR(36);
ALTER TABLE oauth_authorization_code ADD COLUMN tenant_id VARCHAR(36);
ALTER TABLE webhook_delivery ADD COLUMN tenant_id VARCHAR(36);

-- 添加索引
CREATE INDEX idx_webhook_tenant ON webhook(tenant_id);
CREATE INDEX idx_session_tenant ON session(tenant_id);
CREATE INDEX idx_account_tenant ON account(tenant_id);
-- ... 其他表
```

#### 3. Organization 关联 Tenant

```sql
-- 迁移：Organization 添加 tenantId
ALTER TABLE organization ADD COLUMN tenant_id VARCHAR(36);
CREATE INDEX idx_organization_tenant ON organization(tenant_id);
```

### API 变更

**新增接口**：

#### 租户管理 API（管理员）

- `POST /api/admin/tenants`：创建租户
- `GET /api/admin/tenants`：列出所有租户
- `GET /api/admin/tenants/:id`：获取租户详情
- `PUT /api/admin/tenants/:id`：更新租户
- `POST /api/admin/tenants/:id/activate`：激活租户
- `POST /api/admin/tenants/:id/suspend`：停用租户
- `GET /api/admin/tenants/:id/usage`：获取租户使用情况

#### 租户配额 API

- `GET /api/tenant/quota`：获取当前租户配额
- `GET /api/tenant/usage`：获取当前租户使用情况
- `POST /api/tenant/check-quota`：检查配额（内部接口）

**请求/响应结构**：

```typescript
// POST /api/admin/tenants
interface CreateTenantRequest {
  name: string;
  slug: string;
  plan: 'FREE' | 'STARTER' | 'PRO' | 'ENTERPRISE';
  ownerId: string;
  maxOrganizations?: number;
  maxMembers?: number;
  maxStorage?: number;
}

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
    maxStorage: number;
  };
  usage?: {
    organizations: number;
    members: number;
    storage: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

// GET /api/tenant/quota
interface TenantQuotaResponse {
  quota: {
    maxOrganizations: number;
    maxMembers: number;
    maxStorage: number;
  };
  usage: {
    organizations: number;
    members: number;
    storage: number;
  };
  available: {
    organizations: number;
    members: number;
    storage: number;
  };
}
```

### UI 变更

**新增页面/组件**：

#### 管理员后台

- `TenantManagementPage`：租户管理页面
  - 租户列表（表格）
  - 创建租户表单
  - 租户详情（配额、使用情况）
  - 激活/停用操作

- `TenantQuotaCard`：租户配额卡片
  - 显示配额使用情况
  - 进度条可视化
  - 超额警告

#### 用户界面

- `TenantSelector`：租户选择器（如果用户属于多个租户）
- `TenantUsageIndicator`：租户使用情况指示器

**用户流程**：

1. 管理员进入租户管理页面
2. 点击"创建租户"
3. 填写租户信息（名称、套餐、配额）
4. 系统创建租户并设置状态为 "pending"
5. 管理员激活租户
6. 租户所有者收到邀请邮件
7. 租户所有者登录并开始使用

## 边界情况

- **租户不存在**：返回 404 Not Found，提示租户不存在
- **租户已删除**：返回 403 Forbidden，提示租户已删除
- **租户配额为零**：返回 403 Forbidden，提示配额为零
- **超级管理员跨租户操作**：需要特殊的 `@SkipTenantGuard()` 装饰器
- **租户切换组织**：不影响租户隔离，仅切换组织视图
- **租户域名识别**：支持子域名和自定义域名识别租户
- **租户数据迁移**：提供数据迁移工具，支持租户间数据迁移

## 范围外

- **Schema 隔离**：不实现数据库 Schema 级别隔离（行级隔离已足够）
- **数据库隔离**：不实现每个租户独立数据库（成本过高）
- **租户自定义域名 SSL**：暂不支持（后续迭代）
- **租户计费系统**：不在本功能范围内（独立模块）
- **多区域部署**：暂不支持（后续迭代）
- **租户数据备份恢复**：暂不支持（独立模块）

## 测试策略

### 单元测试（70%）

**领域层测试**：

- `Tenant` 聚合根：创建、激活、停用、配额检查
- `TenantQuota` 值对象：配额计算、比较
- `TenantStatus` 值对象：状态转换规则
- 业务规则：BR1-BR5

**应用层测试**：

- `TenantCommandHandler`：命令处理逻辑
- `TenantQueryHandler`：查询处理逻辑
- `TenantGuard`：权限检查逻辑
- `TenantMiddleware`：租户识别逻辑

**基础设施层测试**：

- `TenantFilter`：过滤器应用逻辑
- `TenantScopedRepositoryAdapter`：自动注入逻辑

### 集成测试（20%）

- `TenantRepository` 实现测试（PostgreSQL）
- 租户过滤器自动应用测试（MikroORM）
- 租户中间件注入测试（NestJS）
- 多组件协作测试（Middleware + Guard + Filter）

### E2E 测试（10%）

- 多租户数据隔离测试（租户 A 无法访问租户 B 的数据）
- 租户配额限制测试（超过配额时拒绝请求）
- 租户生命周期测试（创建 → 激活 → 使用 → 停用）
- 越权访问拒绝测试（跨租户访问返回 403）

### 测试覆盖率目标

- 领域层：>95%（核心业务逻辑）
- 应用层：>90%（命令/查询处理）
- 基础设施层：>85%（中间件、守卫、过滤器）
- 总体：>85%

---

## 风险评估

| 风险                      | 影响 | 概率 | 缓解措施                            |
| :------------------------ | :--: | :--: | :---------------------------------- |
| 数据泄露（过滤器失效）    |  高  |  中  | 编写大量集成测试，定期审计 SQL 查询 |
| 性能影响（全局过滤器）    |  中  |  中  | 优化索引，监控查询性能              |
| 迁移风险（添加 tenantId） |  高  |  低  | 分批迁移，保留回滚脚本              |
| 租户-Org 关系混乱         |  中  |  高  | 明确架构设计，编写详细文档          |
| 超级管理员权限滥用        |  高  |  低  | 审计日志，权限分离                  |

### 回滚计划

1. **数据库回滚**：保留迁移脚本的回滚版本
2. **代码回滚**：使用 Git 回滚到上一个稳定版本
3. **配置回滚**：禁用租户中间件和过滤器（紧急情况）
4. **数据修复**：提供数据修复脚本，修复隔离问题

---

## 依赖关系

### 内部依赖

- `@oksai/shared/context`：租户上下文服务（TenantContextService）
- `@oksai/shared/database`：MikroORM 配置和 BaseEntity
- `@oksai/shared/logger`：日志服务（自动注入租户上下文）
- `@oksai/nestjs-better-auth`：认证服务（JWT Token 解析）
- `apps/gateway/src/auth/organization.service.ts`：组织管理服务

### 外部依赖

- `@mikro-orm/core`：MikroORM Filters 功能
- `@nestjs/common`：NestJS Middleware/Guard/Decorator
- `reflect-metadata`：装饰器元数据（依赖注入）

## 实现计划

### Phase 0: 架构决策（1 天）

- [ ] 明确 Tenant vs Organization 关系（决策记录）
- [ ] 确定隔离策略（行级隔离）
- [ ] 设计租户识别策略（JWT/Header/域名）

### Phase 1: 基础隔离（Sprint 1 - 2 周）

**目标**：实现基本的数据隔离，防止数据泄露

- [ ] 增强 Tenant 实体（添加 slug、ownerId、quota 字段）
- [ ] 为所有实体添加 tenantId（10 个缺失实体）
- [ ] 实现 MikroORM 租户过滤器（TenantFilter）
- [ ] 实现租户中间件（TenantMiddleware）
- [ ] 实现租户守卫（TenantGuard）
- [ ] 编写集成测试（数据隔离测试）
- [ ] 数据库迁移脚本

**交付物**：

- 租户过滤器实现
- 租户中间件实现
- 租户守卫实现
- 测试覆盖率 > 80%

### Phase 2: 租户管理（Sprint 2 - 2 周）

**目标**：完善租户管理功能

- [ ] 实现 TenantService（CRUD、激活、停用）
- [ ] 实现 TenantController（管理员 API）
- [ ] 实现配额检查装饰器（@CheckQuota）
- [ ] 实现配额守卫（QuotaGuard）
- [ ] Organization 添加 tenantId 关联
- [ ] 数据迁移脚本（Organization → Tenant）
- [ ] 编写单元测试和集成测试

**交付物**：

- TenantService 完整实现
- Tenant API 接口
- 配额管理系统
- 数据迁移脚本

### Phase 3: 增强功能（Sprint 3 - 1 周）

**目标**：增强租户功能

- [ ] 租户统计数据服务（TenantStatsService）
- [ ] 租户配置管理（TenantSettingsService）
- [ ] 租户域名识别（子域名、自定义域名）
- [ ] 管理员后台 UI（租户管理页面）
- [ ] 租户使用情况 UI（配额卡片）
- [ ] 文档完善（API 文档、使用指南）
- [ ] 性能优化（索引优化、查询优化）

**交付物**：

- 租户统计面板
- 租户配置 API
- 管理员后台
- 技术文档

### Phase 4: 安全审计（持续）

- [ ] 数据隔离审计（定期检查 SQL 查询）
- [ ] 权限检查审计（定期检查 Guard 逻辑）
- [ ] 性能监控（租户过滤器性能）
- [ ] 安全测试（渗透测试）

## 参考资料

- [开发工作流程](./workflow.md)
- [测试指南](./testing.md)
- [多租户评估报告](../../docs/evaluations/multi-tenant-evaluation.md)
- [多租户架构指南](../../guidelines/archi/archi-06-multi-tenant.md)
- [MikroORM Filters](https://mikro-orm.io/docs/filters)
- [NestJS Multi-tenancy](https://docs.nestjs.com/fundamentals/multi-tenancy)
- [Better Auth Organization Plugin](https://better-auth.com/docs/plugins/organization)
- [Multi-tenant Architecture Patterns](https://docs.microsoft.com/en-us/azure/architecture/guide/multitenant/considerations)
