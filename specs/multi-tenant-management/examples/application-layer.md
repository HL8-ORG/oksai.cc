# 应用层完整示例

完整的 **DDD + 六边形架构 + CQRS + EDA + Event Sourcing** 应用层实现示例。

---

## 🏗️ 架构概览

```
┌─────────────────────────────────────────────────────────────┐
│                      Controller                              │
│                 (接收 HTTP 请求)                              │
└───────────────────────────┬─────────────────────────────────┘
                            │
        ┌───────────────────┴───────────────────┐
        │                                       │
        ▼                                       ▼
┌───────────────────────┐           ┌───────────────────────┐
│     Command Bus       │           │      Query Bus        │
│   (命令总线 - 写)      │           │   (查询总线 - 读)      │
└───────────┬───────────┘           └───────────┬───────────┘
            │                                   │
            ▼                                   ▼
┌───────────────────────┐           ┌───────────────────────┐
│  Command Handler      │           │   Query Handler       │
│  (命令处理器)          │           │   (查询处理器)         │
└───────────┬───────────┘           └───────────┬───────────┘
            │                                   │
            ▼                                   ▼
┌───────────────────────┐           ┌───────────────────────┐
│    Event Store        │           │    ClickHouse         │
│  (PostgreSQL - 写)    │           │   (读模型 - 读)        │
└───────────┬───────────┘           └───────────────────────┘
            │
            ▼ 领域事件
┌───────────────────────┐
│      Outbox           │
│   (可靠事件发布)       │
└───────────────────────┘
```

---

## 📚 完整示例

