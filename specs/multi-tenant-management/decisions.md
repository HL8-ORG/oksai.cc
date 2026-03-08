# 多租户管理决策

## 通用决策

以下是适用于所有功能的通用决策，无需重复记录：

### UDR-001：优先使用共享模块

**背景**
项目中已有成熟的共享模块提供通用功能，避免重复实现。

**决策**
当需要使用以下功能时，优先使用 `libs/shared` 目录下的共享模块：

| 功能类型 | 共享模块            | 使用场景                   |
| -------- | ------------------- | -------------------------- |
| 日志     | `@oksai/logger`     | 统一日志记录、结构化日志   |
| 异常     | `@oksai/exceptions` | 统一异常处理、DDD 领域异常 |
| 契约     | `@oksai/constants`  | 事件契约、API 契约定义     |
| 配置     | `@oksai/config`     | 环境配置、配置验证         |
| 上下文   | `@oksai/context`    | 租户上下文、请求上下文     |

**理由**

- ✅ 避免重复造轮子
- ✅ 保持一致性和可维护性
- ✅ 统一错误处理和日志格式
- ✅ 便于跨功能共享

**示例**

```typescript
// ✅ 推荐：使用共享模块
import { OksaiLoggerService } from '@oksai/logger';
import { DomainException } from '@oksai/exceptions';
import { TenantContext } from '@oksai/context';

// ❌ 避免：自己实现
import { Logger } from '@nestjs/common'; // 不统一
import { CustomError } from './custom-error'; // 重复实现
```

---

## 功能特定决策

以下是该功能特有的架构决策记录（ADR）：

## ADR-001：Tenant vs Organization 关系模型

### 背景

项目中同时存在 `Tenant` 和 `Organization` 两个概念，关系不明确：

- `Tenant`：租户实体，包含基本信息（name, plan, status）
- `Organization`：组织实体，由 Better Auth 管理（成员、权限）
- 两者完全独立，无关联关系

**问题**：

1. 数据隔离层次混乱（User 使用 tenantId，Webhook 使用 organizationId）
2. 不清楚是租户隔离还是组织隔离
3. 容易导致数据泄露

### 备选方案

#### 方案 A：Tenant 包含多个 Organization（推荐）

```
Tenant (租户 = 企业客户/公司)
  ├─ Organization 1 (团队A/部门A)
  ├─ Organization 2 (团队B/部门B)
  └─ Organization 3 (团队C/部门C)
```

**优点**：

- ✅ 适合 B2B SaaS 场景
- ✅ 一个企业客户一个租户
- ✅ 租户内可以有多个团队/部门
- ✅ 支持企业组织架构
- ✅ 配额管理更清晰（租户级别）

**缺点**：

- ❌ 实现复杂度稍高
- ❌ 需要重构 Organization 表结构

#### 方案 B：Organization 等同于 Tenant

```
Organization = Tenant (组织即租户)
```

**优点**：

- ✅ 实现简单
- ✅ 复用 Better Auth 的 Organization 功能
- ✅ 无需重构

**缺点**：

- ❌ 不适合企业级场景
- ❌ 无法支持企业多团队
- ❌ 配额管理困难
- ❌ 不符合业务语义（租户 ≠ 组织）

#### 方案 C：Tenant 和 Organization 完全独立

```
Tenant (租户)
Organization (组织)
  └─ 无关联
```

**优点**：

- ✅ 无需改动

**缺点**：

- ❌ 关系混乱
- ❌ 数据隔离不清晰
- ❌ 权限检查困难
- ❌ 维护成本高

### 决策

**选择方案 A：Tenant 包含多个 Organization**

**理由**：

1. **符合业务语义**：租户代表企业客户，组织代表团队/部门
2. **适合 B2B SaaS**：一个企业客户可以有多个团队
3. **配额管理清晰**：配额基于租户，不基于组织
4. **数据隔离明确**：所有数据基于 `tenantId` 隔离
5. **可扩展性好**：未来支持企业组织架构、部门权限等

### 影响

1. **数据库变更**：
   - Organization 表添加 `tenantId` 列
   - Organization 属于 Tenant（多对一关系）

2. **代码重构**：
   - Organization 创建时必须关联 Tenant
   - Organization 查询时自动过滤 `tenantId`

3. **权限模型**：
   - 租户级别：数据隔离、配额管理
   - 组织级别：成员管理、权限控制

4. **向后兼容**：
   - 现有组织需要迁移到默认租户
   - 提供数据迁移脚本

---

## ADR-002：数据隔离策略

### 背景

多租户系统必须确保租户数据完全隔离，防止数据泄露。需要选择合适的隔离策略。

**问题**：

1. 当前无任何自动隔离机制
2. 手动添加 `WHERE tenantId = ?` 容易遗漏
3. 存在严重的数据泄露风险

### 备选方案

#### 方案 A：行级隔离（Row-level Isolation）

**实现方式**：

- 所有表添加 `tenantId` 列
- 使用 MikroORM 全局过滤器自动添加 `WHERE tenantId = ?`
- 查询时自动过滤，无需手动处理

