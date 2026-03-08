# 多租户管理后续工作

从首版实现中延期的想法与增强项。

---

## 增强项

| 功能                           | 描述                                                               | 优先级 | 估算工作量 | 依赖                                 |
| :----------------------------- | :----------------------------------------------------------------- | :----: | :--------: | :----------------------------------- |
| **Organization → Tenant 关联** | 为 Organization 实体添加 tenantId，实现租户与组织的完整关联        |   高   |   2-3天    | Better Auth organization schema 扩展 |
| **租户域名识别**               | 支持通过子域名（tenant.app.com）和自定义域名（tenant.com）识别租户 |   高   |   3-5天    | DNS 配置、SSL 证书管理               |
| **租户统计数据服务**           | 实时统计租户使用情况（组织数、成员数、存储使用量）                 |   中   |    2天     | Organization → Tenant 关联           |
| **租户配置管理**               | 租户级别的自定义配置（主题、功能开关、通知设置）                   |   中   |   2-3天    | 租户统计数据服务                     |
| **管理员后台 UI**              | 租户管理界面（创建、激活、停用、配额管理）                         |   中   |   5-7天    | TanStack Start UI 组件               |
| **租户配额卡片**               | 前端展示配额使用情况的可视化组件                                   |   低   |   1-2天    | 管理员后台 UI                        |
| **租户计费系统**               | 租户订阅管理、计费周期、发票生成                                   |   低   |  10-15天   | 外部支付服务（Stripe/支付宝）        |
| **多区域部署**                 | 支持租户数据在不同地理区域的存储                                   |   低   |  15-20天   | 多区域数据库、数据同步机制           |

---

## 技术债

| 问题                           | 影响                                                   | 优先级 | 估算工作量 | 解决方案                                           |
| :----------------------------- | :----------------------------------------------------- | :----: | :--------: | :------------------------------------------------- |
| **数据库迁移未执行**           | 迁移脚本已创建但未应用到生产环境，无法验证实际效果     |   高   |   0.5天    | 在测试环境验证后执行 `pnpm mikro-orm migration:up` |
| **缺少 BDD Feature 文件**      | design.md 中的场景未转换为 Gherkin 格式，缺少 E2E 测试 |   中   |    2天     | 创建 `features/multi-tenant.feature`，实现步骤定义 |
| **Organization 缺少 tenantId** | Organization 实体未与 Tenant 关联，数据隔离不完整      |   高   |   2-3天    | 扩展 Better Auth schema，添加迁移脚本              |
| **性能监控缺失**               | 未实现租户过滤器的性能监控，无法评估性能影响           |   中   |   1-2天    | 添加性能监控中间件、日志记录                       |
| **超级管理员审计日志**         | 超级管理员跨租户操作缺少审计日志，存在安全风险         |   中   |   1-2天    | 实现审计日志服务，记录敏感操作                     |
| **租户配额为零的处理**         | 配额为零时应拒绝资源创建，但未充分测试                 |   低   |   0.5天    | 增加边界条件测试用例                               |

---

## 可选优化

| 优化项                 | 收益                                         | 优先级 | 估算工作量 |
| :--------------------- | :------------------------------------------- | :----: | :--------: |
| **租户过滤器性能优化** | 减少 SQL 查询开销，提升查询性能 10-20%       |   低   |   2-3天    |
| **租户上下文缓存**     | 减少 TenantContext 重复计算，降低 CPU 使用率 |   低   |    1天     |
| **租户数据归档**       | 自动归档不活跃租户数据，减少存储成本         |   低   |   3-5天    |
| **租户备份恢复**       | 支持单个租户的数据备份和恢复                 |   低   |   5-7天    |
| **租户数据迁移工具**   | 支持租户间数据迁移（合并、拆分租户）         |   低   |   7-10天   |
| **Schema 级别隔离**    | 为高安全性需求的租户提供独立的数据库 Schema  |   低   |  10-15天   |

---

## 讨论记录

| 日期       | 讨论                             | 决定                                              |
| :--------- | :------------------------------- | :------------------------------------------------ |
| 2026-03-08 | 是否实现 Schema 级别隔离？       | 延期：成本过高，行级隔离已满足当前需求            |
| 2026-03-08 | 是否支持多租户独立数据库？       | 延期：暂不支持，增加运维复杂度                    |
| 2026-03-08 | Organization 是否需要 tenantId？ | 采纳：需要，确保租户-组织层级清晰                 |
| 2026-03-08 | 是否实现租户计费系统？           | 延期：独立模块，不在多租户管理范围内              |
| 2026-03-08 | 是否支持租户域名识别？           | 待定：优先级中等，Phase 3 考虑                    |
| 2026-03-08 | 超级管理员权限如何控制？         | 采纳：使用 `@SkipTenantGuard()` 装饰器 + 审计日志 |