```typescript
/**
 * 应用层完整示例 - CQRS + Event Sourcing
 *
 * 展示：
 * - Command（命令）- 写操作，修改状态
 * - Query（查询）- 读操作，查询读模型
 * - CommandHandler（命令处理器）- 处理命令，发布事件
 * - QueryHandler（查询处理器）- 查询读模型，返回 DTO
 * - Outbox 模式 - 可靠事件发布
 * - Result 模式 - 函数式错误处理
 */

import type { CommandHandler, QueryHandler } from '@oksai/shared/cqrs';
import type { Result } from '@oksai/shared/kernel';
import type { OutboxPort } from '@{module}/domain/ports/secondary/outbox.port';
import type { JobReadModel } from '@{module}/infrastructure/read-models/job.read-model';

// ==================== Command（写模型）====================

/**
 * 创建 Job 命令
 *
 * Command 特点：
 * - 只包含数据，不包含行为
 * - 命名使用动词（CreateJob）
 * - 参数使用原始类型或值对象
 * - 写操作：修改状态，发布事件
 */
export interface CreateJobPayload {
  title: string;
  tenantId: string;
  userId: string;
  correlationId: string;
}

export class CreateJobCommand {
  readonly commandType = 'CreateJob';

  constructor(public readonly payload: CreateJobPayload) {}
}

/**
 * 启动 Job 命令
 */
export interface StartJobPayload {
  jobId: string;
  tenantId: string;
  userId: string;
  correlationId: string;
}

export class StartJobCommand {
  readonly commandType = 'StartJob';

  constructor(public readonly payload: StartJobPayload) {}
}

// ==================== Command Handler（命令处理器）====================

/**
 * 创建 Job 命令处理器
 *
 * Command Handler 职责（写模型）：
 * 1. 加载/创建聚合根
 * 2. 调用领域对象方法
 * 3. 保存聚合（事件溯源）
 * 4. 将领域事件写入 Outbox
 * 5. 清理已提交事件
 *
 * 关键点：
 * - 写操作：修改状态，发布事件
 * - 使用 Event Sourcing 保存聚合
 * - 使用 Outbox 模式确保事件可靠发布
 */
export class CreateJobHandler
  implements CommandHandler<CreateJobCommand, string>
{
  constructor(
    private readonly jobRepository: JobRepository,
    private readonly outbox: OutboxPort,
  ) {}

  async execute(command: CreateJobCommand): Promise<Result<string>> {
    // 1. 创建值对象
    const titleResult = JobTitle.create(command.payload.title);
    if (titleResult.isFailure) {
      return Result.fail(titleResult.error);
    }

    // 2. 创建聚合根（领域层）
    const job = Job.create({
      id: JobId.create(),
      title: titleResult.value,
      tenantId: command.payload.tenantId,
      createdBy: command.payload.userId,
    });

    // 3. 保存聚合（Event Sourcing - 保存事件流）
    await this.jobRepository.save(job);

    // 4. 将领域事件写入 Outbox（可靠事件发布）
    for (const domainEvent of job.domainEvents) {
      await this.outbox.save(this.toIntegrationEvent(domainEvent, command));
    }

    // 5. 清理已提交事件
    job.clearDomainEvents();

    return Result.ok(job.id);
  }

  /**
   * 领域事件转换为集成事件
   */
  private toIntegrationEvent(
    domainEvent: DomainEvent,
    command: CreateJobCommand,
  ): OutboxMessage {
    return {
      id: uuidv4(),
      eventType: `job.${domainEvent.eventType.toLowerCase()}`,
      version: 'v1',
      payload: domainEvent.payload,
      metadata: {
        tenantId: command.payload.tenantId,
        userId: command.payload.userId,
        correlationId: command.payload.correlationId,
        causationId: domainEvent.eventId,
      },
      status: 'PENDING',
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
    };
  }
}

/**
 * 启动 Job 命令处理器
 *
 * 展示：加载现有聚合，调用领域方法，保存事件流
 */
export class StartJobHandler implements CommandHandler<StartJobCommand, void> {
  constructor(
    private readonly jobRepository: JobRepository,
    private readonly outbox: OutboxPort,
  ) {}

  async execute(command: StartJobCommand): Promise<Result<void>> {
    // 1. 加载聚合（从 Event Store 重放事件）
    const jobId = JobId.from(command.payload.jobId);
    const job = await this.jobRepository.findById(jobId);

    if (!job) {
      return Result.fail(new Error('Job 不存在'));
    }

    // 2. 验证租户（多租户安全）
    if (job.tenantId !== command.payload.tenantId) {
      return Result.fail(new Error('无权访问此 Job'));
    }

    // 3. 执行业务逻辑（领域层）
    try {
      job.start();
    } catch (error) {
      return Result.fail(error as Error);
    }

    // 4. 保存聚合（Event Sourcing - 追加新事件）
    await this.jobRepository.save(job);

    // 5. 写入 Outbox
    for (const domainEvent of job.domainEvents) {
      await this.outbox.save(this.toIntegrationEvent(domainEvent, command));
    }

    // 6. 清理事件
    job.clearDomainEvents();

    return Result.ok(undefined);
  }

  private toIntegrationEvent(
    domainEvent: DomainEvent,
    command: StartJobCommand,
  ): OutboxMessage {
    return {
      id: uuidv4(),
      eventType: `job.${domainEvent.eventType.toLowerCase()}`,
      version: 'v1',
      payload: domainEvent.payload,
      metadata: {
        tenantId: command.payload.tenantId,
        userId: command.payload.userId,
        correlationId: command.payload.correlationId,
        causationId: domainEvent.eventId,
      },
      status: 'PENDING',
      retryCount: 0,
      maxRetries: 3,
      createdAt: new Date(),
    };
  }
}

// ==================== Query（读模型）====================

/**
 * 获取 Job 查询
 *
 * Query 特点：
 * - 只读操作
 * - 返回 DTO 而非领域对象
 * - 不修改状态
 * - 查询读模型（ClickHouse），而非写模型（Event Store）
 */
export class GetJobQuery {
  constructor(
    public readonly jobId: string,
    public readonly tenantId: string,
  ) {}
}

/**
 * 获取 Job 列表查询
 */
export class GetJobListQuery {
  constructor(
    public readonly tenantId: string,
    public readonly page?: number,
    public readonly pageSize?: number,
    public readonly status?: string,
  ) {}
}

// ==================== Query Handler（查询处理器）====================

/**
 * 获取 Job 查询处理器
 *
 * Query Handler 职责（读模型）：
 * 1. 从读模型查询数据（ClickHouse）
 * 2. 转换为 DTO
 * 3. 返回结果
 *
 * 关键点：
 * - 读操作：不修改状态，不发布事件
 * - 查询读模型（ClickHouse），性能优化
 * - 返回 DTO，而非领域对象
 */
export class GetJobHandler
  implements QueryHandler<GetJobQuery, Result<JobDto>>
{
  constructor(private readonly jobReadModel: JobReadModel) {}

  async execute(query: GetJobQuery): Promise<Result<JobDto>> {
    // 1. 从读模型查询（ClickHouse）
    const job = await this.jobReadModel.findById(query.jobId, query.tenantId);

    if (!job) {
      return Result.fail(new Error('Job 不存在'));
    }

    // 2. 直接返回 DTO（读模型已经是扁平化结构）
    return Result.ok(job);
  }
}

/**
 * 获取 Job 列表查询处理器
 *
 * 展示：分页查询、过滤、排序
 */
export class GetJobListHandler
  implements QueryHandler<GetJobListQuery, Result<JobListDto>>
{
  constructor(private readonly jobReadModel: JobReadModel) {}

  async execute(query: GetJobListQuery): Promise<Result<JobListDto>> {
    // 1. 从读模型查询列表（ClickHouse）
    const { jobs, total } = await this.jobReadModel.findAll({
      tenantId: query.tenantId,
      page: query.page || 1,
      pageSize: query.pageSize || 10,
      status: query.status,
    });

    // 2. 返回 DTO 列表
    return Result.ok({
      jobs,
      total,
      page: query.page || 1,
      pageSize: query.pageSize || 10,
    });
  }
}

// ==================== DTO（数据传输对象）====================

/**
 * Job DTO
 *
 * DTO 特点：
 * - 只包含数据
 * - 使用原始类型（扁平化结构）
 * - 不包含业务逻辑
 * - 读模型直接返回此格式
 */
export interface JobDto {
  id: string;
  title: string;
  status: string;
  tenantId: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  startedAt?: Date;
  completedAt?: Date;
}

/**
 * Job 列表 DTO
 */
export interface JobListDto {
  jobs: JobDto[];
  total: number;
  page: number;
  pageSize: number;
}

// ==================== Outbox 消息 ====================

/**
 * Outbox 消息
 *
 * 用于可靠事件发布
 */
export interface OutboxMessage {
  id: string;
  eventType: string;
  version: string;
  payload: unknown;
  metadata: {
    tenantId: string;
    userId: string;
    correlationId: string;
    causationId?: string;
  };
  status: 'PENDING' | 'PROCESSING' | 'PROCESSED' | 'FAILED';
  retryCount: number;
  maxRetries: number;
  createdAt: Date;
  processedAt?: Date;
  error?: string;
}
```

