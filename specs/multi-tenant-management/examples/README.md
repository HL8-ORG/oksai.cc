# 后端模版示例库

本目录包含后端开发的标准代码示例，遵循 **DDD + 六边形架构 + CQRS + EDA + Event Sourcing** 混合架构。

---

## ⚠️ 重要：架构选择指南

**不是所有模块都需要完整的混合架构！** 根据 [archi-13-architecture-selection.md](../../../guidelines/archi/archi-13-architecture-selection.md) 选择合适的架构级别：

| 级别        | 名称      | 适用场景           | 架构模式                                   |
| :---------- | :-------- | :----------------- | :----------------------------------------- |
| **Level 1** | 简单 CRUD | 字典表、配置管理   | DDD（基础）+ 六边形                        |
| **Level 2** | 业务领域  | 用户管理、权限管理 | DDD + 六边形 + EDA                         |
| **Level 3** | 复杂领域  | Job、订单、支付    | DDD + 六边形 + CQRS + EDA + Event Sourcing |

**决策清单**：

- [ ] 是否有复杂业务规则？（聚合根、值对象）
- [ ] 是否需要跨模块通知？（领域事件）
- [ ] 是否需要审计历史？（Event Sourcing）
- [ ] 读操作是否频繁？（CQRS）
- [ ] 事件是否必须送达？（Outbox）

**推荐**：

- 0-1 项 YES → Level 1（简单实体，CRUD）
- 2-3 项 YES → Level 2（聚合根，领域事件）
- 4+ 项 YES → Level 3（完整混合架构）

---

## 📚 示例索引

### Level 3 示例（完整混合架构）

| 文件                   | 描述                   | 关键模式                                       |
| :--------------------- | :--------------------- | :--------------------------------------------- |
| `domain-layer.md`      | 领域层完整示例（Job）  | 聚合根、实体、值对象、领域事件、Event Sourcing |
| `application-layer.md` | 应用层完整示例（CQRS） | Command、Query、Handler、Outbox、Result 模式   |
| `domain-test.md`       | 领域层测试完整示例     | 聚合根测试、业务规则验证、多租户场景           |

### Level 2 示例（业务领域）

**适用于**：用户管理、权限管理、文档管理等

**架构组件**：

- ✅ 聚合根（AggregateRoot）
- ✅ 值对象（ValueObject）
- ✅ 领域事件（DomainEvent）
- ✅ 事件发布（EventBus）
- ❌ 无 CQRS
- ❌ 无 Event Sourcing
- ❌ 无 Outbox

**示例代码**：参见 `domain-layer.md` 中的 User 聚合根示例

### Level 1 示例（简单 CRUD）

**适用于**：字典表、配置管理等

**架构组件**：

- ❌ 无聚合根（简单实体）
- ❌ 无领域事件
- ❌ 无 CQRS
- ❌ 无 Event Sourcing
- ✅ 简单的 CRUD 操作

**示例代码**：参见 `domain-layer.md` 中的 Country 实体示例

### 架构说明

**混合架构模式**：

- **DDD**：领域驱动设计，聚合根、值对象、领域事件
- **六边形架构**：端口与适配器，依赖反转
- **CQRS**：命令查询职责分离，写模型与读模型分离
- **EDA**：事件驱动架构，领域事件、集成事件
- **Event Sourcing**：事件溯源，状态变更持久化为事件流

---

## 🎯 使用方式

### 开发时参考

1. **创建聚合根**：参考 `domain-layer.md` - 聚合根、值对象、领域事件
2. **实现 Command Handler**：参考 `application-layer.md` - 写操作，Event Sourcing
3. **实现 Query Handler**：参考 `application-layer.md` - 读操作，查询读模型
4. **编写测试**：参考 `domain-test.md` - 领域层测试，业务规则验证

### CQRS 开发流程

```
写操作（Command）：
1. 定义 Command（application/commands/）
2. 创建聚合根（domain/model/）
3. 实现 Command Handler（application/commands/handlers/）
4. 保存到 Event Store（infrastructure/persistence/）
5. 写入 Outbox（infrastructure/outbox/）

读操作（Query）：
1. 定义 Query（application/queries/）
2. 实现 Query Handler（application/queries/handlers/）
3. 查询读模型（ClickHouse）
4. 返回 DTO
```

### 代码审查标准

示例代码代表团队的编码标准：

- DDD 分层约定
- CQRS 分离（写模型 vs 读模型）
- 命名规范
- 错误处理（Result 模式）
- 测试覆盖（AAA 模式）

---

## 📋 示例质量标准

每个示例必须包含：

- ✅ **完整可运行**：可直接复制使用
- ✅ **类型安全**：完整的 TypeScript 类型
- ✅ **错误处理**：使用 Result 模式
- ✅ **注释清晰**：关键决策点有中文注释
- ✅ **遵循约定**：符合 AGENTS.md 中的约定
- ✅ **架构一致**：符合混合架构模式
- ✅ **多租户安全**：包含租户 ID 验证

