# 多租户管理提示词

---

## 开发流程

### 同步实现状态

审查多租户管理已实现内容，并更新 `specs/multi-tenant-management/implementation.md`。

```
审查多租户管理的实现进度，并更新 implementation.md：
1. 检查 apps/gateway/src/tenant/ 目录的实现情况
2. 检查 libs/shared/database/src/domain/tenant/ 的领域模型
3. 更新 implementation.md 的 TDD 循环进度表
4. 更新测试覆盖率数据
```

### 开始开发新功能

按照工作流程开发多租户管理：

1. **用户故事**：在 `specs/multi-tenant-management/design.md` 中定义用户故事（使用 INVEST 原则）
2. **BDD 场景**：在 `features/multi-tenant.feature` 中编写验收场景
3. **TDD 循环**：
   - 🔴 Red: 编写失败的单元测试
   - 🟢 Green: 用最简代码让测试通过
   - 🔵 Refactor: 优化代码结构
4. **代码实现**：按照 DDD 分层实现功能

详见 `specs/multi-tenant-management/workflow.md`。

### 继续开发功能

继续处理多租户管理。请先阅读 `specs/multi-tenant-management/implementation.md` 了解当前状态。

```
继续开发多租户管理功能：
1. 阅读 implementation.md 了解当前进度
2. 查看"进行中"和"下一步"部分
3. 继续实现未完成的功能
```

---

## 测试相关

### 生成测试

为多租户组件编写测试，遵循现有测试模式（使用 Vitest）。

**示例：租户领域层测试**

```typescript
// tenant.aggregate.spec.ts
describe('Tenant', () => {
  describe('create', () => {
    it('should create tenant with valid props', () => {
      const result = Tenant.create({
        name: '企业A',
        slug: 'enterprise-a',
        plan: TenantPlanValue.PRO,
        ownerId: 'user-123',
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.name).toBe('企业A');
    });

    it('should fail when name is empty', () => {
      const result = Tenant.create({
        name: '',
        slug: 'enterprise-a',
        plan: TenantPlanValue.PRO,
        ownerId: 'user-123',
      });

      expect(result.isFail()).toBe(true);
      expect(result.error.message).toContain('租户名称不能为空');
    });
  });
});
```

### 生成测试 Fixture

为 Tenant 创建测试数据工厂：

```typescript
// tenant.fixture.ts
import { Tenant } from './tenant.aggregate.js';
import { TenantPlan, TenantStatus, TenantQuota } from './index.js';

export class TenantFixture {
  static createDefault(overrides?: Partial<TenantProps>): Tenant {
    return Tenant.create({
      name: '测试租户',
      slug: 'test-tenant',
      plan: TenantPlan.pro(),
      status: TenantStatus.active(),
      ownerId: 'owner-123',
      quota: TenantQuota.createForPlan(TenantPlanValue.PRO),
      ...overrides,
    }).value;
  }

  static createPending(): Tenant {
    return Tenant.create({
      name: '待审核租户',
      slug: 'pending-tenant',
      plan: TenantPlan.starter(),
      status: TenantStatus.pending(),
      ownerId: 'owner-456',
    }).value;
  }

  static createWithQuota(quota: Partial<TenantQuotaProps>): Tenant {
    return Tenant.create({
      name: '配额测试租户',
      slug: 'quota-test',
      plan: TenantPlan.pro(),
      ownerId: 'owner-789',
      quota: TenantQuota.create(quota),
    }).value;
  }

  static createInvalid(): CreateTenantProps {
    return {
      name: '', // 故意设置为无效值
      slug: '',
      plan: 'INVALID' as any,
      ownerId: '',
    };
  }
}
```

### 生成 Mock 对象

为依赖创建 Mock 实现：

```typescript
// tenant-context.mock.ts
import { ITenantContextService } from '@oksai/shared/context';
import { vi } from 'vitest';

export class MockTenantContextService implements ITenantContextService {
  private tenantId: string | null = null;

  setTenantId(id: string): void {
    this.tenantId = id;
  }

  getTenantId(): string | null {
    return this.tenantId;
  }

  run = vi.fn((context, callback) => callback());

  clear(): void {
    this.tenantId = null;
  }
}

// 使用示例
const mockContext = new MockTenantContextService();
mockContext.setTenantId('tenant-123');
```

