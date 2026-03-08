# 多租户管理开发工作流程

本文档描述了多租户管理功能从需求到实现的完整开发工作流程。

---

## 一、工作流程概览

### 1.1 完整开发流程

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  用户故事     │ →  │  BDD 场景    │ →  │  TDD 循环    │ →  │  代码实现    │
│  User Story  │    │  Scenario    │    │  Red-Green   │    │  Production  │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
      ↓                   ↓                   ↓                   ↓
   业务需求            验收标准            单元测试            领域代码
   业务语言            Gherkin语法         技术实现            基础设施
```

### 1.2 各阶段目标

| 阶段         | 目标         | 产出物          | 参与者                 | 状态 |
| :----------- | :----------- | :-------------- | :--------------------- | :--: |
| **用户故事** | 明确业务需求 | 用户故事卡片    | 产品经理、用户         |  ✅  |
| **BDD 场景** | 定义验收标准 | Feature 文件    | 产品经理、开发者、测试 |  ⏳  |
| **TDD 循环** | 驱动代码设计 | 单元测试 + 实现 | 开发者                 |  ✅  |
| **代码实现** | 完成功能开发 | 生产代码        | 开发者                 |  ✅  |

---

## 二、阶段一：用户故事（User Story）

### 2.1 主用户故事

```gherkin
作为 SaaS 平台的企业客户
我想要 确保我的数据与其他客户完全隔离
以便于 保护商业机密和用户隐私，满足数据保护法规要求
```

### 2.2 相关用户故事

1. **管理员管理租户**

   ```gherkin
   作为系统管理员
   我想要 查看和管理所有租户
   以便于 运营和维护平台
   ```

2. **租户所有者创建组织**

   ```gherkin
   作为租户所有者
   我想要 为我的租户创建多个组织
   以便于 按团队/部门隔离数据
   ```

3. **开发人员自动过滤**

   ```gherkin
   作为开发人员
   我想要 自动应用租户过滤
   以便于 避免手动过滤导致的数据泄露
   ```

4. **租户所有者设置配额**
   ```gherkin
   作为租户所有者
   我想要 设置租户配额
   以便于 控制资源使用和成本
   ```

### 2.3 用户故事验收标准（INVEST 原则）

| 原则            | 说明   | 检查点                               | 状态 |
| :-------------- | :----- | :----------------------------------- | :--: |
| **I**ndependent | 独立性 | ✅ 租户隔离机制独立于业务逻辑        |  ✅  |
| **N**egotiable  | 可协商 | ✅ 隔离策略可以根据需求调整          |  ✅  |
| **V**aluable    | 有价值 | ✅ 防止数据泄露，满足合规要求        |  ✅  |
| **E**stimable   | 可估算 | ✅ 基于标准实现模式，可估算工作量    |  ✅  |
| **S**mall       | 足够小 | ❌ 需要拆分为多个 Sprint（P0/P1/P2） |  -   |
| **T**estable    | 可测试 | ✅ 可通过集成测试验证隔离效果        |  ✅  |

---

## 三、阶段二：BDD 场景设计

### 3.1 从用户故事到场景

```
用户故事 → 拆分场景 → 编写 Gherkin → 定义步骤
```

### 3.2 场景设计示例

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

  @happy-path @tenant-creation
  Scenario: 创建租户并设置配额
    Given 系统管理员已登录
    When 管理员创建租户 { name: "企业A", plan: "PRO", maxMembers: 100 }
    Then 系统创建 Tenant 实体
    And 系统设置配额 { maxMembers: 100, maxOrganizations: 10 }
    And 发布 TenantCreatedEvent 领域事件
    And 租户状态为 "pending"

  @happy-path @tenant-activation
  Scenario: 租户激活
    Given 租户 "tenant-123" 状态为 "pending"
    When 系统管理员激活租户
    Then 租户状态变为 "active"
    And 发布 TenantActivatedEvent 领域事件

  @happy-path @quota-check
  Scenario: 检查租户配额
    Given 租户 "tenant-123" 配额 { maxMembers: 100, currentMembers: 99 }
    When 邀请新成员
    Then 系统检查配额：99 < 100
    And 允许邀请

  @error-case @invalid-tenant
  Scenario: 无效租户访问
    Given 用户请求中缺少租户标识
    When 用户访问任何需要租户的 API
    Then 返回 400 Bad Request
    And 错误信息："缺少租户标识"

  @error-case @tenant-suspended
  Scenario: 租户已停用
    Given 用户已登录，租户状态为 "suspended"
    When 用户请求任何 API
    Then 返回 403 Forbidden
    And 错误信息："租户已被停用"

  @error-case @cross-tenant
  Scenario: 跨租户访问资源
    Given 用户属于租户 "tenant-123"
    And 资源属于租户 "tenant-456"
    When 用户尝试访问该资源
    Then TenantGuard 检查失败
    And 返回 403 Forbidden
    And 错误信息："无权访问其他租户的资源"

  @error-case @quota-exceeded
  Scenario: 超过配额限制
    Given 租户 "tenant-123" 配额 { maxMembers: 100, currentMembers: 100 }
    When 邀请新成员
    Then 系统检查配额：100 >= 100
    And 返回 403 Forbidden
    And 错误信息："已达到配额限制，请升级套餐"

  @edge-case @tenant-id-inconsistent
  Scenario: 租户 ID 不一致
    Given 用户 JWT Token 中 tenantId = "tenant-123"
    And 请求 Header 中 X-Tenant-ID = "tenant-456"
    When 系统验证租户标识
    Then 使用 JWT Token 中的 tenantId
    And 记录警告日志："租户 ID 不一致"

  @edge-case @zero-quota
  Scenario: 租户配额为零
    Given 租户 "tenant-123" 配额 { maxMembers: 0 }
    When 邀请新成员
    Then 返回 403 Forbidden
    And 错误信息："租户配额为零，请联系管理员"

  @edge-case @organization-switch
  Scenario: 租户切换组织
    Given 用户属于租户 "tenant-123"
    And 用户属于组织 "org-1" 和 "org-2"
    When 用户切换活动组织到 "org-2"
    Then 更新 JWT Token 中的 activeOrganizationId
    And 租户上下文保持不变 { tenantId: "tenant-123" }
```