---

## 🎯 关键模式

### 1. CQRS 分离 - 写模型 vs 读模型

```typescript
// ✅ 写模型：Command 修改状态，发布事件
export class CreateJobHandler
  implements CommandHandler<CreateJobCommand, string>
{
  constructor(
    private readonly jobRepository: JobRepository, // Event Store
    private readonly outbox: OutboxPort, // Outbox 表
  ) {}

  async execute(command: CreateJobCommand): Promise<Result<string>> {
    // 1. 创建聚合根
    const job = Job.create({
      /* ... */
    });

    // 2. 保存到 Event Store（写模型）
    await this.jobRepository.save(job);

    // 3. 写入 Outbox（可靠事件发布）
    for (const event of job.domainEvents) {
      await this.outbox.save(this.toIntegrationEvent(event, command));
    }

    return Result.ok(job.id);
  }
}

// ✅ 读模型：Query 查询读模型，不修改状态
export class GetJobHandler
  implements QueryHandler<GetJobQuery, Result<JobDto>>
{
  constructor(private readonly jobReadModel: JobReadModel) {} // ClickHouse

  async execute(query: GetJobQuery): Promise<Result<JobDto>> {
    // 直接查询读模型（ClickHouse），性能优化
    const job = await this.jobReadModel.findById(query.jobId, query.tenantId);

    return Result.ok(job); // 返回扁平化 DTO
  }
}
```

### 2. Command 模式 - 写操作

```typescript
// ✅ 好的实践：Command 只包含数据
export class CreateJobCommand {
  readonly commandType = 'CreateJob';

  constructor(public readonly payload: CreateJobPayload) {}
}

// ❌ 避免的做法：Command 包含行为或领域对象
export class CreateJobCommand {
  constructor(public readonly job: Job) {} // 包含领域对象

  validate() {
    // 包含行为 - 应该在领域层
  }
}
```

### 3. Query 模式 - 读操作

```typescript
// ✅ 好的实践：Query 返回 DTO，查询读模型
export class GetJobHandler
  implements QueryHandler<GetJobQuery, Result<JobDto>>
{
  async execute(query: GetJobQuery): Promise<Result<JobDto>> {
    // 查询读模型（ClickHouse）
    const job = await this.readModel.findById(query.jobId);
    return Result.ok(job); // 返回 DTO
  }
}

// ❌ 避免的做法：Query 返回领域对象或查询写模型
export class GetJobHandler implements QueryHandler<GetJobQuery, Result<Job>> {
  async execute(query: GetJobQuery): Promise<Result<Job>> {
    // 查询写模型（Event Store）- 性能差
    const job = await this.repository.findById(query.jobId);
    return Result.ok(job); // 返回领域对象 - 泄露领域层
  }
}
```

### 4. Outbox 模式 - 可靠事件发布