### 运行测试检查

检查多租户管理的测试状态：

```bash
# 运行单元测试
pnpm vitest run apps/gateway/src/tenant/**/*.spec.ts
pnpm vitest run libs/shared/database/src/domain/tenant/**/*.spec.ts

# 运行集成测试
pnpm vitest run apps/gateway/src/tenant/**/*.int-spec.ts

# 检查覆盖率
pnpm vitest run --coverage

# 更新 implementation.md 中的覆盖率数据
```

### TDD 开发

使用 TDD 方式开发多租户组件：

**示例：实现配额检查功能**

```typescript
// 🔴 Red: 编写失败的测试
describe('Tenant', () => {
  describe('checkQuota', () => {
    it('should return true when under quota', () => {
      const tenant = TenantFixture.createWithQuota({
        maxMembers: 100,
        currentMembers: 99,
      });

      const result = tenant.checkQuota('members');

      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(true);
    });

    it('should return false when at quota', () => {
      const tenant = TenantFixture.createWithQuota({
        maxMembers: 100,
        currentMembers: 100,
      });

      const result = tenant.checkQuota('members');

      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(false);
    });
  });
});

// 🟢 Green: 最简实现
export class Tenant extends AggregateRoot<TenantProps> {
  checkQuota(
    resource: 'organizations' | 'members' | 'storage',
  ): Result<boolean, Error> {
    const current = this.props.quota[`current${capitalize(resource)}`];
    const max = this.props.quota[`max${capitalize(resource)}`];

    return Result.ok(current < max);
  }
}

// 🔵 Refactor: 优化代码
export class Tenant extends AggregateRoot<TenantProps> {
  checkQuota(resource: QuotaResource): Result<boolean, Error> {
    const result = this.props.quota.isWithinLimit(resource);
    return Result.ok(result);
  }
}
```

---

## BDD 相关

### 生成 BDD 场景

为多租户管理编写 BDD 场景：

```gherkin
# features/multi-tenant.feature
Feature: 多租户管理
  作为 SaaS 平台的企业客户
  我想要 确保我的数据与其他客户完全隔离
  以便于 保护商业机密和用户隐私，满足数据保护法规要求

  Background:
    Given 系统已启动
    And 数据库连接正常

  @happy-path @tenant-isolation
  Scenario: 租户识别与数据隔离
    Given 用户已登录，JWT Token 包含 tenantId = "tenant-123"
    And 租户状态为 "active"
    When 用户请求 GET /api/users
    Then 系统自动注入租户上下文 { tenantId: "tenant-123" }
    And 系统自动应用过滤器 WHERE tenant_id = "tenant-123"
    And 返回租户 "tenant-123" 的用户列表
    And 不包含其他租户的用户

  @error-case @cross-tenant
  Scenario: 跨租户访问资源
    Given 用户属于租户 "tenant-123"
    And 资源属于租户 "tenant-456"
    When 用户尝试访问该资源
    Then TenantGuard 检查失败
    And 返回 403 Forbidden
    And 错误信息："无权访问其他租户的资源"

  @quota @business-rule
  Scenario: 检查租户配额
    Given 租户 "tenant-123" 配额 { maxMembers: 100, currentMembers: 99 }
    When 邀请新成员
    Then 系统检查配额：99 < 100
    And 允许邀请

  @edge-case @quota-exceeded
  Scenario: 超过配额限制
    Given 租户 "tenant-123" 配额 { maxMembers: 100, currentMembers: 100 }
    When 邀请新成员
    Then 系统检查配额：100 >= 100
    And 返回 403 Forbidden
    And 错误信息："已达到配额限制，请升级套餐"
```

### 实现 BDD 步骤定义

为 `multi-tenant.feature` 实现步骤定义：

