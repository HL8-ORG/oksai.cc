# Better Auth MikroORM 适配器优化架构决策记录（ADR）

本文档记录优化过程中的关键技术决策。

---

## 通用决策

以下是适用于所有功能的通用决策：

### UDR-001：优先使用共享模块

当需要使用以下功能时，优先使用 `libs/shared` 目录下的共享模块：

| 功能类型 | 共享模块 | 使用场景 |
|---------|---------|---------|
| 日志 | `@oksai/logger` | 统一日志记录、结构化日志 |
| 异常 | `@oksai/exceptions` | 统一异常处理、DDD 分层异常 |
| 契约 | `@oksai/constants` | 错误码、事件名称、API 契约 |
| 配置 | `@oksai/config` | 环境配置、配置验证 |
| 上下文 | `@oksai/context` | 租户上下文、请求上下文 |

**示例：**
```typescript
// ✅ 推荐
import { OksaiLoggerService } from "@oksai/logger";
import { InfrastructureException } from "@oksai/exceptions";

// ❌ 避免
import { Logger } from "@nestjs/common";
```

### UDR-002：文档管理规范

**决策**
当需要创建开发文档时，优先在当前项目的 `docs` 目录下创建。

**文档位置：**
- 功能文档 → `specs/{feature}/docs/`
- 应用文档 → `apps/{app}/docs/`
- 库文档 → `libs/{lib}/docs/`
- 跨项目文档 → `docs/`

**示例：**
```
# ✅ 推荐
libs/shared/better-auth-mikro-orm/docs/migration-guide.md
specs/better-auth-mikro-orm-optimization/docs/performance.md

# ❌ 避免
docs/better-auth-migration.md  # 应在库或 spec 的 docs 目录
```

---

## 功能特定决策

## ADR-001: 事务实现策略

**状态**: ✅ 已决定  
**决策日期**: 2026-03-05  
**决策者**: AI Architect  

### 背景

当前适配器的 `transaction` 方法使用 Better Auth 工厂兜底逻辑，仅顺序执行回调，不是真实的数据库事务边界。这可能导致多写操作数据不一致。

### 决策

**采用方案 A：直接接入 MikroORM transactional()**

创建 `TransactionManager` 类，包装 MikroORM 的 `em.transactional()` 方法：

```typescript
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
}
```

### 理由

1. **原生支持**：MikroORM 的 `transactional()` 提供完整的事务支持
2. **成熟稳定**：MikroORM 的事务管理经过充分测试
3. **易于集成**：只需包装现有 API
4. **性能良好**：无额外开销

### 替代方案

**方案 B：使用第三方事务库**
- ❌ 增加依赖
- ❌ 与 MikroORM 集成复杂
- ❌ 维护成本高

**方案 C：不实现事务，文档说明限制**
- ❌ 数据一致性风险
- ❌ 功能不完整

### 影响

- ✅ 真实事务支持
- ✅ 数据一致性保证
- ⚠️ 需要额外测试（事务回滚、超时）
- ⚠️ 需要文档说明配置选项

---

## ADR-002: 测试策略

**状态**: ✅ 已决定  
**决策日期**: 2026-03-05  
**决策者**: AI Architect  

### 背景

当前仅有单元测试（Mock EntityManager），缺少真实数据库集成测试和 E2E 测试。需要制定测试策略确保质量。

### 决策

**采用分层测试策略：40% 单元 + 40% 集成 + 20% E2E**

```
单元测试（40%）
  - TransactionManager 事务逻辑
  - 错误处理和异常转换
  - 输入输出规范化

集成测试（40%）
  - 真实 PostgreSQL CRUD 操作
  - 事务提交和回滚
  - 并发场景测试
  - 边界条件测试

E2E 测试（20%）
  - 完整认证流程
  - 组织管理流程
```

### 理由

1. **风险驱动**：事务和并发是高风险区域，需要集成测试验证
2. **快速反馈**：单元测试快速发现逻辑错误
3. **真实环境**：集成测试在真实数据库上验证
4. **端到端**：E2E 测试验证完整流程

### 测试环境

使用 Docker Compose 启动测试数据库：

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

### 影响

- ✅ 测试覆盖率 > 80%
- ✅ 真实环境验证
- ⚠️ 测试时间增加（~2 分钟）
- ⚠️ 需要 Docker 环境

---

## ADR-003: 关系模型限制处理策略

**状态**: ✅ 已决定  
**决策日期**: 2026-03-05  
**决策者**: AI Architect  

### 背景

当前适配器不支持 m:m（多对多）和 1:m（一对多）关系。Better Auth 的 Organization 插件可能使用 m:m 关系。

### 决策

**采用方案 A：明确限制 + 提供规避方案**

1. **文档明确限制**
   - 在 `LIMITATIONS.md` 中说明不支持的关系模型
   - 列出影响的 Better Auth 功能