**优点**：

- ✅ 实现简单，成本最低
- ✅ 性能开销小
- ✅ 易于维护
- ✅ 适合大多数场景

**缺点**：

- ❌ 隔离性不如 Schema 隔离
- ❌ 需要确保所有查询都应用过滤器
- ❌ 索引优化要求高

**成本**：

- 开发成本：低（2 周）
- 运维成本：低
- 硬件成本：低

#### 方案 B：Schema 隔离（Schema Isolation）

**实现方式**：

- 每个租户一个数据库 Schema
- `tenant1.users`, `tenant2.users`
- 动态切换 Schema

**优点**：

- ✅ 隔离性更强
- ✅ 数据库级别隔离
- ✅ 支持租户独立备份

**缺点**：

- ❌ 实现复杂
- ❌ Schema 管理困难
- ❌ 迁移脚本需要应用到所有 Schema
- ❌ 连接池管理复杂

**成本**：

- 开发成本：中（4 周）
- 运维成本：中
- 硬件成本：中

#### 方案 C：数据库隔离（Database Isolation）

**实现方式**：

- 每个租户一个独立数据库
- 完全物理隔离

**优点**：

- ✅ 隔离性最强（物理隔离）
- ✅ 安全性最高
- ✅ 支持租户独立部署

**缺点**：

- ❌ 实现最复杂
- ❌ 运维成本极高
- ❌ 资源浪费严重
- ❌ 不适合大量租户

**成本**：

- 开发成本：高（8 周）
- 运维成本：高
- 硬件成本：高

### 决策

**选择方案 A：行级隔离**

**理由**：

1. **当前阶段适用**：项目处于早期，租户数量有限
2. **成本最优**：开发成本低，运维成本低
3. **性能够用**：性能开销小，适合中小规模
4. **易于实现**：MikroORM Filters 提供开箱即用支持
5. **风险可控**：通过集成测试和审计日志确保隔离效果

**保障措施**：

1. **自动过滤**：MikroORM 全局过滤器，默认启用
2. **Guard 检查**：TenantGuard 检查资源归属
3. **集成测试**：编写大量数据隔离测试
4. **SQL 审计**：定期审计 SQL 查询日志
5. **索引优化**：为所有 `tenantId` 列创建索引

**未来扩展**：

- 如果租户数量增长到 1000+，考虑迁移到 Schema 隔离
- 如果有高安全需求租户，提供数据库隔离选项（企业版）

### 影响

1. **数据库设计**：
   - 所有业务表添加 `tenantId` 列
   - 创建复合索引（tenantId + 其他条件）

2. **代码实现**：
   - 实现 TenantFilter（MikroORM）
   - 实现 TenantMiddleware（租户识别）
   - 实现 TenantGuard（权限检查）

3. **性能优化**：
   - 监控过滤器性能影响
   - 优化索引和查询计划

4. **测试策略**：
   - 编写大量数据隔离测试
   - 定期进行安全审计

---

## ADR-003：租户识别策略

### 背景

系统需要从请求中识别租户，以便注入租户上下文和应用数据隔离。需要确定租户识别的优先级和方式。

**问题**：

1. 租户信息可能存在于多个地方（JWT、Header、域名）
2. 需要确定识别优先级
3. 需要处理租户 ID 不一致的情况

### 备选方案

#### 方案 A：JWT Token 优先（推荐）

**识别顺序**：

1. JWT Token 中的 `tenantId`（最高优先级）
2. 请求 Header `X-Tenant-ID`
3. 子域名识别（`tenant.app.com`）
4. 自定义域名识别

**优点**：

- ✅ 安全性高（JWT 已签名）
- ✅ 用户无法伪造
- ✅ 与认证系统集成
- ✅ 支持用户切换租户

**缺点**：

- ❌ 需要解析 JWT
- ❌ 依赖认证系统

**适用场景**：

- 用户已登录的 API 请求
- Web 应用

#### 方案 B：Header 优先

**识别顺序**：

1. 请求 Header `X-Tenant-ID`
2. JWT Token 中的 `tenantId`
3. 域名识别

**优点**：

- ✅ 实现简单
- ✅ 不依赖 JWT

**缺点**：

- ❌ 安全性低（Header 可伪造）
- ❌ 需要额外验证

**适用场景**：

- 内部服务间调用
- Webhook 回调

#### 方案 C：域名识别优先

**识别顺序**：

1. 子域名识别（`tenant.app.com`）
2. 自定义域名识别
3. JWT Token
4. Header

**优点**：

- ✅ 用户体验好（无需登录即可识别租户）
- ✅ 支持多租户品牌定制

**缺点**：

- ❌ 需要 DNS 配置
- ❌ SSL 证书管理复杂
- ❌ 本地开发困难

**适用场景**：

- 公开访问的页面
- 租户品牌定制

### 决策

**选择方案 A：JWT Token 优先**

**理由**：