```typescript
// features/step-definitions/multi-tenant.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'vitest';
import { TenantContextService } from '@oksai/shared/context';
import { TenantGuard } from '../../apps/gateway/src/tenant/tenant.guard.js';

let tenantContext: TenantContextService;
let tenantGuard: TenantGuard;
let result: any;
let error: Error;

// ==================== Given ====================

Given('用户已登录，JWT Token 包含 tenantId = {string}', (tenantId: string) => {
  tenantContext = new TenantContextService();
  tenantContext.setTenantId(tenantId);
});

Given('租户状态为 {string}', async (status: string) => {
  // Mock 或查询租户状态
});

Given('用户属于租户 {string}', (tenantId: string) => {
  tenantContext.setTenantId(tenantId);
});

Given('资源属于租户 {string}', async (tenantId: string) => {
  // 准备测试数据
});

Given(
  '租户 {string} 配额 { maxMembers: {int}, currentMembers: {int} }',
  async (tenantId: string, maxMembers: number, currentMembers: number) => {
    // 设置配额数据
  },
);

// ==================== When ====================

When('用户请求 GET /api/users', async () => {
  try {
    // 模拟 HTTP 请求
    result = await simulateGetUsersRequest(tenantContext);
  } catch (e) {
    error = e;
  }
});

When('用户尝试访问该资源', async () => {
  try {
    await tenantGuard.canActivate(mockExecutionContext);
  } catch (e) {
    error = e;
  }
});

When('邀请新成员', async () => {
  try {
    result = await inviteMember({ email: 'new@example.com' });
  } catch (e) {
    error = e;
  }
});

// ==================== Then ====================

Then('系统自动注入租户上下文 { tenantId: {string} }', (tenantId: string) => {
  expect(tenantContext.getTenantId()).toBe(tenantId);
});

Then('系统自动应用过滤器 WHERE tenant_id = {string}', (tenantId: string) => {
  // 验证 SQL 查询日志
  expect(lastQuery).toContain(`tenant_id = '${tenantId}'`);
});

Then('返回租户 {string} 的用户列表', (tenantId: string) => {
  expect(result.users).toBeDefined();
  result.users.forEach((user: any) => {
    expect(user.tenantId).toBe(tenantId);
  });
});

Then('不包含其他租户的用户', () => {
  const tenantId = tenantContext.getTenantId();
  result.users.forEach((user: any) => {
    expect(user.tenantId).toBe(tenantId);
  });
});

Then('返回 {int} Forbidden', (statusCode: number) => {
  expect(error).toBeDefined();
  expect(error.status).toBe(statusCode);
});

Then('错误信息：{string}', (message: string) => {
  expect(error.message).toContain(message);
});

Then('TenantGuard 检查失败', () => {
  expect(error).toBeDefined();
  expect(error.message).toContain('无权访问');
});

Then('系统检查配额：{int} < {int}', (current: number, max: number) => {
  expect(current).toBeLessThan(max);
});

Then('允许邀请', () => {
  expect(result.success).toBe(true);
});
```

---

## 代码审查

### 代码审查

从以下角度审查多租户管理改动：

```bash
# 审查要点：
1. 类型安全
   - 所有 tenantId 使用 string 类型
   - Result<T, E> 错误处理
   - 避免 any 类型

2. 错误处理
   - 所有异步操作使用 try-catch
   - 领域错误返回 Result.fail()
   - HTTP 错误使用 NestJS 异常

3. 安全性
   - 所有查询包含 tenantId 过滤
   - TenantGuard 应用到所有敏感端点
   - 超级管理员操作有审计日志

4. 边界情况
   - tenantId 为 null 的处理
   - 租户不存在的处理
   - 租户状态异常的处理
```

### 测试审查

审查多租户管理的测试质量：

```bash
# 测试审查清单
- [ ] 测试命名清晰（should {behavior} when {condition}）
- [ ] 使用 AAA 模式（Arrange-Act-Assert）
- [ ] 覆盖正常流程、异常流程、边界条件
- [ ] Mock 使用正确
- [ ] 测试独立、可重复执行
- [ ] 数据隔离测试完整
- [ ] 跨租户访问测试充分
- [ ] 配额检查测试覆盖所有边界
```