### 3.3 BDD 场景状态

| 场景类型                | 场景数 | 已实现 |  状态   |
| :---------------------- | :----: | :----: | :-----: |
| 正常流程（Happy Path）  |   4    |   4    |   ✅    |
| 异常流程（Error Cases） |   4    |   4    |   ✅    |
| 边界条件（Edge Cases）  |   3    |   0    |   ⏳    |
| **总计**                | **11** | **8**  | **73%** |

---

## 四、阶段三：TDD 开发循环

### 4.1 双循环开发模式

```
┌─────────────────────────────────────────────────────────────────┐
│                    外层循环：BDD                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Feature: 多租户管理                                       │  │
│  │  Scenario: 租户识别与数据隔离                              │  │
│  │    Given... When... Then...                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              内层循环：TDD                                 │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  🔴 Red: 编写失败的单元测试                         │  │  │
│  │  │  🟢 Green: 用最简单的方式让测试通过                 │  │  │
│  │  │  🔵 Refactor: 优化代码，保持测试通过                │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 TDD 循环示例

#### 示例 1：实现 Tenant 聚合根

**🔴 Red: 编写失败的测试**

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
      expect(result.value.slug).toBe('enterprise-a');
      expect(result.value.plan.value).toBe(TenantPlanValue.PRO);
      expect(result.value.status.isPending()).toBe(true);
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

    it('should add TenantCreatedEvent', () => {
      const result = Tenant.create({
        name: '企业A',
        slug: 'enterprise-a',
        plan: TenantPlanValue.PRO,
        ownerId: 'user-123',
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.hasDomainEvents()).toBe(true);
      expect(result.value.domainEventsCount).toBe(1);
      expect(result.value.domainEvents[0]).toBeInstanceOf(TenantCreatedEvent);
    });
  });
});
```

