# AGENTS.md — 多租户管理

## 项目背景

实现完整的多租户隔离机制，包括租户识别、自动数据隔离、权限检查和配额管理，防止数据泄露和越权访问，满足数据保护法规要求。

## 开始前

1. **必读文档**：
   - 📖 `specs/multi-tenant-management/design.md` - 技术设计（Source of Truth）
   - 📊 `docs/evaluations/multi-tenant-evaluation.md` - 当前状态评估
   - 🏗️ `guidelines/archi/archi-06-multi-tenant.md` - 架构指南

2. **查看当前进度**：
   - `specs/multi-tenant-management/implementation.md` - 实现进度

3. **参考现有代码**：
   - 租户上下文：`libs/shared/context/src/lib/tenant-context.service.ts`
   - 租户实体：`libs/shared/database/src/entities/tenant.entity.ts`
   - 组织管理：`apps/gateway/src/auth/organization.service.ts`

4. **开发流程**：
   - 参考 `specs/_templates/workflow.md` 了解开发工作流程

## 开发工作流程

遵循 `specs/_templates/workflow.md` 中的标准流程：

### 1. 用户故事（INVEST 原则）

在 `design.md` 中已定义核心用户故事：

- **主故事**：作为 SaaS 平台的企业客户，确保数据与其他客户完全隔离
- **相关故事**：管理员管理租户、租户所有者创建组织、开发人员自动过滤

### 2. BDD 场景（Given-When-Then）

`design.md` 中已定义 11 个场景：

- ✅ 4 个正常流程
- ✅ 4 个异常流程
- ✅ 3 个边界条件

### 3. TDD 循环（Red-Green-Refactor）

```bash
# 启动测试监听
pnpm vitest watch

# 🔴 Red: 编写失败的测试
# 例如：tenant.filter.spec.ts
it('should filter by tenantId automatically', () => {
  // 这个测试会失败，因为 TenantFilter 还未实现
});

# 🟢 Green: 编写最简实现
# 实现 TenantFilter

# 🔵 Refactor: 优化代码
# 重构、提取公共逻辑
```

### 4. 代码实现（DDD 分层）

按照领域驱动设计分层：

1. **领域层**：Tenant 聚合根、TenantQuota 值对象
2. **应用层**：TenantService、TenantCommandHandler
3. **基础设施层**：TenantMiddleware、TenantGuard、TenantFilter
4. **接口层**：TenantController

## 核心依赖：@oksai/domain-core

**重要**：多租户管理功能必须充分利用 `@oksai/domain-core` 提供的 DDD 基础设施。

### 核心类映射

| Kernel 类          | 使用场景      | 示例                                              |
| ------------------ | ------------- | ------------------------------------------------- |
| **AggregateRoot**  | Tenant 聚合根 | `class Tenant extends AggregateRoot<TenantProps>` |
| **ValueObject**    | 值对象        | `TenantQuota`, `TenantPlan`, `TenantStatus`       |
| **DomainEvent**    | 领域事件      | `TenantCreatedEvent`, `TenantActivatedEvent`      |
| **Result**         | 错误处理      | `Result.ok(tenant)` 或 `Result.fail(error)`       |
| **Guard**          | 参数验证      | `Guard.againstEmpty('name', name)`                |
| **UniqueEntityID** | 实体 ID       | `new UniqueEntityID()`                            |

**详细指南**：参见 `docs/kernel-integration.md`

## 代码模式

### 多租户核心模式

#### 0. 使用 @oksai/domain-core 的 DDD 模式（推荐）

```typescript
// ✅ 正确：使用 AggregateRoot
import { AggregateRoot, Result, Guard, UniqueEntityID } from "@oksai/domain-core";

export class Tenant extends AggregateRoot<TenantProps> {
  private constructor(props: TenantProps, id?: UniqueEntityID) {
    super(props, id);
  }

  // 业务方法返回 Result
  public activate(): Result<void, Error> {
    if (!this.props.status.isPending()) {
      return Result.fail(new Error("只有待审核的租户才能激活"));
    }

    this.props.status = TenantStatus.active();
    this.addDomainEvent(new TenantActivatedEvent(...));

    return Result.ok(undefined);
  }

  // 工厂方法使用 Result
  public static create(props: {...}): Result<Tenant, Error> {
    // 使用 Guard 验证参数
    const guardResult = Guard.combine([
      Guard.againstEmpty("name", props.name),
      Guard.againstEmpty("slug", props.slug),
    ]);

    if (guardResult.isFail()) {
      return Result.fail(new Error(guardResult.error[0].message));
    }

    const tenant = new Tenant({...}, props.id);

    // 自动添加领域事件
    tenant.addDomainEvent(new TenantCreatedEvent(...));

    return Result.ok(tenant);
  }
}

// 使用示例
const result = Tenant.create({ name: "企业A", slug: "enterprise-a", ... });
if (result.isOk()) {
  const tenant = result.value;
  console.log(tenant.domainEvents); // 自动管理
}
```

#### 1. MikroORM 租户过滤器

