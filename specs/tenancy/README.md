# 多租户系统 (Tenancy)

> 🎯 **Status**: Phase 5 - 85% 完成（核心功能 100%）
>
> 📅 **最后更新**: 2026-03-09
>
> 👥 **维护者**: oksai.cc 团队

---

## 📖 文档导航

### 核心文档

| 文档                                     | 说明                            | 更新状态 |
| ---------------------------------------- | ------------------------------- | -------- |
| [design.md](./design.md)                 | 技术设计文档（Source of Truth） | ✅ 完成  |
| [implementation.md](./implementation.md) | 实现进度跟踪                    | ✅ 最新  |
| [testing.md](./testing.md)               | 测试策略和计划                  | ✅ 完成  |
| [workflow.md](./workflow.md)             | 开发工作流程                    | ✅ 完成  |
| [decisions.md](./decisions.md)           | 架构决策记录（ADR）             | ✅ 完成  |
| [prompts.md](./prompts.md)               | 常用 AI 提示词                  | ✅ 完成  |
| [future-work.md](./future-work.md)       | 后续工作和版本规划              | ✅ 完成  |
| [AGENTS.md](./AGENTS.md)                 | AI 助手指南                     | ✅ 完成  |

### 用户文档

| 文档                                                 | 说明         | 更新状态 |
| ---------------------------------------------------- | ------------ | -------- |
| [docs/api-usage-guide.md](./docs/api-usage-guide.md) | API 使用指南 | ✅ 最新  |
| [examples/](./examples/)                             | 代码示例     | ✅ 完成  |

### 架构分析

| 文档                                                                         | 说明           |
| ---------------------------------------------------------------------------- | -------------- |
| [ARCHITECTURE_COMPLIANCE_ANALYSIS.md](./ARCHITECTURE_COMPLIANCE_ANALYSIS.md) | 架构合规性分析 |
| [ARCHITECTURE_COMPLIANCE_SUMMARY.md](./ARCHITECTURE_COMPLIANCE_SUMMARY.md)   | 架构合规性总结 |
| [CONTEXT-MAP.md](./CONTEXT-MAP.md)                                           | 上下文映射     |
| [AUDIT-CHECKLIST.md](./AUDIT-CHECKLIST.md)                                   | 审计检查清单   |

---

## 🚀 快速开始

### 功能概述

多租户系统提供完整的 SaaS 平台多租户能力：

- ✅ **租户管理**: 创建、激活、停用租户
- ✅ **租户上下文**: 自动识别和管理租户上下文
- ✅ **配额管理**: 组织数、成员数、存储空间限制
- ✅ **套餐管理**: FREE/STARTER/PRO/ENTERPRISE 四档套餐
- ✅ **数据隔离**: 行级数据隔离，防止跨租户数据泄露
- ✅ **NestJS 集成**: Guard、Interceptor、Decorator

### API 端点

所有 API 端点都需要超级管理员权限：

```
POST   /api/admin/tenants                    # 创建租户
GET    /api/admin/tenants                    # 列出租户
GET    /api/admin/tenants/:id                # 获取租户详情
PUT    /api/admin/tenants/:id                # 更新租户
POST   /api/admin/tenants/:id/activate       # 激活租户
POST   /api/admin/tenants/:id/suspend        # 停用租户
GET    /api/admin/tenants/:id/usage          # 获取使用情况
```

### 使用示例