---

## 文档相关

### 生成带截图的文档

为多租户管理生成带截图的文档：

```bash
# 1. 启动应用
pnpm dev

# 2. 打开浏览器到管理员后台
# http://localhost:3000/admin/tenants

# 3. 采集截图
# - tenant-list.png (租户列表)
# - tenant-create.png (创建租户表单)
# - tenant-detail.png (租户详情)
# - tenant-quota.png (配额使用情况)

# 4. 保存到 specs/multi-tenant-management/docs/screenshots/

# 5. 更新 docs/README.md
```

**文档结构**：

```markdown
# 多租户管理文档

## 功能概览

![租户列表](./screenshots/tenant-list.png)

## 创建租户

### 步骤 1: 填写租户信息

![创建租户](./screenshots/tenant-create.png)

### 步骤 2: 设置配额

![配额设置](./screenshots/tenant-quota.png)

## 配置选项

- maxOrganizations: 最大组织数
- maxMembers: 最大成员数
- maxStorage: 最大存储空间（字节）

## 常见用例

1. 创建新租户
2. 激活租户
3. 管理配额
```

### 提升文档为公开版本

将内部文档提升为公开的 Mintlify 文档：

```bash
# 1. 审阅 specs/multi-tenant-management/docs/README.md

# 2. 复制内容到 docs/multi-tenant.mdx（Mintlify 格式）

# 3. 移动截图到 docs/images/multi-tenant/

# 4. 更新 docs/mint.json 导航
{
  "navigation": [
    {
      "group": "平台功能",
      "pages": ["multi-tenant"]
    }
  ]
}

# 5. 调整文案以适配客户受众（移除内部细节）
```

---

## 检查清单

### 验证工作流程完成度

检查多租户管理是否完成所有开发步骤：

```markdown
- [x] 用户故事已定义（符合 INVEST 原则）
- [ ] BDD 场景已编写并通过（features/multi-tenant.feature）
- [x] TDD 循环已完成（Red-Green-Refactor）
  - [x] 领域层：Tenant, TenantQuota, TenantPlan, TenantStatus
  - [x] 基础设施层：TenantMiddleware, TenantGuard, TenantFilter
  - [x] 应用层：TenantService
  - [x] 接口层：TenantController
- [x] 单元测试覆盖率 > 80%（实际 100%）
- [x] 集成测试已编写（数据隔离测试）
- [ ] E2E 测试已编写（待 BDD 场景实现）
- [x] 代码已 Review
- [ ] 文档已生成（待补充 UI 截图）
```

### 发布前检查

检查多租户管理是否可以发布：

```markdown
- [x] 所有测试通过（67/67）
- [x] 覆盖率达标（领域层 >95%，总体 >85%）
- [x] 无 TypeScript 错误
- [ ] 无 Lint 错误（有少量 unused variable）
- [ ] 文档已更新
- [ ] CHANGELOG 已更新
- [ ] 数据库迁移已执行
```

---

## 常见开发任务提示词

### 添加新的租户识别方式

```
为 TenantMiddleware 添加新的租户识别方式：{识别方式}

要求：
1. 实现识别逻辑
2. 编写单元测试
3. 更新优先级顺序
4. 更新文档
```

### 实现新的配额资源

```
为租户配额系统添加新的资源类型：{资源名称}

步骤：
1. 更新 TenantQuota 值对象
2. 添加配额检查逻辑
3. 更新 QuotaGuard
4. 编写测试
5. 更新 API 响应
```

### 添加租户统计数据

```
实现租户统计数据服务，统计以下指标：
- 组织数量
- 成员数量
- 存储使用量
- 活跃用户数

要求：
1. 创建 TenantStatsService
2. 实现统计 API
3. 添加缓存（Redis）
4. 编写测试
```

---

## 参考资源

- [开发工作流程](./workflow.md)
- [测试计划](./testing.md)
- [架构决策](./decisions.md)
- [后续工作](./future-work.md)
