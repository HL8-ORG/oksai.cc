# Better Auth MikroORM 适配器优化设计

## 概述

优化和完善 `libs/shared/better-auth-mikro-orm` 适配器，实现真实事务支持、增强测试覆盖、完善文档，确保与 Better Auth DBAdapter 契约完全兼容，为 oksai.cc 项目的认证系统提供可靠的 MikroORM 数据库层。

## 问题陈述

当前 `libs/shared/better-auth-mikro-orm` 适配器虽然已实现核心 DBAdapter 契约（32/32 测试通过），但存在以下关键问题：

1. **事务语义弱保证**：当前 transaction 使用工厂兜底逻辑，不是真实的数据库事务边界，可能导致多写操作数据不一致
2. **测试覆盖不足**：仅有单元测试（Mock EntityManager），缺少真实数据库集成测试和 E2E 测试
3. **关系模型限制**：不支持 m:m（多对多）和 1:m（一对多）关系，影响组织管理等功能
4. **文档不完整**：缺少功能矩阵、限制说明、迁移指南

这些问题可能导致：
- 数据不一致风险（用户创建成功但组织创建失败）
- 生产环境潜在 bug（并发场景、事务回滚）
- 开发者误用（不了解功能边界）

## 用户故事

### 主用户故事

```gherkin
作为 oksai.cc 开发者
我想要使用稳定可靠的 Better Auth MikroORM 适配器
以便于在项目中安全地使用 MikroORM 作为认证数据库层
```

### 验收标准（INVEST 原则）

| 原则 | 说明 | 检查点 |
|:---|:---|:---|
| **I**ndependent | 独立性 | ✅ 不依赖其他未完成功能 |
| **N**egotiable | 可协商 | ✅ 实现细节可讨论 |
| **V**aluable | 有价值 | ✅ 消除数据不一致风险，提升生产稳定性 |
| **E**stimable | 可估算 | ✅ 工作量明确（2-3 周） |
| **S**mall | 足够小 | ✅ 聚焦于适配器优化 |
| **T**estable | 可测试 | ✅ 有明确的验收场景 |

### 相关用户故事

- 作为开发者，我希望适配器支持真实事务，以便保证多写操作的一致性
- 作为开发者，我希望有完整的集成测试，以便在生产环境前发现问题
- 作为开发者，我希望有清晰的文档说明功能边界，以便正确使用
- 作为开发者，我希望了解关系模型限制的规避方案，以便设计实体

## BDD 场景设计

### 正常流程（Happy Path）

```gherkin
Feature: 真实事务支持

  Scenario: 多写操作成功提交
    Given 用户注册流程需要创建用户和默认组织
    When 使用事务执行创建操作
    And 所有操作成功
    Then 事务提交，用户和组织都创建成功
    And 数据库中存在对应的记录

  Scenario: 多写操作失败回滚
    Given 用户注册流程需要创建用户和默认组织
    When 使用事务执行创建操作
    And 组织创建失败
    Then 事务回滚，用户创建也被撤销
    And 数据库中不存在任何新记录

Feature: 集成测试覆盖

  Scenario: 真实数据库 CRUD 操作
    Given 配置了 PostgreSQL 测试数据库
    When 执行 create/findOne/findMany/update/delete 操作
    Then 数据正确写入和读取
    And 关联关系正确处理

  Scenario: 并发操作测试
    Given 多个并发请求同时操作相同资源
    When 使用 EntityManager.fork() 隔离上下文
    Then 操作互不干扰，结果正确

Feature: 功能边界文档

  Scenario: 开发者查看功能矩阵
    Given 开发者打开 README.md
    When 查看功能支持矩阵
    Then 清楚了解哪些功能支持、哪些有限制、哪些不支持
```

### 异常流程（Error Cases）

```gherkin
Feature: 事务错误处理

  Scenario: 事务超时
    Given 事务执行时间超过配置的超时时间
    When 事务未完成
    Then 抛出 TransactionTimeoutError
    And 自动回滚所有操作

  Scenario: 嵌套事务
    Given 已有一个活动事务
    When 尝试在事务内开启新事务
    Then 使用 savepoint 或抛出明确错误

Feature: 关系模型限制

  Scenario: 尝试使用 m:m 关系
    Given 实体使用多对多关系
    When 适配器尝试处理该实体
    Then 抛出明确的错误信息
    And 错误信息建议使用中间实体方案
```

### 边界条件（Edge Cases）

```gherkin
Feature: 边界条件处理

  Scenario: 空值处理
    Given 数据包含 null 或 undefined 字段
    When 执行数据库操作
    Then 正确处理空值，不抛出异常

  Scenario: 大批量操作
    Given 需要插入 1000 条记录
    When 使用批量操作
    Then 性能可接受（< 5秒）
    And 内存使用合理

  Scenario: 连接池耗尽
    Given 数据库连接池已满
    When 新请求到达
    Then 等待连接释放或抛出明确错误
    And 不导致应用崩溃
```

## 技术设计

### 架构模式

本优化采用 **渐进式增强** 策略：

- **Phase 1**：修复关键问题（事务、测试）
- **Phase 2**：增强功能（文档、示例）
- **Phase 3**：扩展能力（关系模型、性能）