```typescript
// 创建租户
const response = await fetch('http://localhost:3000/api/admin/tenants', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  credentials: 'include',
  body: JSON.stringify({
    name: '企业A',
    slug: 'enterprise-a',
    plan: 'PRO',
    ownerId: 'user-123',
    maxOrganizations: 10,
    maxMembers: 100,
  }),
});

// 激活租户
await fetch(`http://localhost:3000/api/admin/tenants/${tenantId}/activate`, {
  method: 'POST',
  credentials: 'include',
});
```

详见：[API 使用指南](./docs/api-usage-guide.md)

---

## 📊 实现进度

### 总体进度

```
Phase 1: BDD        ████████████ 100% ✅
Phase 2: 领域层    ████████████ 100% ✅
Phase 3: 应用层    ████████████ 100% ✅
Phase 4: 基础设施层 ██████████░░  80% 🟡
Phase 5: API 层    ██████████░░  85% 🟡
```

### 测试覆盖率

| 层级       | 目标     | 实际    | 状态   |
| ---------- | -------- | ------- | ------ |
| 领域层     | >95%     | 100%    | ✅     |
| 应用层     | >90%     | 90%     | ✅     |
| 基础设施层 | >85%     | 60%     | 🟡     |
| API 层     | >80%     | 0%      | ⏳     |
| **总体**   | **>90%** | **80%** | **🟡** |

### 代码统计

- **实现文件**: 41 个
- **测试文件**: 12 个
- **测试通过率**: 100% (80/80 tests)

详见：[implementation.md](./implementation.md)

---

## 🏗️ 架构设计

### DDD 分层架构

```
libs/tenancy/
├── domain/                    # 领域层（100% 测试覆盖）
│   ├── tenant/
│   │   ├── tenant.aggregate.ts
│   │   ├── tenant-plan.vo.ts
│   │   ├── tenant-status.vo.ts
│   │   ├── tenant-quota.vo.ts
│   │   └── events/
│   ├── repository.interface.ts
│   └── fixtures/
├── application/               # 应用层（90% 测试覆盖）
│   ├── commands/
│   │   ├── create-tenant.command.ts
│   │   ├── activate-tenant.command.ts
│   │   ├── suspend-tenant.command.ts
│   │   ├── update-tenant-quota.command.ts
│   │   └── change-tenant-plan.command.ts
│   └── queries/
│       ├── get-tenant-by-id.query.ts
│       ├── list-tenants.query.ts
│       └── check-tenant-quota.query.ts
├── infrastructure/            # 基础设施层（60% 测试覆盖）
│   ├── repository/
│   │   └── mikro-orm-tenant.repository.ts
│   ├── adapters/
│   │   └── tenant-context.adapter.ts
│   └── guards/
│       └── tenant.guard.ts
└── api/                       # API 层（在 apps/gateway）
    ├── tenant.controller.ts
    ├── tenant.service.ts
    └── dto/
```

### 关键设计决策

#### ADR-001: 独立包设计

**决策**: 创建 `@oksai/tenancy` 独立包

**理由**:

- ✅ 符合单一职责原则
- ✅ 可独立开发、测试、发布
- ✅ 其他项目可直接引入
- ✅ 清晰的模块边界

详见：[decisions.md](./decisions.md#ADR-001)

#### ADR-002: 租户上下文管理

**决策**: 使用 Node.js AsyncLocalStorage

**理由**:

- ✅ Node.js 原生支持，无需额外依赖
- ✅ 性能优于 CLS 和 Request Scope
- ✅ 支持异步操作和 Promise 链

详见：[decisions.md](./decisions.md#ADR-002)

#### ADR-003: 租户隔离策略

**决策**: 装饰器 + 拦截器 + ORM 钩子（混合方案）

**理由**:

- ✅ 灵活：通过装饰器控制隔离级别
- ✅ 安全：默认强制隔离，防止遗漏
- ✅ 可调试：装饰器明确声明，易于理解

详见：[decisions.md](./decisions.md#ADR-003)

---

## 🧪 测试

### 运行测试

```bash
# 运行所有测试
pnpm test

# 运行单元测试
pnpm vitest run libs/tenancy

# 运行测试并生成覆盖率报告
pnpm vitest run libs/tenancy --coverage

