# 多租户管理测试计划

## 测试策略

遵循测试金字塔：单元测试 70% | 集成测试 20% | E2E 测试 10%

---

## 单元测试（70%）

### 领域层

| 组件                    | 测试文件                   | 测试用例                   | 状态 |
| :---------------------- | :------------------------- | :------------------------- | :--: |
| **Tenant 聚合根**       | `tenant.aggregate.spec.ts` | 创建、激活、停用、配额检查 |  ✅  |
| **TenantPlan 值对象**   | `tenant-plan.vo.spec.ts`   | 套餐创建、特性检查、比较   |  ✅  |
| **TenantStatus 值对象** | `tenant-status.vo.spec.ts` | 状态创建、转换检查         |  ✅  |
| **TenantQuota 值对象**  | `tenant-quota.vo.spec.ts`  | 配额检查、比较、操作       |  ✅  |
| **领域事件**            | `events/*.spec.ts`         | 事件创建、属性验证         |  ✅  |

**测试覆盖率**：领域层 100%

### 应用层

| 组件              | 测试文件                 | 测试用例                   | 状态 |
| :---------------- | :----------------------- | :------------------------- | :--: |
| **TenantService** | `tenant.service.spec.ts` | CRUD、激活、停用、配额管理 |  ✅  |
| **DTO 验证**      | `dto/*.spec.ts`          | 请求验证、错误处理         |  ✅  |

**测试覆盖率**：应用层 100%

### 基础设施层

| 组件                 | 测试文件                     | 测试用例                | 状态 |
| :------------------- | :--------------------------- | :---------------------- | :--: |
| **TenantMiddleware** | `tenant.middleware.spec.ts`  | 租户识别、验证、注入    |  ✅  |
| **TenantGuard**      | `tenant.guard.spec.ts`       | 权限检查、跨租户防护    |  ✅  |
| **TenantFilter**     | `tenant.filter.spec.ts`      | 自动过滤、动态启用/禁用 |  ✅  |
| **QuotaGuard**       | `guards/quota.guard.spec.ts` | 配额检查、超限处理      |  ✅  |

**测试覆盖率**：基础设施层 100%

### 接口层

| 组件                 | 测试文件                    | 测试用例      | 状态 |
| :------------------- | :-------------------------- | :------------ | :--: |
| **TenantController** | `tenant.controller.spec.ts` | 7 个 API 端点 |  ✅  |

**测试覆盖率**：接口层 100%

### 测试模式

```typescript
// AAA 模式（Arrange-Act-Assert）
describe('Tenant', () => {
  describe('activate', () => {
    it('should activate pending tenant', () => {
      // Arrange - 准备测试数据
      const tenant = TenantFixture.createPending();

      // Act - 执行操作
      const result = tenant.activate();

      // Assert - 验证结果
      expect(result.isOk()).toBe(true);
      expect(tenant.status.isActive()).toBe(true);
    });

    it('should fail when activating non-pending tenant', () => {
      // Arrange
      const tenant = TenantFixture.createDefault(); // 已激活

      // Act
      const result = tenant.activate();

      // Assert
      expect(result.isFail()).toBe(true);
      expect(result.error.message).toContain('只有待审核的租户才能激活');
    });
  });
});
```

---

## 集成测试（20%）

| 组件                   | 测试文件                        | 测试内容                   | 状态 |
| :--------------------- | :------------------------------ | :------------------------- | :--: |
| **数据隔离**           | `tenant.isolation.spec.ts`      | 租户间数据隔离验证         |  ✅  |
| **TenantRepository**   | `tenant.repository.int-spec.ts` | CRUD 操作、事务            |  ⏳  |
| **Middleware + Guard** | `tenant.flow.int-spec.ts`       | 租户识别→权限检查→数据过滤 |  ⏳  |
| **配额系统**           | `quota.flow.int-spec.ts`        | 配额检查→资源创建→超限拒绝 |  ⏳  |