**🟢 Green: 最简实现**

```typescript
// tenant.aggregate.ts
export class Tenant extends AggregateRoot<TenantProps> {
  private constructor(props: TenantProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(props: CreateTenantProps): Result<Tenant, Error> {
    // 最简验证
    if (!props.name?.trim()) {
      return Result.fail(new Error('租户名称不能为空'));
    }

    if (!props.slug?.trim()) {
      return Result.fail(new Error('租户标识不能为空'));
    }

    // 创建
    const tenant = new Tenant(
      {
        id: UniqueEntityID.generate(),
        name: props.name,
        slug: props.slug,
        plan: TenantPlan.create(props.plan),
        status: TenantStatus.pending(),
        ownerId: props.ownerId,
        quota: TenantQuota.createForPlan(props.plan),
        createdAt: new Date(),
        updatedAt: new Date(),
      },
      props.id,
    );

    // 添加事件
    tenant.addDomainEvent(new TenantCreatedEvent(tenant.id));

    return Result.ok(tenant);
  }
}
```

**🔵 Refactor: 优化代码**

```typescript
// tenant.aggregate.ts
export class Tenant extends AggregateRoot<TenantProps> {
  private constructor(props: TenantProps, id?: UniqueEntityID) {
    super(props, id);
  }

  static create(props: CreateTenantProps): Result<Tenant, Error> {
    // 提取验证逻辑
    const errors = this.validate(props);
    if (errors.length > 0) {
      return Result.fail(errors[0]);
    }

    // 提取创建逻辑
    const tenant = new Tenant(this.initializeProps(props), props.id);

    // 提取事件触发
    tenant.emitCreatedEvent();

    return Result.ok(tenant);
  }

  private static validate(props: CreateTenantProps): Error[] {
    const errors: Error[] = [];

    const guardResult = Guard.combine([
      Guard.againstEmpty('租户名称', props.name),
      Guard.againstEmpty('租户标识', props.slug),
      Guard.againstEmpty('租户所有者', props.ownerId),
    ]);

    if (!guardResult.succeeded) {
      errors.push(new Error(guardResult.message));
    }

    return errors;
  }

  private static initializeProps(props: CreateTenantProps): TenantProps {
    return {
      id: props.id || UniqueEntityID.generate(),
      name: props.name,
      slug: props.slug,
      plan: TenantPlan.create(props.plan),
      status: TenantStatus.pending(),
      ownerId: props.ownerId,
      quota: TenantQuota.createForPlan(props.plan),
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  private emitCreatedEvent(): void {
    this.addDomainEvent(new TenantCreatedEvent(this.id));
  }
}
```

---

#### 示例 2：实现配额检查

**🔴 Red: 编写失败的测试**

```typescript
// tenant.aggregate.spec.ts
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

    it('should return false when over quota', () => {
      const tenant = TenantFixture.createWithQuota({
        maxMembers: 100,
        currentMembers: 101,
      });

      const result = tenant.checkQuota('members');

      expect(result.isOk()).toBe(true);
      expect(result.value).toBe(false);
    });
  });
});
```

**🟢 Green: 最简实现**

```typescript
// tenant.aggregate.ts
export class Tenant extends AggregateRoot<TenantProps> {
  checkQuota(
    resource: 'organizations' | 'members' | 'storage',
  ): Result<boolean, Error> {
    const current = this.props.quota[`current${capitalize(resource)}`];
    const max = this.props.quota[`max${capitalize(resource)}`];

    return Result.ok(current < max);
  }
}
```

**🔵 Refactor: 优化代码**

