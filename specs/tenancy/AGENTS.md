# AGENTS.md — 多租户系统

## 项目背景

多租户（Multi-tenancy）是 SaaS 平台的核心能力，提供租户隔离、资源配额、租户上下文管理等完整解决方案。本包将多租户作为独立的、可复用的模块开发和维护。

## 开始前

1. 阅读 `specs/tenancy/design.md`
2. 查看 `specs/tenancy/implementation.md` 了解当前进度
3. 参考 `specs/_templates/workflow.md` 了解开发工作流程
4. 参考以下目录中的现有实现模式：
   - `libs/iam/domain/src/tenant/` — 租户领域模型（待迁移）
   - `libs/shared/context/src/` — 租户上下文管理（待迁移）
   - `libs/shared/kernel/` — DDD 基础设施

## 开发工作流程

遵循 `specs/_templates/workflow.md` 中的标准流程：

1. **用户故事**：在 `design.md` 中定义用户故事（符合 INVEST 原则）✅
2. **BDD 场景**：编写验收场景（Given-When-Then）✅
3. **TDD 循环**：
   - 🔴 Red: 编写失败的测试
   - 🟢 Green: 最简实现
   - 🔵 Refactor: 优化代码
4. **代码实现**：按照 DDD 分层实现

## 代码模式

### 领域层模式

遵循 DDD 分层架构，参考 `libs/iam/domain` 的实现：

```typescript
// tenant.aggregate.ts
import { AggregateRoot, Guard, Result, UniqueEntityID } from "@oksai/kernel";

export class Tenant extends AggregateRoot<TenantProps> {
  // 私有构造函数
  private constructor(props: TenantProps, id?: UniqueEntityID) {
    super(props, id);
  }

  // Getter 方法
  get name(): string {
    return this.props.name;
  }

  // 业务方法
  public activate(): Result<void, Error> {
    if (!this.props.status.canBeActivated()) {
      return Result.fail(new Error("只有待审核的租户才能激活"));
    }
    this.props.status = TenantStatus.active();
    this.addDomainEvent(new TenantActivatedEvent({ tenantId: this.id.toString() }, this.id));
    return Result.ok(undefined);
  }

  // 工厂方法
  public static create(props: CreateTenantProps): Result<Tenant, Error> {
    const guardResult = Guard.combine([
      Guard.againstEmpty("name", props.name),
      Guard.againstEmpty("slug", props.slug),
    ]);
    if (guardResult.isFail()) {
      return Result.fail(new Error(guardResult.error?.[0]?.message));
    }
    const tenant = new Tenant({ ...props }, id);
    tenant.addDomainEvent(new TenantCreatedEvent({ ... }, tenant.id));
    return Result.ok(tenant);
  }
}
```

### 值对象模式

```typescript
// tenant-status.vo.ts
import { ValueObject, Result } from '@oksai/kernel';

export class TenantStatus extends ValueObject<TenantStatusProps> {
  private constructor(props: TenantStatusProps) {
    super(props);
  }

  public static pending(): TenantStatus {
    return new TenantStatus({ value: 'PENDING' });
  }

  public static active(): TenantStatus {
    return new TenantStatus({ value: 'ACTIVE' });
  }

  public canBeActivated(): boolean {
    return this.props.value === 'PENDING';
  }
}
```

### Repository 接口模式

```typescript
// tenant.repository.ts
import type { Result } from '@oksai/kernel';
import type { Tenant } from './tenant.aggregate.js';

export interface ITenantRepository {
  findById(id: string): Promise<Result<Tenant | null>>;
  findBySlug(slug: string): Promise<Result<Tenant | null>>;
  save(tenant: Tenant): Promise<Result<void>>;
}
```

### NestJS 集成模式

```typescript
// tenancy.module.ts
import { Module, Global } from '@nestjs/common';

@Global()
@Module({
  providers: [TenantContextService, TenantGuard, TenantInterceptor],
  exports: [TenantContextService],
})
export class TenancyModule {}
```

## 不要做

- 不要添加 `design.md` 之外的功能
- 不要跳过测试（遵循 TDD：先写测试）
- 不要跳过 BDD 场景（确保验收标准明确）
- 不要在领域层依赖 NestJS 或 ORM 框架（保持领域纯净）
- 不要在领域层使用 `import type` 导入注入的 Service（会丢失元数据）
- 不要在测试中使用 `any` 类型
- 不要忽略 LSP 错误

## 测试策略

### 单元测试（70%）

**领域层测试模式**：