2. **运行时检测和错误提示**
   ```typescript
   if (isManyToManyRelation(property)) {
     throw new BetterAuthError(
       `[Mikro ORM Adapter] 不支持多对多关系: ${property.name}。` +
       `请使用中间实体方案替代。参考: docs/LIMITATIONS.md`
     );
   }
   ```

3. **提供规避方案**
   - 使用中间实体替代 m:m 关系
   - 提供示例代码和最佳实践

### 规避方案示例

```typescript
// ❌ 不支持：直接使用 m:m 关系
@Entity()
class Organization {
  @ManyToMany(() => User)
  members = new Collection<User>(this);
}

// ✅ 支持：使用中间实体
@Entity()
class OrganizationMember {
  @PrimaryKey()
  id: string;

  @ManyToOne(() => Organization)
  organization: Organization;

  @ManyToOne(() => User)
  member: User;

  @Property()
  role: string; // 'owner' | 'admin' | 'member'
}
```

### 理由

1. **实现成本高**：完整支持 m:m 需要大量工作
2. **优先级低**：可以通过中间实体规避
3. **风险可控**：明确限制，避免误用
4. **渐进增强**：未来可按需实现

### 替代方案

**方案 B：完整实现 m:m 支持**
- ❌ 工作量大（1-2 周）
- ❌ 复杂度高
- ❌ 不确定是否必需

**方案 C：不支持任何关系模型**
- ❌ 限制过多
- ❌ 影响功能

### 影响

- ✅ 避免误用
- ✅ 提供规避方案
- ⚠️ 需要额外 Entity 设计
- ⚠️ 影响 Better Auth Organization 插件（需测试）

---

## ADR-004: 文档组织策略

**状态**: ✅ 已决定  
**决策日期**: 2026-03-05  
**决策者**: AI Architect  

### 背景

当前缺少完整文档，新开发者难以快速上手。需要制定文档组织策略。

### 决策

**采用多文档分层策略**

```
docs/
├── README.md              # 快速开始、功能矩阵
├── LIMITATIONS.md         # 限制说明、规避方案
├── MIGRATION.md           # 迁移指南
├── API.md                 # API 文档（TSDoc 生成）
└── examples/              # 使用示例
    ├── basic-usage.ts
    ├── transaction-usage.ts
    └── entity-design.ts
```

### 文档内容

**README.md**：
- 功能概览
- 功能支持矩阵（✅ 支持 / ⚠️ 有限制 / ❌ 不支持）
- 快速开始（5 分钟上手）
- 配置选项
- 常见问题

**LIMITATIONS.md**：
- 事务限制
- 关系模型限制
- 性能限制
- 规避方案
- 最佳实践

**MIGRATION.md**：
- 从 Drizzle 迁移
- Entity 设计最佳实践
- 常见问题和解决方案

### 理由

1. **分层清晰**：不同文档面向不同需求
2. **易于维护**：每个文档职责单一
3. **快速定位**：开发者可以快速找到需要的信息
4. **示例驱动**：提供可运行的示例代码

### 影响

- ✅ 新开发者可快速上手
- ✅ 明确功能边界
- ⚠️ 需要持续维护文档
- ⚠️ 文档与代码同步更新

---

## ADR-005: 向后兼容策略

**状态**: ✅ 已决定  
**决策日期**: 2026-03-05  
**决策者**: AI Architect  

### 背景

增强事务支持可能影响现有配置。需要确保向后兼容。

### 决策

**所有新功能默认可选，保持向后兼容**

```typescript
// 旧配置（继续工作）
const adapter = mikroOrmAdapter(orm);

// 新配置（可选）
const adapter = mikroOrmAdapter(orm, {
  transaction: {
    timeout: 30000,
    isolationLevel: IsolationLevel.READ_COMMITTED,
  },
});
```

### 实现策略

1. **配置可选**：新配置项都有默认值
2. **默认行为**：不提供配置时使用原实现
3. **渐进增强**：提供配置时启用新功能
4. **版本管理**：使用语义化版本（SemVer）

### 理由

1. **平滑迁移**：现有用户无需修改代码
2. **渐进采用**：按需启用新功能
3. **降低风险**：避免破坏性变更
4. **用户友好**：尊重用户选择

### 影响

- ✅ 向后兼容
- ✅ 平滑迁移
- ⚠️ 配置复杂度增加
- ⚠️ 需要文档说明默认行为

---

## ADR 总结

| ADR | 决策 | 状态 | 优先级 |
|:---|:---|:---:|:---:|
| ADR-001 | 接入 MikroORM transactional() | ✅ 已决定 | P0 |
| ADR-002 | 分层测试策略（40/40/20） | ✅ 已决定 | P0 |
| ADR-003 | 明确限制 + 提供规避方案 | ✅ 已决定 | P1 |
| ADR-004 | 多文档分层策略 | ✅ 已决定 | P1 |
| ADR-005 | 向后兼容，新功能可选 | ✅ 已决定 | P0 |

---

**文档版本**: 1.0  
**最后更新**: 2026-03-05  
**维护者**: oksai.cc 团队