# Watch 模式
pnpm vitest watch libs/tenancy
```

### 测试策略

- **单元测试 (70%)**: 领域逻辑、业务规则
- **集成测试 (20%)**: 数据库、NestJS 集成
- **E2E 测试 (10%)**: 完整业务流程

详见：[testing.md](./testing.md)

---

## 📚 代码示例

### 领域层示例

```typescript
// 创建租户
const result = Tenant.create({
  name: '企业A',
  slug: 'enterprise-a',
  plan: 'PRO',
  ownerId: 'user-123',
});

if (result.isOk()) {
  const tenant = result.value;
  console.log(tenant.id); // UUID
  console.log(tenant.status); // TenantStatus(PENDING)

  // 激活租户
  tenant.activate();
  console.log(tenant.status); // TenantStatus(ACTIVE)
}
```

### 应用层示例

```typescript
// 使用 Command 创建租户
const command = new CreateTenantCommand({
  name: '企业A',
  slug: 'enterprise-a',
  plan: 'PRO',
  ownerId: 'user-123',
});

const result = await commandBus.execute(command);
```

更多示例：[examples/](./examples/)

---

## 🔧 开发指南

### 开发前准备

1. **阅读设计文档**: [design.md](./design.md)
2. **查看实现进度**: [implementation.md](./implementation.md)
3. **了解工作流程**: [workflow.md](./workflow.md)
4. **参考 AI 指南**: [AGENTS.md](./AGENTS.md)

### 开发流程

遵循标准的 TDD + DDD 流程：

```
1. 用户故事（design.md）
   ↓
2. BDD 场景（features/*.feature）
   ↓
3. TDD 循环（Red-Green-Refactor）
   ↓
4. 代码实现（领域层 → 应用层 → 基础设施层）
   ↓
5. 代码审查
```

详见：[workflow.md](./workflow.md)

### 常用命令

```bash
# 运行开发服务器
pnpm dev

# 运行测试
pnpm test

# 构建项目
pnpm build

# Lint 检查
pnpm lint

# 格式化代码
pnpm format
```

---

## 📖 文档查看

### Swagger UI

```bash
# 启动应用
pnpm dev

# 访问 Swagger
open http://localhost:3000/api/swagger

# 访问 Scalar
open http://localhost:3000/docs
```

### API 使用指南

完整的 API 使用文档，包括：

- 所有端点的详细说明
- 请求/响应示例
- 常见用例
- 最佳实践
- 错误处理

详见：[docs/api-usage-guide.md](./docs/api-usage-guide.md)

---

## 🗺️ 路线图

### v1.0 (当前)

- ✅ 租户创建、激活、停用
- ✅ 租户上下文管理
- ✅ 租户配额检查
- ✅ 租户套餐管理
- ✅ 租户隔离（行级）
- ✅ NestJS 集成

### v1.1 (计划中)

- 🔥 租户套餐变更历史
- 🔥 租户配额预警
- 🔥 租户使用量统计

### v1.2+ (未来)

- 🌟 租户自定义域名
- 🌟 租户 API 限流
- 🌟 租户功能开关
- 🌟 租户数据库物理隔离
- 🌟 租户审计日志

详见：[future-work.md](./future-work.md)

---

## 🤝 贡献指南

### 开发规范

1. **代码风格**: 遵循 Biome 配置
2. **测试覆盖率**: >90%
3. **文档**: 公共 API 必须有 TSDoc 注释
4. **提交信息**: 使用 Conventional Commits

### 提交 PR

1. Fork 项目
2. 创建特性分支
3. 编写测试（TDD）
4. 实现功能
5. 提交 PR

详见：[AGENTS.md](./AGENTS.md)

---

## 📞 联系方式

- **GitHub Issues**: 提交 Bug 报告或功能请求
- **技术讨论**: 在开发群讨论
- **文档反馈**: 提交 Issue 或 PR

---

## 📄 许可证

Copyright © 2026 oksai.cc

---

**最后更新**: 2026-03-09  
**版本**: v1.0  
**状态**: Phase 5 - 85% 完成
