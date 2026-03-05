# AGENTS.md — Better Auth MikroORM 适配器优化

## 项目背景

优化和完善 `libs/shared/better-auth-mikro-orm` 适配器，实现真实事务支持、增强测试覆盖、完善文档，确保与 Better Auth DBAdapter 契约完全兼容。

**核心问题**：
1. 事务语义弱保证（工厂兜底，非真实事务）
2. 测试覆盖不足（仅单元测试，缺少集成测试）
3. 关系模型限制（不支持 m:m 和 1:m）
4. 文档不完整（缺少功能矩阵、限制说明）

## 开始前

1. **阅读设计文档**
   - 阅读 `specs/better-auth-mikro-orm-optimization/design.md` 了解完整的技术设计
   - 阅读 `specs/better-auth-mikro-orm-optimization/implementation.md` 了解当前实现进度
   - 阅读 `specs/better-auth-mikro-orm-optimization/decisions.md` 了解架构决策

2. **了解现状**
   - 查看 `libs/shared/better-auth-mikro-orm/src/` 中的现有实现
   - 运行现有测试：`pnpm vitest run libs/shared/better-auth-mikro-orm/src/spec/`
   - 查看覆盖率：`pnpm vitest run --coverage libs/shared/better-auth-mikro-orm/`

3. **学习相关技术**
   - [MikroORM 事务管理](https://mikro-orm.io/docs/transactions)
   - [MikroORM 实体管理](https://mikro-orm.io/docs/entity-manager)
   - [Better Auth 数据库适配器](https://www.better-auth.com/docs/concepts/database)

4. **准备开发环境**
   - 确保依赖已安装（`pnpm install`）
   - 确保 Docker 已安装（集成测试需要）
   - 确保测试环境就绪

## 开发工作流程

遵循 `specs/_templates/workflow.md` 中的标准流程：

1. **用户故事**：在 `design.md` 中定义用户故事（符合 INVEST 原则）
2. **BDD 场景**：编写验收场景（Given-When-Then）
3. **TDD 循环**：
   - 🔴 Red: 编写失败的测试
   - 🟢 Green: 最简实现
   - 🔵 Refactor: 优化代码
4. **代码实现**：按照设计文档实现

### Phase 1: 核心问题修复（1 周）

**任务 1: 创建 TransactionManager**（2-3 天）
- 创建 `src/utils/transactionManager.ts`
- 实现 `execute()` 方法
- 编写单元测试（覆盖率 > 90%）
- 添加 TSDoc 文档

**任务 2: 更新 mikroOrmAdapter**（1-2 天）
- 扩展 `MikroOrmAdapterConfig` 接口
- 接入 `config.transaction`
- 保持向后兼容
- 编写配置测试

**任务 3: 创建集成测试环境**（1 天）
- 配置 Docker Compose
- 创建测试 Entity
- 配置 Vitest 集成测试

**任务 4: 编写基础集成测试**（2-3 天）
- CRUD 操作测试
- 事务提交和回滚测试
- 覆盖率 > 60%

### Phase 2: 测试和文档完善（1 周）

**任务 5: 扩展集成测试**（2-3 天）
- 并发场景测试
- 边界条件测试

**任务 6: 创建 E2E 测试**（2-3 天）
- 完整认证流程测试

**任务 7: 编写文档**（2-3 天）
- README.md：功能矩阵、快速开始
- LIMITATIONS.md：限制说明
- MIGRATION.md：迁移指南

**任务 8: 创建使用示例**（1-2 天）
- basic-usage.ts
- transaction-usage.ts
- entity-design.ts

### Phase 3: 功能扩展（可选，1-2 周）

**任务 9: 关系模型增强**（可选）
**任务 10: 性能优化**（可选）
**任务 11: 监控和可观测性**（可选）

## 代码模式

### TransactionManager 模式

```typescript
// src/utils/transactionManager.ts
export class TransactionManager {
  constructor(
    private readonly orm: MikroORM,
    private readonly config?: TransactionConfig
  ) {}

  async execute<T>(
    cb: (em: EntityManager) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T> {
    const em = this.orm.em.fork();
    const timeout = options?.timeout ?? this.config?.timeout ?? 30000;

    return Promise.race([
      em.transactional(cb),
      this.createTimeoutPromise(timeout),
    ]);
  }

  private createTimeoutPromise<T>(timeout: number): Promise<T> {
    return new Promise((_, reject) => {
      setTimeout(() => {
        reject(new TransactionTimeoutError(timeout));
      }, timeout);
    });
  }
}
```

### 适配器配置模式

```typescript
// src/adapter.ts
export const mikroOrmAdapter = (
  orm: MikroORM,
  config?: MikroOrmAdapterConfig
) => {
  const transactionManager = config?.transaction
    ? new TransactionManager(orm, config.transaction)
    : undefined;

  return createAdapter({
    config: {
      adapterId: 'mikro-orm-adapter',
      adapterName: 'Mikro ORM Adapter',
      supportsJSON: true,
      transaction: transactionManager?.execute.bind(transactionManager),
    },
    adapter() {
      const em = orm.em.fork();
      return {
        // CRUD 操作
      };
    },
  });
};
```

### 集成测试模式

```typescript
// src/spec/integration/adapter.integration.spec.ts
describe('mikroOrmAdapter (Integration)', () => {
  let orm: MikroORM;
  let adapter: ReturnType<typeof mikroOrmAdapter>;

  beforeAll(async () => {
    orm = await MikroORM.init({
      type: 'postgresql',
      dbName: 'better_auth_test',
      entities: [User, Session, Account, Organization],
    });
    adapter = mikroOrmAdapter(orm);
  });

  afterAll(async () => {
    await orm.close();
  });

  beforeEach(async () => {
    await cleanDatabase(orm);
  });

  it('应该创建用户并查询', async () => {
    const user = await adapter.create({
      model: 'user',
      data: { email: 'test@example.com', name: 'Test' },
    });

    expect(user.id).toBeDefined();

    const found = await adapter.findOne({
      model: 'user',
      where: [{ field: 'id', value: user.id }],
    });

    expect(found.email).toBe('test@example.com');
  });
});
```

## 不要做

### 不要偏离技术规格

- ❌ 不要添加 `design.md` 之外的功能
- ❌ 不要破坏与 Better Auth DBAdapter 的兼容性
- ❌ 不要引入强依赖可选包
- ❌ 不要跳过测试（遵循 TDD）

### 不要破坏现有功能

- ❌ 不要修改已发布的 API 签名
- ❌ 不要破坏向后兼容性
- ❌ 不要改变现有测试的预期行为

### 不要忽视代码质量

- ❌ 不要跳过 TSDoc 注释（公共 API 必须有文档）
- ❌ 不要使用 any 类型（使用 unknown 或具体类型）
- ❌ 不要忽略 TypeScript 错误
- ❌ 不要跳过 lint 检查

### 不要忘记文档

- ❌ 不要忘记更新 README.md
- ❌ 不要忘记更新 CHANGELOG.md
- ❌ 不要忘记添加使用示例

## 测试策略

### 单元测试（40%）

**重点测试**：
- TransactionManager 事务逻辑
- 错误处理和异常转换
- 输入输出规范化

**覆盖率目标**：
- 核心功能：100%
- 整体：80%+

**测试命令**：
```bash
pnpm vitest run libs/shared/better-auth-mikro-orm/src/spec/
```

### 集成测试（40%）

**重点测试**：
- 真实数据库 CRUD 操作
- 事务提交和回滚
- 并发场景
- 边界条件

**测试环境**：
- Docker Compose 启动 PostgreSQL
- 每个测试前清理数据库
- 使用 MikroORM SchemaGenerator 创建表

**测试命令**：
```bash
docker-compose -f docker-compose.test.yml up -d
pnpm vitest run libs/shared/better-auth-mikro-orm/src/spec/integration/
docker-compose -f docker-compose.test.yml down
```

### E2E 测试（20%）

**重点测试**：
- 完整认证流程
- 组织管理流程

**测试命令**：
```bash
pnpm vitest run libs/shared/better-auth-mikro-orm/src/spec/e2e/
```

## 常见问题

### Q: 如何实现真实事务？

**A:** 创建 TransactionManager 包装 MikroORM 的 `em.transactional()`：

```typescript
const transactionManager = new TransactionManager(orm, {
  timeout: 30000,
});

await transactionManager.execute(async (em) => {
  const user = em.create(User, userData);
  const org = em.create(Organization, orgData);
  await em.flush();
});
```

### Q: 如何处理并发冲突？

**A:** 使用 `em.fork()` 隔离上下文：

```typescript
// 每个请求使用独立的 EntityManager
const em1 = orm.em.fork();
const em2 = orm.em.fork();

// 两个请求互不干扰
await em1.findOne(User, { id: 1 });
await em2.findOne(User, { id: 1 });
```

### Q: 如何处理 m:m 关系限制？

**A:** 使用中间实体：

```typescript
// ❌ 不支持
@Entity()
class Organization {
  @ManyToMany(() => User)
  members = new Collection<User>(this);
}

// ✅ 支持
@Entity()
class OrganizationMember {
  @ManyToOne(() => Organization)
  organization: Organization;

  @ManyToOne(() => User)
  member: User;

  @Property()
  role: string;
}
```

### Q: 如何配置测试数据库？

**A:** 使用 Docker Compose：

```yaml
# docker-compose.test.yml
services:
  postgres:
    image: postgres:16-alpine
    environment:
      POSTGRES_DB: better_auth_test
      POSTGRES_USER: test
      POSTGRES_PASSWORD: test
    ports:
      - "5433:5432"
```

```bash
docker-compose -f docker-compose.test.yml up -d
```

### Q: 如何保证向后兼容？

**A:** 所有新功能默认可选：

```typescript
// 旧配置（继续工作）
const adapter = mikroOrmAdapter(orm);

// 新配置（可选）
const adapter = mikroOrmAdapter(orm, {
  transaction: {
    timeout: 30000,
  },
});
```

### Q: 如何调试事务问题？

**A:** 
1. 启用 MikroORM 日志（`debug: true`）
2. 在 TransactionManager 中添加日志
3. 检查事务超时配置
4. 使用数据库工具查看事务状态

## 参考资源

### 官方文档

- [Better Auth 官方文档](https://www.better-auth.com/docs)
- [MikroORM 官方文档](https://mikro-orm.io/docs)
- [MikroORM 事务管理](https://mikro-orm.io/docs/transactions)

### 项目文档

- [Better Auth Core 深度分析](../../docs/better-auth-core-deep-analysis.md)
- [Better Auth MikroORM DBAdapter 契约评估](../../docs/better-auth-mikro-orm-dbadapter-contract-evaluation.md)
- [Better Auth MikroORM 库评估](../../docs/better-auth-mikro-orm-library-assessment.md)

### 开发资源

- [开发工作流程](../_templates/workflow.md)
- [测试指南](../_templates/testing.md)
- [NestJS Better Auth 集成](../nestjs-better-auth/design.md)

---

**文档版本**: 1.0  
**最后更新**: 2026-03-05  
**维护者**: oksai.cc 团队