```typescript
// tenant.aggregate.ts
export class Tenant extends AggregateRoot<TenantProps> {
  checkQuota(resource: QuotaResource): Result<boolean, Error> {
    // 委托给 TenantQuota 值对象
    const result = this.props.quota.isWithinLimit(resource);
    return Result.ok(result);
  }
}

// tenant-quota.vo.ts
export class TenantQuota extends ValueObject<TenantQuotaProps> {
  isWithinLimit(resource: QuotaResource): boolean {
    const current = this.props[`current${capitalize(resource)}`];
    const max = this.props[`max${capitalize(resource)}`];

    return current < max;
  }
}
```

---

### 4.3 TDD 循环进度

| 层级           | 组件             | Red | Green | Refactor | 测试数  |   状态   |
| :------------- | :--------------- | :-: | :---: | :------: | :-----: | :------: |
| **领域层**     |
| 值对象         | TenantPlan       | ✅  |  ✅   |    ✅    |   19    |    ✅    |
| 值对象         | TenantStatus     | ✅  |  ✅   |    ✅    |   14    |    ✅    |
| 值对象         | TenantQuota      | ✅  |  ✅   |    ✅    |   25    |    ✅    |
| 聚合根         | Tenant           | ✅  |  ✅   |    ✅    |   21    |    ✅    |
| 领域事件       | Events (4)       | ✅  |  ✅   |    ✅    |    4    |    ✅    |
| **基础设施层** |
| 过滤器         | TenantFilter     | ✅  |  ✅   |    ✅    |    9    |    ✅    |
| 中间件         | TenantMiddleware | ✅  |  ✅   |    ✅    |   10    |    ✅    |
| 守卫           | TenantGuard      | ✅  |  ✅   |    ✅    |    9    |    ✅    |
| 守卫           | QuotaGuard       | ✅  |  ✅   |    ✅    |    5    |    ✅    |
| **应用层**     |
| 服务           | TenantService    | ✅  |  ✅   |    ✅    |   18    |    ✅    |
| **接口层**     |
| 控制器         | TenantController | ✅  |  ✅   |    ✅    |   21    |    ✅    |
| **集成测试**   |
| 数据隔离       | TenantIsolation  | ✅  |  ✅   |    -     |    9    |    ✅    |
| **总计**       |                  | ✅  |  ✅   |    ✅    | **164** | **100%** |

---

## 五、阶段四：应用层与基础设施层

### 5.1 应用层实现

#### TenantService（已完成）

```typescript
// tenant.service.ts
@Injectable()
export class TenantService {
  constructor(
    private readonly tenantRepository: ITenantRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async create(dto: CreateTenantDto): Promise<Result<Tenant, Error>> {
    // 1. 检查 slug 唯一性
    const existing = await this.tenantRepository.findBySlug(dto.slug);
    if (existing) {
      return Result.fail(new Error('租户标识已存在'));
    }

    // 2. 创建租户（领域逻辑）
    const result = Tenant.create({
      name: dto.name,
      slug: dto.slug,
      plan: dto.plan,
      ownerId: dto.ownerId,
    });

    if (result.isFail()) {
      return result;
    }

    // 3. 保存
    await this.tenantRepository.save(result.value);

    // 4. 发布事件
    await this.eventBus.publishAll(result.value.domainEvents);
    result.value.clearDomainEvents();

    return Result.ok(result.value);
  }

  async activate(id: string): Promise<Result<void, Error>> {
    // 1. 查找租户
    const tenant = await this.tenantRepository.findById(id);
    if (!tenant) {
      return Result.fail(new Error('租户不存在'));
    }

    // 2. 激活（领域逻辑）
    const result = tenant.activate();
    if (result.isFail()) {
      return result;
    }

    // 3. 保存
    await this.tenantRepository.save(tenant);

    // 4. 发布事件
    await this.eventBus.publishAll(tenant.domainEvents);
    tenant.clearDomainEvents();

    return Result.ok(undefined);
  }
}
```

### 5.2 基础设施层实现

#### TenantMiddleware（已完成）