```typescript
// libs/shared/database/src/filters/tenant.filter.ts
import { Filter, FilterQuery } from '@mikro-orm/core';
import { TenantContextService } from '@oksai/shared/context';

@Filter({
  name: 'tenant',
  cond: ({ em }: { em: EntityManager }) => {
    const tenantContext = em.getContext().tenantContext;
    if (!tenantContext?.tenantId) {
      return {};
    }
    return { tenantId: tenantContext.tenantId };
  },
  default: true,
  entity: ['User', 'Organization', 'Webhook'], // 应用的实体
})
export class TenantFilter {}
```

#### 2. 租户中间件

```typescript
// apps/gateway/src/tenant/tenant.middleware.ts
import { Injectable, NestMiddleware } from '@nestjs/common';
import { TenantContextService } from '@oksai/shared/context';

@Injectable()
export class TenantMiddleware implements NestMiddleware {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly sessionService: SessionService,
  ) {}

  async use(req: Request, res: Response, next: NextFunction) {
    // 1. 提取 tenantId（优先级：JWT > Header > 域名）
    const tenantId = this.extractTenantId(req);

    if (!tenantId) {
      throw new BadRequestException('缺少租户标识');
    }

    // 2. 验证租户有效性
    const tenant = await this.tenantService.getById(tenantId);
    if (!tenant || tenant.status !== 'ACTIVE') {
      throw new ForbiddenException('无效的租户或租户已被停用');
    }

    // 3. 注入到上下文
    const context = TenantContext.create({
      tenantId,
      userId: req.user?.id,
      correlationId: this.generateCorrelationId(),
    });

    this.tenantContext.run(context, () => next());
  }

  private extractTenantId(req: Request): string | null {
    return (
      req.user?.tenantId || // JWT Token
      req.headers['x-tenant-id'] || // Header
      this.extractFromDomain(req.hostname) // 域名
    );
  }
}
```

#### 3. 租户守卫

```typescript
// apps/gateway/src/tenant/tenant.guard.ts
import {
  Injectable,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
} from '@nestjs/common';
import { TenantContextService } from '@oksai/shared/context';

@Injectable()
export class TenantGuard implements CanActivate {
  constructor(private readonly tenantContext: TenantContextService) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const tenantId = this.tenantContext.tenantId;
    const resourceId = this.getResourceId(context);

    if (!resourceId) {
      return true; // 无资源 ID，跳过检查
    }

    // 检查资源是否属于当前租户
    const resource = await this.getResource(resourceId);
    if (resource.tenantId !== tenantId) {
      throw new ForbiddenException('无权访问其他租户的资源');
    }

    return true;
  }
}
```

#### 4. 配额检查装饰器

```typescript
// apps/gateway/src/tenant/quota.decorator.ts
import { SetMetadata } from '@nestjs/common';

export const QUOTA_KEY = 'quota';
export const CheckQuota = (resource: 'organizations' | 'members' | 'storage') =>
  SetMetadata(QUOTA_KEY, resource);

// 使用
@Controller('organizations')
export class OrganizationController {
  @Post()
  @CheckQuota('organizations')
  async create(@Body() dto: CreateOrganizationDto) {
    // 自动检查配额
  }
}
```

### 测试模式

#### 领域层测试

```typescript
// libs/shared/database/src/entities/tenant.entity.spec.ts
describe('Tenant', () => {
  describe('activate', () => {
    it('should activate pending tenant', () => {
      const tenant = new Tenant('企业A', 'PRO');
      expect(tenant.status).toBe('pending');

      tenant.activate();

      expect(tenant.status).toBe('active');
      expect(tenant.hasDomainEvents()).toBe(true);
    });

    it('should throw error when activating non-pending tenant', () => {
      const tenant = new Tenant('企业A', 'PRO');
      tenant.activate();

      expect(() => tenant.activate()).toThrow('只有待审核的租户才能激活');
    });
  });

  describe('checkQuota', () => {
    it('should return true when under quota', () => {
      const tenant = new Tenant('企业A', 'PRO');
      tenant.updateQuota({ maxMembers: 100 });

      const result = tenant.checkQuota('members', 99);

      expect(result).toBe(true);
    });

    it('should return false when at quota', () => {
      const tenant = new Tenant('企业A', 'PRO');
      tenant.updateQuota({ maxMembers: 100 });

      const result = tenant.checkQuota('members', 100);

      expect(result).toBe(false);
    });
  });
});
```

#### 集成测试（数据隔离）

