# 多租户系统测试

## 测试策略概览

| 测试类型 | 占比 | 目标覆盖率 | 重点                |
| :------- | :--: | :--------: | :------------------ |
| 单元测试 | 70%  |    >90%    | 领域逻辑、业务规则  |
| 集成测试 | 20%  |    >85%    | 数据库、NestJS 集成 |
| E2E 测试 | 10%  |    >80%    | 完整业务流程        |

---

## 单元测试（70%）

### 领域层测试（>95%）

#### Tenant 聚合根测试

**测试场景**：

1. **创建租户**
   - ✅ 创建有效的租户
   - ✅ slug 太短（<3 字符）
   - ✅ slug 太长（>100 字符）
   - ✅ slug 格式无效（包含特殊字符）
   - ✅ name 为空
   - ✅ 自动设置 PENDING 状态
   - ✅ 发布 TenantCreatedEvent

2. **激活租户**
   - ✅ PENDING → ACTIVE
   - ✅ 已激活的租户不能再次激活
   - ✅ SUSPENDED 状态不能激活
   - ✅ 发布 TenantActivatedEvent

3. **停用租户**
   - ✅ ACTIVE → SUSPENDED
   - ✅ 停用原因不能为空
   - ✅ PENDING 状态不能停用
   - ✅ 发布 TenantSuspendedEvent

4. **配额管理**
   - ✅ 检查配额是否在限制内
   - ✅ 更新配额
   - ✅ 发布 TenantQuotaUpdatedEvent

5. **套餐变更**
   - ✅ 升级套餐（允许）
   - ✅ 降级套餐（当前使用量超限，拒绝）
   - ✅ 降级套餐（当前使用量未超限，允许）
   - ✅ 发布 TenantPlanChangedEvent

**测试示例**：

```typescript
// tenant.aggregate.spec.ts
describe('Tenant', () => {
  describe('create', () => {
    it('should create tenant with valid props', () => {
      const result = Tenant.create({
        name: '测试租户',
        slug: 'test-tenant',
        plan: 'PRO',
        ownerId: 'user-123',
      });

      expect(result.isOk()).toBe(true);
      const tenant = result.value as Tenant;
      expect(tenant.name).toBe('测试租户');
      expect(tenant.slug).toBe('test-tenant');
      expect(tenant.plan.value).toBe('PRO');
      expect(tenant.status.value).toBe('PENDING');
    });

    it('should fail when slug is too short', () => {
      const result = Tenant.create({
        ...validProps,
        slug: 'ab',
      });

      expect(result.isFail()).toBe(true);
      expect(result.error?.message).toContain('不能小于 3 个字符');
    });

    it('should publish TenantCreatedEvent', () => {
      const tenant = createTestTenant();

      expect(tenant.hasDomainEvents).toBe(true);
      expect(tenant.domainEventsCount).toBe(1);
      expect(tenant.domainEvents[0]).toBeInstanceOf(TenantCreatedEvent);
    });
  });

  describe('activate', () => {
    it('should activate pending tenant', () => {
      const tenant = createTestTenant(); // status: PENDING

      const result = tenant.activate();

      expect(result.isOk()).toBe(true);
      expect(tenant.status.value).toBe('ACTIVE');
      expect(tenant.hasDomainEvents).toBe(true);
    });

    it('should fail when tenant is already active', () => {
      const tenant = createTestTenant();
      tenant.activate(); // PENDING → ACTIVE

      const result = tenant.activate(); // 再次激活

      expect(result.isFail()).toBe(true);
      expect(result.error?.message).toContain('只有待审核的租户才能激活');
    });
  });
});
```

#### 值对象测试

**TenantPlan**：

- ✅ 创建有效的套餐（FREE/STARTER/PRO/ENTERPRISE）
- ✅ 无效的套餐值
- ✅ 获取配额限制
- ✅ 套餐比较（isHigherThan、isLowerThan）

**TenantStatus**：