```typescript
// ✅ 好的实践：使用 Outbox 确保事件可靠发布
export class CreateJobHandler
  implements CommandHandler<CreateJobCommand, string>
{
  async execute(command: CreateJobCommand): Promise<Result<string>> {
    const job = Job.create({
      /* ... */
    });

    // 1. 保存聚合（Event Store）
    await this.jobRepository.save(job);

    // 2. 写入 Outbox（同一事务）
    for (const event of job.domainEvents) {
      await this.outbox.save(this.toIntegrationEvent(event, command));
    }

    // 3. 清理事件
    job.clearDomainEvents();

    return Result.ok(job.id);
  }
}

// ❌ 避免的做法：直接发布事件（可能丢失）
export class CreateJobHandler
  implements CommandHandler<CreateJobCommand, string>
{
  async execute(command: CreateJobCommand): Promise<Result<string>> {
    const job = Job.create({
      /* ... */
    });
    await this.jobRepository.save(job);

    // 直接发布事件 - 如果失败，事件丢失
    await this.eventBus.publishAll(job.domainEvents);

    return Result.ok(job.id);
  }
}
```

### 5. Result 模式 - 函数式错误处理

```typescript
// ✅ 好的实践：使用 Result 模式
async execute(command: CreateJobCommand): Promise<Result<string>> {
  const titleResult = JobTitle.create(command.payload.title);
  if (titleResult.isFailure) {
    return Result.fail(titleResult.error);  // 返回错误
  }

  const job = Job.create({ title: titleResult.value, /* ... */ });
  await this.jobRepository.save(job);

  return Result.ok(job.id);  // 返回成功
}

// ❌ 避免的做法：抛出异常
async execute(command: CreateJobCommand): Promise<string> {
  if (!command.payload.title) {
    throw new Error('标题不能为空');  // 使用异常 - 非函数式
  }

  const job = Job.create({ /* ... */ });
  await this.jobRepository.save(job);

  return job.id;
}
```

---

## 📖 最佳实践

### ✅ 推荐做法

1. **CQRS 分离**：
   - Command（写）：修改状态，发布事件，写入 Event Store
   - Query（读）：查询读模型，返回 DTO，不修改状态

2. **Command Handler 职责**：
   - 加载/创建聚合根
   - 调用领域对象方法
   - 保存聚合（Event Sourcing）
   - 写入 Outbox（可靠事件发布）
   - 清理已提交事件

3. **Query Handler 职责**：
   - 查询读模型（ClickHouse）
   - 返回扁平化 DTO
   - 不发布事件，不修改状态

4. **使用 Result 模式**：而非抛出异常

5. **Outbox 模式**：确保事件可靠发布

6. **多租户安全**：所有查询/命令都验证租户 ID

### ❌ 避免做法

1. **Command 包含行为**：Command 应该只有数据

2. **Handler 包含业务逻辑**：业务逻辑应在领域层

3. **Query 修改状态**：Query 应该是只读的

4. **返回领域对象**：应该返回 DTO

5. **直接发布事件**：应该使用 Outbox 模式

6. **Query 查询写模型**：应该查询读模型（性能优化）

7. **在 Handler 中验证**：验证应在领域层

---

## 🔄 数据流示例

### 写操作（CreateJob）

```
1. Controller 接收 HTTP 请求
   ↓
2. Controller 构建 CreateJobCommand
   ↓
3. Command Bus 路由到 CreateJobHandler
   ↓
4. Handler 创建 Job 聚合根
   ↓
5. Handler 保存 Job 到 Event Store（PostgreSQL）
   ↓
6. Handler 将领域事件写入 Outbox（PostgreSQL）
   ↓
7. Outbox Processor 发布事件到消息队列
   ↓
8. Event Consumer 更新读模型（ClickHouse）
```

### 读操作（GetJob）

```
1. Controller 接收 HTTP 请求
   ↓
2. Controller 构建 GetJobQuery
   ↓
3. Query Bus 路由到 GetJobHandler
   ↓
4. Handler 查询读模型（ClickHouse）
   ↓
5. Handler 返回 JobDto（扁平化结构）
```

---

## 🔗 参考资源

- [设计指南](../design.md) - 应用层设计决策
- [测试策略](../testing.md) - 应用层测试
- [workflow.md](../workflow.md) - TDD 开发流程
- [examples/domain-layer.md](./domain-layer.md) - 领域层示例
- [examples/README.md](./README.md) - 示例库索引
- [架构指南](../../../guidelines/archi/archi-07-command-handler.md) - CQRS 架构
- [Event Store](../../../guidelines/archi/archi-03-event-store.md) - 事件存储