### 核心组件

**事务管理器**：
- 接入 MikroORM 的 `transactional()` 方法
- 支持事务传播和隔离级别
- 提供事务超时和错误处理

**测试套件**：
- 集成测试（真实 PostgreSQL）
- 并发测试（多个 EntityManager）
- E2E 测试（完整认证流程）

**文档系统**：
- 功能支持矩阵
- 限制说明和规避方案
- 迁移指南和最佳实践

### 业务规则

- 所有写操作应在事务内执行（推荐）
- 事务超时时间默认 30 秒
- 并发操作使用 `em.fork()` 隔离上下文
- 不支持的关系模型应抛出明确错误
- 所有公共 API 必须有 TSDoc 注释

### 模块结构

```
libs/shared/better-auth-mikro-orm/
├── src/
│   ├── adapter.ts                 # 核心适配器（增强事务支持）
│   ├── utils/
│   │   ├── adapterUtils.ts        # 工具函数
│   │   ├── createAdapterError.ts  # 错误处理
│   │   └── transactionManager.ts  # 事务管理器（新增）
│   ├── spec/
│   │   ├── adapter.spec.ts        # 单元测试
│   │   ├── integration/           # 集成测试（新增）
│   │   │   ├── adapter.integration.spec.ts
│   │   │   ├── transaction.spec.ts
│   │   │   └── concurrency.spec.ts
│   │   └── e2e/                   # E2E 测试（新增）
│   │       └── auth-flow.spec.ts
│   └── index.ts
├── docs/                          # 文档（新增）
│   ├── README.md                  # 功能矩阵、使用指南
│   ├── LIMITATIONS.md             # 限制说明
│   └── MIGRATION.md               # 迁移指南
└── examples/                      # 示例（新增）
    ├── basic-usage.ts
    ├── transaction-usage.ts
    └── entity-design.ts
```

### 接口设计

#### 事务配置接口

```typescript
export interface MikroOrmAdapterConfig {
  debugLogs?: boolean;
  supportsJSON?: boolean;
  
  // 新增：事务配置
  transaction?: {
    timeout?: number;              // 超时时间（毫秒）
    isolationLevel?: IsolationLevel; // 隔离级别
    enableSavepoint?: boolean;     // 是否启用 savepoint
  };
  
  // 新增：连接池配置
  connectionPool?: {
    maxConnections?: number;
    acquireTimeoutMillis?: number;
  };
}
```

#### 事务管理器接口

```typescript
export class TransactionManager {
  /**
   * 在事务内执行操作
   * 
   * @param cb - 要执行的操作
   * @param options - 事务选项
   * @returns 操作结果
   * 
   * @example
   * ```typescript
   * const result = await transactionManager.execute(async (em) => {
   *   const user = em.create(User, userData);
   *   const org = em.create(Organization, orgData);
   *   await em.flush();
   *   return { user, org };
   * });
   * ```
   */
  async execute<T>(
    cb: (em: EntityManager) => Promise<T>,
    options?: TransactionOptions
  ): Promise<T>;
}
```

### 数据库变更

无 Schema 变更，仅需增强适配器实现。

### API 变更

**增强 API**：

```typescript
// 当前 API（保持兼容）
export const mikroOrmAdapter = (
  orm: MikroORM,
  config?: MikroOrmAdapterConfig
) => createAdapter({ /* ... */ });

// 增强后（新增事务支持）
const adapter = mikroOrmAdapter(orm, {
  transaction: {
    timeout: 30000,
    isolationLevel: IsolationLevel.READ_COMMITTED,
  },
});

// 使用事务
await adapter.transaction(async () => {
  await adapter.create({ model: 'user', data: userData });
  await adapter.create({ model: 'organization', data: orgData });
});
```

## 边界情况

需要处理的重要边界情况：

- **嵌套事务**：使用 savepoint 或抛出明确错误
- **事务超时**：自动回滚并抛出 TransactionTimeoutError
- **并发冲突**：多个请求操作相同资源，使用乐观锁或重试
- **空值处理**：正确处理 null/undefined 字段
- **大批量操作**：分批处理，避免内存溢出
- **连接池耗尽**：等待或抛出明确错误
- **关系模型限制**：检测并抛出明确错误，建议规避方案

## 范围外

该优化明确不包含的内容：

- Better Auth 实例的创建和配置
- 前端客户端集成
- 自定义认证策略实现
- Rate Limiting 集成
- m:m 和 1:m 关系的完整支持（提供规避方案）
- 性能优化（如缓存、连接池调优）- 作为 Phase 3

## 测试策略

### 单元测试（40%）

**领域层测试**：
- TransactionManager 事务逻辑
- 错误处理和异常转换
- 输入输出规范化

**覆盖率目标**：
- 核心功能：100%
- 整体：80%+

### 集成测试（40%）

**数据库集成**：
- 真实 PostgreSQL CRUD 操作
- 事务提交和回滚
- 并发场景测试
- 关联关系处理

**测试环境**：
- Docker Compose 启动测试数据库
- 每个测试前清理数据库
- 使用 MikroORM SchemaGenerator 创建表