1. **安全性最高**：JWT 已签名，无法伪造
2. **集成简单**：与 Better Auth 认证系统集成
3. **用户友好**：支持用户切换租户
4. **适合当前阶段**：项目使用 Better Auth，JWT 是主要认证方式

**识别策略**：

```typescript
// 租户识别优先级
1. JWT Token 中的 tenantId（已验证）
2. Header X-Tenant-ID（需要验证用户是否有权访问该租户）
3. 子域名识别（需要验证域名绑定）
4. 自定义域名识别（企业版功能）
```

**冲突处理**：

```typescript
// 如果 JWT 和 Header 的 tenantId 不一致
if (jwtTenantId !== headerTenantId) {
  // 使用 JWT 中的 tenantId（更安全）
  tenantId = jwtTenantId;

  // 记录警告日志
  logger.warn('租户 ID 不一致', {
    jwtTenantId,
    headerTenantId,
    userId,
  });
}
```

### 影响

1. **JWT Token 结构**：

   ```typescript
   interface JWTPayload {
     userId: string;
     tenantId: string; // 添加租户 ID
     activeOrganizationId?: string;
   }
   ```

2. **中间件实现**：
   - TenantMiddleware 解析 JWT Token
   - 验证租户有效性
   - 注入到 TenantContextService

3. **测试策略**：
   - 测试 JWT Token 识别
   - 测试 Header 识别（带权限验证）
   - 测试租户 ID 不一致情况

4. **文档更新**：
   - API 文档说明租户识别方式
   - 客户端集成指南

---

## ADR-004：MikroORM 过滤器实现方式

### 背景

MikroORM 提供两种过滤器实现方式：

1. 装饰器方式（`@Filter`）
2. 全局过滤器配置

需要选择合适的实现方式。

### 决策

**使用全局过滤器 + 动态条件**

**实现方式**：

```typescript
// MikroORM 配置
{
  filters: {
    tenant: {
      name: 'tenant',
      cond: (args, type, em) => {
        const tenantId = TenantContext.getTenantId();
        if (!tenantId) return {};
        return { tenantId };
      },
      default: true,  // 默认启用
      entity: ['User', 'Organization', 'Webhook'],  // 应用的实体
    },
  },
}
```

**理由**：

- ✅ 全局配置，无需每个实体添加装饰器
- ✅ 动态获取租户 ID，无需传递参数
- ✅ 默认启用，确保隔离效果
- ✅ 支持动态禁用（超级管理员）

**注意事项**：

1. 确保 TenantContext 在查询前已注入
2. 超级管理员操作时禁用过滤器
3. 编写集成测试验证过滤效果

---

## ADR-005：配额管理粒度

### 背景

租户配额可以管理不同资源的使用限制，需要确定配额管理的粒度和检查时机。

### 决策

**配额粒度：租户级别，资源类型包括**：

- `maxOrganizations`：最大组织数
- `maxMembers`：最大成员数
- `maxStorage`：最大存储空间（字节）

**检查时机**：

1. **资源创建前**：使用 `@CheckQuota()` 装饰器 + QuotaGuard
2. **资源创建后**：发布领域事件，更新使用量
3. **定期统计**：后台任务定期统计实际使用量

**实现方式**：

```typescript
// 配额检查装饰器
@Post()
@CheckQuota('members')
async inviteMember() {
  // QuotaGuard 自动检查配额
}

// QuotaGuard
async canActivate(context: ExecutionContext) {
  const resource = this.reflector.get('quota', context.getHandler());
  const tenantId = this.tenantContext.tenantId;

  const hasQuota = await this.tenantService.checkQuota(tenantId, resource);
  if (!hasQuota) {
    throw new ForbiddenException('已达到配额限制，请升级套餐');
  }

  return true;
}
```

**理由**：

- ✅ 粒度适中，满足大部分场景
- ✅ 检查时机合理，防止超额
- ✅ 支持动态调整配额
- ✅ 便于后续扩展（如 API 调用次数限制）

---

## 决策总结

| 决策    | 选择                         | 理由                             | 风险                     |
| ------- | ---------------------------- | -------------------------------- | ------------------------ |
| ADR-001 | Tenant 包含多个 Organization | 符合 B2B SaaS 场景，业务语义清晰 | 需要重构 Organization 表 |
| ADR-002 | 行级隔离                     | 成本最优，易于实现，适合当前阶段 | 隔离性不如 Schema 隔离   |
| ADR-003 | JWT Token 优先识别           | 安全性最高，集成简单             | 依赖认证系统             |
| ADR-004 | 全局过滤器                   | 无需装饰器，默认启用             | 需确保上下文注入         |
| ADR-005 | 租户级别配额                 | 粒度适中，满足需求               | 可能不够灵活             |

**风险缓解**：

1. 编写大量集成测试
2. 定期审计 SQL 查询
3. 保留回滚脚本
4. 监控性能影响
5. 文档完善

**未来考虑**：

1. 如果租户数量增长到 1000+，考虑迁移到 Schema 隔离
2. 如果有高安全需求，提供数据库隔离选项（企业版）
3. 配额管理支持自定义维度（如 API 调用次数）