---

## 🔗 与模版文档的关系

```
模版文档（指导性）        示例代码（演示性）
    ↓                       ↓
design.md          →  domain-layer.md
  (决策点)              (完整实现)

workflow.md        →  application-layer.md
  (开发流程)            (CQRS 完整流程)

testing.md         →  domain-test.md
  (测试策略)            (完整测试)
```

**原则**：

- 模版文档说明 **WHY** 和 **WHEN**
- 示例代码展示 **HOW**
- 避免在模版文档中重复示例代码

---

## 🛠️ 维护指南

### 添加新示例

1. **创建文件**：遵循命名约定 `{type}.md`
2. **编写完整示例**：包含所有必要的导入和类型
3. **添加注释**：解释关键决策点和架构模式
4. **更新索引**：在本 README 中添加条目
5. **验证可运行**：确保代码可复制使用

### 更新现有示例

1. **保持向后兼容**：避免破坏现有引用
2. **更新注释**：反映变更的原因
3. **测试影响范围**：检查引用该示例的文档
4. **更新相关文档**：同步更新设计文档

---

## 📖 示例使用场景

### 场景 1：创建聚合根（Event Sourcing）

```
1. 阅读 design.md 了解领域设计
2. 参考 workflow.md 了解 TDD 流程
3. 复制 domain-layer.md 示例作为起点
4. 根据具体业务规则修改
5. 编写测试（domain-test.md）
```

### 场景 2：实现 Command Handler（写操作）

```
1. 阅读 design.md "应用层" 了解 CQRS 设计
2. 参考 workflow.md "Handler TDD" 了解流程
3. 复制 application-layer.md Command Handler 示例
4. 实现聚合加载、业务逻辑、Event Sourcing、Outbox
```

### 场景 3：实现 Query Handler（读操作）

```
1. 阅读 design.md "应用层" 了解 CQRS 设计
2. 复制 application-layer.md Query Handler 示例
3. 实现读模型查询、DTO 转换
```

### 场景 4：编写测试

```
1. 阅读 testing.md 了解测试策略
2. 参考 domain-test.md 或 application-test.md
3. 复制测试示例
4. 适配到具体实体和业务规则
```

---

## 🎨 代码风格

示例代码遵循以下风格：

```typescript
// ✅ 好的示例 - CQRS Command Handler
/**
 * 创建 Job 命令处理器
 *
 * 职责：
 * - 创建聚合根（领域层）
 * - 保存到 Event Store（写模型）
 * - 写入 Outbox（可靠事件发布）
 */
export class CreateJobHandler
  implements CommandHandler<CreateJobCommand, string>
{
  constructor(
    private readonly jobRepository: JobRepository,
    private readonly outbox: OutboxPort,
  ) {}

  async execute(command: CreateJobCommand): Promise<Result<string>> {
    // 1. 创建聚合根
    const job = Job.create({
      id: JobId.create(),
      title: titleResult.value,
      tenantId: command.payload.tenantId,
      createdBy: command.payload.userId,
    });

    // 2. 保存到 Event Store
    await this.jobRepository.save(job);

    // 3. 写入 Outbox
    for (const event of job.domainEvents) {
      await this.outbox.save(this.toIntegrationEvent(event, command));
    }

    // 4. 清理事件
    job.clearDomainEvents();

    return Result.ok(job.id);
  }
}

// ❌ 避免的写法 - Handler 包含业务逻辑
export class CreateJobHandler {
  async execute(command: CreateJobCommand): Promise<string> {
    // 不要在 Handler 中验证业务规则
    if (!command.payload.title.includes('任务')) {
      throw new Error('标题必须包含"任务"'); // 应该在领域层
    }

    // 不要直接操作数据库
    await this.db.query('INSERT INTO jobs ...'); // 应该通过 Repository
  }
}
```

---

## 📚 参考资源

### 架构文档

- [架构概览](../../../guidelines/archi/archi.md) - DDD + 六边形 + CQRS + EDA + Event Sourcing
- [领域层](../../../guidelines/archi/archi-02-domain.md) - 聚合根、值对象、领域事件
- [Event Store](../../../guidelines/archi/archi-03-event-store.md) - 事件存储
- [Command Handler](../../../guidelines/archi/archi-07-command-handler.md) - CQRS 和 Outbox 模式

### 官方文档

- [NestJS 文档](https://nestjs.com/)
- [MikroORM 文档](https://mikro-orm.io/)
- [Better Auth 文档](https://better-auth.com/)
- [ClickHouse 文档](https://clickhouse.com/)

### 内部文档

- [设计指南](../design.md)
- [测试策略](../testing.md)
- [代码约定](../AGENTS.md)
- [上下文地图](../CONTEXT-MAP.md)

---

**维护者**：后端团队  
**架构**：DDD + 六边形 + CQRS + EDA + Event Sourcing  
**最后更新**：2026-03-07