### E2E 测试（20%）

**完整认证流程**：
- 用户注册（创建用户 + 默认组织）
- 用户登录
- 会话验证
- 权限检查

**测试覆盖率**：
- 当前：32/32 单元测试通过
- 目标：50+ 测试（单元 + 集成 + E2E）

---

## 风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|:---|:---:|:---:|:---|
| 事务实现复杂度超预期 | 高 | 中 | 参考 MikroORM 官方文档，使用成熟模式 |
| 并发测试难以重现 | 中 | 中 | 使用压力测试工具（如 k6）模拟高并发 |
| 真实数据库测试环境搭建困难 | 中 | 低 | 使用 Docker Compose 标准化测试环境 |
| 文档维护成本 | 低 | 高 | 自动生成 API 文档，使用模板 |

### 回滚计划

如果优化出现问题：

1. **保留原有实现**：所有改动在 feature branch，不影响主分支
2. **分阶段发布**：先发布文档和测试，再发布事务支持
3. **版本回退**：使用 Git tag 标记稳定版本，随时可回退
4. **降级方案**：提供配置选项禁用新特性，回退到原实现

---

## 依赖关系

### 内部依赖

- `@mikro-orm/core`：核心 ORM 功能
- `better-auth`：认证框架和 DBAdapter 接口

### 外部依赖

- PostgreSQL：测试和生产数据库
- Docker：测试环境容器化

## 实现计划

### Phase 1: 核心问题修复（1 周）

**目标**：实现真实事务支持 + 基础集成测试

**任务**：
- [ ] 创建 TransactionManager 类
  - [ ] 实现 execute() 方法，包装 MikroORM transactional
  - [ ] 添加事务超时处理
  - [ ] 添加错误处理和日志
- [ ] 更新 mikroOrmAdapter 配置
  - [ ] 接入 config.transaction
  - [ ] 添加事务配置选项
  - [ ] 保持向后兼容
- [ ] 创建集成测试环境
  - [ ] 配置 Docker Compose（PostgreSQL）
  - [ ] 创建测试 Entity（User, Session, Organization）
  - [ ] 配置 Vitest 集成测试
- [ ] 编写基础集成测试
  - [ ] CRUD 操作测试
  - [ ] 事务提交测试
  - [ ] 事务回滚测试

**验收标准**：
- ✅ 事务支持真实数据库边界
- ✅ 10+ 集成测试通过
- ✅ 测试覆盖率 > 60%

### Phase 2: 测试和文档完善（1 周）

**目标**：完整测试覆盖 + 清晰文档

**任务**：
- [ ] 扩展集成测试
  - [ ] 并发场景测试（多个 em.fork()）
  - [ ] 关联关系测试
  - [ ] 边界条件测试（空值、大批量、连接池）
- [ ] 创建 E2E 测试
  - [ ] 完整认证流程测试
  - [ ] 组织管理流程测试
- [ ] 编写文档
  - [ ] README.md：功能矩阵、快速开始
  - [ ] LIMITATIONS.md：限制说明和规避方案
  - [ ] MIGRATION.md：从 Drizzle 迁移指南
  - [ ] API 文档（TSDoc）
- [ ] 创建使用示例
  - [ ] basic-usage.ts：基础使用
  - [ ] transaction-usage.ts：事务使用
  - [ ] entity-design.ts：实体设计最佳实践

**验收标准**：
- ✅ 30+ 测试通过（单元 + 集成 + E2E）
- ✅ 测试覆盖率 > 80%
- ✅ 完整文档覆盖
- ✅ 3+ 使用示例

### Phase 3: 功能扩展（可选，1-2 周）

**目标**：增强功能 + 性能优化

**任务**：
- [ ] 关系模型增强
  - [ ] 评估 m:m 关系支持可行性
  - [ ] 实现中间实体方案示例
- [ ] 性能优化
  - [ ] 添加查询缓存
  - [ ] 优化连接池配置
  - [ ] 批量操作性能测试
- [ ] 监控和可观测性
  - [ ] 集成 OpenTelemetry
  - [ ] 添加性能指标
  - [ ] 创建监控面板

**验收标准**：
- ✅ 性能提升 20%+
- ✅ 完整监控指标
- ✅ 生产就绪

## 参考资料

- [Better Auth 官方文档](https://www.better-auth.com/docs)
- [MikroORM 官方文档](https://mikro-orm.io/docs)
- [MikroORM 事务管理](https://mikro-orm.io/docs/transactions)
- [MikroORM Schema Generator](https://mikro-orm.io/docs/schema-generator)
- [开发工作流程](../_templates/workflow.md)
- [测试指南](../_templates/testing.md)

---

## 相关文档

- [Better Auth Core 深度分析](../../docs/better-auth-core-deep-analysis.md)
- [Better Auth MikroORM DBAdapter 契约评估](../../docs/better-auth-mikro-orm-dbadapter-contract-evaluation.md)
- [Better Auth MikroORM 库评估](../../docs/better-auth-mikro-orm-library-assessment.md)
- [NestJS Better Auth 集成](../nestjs-better-auth/design.md)