- ✅ 创建有效的状态（PENDING/ACTIVE/SUSPENDED/DELETED）
- ✅ 状态转换规则（canBeActivated、canBeSuspended）
- ✅ 获取显示名称

**TenantQuota**：

- ✅ 创建有效的配额
- ✅ 配额检查（isWithinLimit）
- ✅ 根据套餐创建默认配额（createForPlan）
- ✅ 配额更新

**测试示例**：

```typescript
// tenant-quota.vo.spec.ts
describe('TenantQuota', () => {
  describe('isWithinLimit', () => {
    it('should return true when usage is within limit', () => {
      const quota = TenantQuota.create({
        maxOrganizations: 10,
        maxMembers: 50,
        maxStorageGB: 100,
      });

      expect(quota.isWithinLimit('organizations', 5)).toBe(true);
      expect(quota.isWithinLimit('members', 30)).toBe(true);
      expect(quota.isWithinLimit('storage', 80)).toBe(true);
    });

    it('should return false when usage exceeds limit', () => {
      const quota = TenantQuota.create({
        maxOrganizations: 10,
        maxMembers: 50,
        maxStorageGB: 100,
      });

      expect(quota.isWithinLimit('organizations', 11)).toBe(false);
      expect(quota.isWithinLimit('members', 51)).toBe(false);
      expect(quota.isWithinLimit('storage', 101)).toBe(false);
    });
  });

  describe('createForPlan', () => {
    it('should create quota based on plan', () => {
      const freeQuota = TenantQuota.createForPlan(TenantPlan.free());
      expect(freeQuota.maxOrganizations).toBe(1);
      expect(freeQuota.maxMembers).toBe(5);

      const proQuota = TenantQuota.createForPlan(TenantPlan.pro());
      expect(proQuota.maxOrganizations).toBe(50);
      expect(proQuota.maxMembers).toBe(200);
    });
  });
});
```

### 应用层测试（>90%）

#### Command Handler 测试

**CreateTenantHandler**：

- ✅ 创建租户成功
- ✅ slug 重复（返回错误）
- ✅ 验证所有参数
- ✅ 调用 Repository.save()

**ActivateTenantHandler**：

- ✅ 激活租户成功
- ✅ 租户不存在
- ✅ 租户状态不允许激活
- ✅ 发布领域事件

**SuspendTenantHandler**：

- ✅ 停用租户成功
- ✅ 停用原因为空（返回错误）
- ✅ 租户不存在
- ✅ 租户状态不允许停用

**ChangeTenantPlanHandler**：

- ✅ 升级套餐成功
- ✅ 降级套餐成功（未超限）
- ✅ 降级套餐失败（超限）
- ✅ 租户不存在

**测试示例**：

```typescript
// create-tenant.handler.spec.ts
describe('CreateTenantHandler', () => {
  let handler: CreateTenantHandler;
  let mockTenantRepo: MockRepository<ITenantRepository>;
  let mockEventBus: MockEventBus;

  beforeEach(() => {
    mockTenantRepo = new MockRepository();
    mockEventBus = new MockEventBus();
    handler = new CreateTenantHandler(mockTenantRepo, mockEventBus);
  });

  it('should create tenant successfully', async () => {
    const command = new CreateTenantCommand({
      name: '测试租户',
      slug: 'test-tenant',
      plan: 'PRO',
      ownerId: 'user-123',
    });

    const result = await handler.execute(command);

    expect(result.isOk()).toBe(true);
    expect(mockTenantRepo.save).toHaveBeenCalled();
    expect(mockEventBus.publish).toHaveBeenCalled();
  });

  it('should fail when slug already exists', async () => {
    mockTenantRepo.findBySlug.mockResolvedValue(Result.ok(existingTenant));

    const command = new CreateTenantCommand({
      name: '测试租户',
      slug: 'existing-slug',
      plan: 'PRO',
      ownerId: 'user-123',
    });

    const result = await handler.execute(command);

    expect(result.isFail()).toBe(true);
    expect(result.error?.message).toContain('slug 已存在');
  });
});
```