```typescript
// apps/gateway/src/tenant/tenant.isolation.spec.ts
describe('Tenant Isolation', () => {
  it('should not allow cross-tenant access', async () => {
    // 创建两个租户的用户
    const tenant1User = await createTestUser({ tenantId: 'tenant-1' });
    const tenant2User = await createTestUser({ tenantId: 'tenant-2' });

    // 租户 1 的用户尝试访问
    const response = await request(app.getHttpServer())
      .get('/api/users')
      .set('Authorization', `Bearer ${tenant1User.token}`);

    // 应该只返回租户 1 的用户
    expect(response.body.users).toHaveLength(1);
    expect(response.body.users[0].tenantId).toBe('tenant-1');

    // 租户 1 的用户尝试访问租户 2 的资源
    const resource = await createTestResource({ tenantId: 'tenant-2' });
    const forbiddenResponse = await request(app.getHttpServer())
      .get(`/api/resources/${resource.id}`)
      .set('Authorization', `Bearer ${tenant1User.token}`);

    expect(forbiddenResponse.status).toBe(403);
    expect(forbiddenResponse.body.message).toContain('无权访问其他租户的资源');
  });
});
```

## 不要做

- ❌ **不要手动过滤**：所有查询必须通过 TenantFilter 自动过滤
- ❌ **不要跳过 Guard**：所有需要租户隔离的接口必须使用 TenantGuard
- ❌ **不要硬编码 tenantId**：必须从 TenantContextService 获取
- ❌ **不要跨租户查询**：禁止禁用 TenantFilter（除非超级管理员）
- ❌ **不要遗漏 tenantId**：所有新实体必须包含 tenantId 字段
- ❌ **不要在组织层隔离**：数据隔离基于租户，不是组织
- ❌ **不要混淆 Tenant 和 Organization**：Tenant 包含多个 Organization

## 测试策略

### 单元测试（70%）

- **领域层**：Tenant 聚合根、TenantQuota 值对象、业务规则
- **应用层**：TenantService、TenantCommandHandler、TenantQueryHandler
- **基础设施层**：TenantFilter、TenantMiddleware、TenantGuard
- **测试命名**：`should {behavior} when {condition}`

### 集成测试（20%）

- **Repository 实现**：TenantRepository（PostgreSQL）
- **过滤器测试**：TenantFilter 自动应用测试
- **中间件测试**：TenantMiddleware 注入测试
- **多组件协作**：Middleware + Guard + Filter 联合测试

### E2E 测试（10%）

- **数据隔离测试**：租户 A 无法访问租户 B 的数据
- **配额限制测试**：超过配额时拒绝请求
- **租户生命周期测试**：创建 → 激活 → 使用 → 停用
- **越权访问测试**：跨租户访问返回 403

### 测试覆盖率目标

- 领域层：>95%（核心业务逻辑）
- 应用层：>90%（命令/查询处理）
- 基础设施层：>85%（中间件、守卫、过滤器）
- 总体：>85%

## 常见问题

### Q1: 如何确保所有查询都应用了租户过滤？

**A:**

1. 使用 MikroORM 全局过滤器（`default: true`）
2. 编写集成测试验证过滤效果
3. 定期审计 SQL 查询日志
4. 使用静态代码分析工具检查

### Q2: 超级管理员如何跨租户操作？

**A:**

1. 使用 `@SkipTenantGuard()` 装饰器
2. 在 TenantContext 中标记为超级管理员
3. 记录审计日志
4. 限制使用场景（仅在必要时）

```typescript
@Controller('admin/tenants')
@UseGuards(SuperAdminGuard)
@SkipTenantGuard()
export class AdminTenantController {
  // 超级管理员可以访问所有租户
}
```

### Q3: 如何处理租户切换组织？

**A:**
租户切换组织不影响数据隔离，仅切换组织视图：

1. 更新 JWT Token 中的 `activeOrganizationId`
2. 租户上下文保持不变（`tenantId` 不变）
3. 数据隔离始终基于 `tenantId`，不基于 `organizationId`

### Q4: 如何处理租户配额为零的情况？

**A:**

1. QuotaGuard 检查配额，如果为零返回 403
2. 提示用户联系管理员或升级套餐
3. 记录配额超限事件（TenantQuotaExceededEvent）

### Q5: 如何保证性能？

**A:**

1. 为所有 `tenantId` 列创建索引
2. 使用复合索引优化查询（tenantId + 其他条件）
3. 监控过滤器性能影响
4. 定期优化查询计划

### Q6: 如何回滚如果出现问题？

**A:**

1. **代码回滚**：Git 回滚到上一个稳定版本
2. **数据库回滚**：执行迁移脚本的回滚版本
3. **紧急禁用**：通过配置开关禁用租户中间件和过滤器
4. **数据修复**：运行数据修复脚本修复隔离问题

## 关键检查清单

在实现过程中，确保：

- [ ] 所有实体都包含 `tenantId` 字段
- [ ] 所有实体都添加了 `tenantId` 索引
- [ ] TenantFilter 配置为默认启用
- [ ] TenantMiddleware 注册到所有需要租户的路由
- [ ] TenantGuard 应用到所有需要租户隔离的 Controller
- [ ] 超级管理员操作有审计日志
- [ ] 配额检查覆盖所有资源创建操作
- [ ] 数据隔离集成测试通过
- [ ] 跨租户访问测试通过
- [ ] 性能测试通过（查询性能未显著下降）
- [ ] 迁移脚本有回滚版本
- [ ] 文档更新（API 文档、使用指南）