### 数据隔离测试（已完成）

```typescript
// tenant.isolation.spec.ts
describe('Tenant Isolation', () => {
  it('should not allow cross-tenant access', async () => {
    // 创建两个租户的用户
    const tenant1User = await createTestUser({ tenantId: 'tenant-1' });
    const tenant2User = await createTestUser({ tenantId: 'tenant-2' });

    // 租户 1 的用户请求
    const response = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${tenant1User.token}`);

    // 应该只返回租户 1 的用户
    expect(response.body.users).toHaveLength(1);
    expect(response.body.users[0].tenantId).toBe('tenant-1');
  });

  it('should prevent cross-tenant resource access', async () => {
    const tenant1User = await createTestUser({ tenantId: 'tenant-1' });
    const tenant2Resource = await createTestResource({ tenantId: 'tenant-2' });

    const response = await request(app.getHttpServer())
      .get(`/api/resources/${tenant2Resource.id}`)
      .set('Authorization', `Bearer ${tenant1User.token}`);

    expect(response.status).toBe(403);
    expect(response.body.message).toContain('无权访问其他租户的资源');
  });
});
```

---

## E2E 测试（10%）

| 场景             | 测试文件                       | 测试内容            | 状态 |
| :--------------- | :----------------------------- | :------------------ | :--: |
| **租户生命周期** | `tenant-lifecycle.e2e-spec.ts` | 创建→激活→使用→停用 |  ⏳  |
| **配额限制**     | `quota-limits.e2e-spec.ts`     | 超过配额时拒绝请求  |  ⏳  |
| **跨租户访问**   | `cross-tenant.e2e-spec.ts`     | 完整的租户隔离流程  |  ⏳  |

### BDD 场景

| 场景类型    | Feature 文件                    | 步骤定义                | 状态 |
| :---------- | :------------------------------ | :---------------------- | :--: |
| Happy Path  | `features/multi-tenant.feature` | `multi-tenant.steps.ts` |  ⏳  |
| Error Cases | 同上                            | 同上                    |  ⏳  |
| Edge Cases  | 同上                            | 同上                    |  ⏳  |

---

## 测试覆盖率目标

- [x] 领域层覆盖率 > 95%（实际：100%）
- [x] 应用层覆盖率 > 90%（实际：100%）
- [x] 基础设施层覆盖率 > 85%（实际：100%）
- [x] 接口层覆盖率 > 90%（实际：100%）
- [x] 总体覆盖率 > 80%（实际：100%）

**当前测试统计**：

| 组件                     | 测试数  |  通过率  |  覆盖率  |
| :----------------------- | :-----: | :------: | :------: |
| 领域层（Tenant）         |   21    |   100%   |   100%   |
| 领域层（TenantPlan）     |   19    |   100%   |   100%   |
| 领域层（TenantStatus）   |   14    |   100%   |   100%   |
| 领域层（TenantQuota）    |   25    |   100%   |   100%   |
| 基础设施层（Middleware） |   10    |   100%   |   100%   |
| 基础设施层（Guard）      |    9    |   100%   |   100%   |
| 应用层（Service）        |   18    |   100%   |   100%   |
| 接口层（Controller）     |   21    |   100%   |   100%   |
| 集成测试（数据隔离）     |    9    |   100%   |    -     |
| **总计**                 | **146** | **100%** | **100%** |

---

## 测试命令

```bash
# 运行单元测试
pnpm vitest run apps/gateway/src/tenant/**/*.spec.ts
pnpm vitest run libs/shared/database/src/domain/tenant/**/*.spec.ts

# 运行集成测试
pnpm vitest run apps/gateway/src/tenant/**/*.int-spec.ts

# 运行 E2E 测试
pnpm vitest run apps/gateway/src/tenant/**/*.e2e-spec.ts

# 运行覆盖率
pnpm vitest run --coverage

# 监听模式
pnpm vitest watch