```typescript
// tenant.middleware.ts
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly tenantService: TenantService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. 提取 tenantId（优先级：JWT > Header > 子域名）
    const tenantId = this.extractTenantId(req);

    if (!tenantId) {
      throw new BadRequestException('缺少租户标识');
    }

    // 2. 验证租户有效性
    const tenant = await this.tenantService.getById(tenantId);
    if (!tenant) {
      throw new ForbiddenException('租户不存在');
    }

    if (!tenant.status.canBeAccessed()) {
      throw new ForbiddenException('租户已被停用');
    }

    // 3. 注入到上下文
    const context = TenantContext.create({
      tenantId,
      userId: req.user?.id,
    });

    this.tenantContext.run(context, () => next());
  }

  private extractTenantId(req: Request): string | null {
    return (
      req.user?.tenantId || // JWT Token
      (req.headers['x-tenant-id'] as string) || // Header
      this.extractFromSubdomain(req.hostname) // 子域名
    );
  }
}
```

#### TenantGuard（已完成）

```typescript
// tenant.guard.ts
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly reflector: Reflector,
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. 检查是否跳过
    if (this.shouldSkip(context)) {
      return true;
    }

    // 2. 获取租户上下文
    const tenantId = this.tenantContext.getTenantId();
    if (!tenantId) {
      throw new UnauthorizedException('缺少租户上下文');
    }

    // 3. 检查资源归属
    const resourceId = this.getResourceId(context);
    if (resourceId) {
      const resource = await this.getResource(resourceId);
      if (resource?.tenantId !== tenantId) {
        throw new ForbiddenException('无权访问其他租户的资源');
      }
    }

    return true;
  }

  private shouldSkip(context: ExecutionContext): boolean {
    return this.reflector.get(SkipTenantGuard, context.getHandler()) === true;
  }
}
```

---

## 六、完整工作流程示例

### 6.1 示例：实现"租户激活"功能

#### Step 1: 编写用户故事

```gherkin
作为系统管理员
我想要 激活待审核的租户
以便于 让租户所有者开始使用平台
```

#### Step 2: 编写 BDD 场景

```gherkin
# features/multi-tenant.feature
Scenario: 租户激活
  Given 租户 "tenant-123" 状态为 "pending"
  When 系统管理员激活租户
  Then 租户状态变为 "active"
  And 发布 TenantActivatedEvent 领域事件
```

#### Step 3: TDD 循环

```typescript
// 🔴 Red
describe('Tenant', () => {
  describe('activate', () => {
    it('should activate pending tenant', () => {
      const tenant = TenantFixture.createPending();

      const result = tenant.activate();

      expect(result.isOk()).toBe(true);
      expect(tenant.status.isActive()).toBe(true);
      expect(tenant.hasDomainEvents()).toBe(true);
      expect(tenant.domainEvents[0]).toBeInstanceOf(TenantActivatedEvent);
    });

    it('should fail when activating non-pending tenant', () => {
      const tenant = TenantFixture.createDefault(); // 已激活

      const result = tenant.activate();

      expect(result.isFail()).toBe(true);
      expect(result.error.message).toContain('只有待审核的租户才能激活');
    });
  });
});

// 🟢 Green
export class Tenant extends AggregateRoot<TenantProps> {
  activate(): Result<void, Error> {
    if (!this.props.status.isPending()) {
      return Result.fail(new Error('只有待审核的租户才能激活'));
    }

    this.props.status = TenantStatus.active();
    this.addDomainEvent(new TenantActivatedEvent(this.id));

    return Result.ok(undefined);
  }
}

// 🔵 Refactor
export class Tenant extends AggregateRoot<TenantProps> {
  activate(): Result<void, Error> {
    // 委托给值对象
    const statusResult = this.props.status.canBeActivated();
    if (!statusResult) {
      return Result.fail(new Error('只有待审核的租户才能激活'));
    }

    this.updateStatus(TenantStatus.active());
    this.emitActivatedEvent();

    return Result.ok(undefined);
  }

  private updateStatus(status: TenantStatus): void {
    this.props.status = status;
    this.props.updatedAt = new Date();
  }

  private emitActivatedEvent(): void {
    this.addDomainEvent(new TenantActivatedEvent(this.id));
  }
}
```