```typescript
// tenant.aggregate.spec.ts
describe('Tenant', () => {
  describe('create', () => {
    it('should create tenant with valid props', () => {
      // Arrange
      const props = {
        name: '测试租户',
        slug: 'test-tenant',
        plan: 'PRO' as const,
        ownerId: 'user-123',
      };

      // Act
      const result = Tenant.create(props);

      // Assert
      expect(result.isOk()).toBe(true);
      const tenant = result.value as Tenant;
      expect(tenant.name).toBe('测试租户');
      expect(tenant.slug).toBe('test-tenant');
    });

    it('should fail when slug is too short', () => {
      const result = Tenant.create({ ...props, slug: 'ab' });
      expect(result.isFail()).toBe(true);
      expect(result.error?.message).toContain('不能小于 3 个字符');
    });
  });

  describe('activate', () => {
    it('should activate pending tenant', () => {
      const tenant = createTestTenant(); // status: PENDING
      const result = tenant.activate();
      expect(result.isOk()).toBe(true);
      expect(tenant.status.value).toBe('ACTIVE');
    });
  });
});
```

**应用层测试模式**：

```typescript
// create-tenant.handler.spec.ts
describe('CreateTenantHandler', () => {
  let handler: CreateTenantHandler;
  let mockRepo: MockRepository<ITenantRepository>;

  beforeEach(() => {
    mockRepo = new MockRepository();
    handler = new CreateTenantHandler(mockRepo);
  });

  it('should create tenant successfully', async () => {
    const command = {
      name: '租户',
      slug: 'tenant',
      plan: 'PRO',
      ownerId: 'user-1',
    };
    const result = await handler.execute(command);
    expect(result.isOk()).toBe(true);
    expect(mockRepo.save).toHaveBeenCalled();
  });
});
```

### 集成测试（20%）

- Repository 与 MikroORM 集成测试（真实数据库）
- TenantGuard 和 TenantInterceptor 与 NestJS 集成
- 多租户上下文切换和隔离验证

### E2E 测试（10%）

- 租户创建 → 激活 → 使用 → 停用完整流程
- 租户隔离验证（跨租户数据隔离）

### 测试命名规范

- 测试文件：`{filename}.spec.ts`
- 测试描述：`should {behavior} when {condition}`
- Fixture 文件：`{filename}.fixture.ts`

## 迁移注意事项

### 代码迁移顺序

1. **领域层**：从 `libs/iam/domain/src/tenant/` 迁移到 `libs/tenancy/domain/`
2. **基础设施层**：新建 Repository 实现
3. **应用层**：从 `libs/shared/context/src/` 迁移租户上下文管理
4. **接口层**：新建 NestJS 模块和守卫

### 向后兼容策略

过渡期间（Phase 1-5），在 `@oksai/iam-domain` 中保留重导出：

```typescript
// libs/iam/domain/src/index.ts
export * from '@oksai/tenancy'; // 重导出，保持向后兼容
```

### Import 路径更新

迁移完成后，更新所有依赖包的 import 路径：

```bash
# 查找所有引用
grep -r "from '@oksai/iam-domain'" --include="*.ts"

# 批量更新
# sed -i "s/@oksai\/iam-domain/@oksai\/tenancy/g" **/*.ts
```

## 常见问题

### Q: 如何确定何时编写测试？

**A:** 遵循 TDD 原则，先写失败的测试（Red），再写最简代码（Green），最后优化（Refactor）。

### Q: 测试应该覆盖哪些场景？

**A:** 参考 BDD 场景文件，至少覆盖：

- 正常流程（Happy Path）
- 异常流程（Error Cases）
- 边界条件（Edge Cases）

### Q: 如何保证代码质量？

**A:**

1. 所有公共 API 都有 TSDoc 注释
2. 测试覆盖率 > 90%
3. 遵循项目代码规范（Biome）
4. 代码 Review 通过
5. 无 LSP 错误

### Q: 领域层为什么不能依赖框架？

**A:** 领域层是业务核心，应该保持纯净，不依赖任何外部框架，便于：

- 独立测试
- 跨项目复用
- 业务逻辑清晰
- 易于理解和维护

### Q: 迁移过程中如何保证功能不受影响？

**A:**

1. 分阶段迁移，每阶段都有完整测试
2. 保持向后兼容，使用重导出
3. 所有 import 路径更新后，确保测试通过
4. Phase 6 才移除旧代码

## 相关文档

- [设计文档](./design.md)
- [实现进度](./implementation.md)
- [技术决策](./decisions.md)
- [测试策略](./testing.md)
- [开发工作流](../../specs/_templates/workflow.md)