# 运行特定测试文件
pnpm vitest run tenant.aggregate.spec.ts

# 运行特定测试用例
pnpm vitest run -t "should create tenant"

# 运行所有多租户相关测试
pnpm vitest run tenant
```

---

## 测试数据 Fixtures

### Tenant Fixture

```typescript
// tenant.fixture.ts
import { Tenant } from './tenant.aggregate.js';
import { TenantPlan, TenantStatus, TenantQuota } from './index.js';

export class TenantFixture {
  /**
   * 创建默认租户（已激活）
   */
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

  /**
   * 创建待审核租户
   */
  static createPending(): Tenant {
    return Tenant.create({
      name: '待审核租户',
      slug: 'pending-tenant',
      plan: TenantPlan.starter(),
      status: TenantStatus.pending(),
      ownerId: 'owner-456',
    }).value;
  }

  /**
   * 创建停用租户
   */
  static createSuspended(): Tenant {
    const tenant = TenantFixture.createDefault();
    tenant.suspend('测试停用');
    return tenant;
  }

  /**
   * 创建带配额的租户
   */
  static createWithQuota(quota: Partial<TenantQuotaProps>): Tenant {
    return Tenant.create({
      name: '配额测试租户',
      slug: 'quota-test',
      plan: TenantPlan.pro(),
      ownerId: 'owner-789',
      quota: TenantQuota.create(quota),
    }).value;
  }

  /**
   * 创建无效租户（用于验证测试）
   */
  static createInvalid(): CreateTenantProps {
    return {
      name: '', // 故意设置为无效值
      slug: '',
      plan: 'INVALID' as any,
      ownerId: '',
    };
  }

  /**
   * 创建接近配额限制的租户
   */
  static createNearQuotaLimit(): Tenant {
    return Tenant.create({
      name: '配额接近限制',
      slug: 'near-limit',
      plan: TenantPlan.pro(),
      ownerId: 'owner-near',
      quota: TenantQuota.create({
        maxMembers: 100,
        currentMembers: 99,
        maxOrganizations: 10,
        currentOrganizations: 10,
      }),
    }).value;
  }

  /**
   * 创建超出配额的租户
   */
  static createOverQuota(): Tenant {
    return Tenant.create({
      name: '配额超限',
      slug: 'over-quota',
      plan: TenantPlan.pro(),
      ownerId: 'owner-over',
      quota: TenantQuota.create({
        maxMembers: 100,
        currentMembers: 100,
        maxOrganizations: 10,
        currentOrganizations: 10,
      }),
    }).value;
  }
}
```

### TenantContext Mock

```typescript
// tenant-context.mock.ts
import { ITenantContextService } from '@oksai/shared/context';
import { vi } from 'vitest';

export class MockTenantContextService implements ITenantContextService {
  private tenantId: string | null = null;
  private userId: string | null = null;

  setTenantId(id: string): void {
    this.tenantId = id;
  }

  setUserId(id: string): void {
    this.userId = id;
  }

  getTenantId(): string | null {
    return this.tenantId;
  }

  getUserId(): string | null {
    return this.userId;
  }

  run = vi.fn((context, callback) => {
    this.tenantId = context.tenantId;
    this.userId = context.userId || null;
    return callback();
  });

  clear(): void {
    this.tenantId = null;
    this.userId = null;
  }
}
```

---

## Mock 策略

| 依赖                     | Mock 方式                  | 说明                   |
| :----------------------- | :------------------------- | :--------------------- |
| **TenantContextService** | `MockTenantContextService` | 模拟租户上下文注入     |
| **TenantRepository**     | `MockTenantRepository`     | 内存实现，保存到 Map   |
| **EventBus**             | `MockEventBus`             | 记录发布的事件         |
| **Database**             | `vi.fn()`                  | Vitest mock 数据库操作 |

### Mock Repository 示例

```typescript
// tenant.repository.mock.ts
import { ITenantRepository } from './tenant.repository.interface.js';
import { Tenant } from './tenant.aggregate.js';