---

## Phase 3 计划（待执行）

### 🎯 目标

完善租户管理功能，增强用户体验和系统可维护性。

### 📋 任务清单

#### 1. Organization → Tenant 关联（优先级：高）

**背景**：Better Auth 的 organization 插件使用内置 schema，需要扩展添加 tenantId。

**技术方案**：

```typescript
// auth.config.ts
organization({
  schema: {
    organization: {
      fields: {
        tenantId: {
          type: "string",
          required: false,
          references: {
            model: "tenant",
            field: "id",
          },
        },
      },
    },
  },
}),
```

**任务**：

- [ ] 研究 Better Auth organization 插件 schema 扩展机制
- [ ] 更新 auth.config.ts 添加 schema 扩展
- [ ] 创建数据库迁移脚本
- [ ] 更新 OrganizationService 自动设置 tenantId
- [ ] 添加集成测试
- [ ] 更新文档

**预估工作量**：2-3 天

---

#### 2. 租户统计数据服务（优先级：中）

**目标**：实时统计租户使用情况。

**接口设计**：

```typescript
interface TenantStats {
  organizations: number;
  members: number;
  storage: number;
  activeUsers: number;
  lastActivityAt: Date;
}

class TenantStatsService {
  async getStats(tenantId: string): Promise<TenantStats>;
  async incrementUsage(
    tenantId: string,
    resource: string,
    amount: number,
  ): Promise<void>;
  async decrementUsage(
    tenantId: string,
    resource: string,
    amount: number,
  ): Promise<void>;
}
```

**任务**：

- [ ] 实现 TenantStatsService
- [ ] 添加统计数据缓存（Redis）
- [ ] 创建定时任务更新统计数据
- [ ] 添加统计 API 端点
- [ ] 编写测试

**预估工作量**：2 天

---

#### 3. 租户域名识别（优先级：中）

**目标**：支持通过域名识别租户。

**识别策略**：

1. **子域名识别**：`{tenant-slug}.app.com`
2. **自定义域名**：`tenant.com` → 查询 DNS 映射

**技术方案**：

```typescript
class TenantDomainService {
  extractFromSubdomain(hostname: string): string | null;
  extractFromCustomDomain(hostname: string): Promise<string | null>;
  validateDomain(domain: string): Promise<boolean>;
}
```

**任务**：

- [ ] 实现 TenantDomainService
- [ ] 更新 TenantMiddleware 支持域名识别
- [ ] 添加域名管理 API
- [ ] 配置 DNS 和 SSL（运维任务）
- [ ] 编写测试

**预估工作量**：3-5 天

---

#### 4. 管理员后台 UI（优先级：中）

**目标**：为管理员提供租户管理界面。

**页面列表**：

- 租户列表页（表格、搜索、筛选）
- 创建租户表单
- 租户详情页（配额、使用情况、操作日志）
- 租户配额卡片组件

**任务**：

- [ ] 创建租户管理页面路由
- [ ] 实现租户列表组件
- [ ] 实现创建租户表单
- [ ] 实现租户详情页
- [ ] 实现配额卡片组件
- [ ] 添加权限控制

**预估工作量**：5-7 天

---

### 📊 Phase 3 预估总工作量

- **Organization 关联**：2-3 天
- **统计数据服务**：2 天
- **域名识别**：3-5 天
- **管理员后台**：5-7 天
- **测试和文档**：2-3 天

**总计**：14-20 天（约 3 个 Sprint）

---

## 长期规划

### Q2 2026

- ✅ Phase 1: 基础隔离（已完成）
- ✅ Phase 2: 租户管理（已完成）
- ⏳ Phase 3: 增强功能（计划中）

### Q3 2026

- 租户计费系统（独立模块）
- 多区域部署支持
- 高级安全功能（数据加密、审计增强）

### Q4 2026

- Schema 级别隔离（企业版）
- 租户数据归档和恢复
- 租户数据迁移工具

---

## 参考文档

- [实现进度](./implementation.md)
- [架构决策](./decisions.md)
- [测试计划](./testing.md)
- [Better Auth Organization Plugin](https://better-auth.com/docs/plugins/organization)