#### Query Handler 测试

**GetTenantByIdHandler**：

- ✅ 查询成功
- ✅ 租户不存在

**CheckTenantQuotaHandler**：

- ✅ 查询配额使用情况
- ✅ 实时模式（查询数据库）
- ✅ 缓存模式（使用缓存）

---

## 集成测试（20%）

### Repository 集成测试（>85%）

**TenantRepository (MikroORM)**：

```typescript
// tenant.repository.integration.spec.ts
describe('TenantRepository (Integration)', () => {
  let orm: MikroORM;
  let repository: TenantRepository;

  beforeAll(async () => {
    orm = await initTestDatabase();
    repository = new TenantRepository(orm.em);
  });

  afterAll(async () => {
    await orm.close();
  });

  beforeEach(async () => {
    await orm.em.nativeDelete(TenantEntity, {});
  });

  it('should save and find tenant', async () => {
    const tenant = createTestTenant();

    await repository.save(tenant);

    const found = await repository.findById(tenant.id.toString());
    expect(found.isOk()).toBe(true);
    expect(found.value?.slug).toBe(tenant.slug);
  });

  it('should enforce unique slug constraint', async () => {
    const tenant1 = createTestTenant({ slug: 'duplicate-slug' });
    const tenant2 = createTestTenant({ slug: 'duplicate-slug' });

    await repository.save(tenant1);
    const result = await repository.save(tenant2);

    expect(result.isFail()).toBe(true);
  });
});
```

### NestJS 集成测试

**TenantGuard**：

```typescript
// tenant.guard.integration.spec.ts
describe('TenantGuard (Integration)', () => {
  let app: INestApplication;
  let guard: TenantGuard;

  beforeAll(async () => {
    const module = await Test.createTestingModule({
      imports: [TenancyModule],
    }).compile();

    app = module.createNestApplication();
    guard = module.get(TenantGuard);
  });

  it('should allow access with valid tenant', async () => {
    const context = createMockExecutionContext({
      headers: { 'x-tenant-id': 'tenant-123' },
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(true);
  });

  it('should deny access without tenant', async () => {
    const context = createMockExecutionContext({
      headers: {},
    });

    const result = await guard.canActivate(context);

    expect(result).toBe(false);
  });
});
```

**TenantInterceptor**：

```typescript
// tenant.interceptor.integration.spec.ts
describe('TenantInterceptor (Integration)', () => {
  it('should set tenant context for request', async () => {
    const interceptor = new TenantInterceptor(tenantContextService);
    const context = createMockExecutionContext({
      headers: { 'x-tenant-id': 'tenant-123' },
    });

    await interceptor.intercept(context, mockCallHandler);

    const currentContext = tenantContextService.currentContext;
    expect(currentContext?.tenantId).toBe('tenant-123');
  });
});
```

### 租户隔离测试

```typescript
// tenant-isolation.integration.spec.ts
describe('Tenant Isolation (Integration)', () => {
  it('should isolate data between tenants', async () => {
    // 创建两个租户
    const tenant1 = await createTenant('tenant-1');
    const tenant2 = await createTenant('tenant-2');

    // 在 tenant1 上下文中创建组织
    await tenantContextService.runWithContext(
      { tenantId: tenant1.id },
      async () => {
        await createOrganization('Org 1');
      },
    );

    // 在 tenant2 上下文中查询
    const orgs = await tenantContextService.runWithContext(
      { tenantId: tenant2.id },
      async () => {
        return await organizationRepository.findAll();
      },
    );

    // 应该看不到 tenant1 的组织
    expect(orgs.length).toBe(0);
  });
});
```

---

## E2E 测试（10%）

### 完整业务流程测试