export class MockTenantRepository implements ITenantRepository {
  private items: Map<string, Tenant> = new Map();

  async save(tenant: Tenant): Promise<void> {
    this.items.set(tenant.id, tenant);
  }

  async findById(id: string): Promise<Tenant | null> {
    return this.items.get(id) ?? null;
  }

  async findBySlug(slug: string): Promise<Tenant | null> {
    for (const tenant of this.items.values()) {
      if (tenant.slug === slug) {
        return tenant;
      }
    }
    return null;
  }

  async delete(id: string): Promise<void> {
    this.items.delete(id);
  }

  // 测试辅助方法
  clear(): void {
    this.items.clear();
  }

  count(): number {
    return this.items.size;
  }
}
```

---

## 测试场景清单

### ✅ 领域层测试场景

#### Tenant 聚合根

- [x] 创建租户（成功）
- [x] 创建租户（名称为空）
- [x] 创建租户（slug 为空）
- [x] 创建租户（自动添加 TenantCreatedEvent）
- [x] 激活租户（成功）
- [x] 激活租户（非待审核状态）
- [x] 停用租户（成功）
- [x] 停用租户（非激活状态）
- [x] 检查配额（未超限）
- [x] 检查配额（已超限）
- [x] 更新配额（成功）
- [x] 重建租户（reconstitute）

#### TenantPlan 值对象

- [x] 创建 FREE 套餐
- [x] 创建 STARTER 套餐
- [x] 创建 PRO 套餐
- [x] 创建 ENTERPRISE 套餐
- [x] 检查特性支持
- [x] 套餐比较
- [x] 无效套餐类型

#### TenantStatus 值对象

- [x] 创建 PENDING 状态
- [x] 创建 ACTIVE 状态
- [x] 创建 SUSPENDED 状态
- [x] 创建 DELETED 状态
- [x] 状态检查（isPending、isActive、isSuspended、isDeleted）
- [x] 转换检查（canBeActivated、canBeSuspended、canBeAccessed）

#### TenantQuota 值对象

- [x] 创建配额（成功）
- [x] 创建套餐默认配额
- [x] 检查配额是否在限制内
- [x] 检查配额是否达到限制
- [x] 获取剩余配额
- [x] 增加使用量
- [x] 设置配额限制
- [x] 无限配额

### ✅ 基础设施层测试场景

#### TenantMiddleware

- [x] 从 JWT Token 提取 tenantId
- [x] 从 Header 提取 tenantId
- [x] 从子域名提取 tenantId
- [x] 缺少租户标识（返回 400）
- [x] 租户不存在（返回 403）
- [x] 租户已停用（返回 403）
- [x] 注入到 TenantContext
- [x] 租户 ID 不一致（优先使用 JWT）
- [x] 超级管理员跳过验证
- [x] 排除路径（/health、/metrics）

#### TenantGuard

- [x] 检查用户租户归属（成功）
- [x] 检查用户租户归属（失败）
- [x] 检查资源租户归属（成功）
- [x] 检查资源租户归属（跨租户）
- [x] @SkipTenantGuard() 装饰器
- [x] 超级管理员权限
- [x] 无资源 ID（跳过检查）
- [x] 租户上下文为空（返回 401）

#### TenantFilter

- [x] 自动添加租户过滤条件
- [x] 动态获取租户上下文
- [x] 禁用过滤器（超级管理员）
- [x] 重新启用过滤器
- [x] 租户上下文为空（不过滤）
- [x] 支持的实体列表
- [x] 复合查询条件

### ✅ 应用层测试场景

#### TenantService

- [x] 创建租户（成功）
- [x] 创建租户（slug 已存在）
- [x] 获取租户（通过 ID）
- [x] 获取租户（通过 slug）
- [x] 列出租户（分页）
- [x] 更新租户（成功）
- [x] 激活租户（成功）
- [x] 激活租户（非待审核）
- [x] 停用租户（成功）
- [x] 停用租户（非激活）
- [x] 获取租户使用情况
- [x] 检查配额（未超限）
- [x] 检查配额（已超限）
- [x] 更新配额
- [x] 租户不存在
- [x] 权限检查

#### TenantController

- [x] POST /api/admin/tenants（创建）
- [x] GET /api/admin/tenants（列表）
- [x] GET /api/admin/tenants/:id（详情）
- [x] PUT /api/admin/tenants/:id（更新）
- [x] POST /api/admin/tenants/:id/activate（激活）
- [x] POST /api/admin/tenants/:id/suspend（停用）
- [x] GET /api/admin/tenants/:id/usage（使用情况）

### ✅ 集成测试场景

#### 数据隔离测试

- [x] 租户 A 无法访问租户 B 的数据
- [x] 自动租户过滤生效
- [x] 跨租户资源访问被拒绝
- [x] 租户上下文正确传递
- [x] Middleware + Guard + Filter 协作
- [x] 创建数据自动设置 tenantId
- [x] 更新数据检查租户归属
- [x] 删除数据检查租户归属
- [x] 批量操作租户隔离

### ⏳ E2E 测试场景（待实现）

#### 租户生命周期

- [ ] 完整流程：创建 → 激活 → 使用 → 停用
- [ ] 管理员创建租户
- [ ] 租户所有者接收邀请
- [ ] 租户成员注册
- [ ] 租户配额管理
- [ ] 租户数据导出
- [ ] 租户删除

#### 配额限制

- [ ] 成员配额超限（拒绝邀请）
- [ ] 组织配额超限（拒绝创建）
- [ ] 存储配额超限（拒绝上传）
- [ ] 配额警告通知
- [ ] 配额升级流程

---

## 性能测试

### 测试场景

```typescript
// tenant.performance.spec.ts
describe('Tenant Performance', () => {
  it('should filter 10000 records in < 100ms', async () => {
    // 创建 10000 条测试数据
    await createTestData(10000);

    const start = Date.now();
    const result = await userRepository.findAll();
    const duration = Date.now() - start;

    expect(duration).toBeLessThan(100);
    expect(result.length).toBeGreaterThan(0);
  });

  it('should handle 100 concurrent requests', async () => {
    const promises = Array(100)
      .fill(null)
      .map((_, i) =>
        request(app.getHttpServer())
          .get('/api/users')
          .set('Authorization', `Bearer ${getToken(i)}`),
      );

    const results = await Promise.all(promises);
    results.forEach((r) => expect(r.status).toBe(200));
  });
});
```

---

## 测试最佳实践

### 1. 测试命名

```typescript
// ✅ 好的命名
it('should activate pending tenant', () => {});
it('should fail when name is empty', () => {});
it('should prevent cross-tenant access', () => {});

// ❌ 差的命名
it('test1', () => {});
it('activation', () => {});
it('works', () => {});
```

### 2. 测试独立性

```typescript
// ✅ 每个测试独立
describe('Tenant', () => {
  let tenant: Tenant;

  beforeEach(() => {
    tenant = TenantFixture.createDefault();
  });

  it('test 1', () => {
    // 使用全新的 tenant
  });

  it('test 2', () => {
    // 使用全新的 tenant，不受 test 1 影响
  });
});
```

### 3. 测试覆盖率

```bash
# 生成覆盖率报告
pnpm vitest run --coverage

# 检查未覆盖的代码
# 查看生成的 coverage/lcov-report/index.html
```

---

## 参考资料

- [测试指南](../../specs-testing/README.md)
- [单元测试最佳实践](../../specs-testing/02-unit-testing.md)
- [Mock 与 Stub 指南](../../specs-testing/07-mocking-guide.md)
- [集成测试指南](../../specs-testing/03-integration-testing.md)
- [Vitest 文档](https://vitest.dev/)