#### Step 4: 应用层实现

```typescript
// tenant.service.ts
async activate(id: string): Promise<Result<void, Error>> {
  const tenant = await this.tenantRepository.findById(id);
  if (!tenant) {
    return Result.fail(new Error('租户不存在'));
  }

  const result = tenant.activate();
  if (result.isFail()) {
    return result;
  }

  await this.tenantRepository.save(tenant);
  await this.eventBus.publishAll(tenant.domainEvents);
  tenant.clearDomainEvents();

  return Result.ok(undefined);
}
```

#### Step 5: 接口层实现

```typescript
// tenant.controller.ts
@Controller('admin/tenants')
export class TenantController {
  @Post(':id/activate')
  async activate(@Param('id') id: string) {
    const result = await this.tenantService.activate(id);

    if (result.isFail()) {
      throw new BadRequestException(result.error.message);
    }

    return {
      success: true,
      message: '租户已激活',
    };
  }
}
```

#### Step 6: 验证 BDD 场景通过

```bash
$ pnpm vitest run features/multi-tenant.feature

Feature: 多租户管理
  Scenario: 租户激活
    ✅ Given 租户 "tenant-123" 状态为 "pending"
    ✅ When 系统管理员激活租户
    ✅ Then 租户状态变为 "active"
    ✅ And 发布 TenantActivatedEvent 领域事件

1 scenario (1 passed)
4 steps (4 passed)
```

---

## 七、开发检查清单

### 7.1 用户故事检查清单

- [x] 使用标准模板（作为...我想要...以便于...）
- [x] 符合 INVEST 原则
- [x] 有明确的验收标准
- [x] 已与产品经理确认需求

### 7.2 BDD 场景检查清单

- [x] 覆盖正常流程（Happy Path）- 4 个场景
- [x] 覆盖异常流程（Error Cases）- 4 个场景
- [ ] 覆盖边界条件（Edge Cases）- 3 个场景（待实现步骤定义）
- [x] 场景独立、可重复执行
- [x] 步骤定义清晰

### 7.3 TDD 循环检查清单

- [x] 先写失败的测试（Red）
- [x] 用最简代码让测试通过（Green）
- [x] 优化代码结构（Refactor）
- [x] 测试覆盖所有业务规则
- [x] 测试命名清晰表达意图

### 7.4 代码实现检查清单

- [x] 领域逻辑在聚合根/实体中
- [x] 值对象不可变
- [x] 领域事件正确触发
- [x] 仓储接口定义在领域层
- [x] 基础设施实现正确

---

## 八、常用命令

```bash
# 运行 BDD 测试
pnpm vitest run features/

# 运行单元测试（TDD）
pnpm vitest run apps/gateway/src/tenant/**/*.spec.ts
pnpm vitest run libs/shared/database/src/domain/tenant/**/*.spec.ts

# 监听模式运行测试
pnpm vitest watch

# 运行特定测试文件
pnpm vitest run tenant.aggregate.spec.ts

# 运行测试并生成覆盖率
pnpm vitest run --coverage

# 运行所有测试
pnpm vitest run

# 运行集成测试
pnpm vitest run tenant.isolation.spec.ts

# 运行 E2E 测试
pnpm vitest run tenant-lifecycle.e2e-spec.ts
```

---

## 九、参考资源

- [设计文档](./design.md)
- [测试计划](./testing.md)
- [架构决策](./decisions.md)
- [实现进度](./implementation.md)
- [后续工作](./future-work.md)
- [测试指南文档系列](../../specs-testing/README.md)
- [单元测试最佳实践](../../specs-testing/02-unit-testing.md)
- [BDD 测试方法](../../specs-testing/03-bdd-testing.md)
- [TDD 方法论](../../specs-testing/04-tdd-methodology.md)
- [DDD 架构中的测试](../../specs-testing/05-testing-in-ddd.md)