```typescript
// tenant-lifecycle.e2e.spec.ts
describe('Tenant Lifecycle (E2E)', () => {
  let app: INestApplication;
  let httpClient: ReturnType<typeof request>;

  beforeAll(async () => {
    app = await createTestApp();
    await app.listen(3000);
    httpClient = request(app.getHttpServer());
  });

  afterAll(async () => {
    await app.close();
  });

  it('should complete tenant lifecycle', async () => {
    // 1. 创建租户
    const createResponse = await httpClient
      .post('/api/tenants')
      .send({
        name: '测试租户',
        slug: 'test-tenant',
        plan: 'PRO',
        ownerId: 'user-123',
      })
      .expect(201);

    const tenantId = createResponse.body.id;

    // 2. 查询租户（应该是 PENDING 状态）
    const getResponse = await httpClient
      .get(`/api/tenants/${tenantId}`)
      .expect(200);

    expect(getResponse.body.status).toBe('PENDING');

    // 3. 激活租户
    await httpClient.patch(`/api/tenants/${tenantId}/activate`).expect(200);

    // 4. 使用租户访问资源
    await httpClient
      .get('/api/organizations')
      .set('X-Tenant-Id', tenantId)
      .expect(200);

    // 5. 停用租户
    await httpClient
      .patch(`/api/tenants/${tenantId}/suspend`)
      .send({ reason: '测试停用' })
      .expect(200);

    // 6. 停用后无法访问
    await httpClient
      .get('/api/organizations')
      .set('X-Tenant-Id', tenantId)
      .expect(403);
  });

  it('should reject quota exceeded operations', async () => {
    const tenant = await createActivatedTenant({ plan: 'FREE' }); // max 1 org

    // 创建第一个组织（成功）
    await httpClient
      .post('/api/organizations')
      .set('X-Tenant-Id', tenant.id)
      .send({ name: 'Org 1' })
      .expect(201);

    // 创建第二个组织（配额超限）
    await httpClient
      .post('/api/organizations')
      .set('X-Tenant-Id', tenant.id)
      .send({ name: 'Org 2' })
      .expect(403);
  });
});
```

---

## 测试工具和辅助函数

### Fixture 工厂

```typescript
// tenant.fixture.ts
export class TenantFixture {
  static createDefault(overrides?: Partial<CreateTenantProps>): Tenant {
    const result = Tenant.create({
      name: '测试租户',
      slug: `tenant-${Date.now()}`,
      plan: 'PRO',
      ownerId: 'user-123',
      ...overrides,
    });

    if (result.isFail()) {
      throw new Error(`Failed to create tenant: ${result.error?.message}`);
    }

    return result.value;
  }

  static createActivated(overrides?: Partial<CreateTenantProps>): Tenant {
    const tenant = this.createDefault(overrides);
    tenant.activate();
    return tenant;
  }
}
```

### Mock 工具

```typescript
// mock.repository.ts
export class MockRepository<T> {
  private items: Map<string, T> = new Map();

  async save(item: T & { id: string }): Promise<void> {
    this.items.set(item.id, item);
  }

  async findById(id: string): Promise<T | null> {
    return this.items.get(id) || null;
  }

  clear(): void {
    this.items.clear();
  }
}
```

---

## 测试覆盖率目标

| 层级       |   目标   |  实际  |  状态  |
| :--------- | :------: | :----: | :----: |
| 领域层     |   >95%   |   -%   |   ⏳   |
| 应用层     |   >90%   |   -%   |   ⏳   |
| 基础设施层 |   >85%   |   -%   |   ⏳   |
| API 层     |   >80%   |   -%   |   ⏳   |
| **总体**   | **>90%** | **-%** | **⏳** |

---

## 测试执行命令

```bash
# 运行所有测试
pnpm test

# 运行单元测试
pnpm vitest run libs/tenancy

# 运行集成测试
pnpm vitest run libs/tenancy --integration

# 运行 E2E 测试
pnpm vitest run apps/gateway --e2e

# 生成测试覆盖率报告
pnpm vitest run libs/tenancy --coverage

# Watch 模式
pnpm vitest watch libs/tenancy
```
