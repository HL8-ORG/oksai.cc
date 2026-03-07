# 领域层完整示例（DDD + 六边形架构）

完整的 DDD 领域层实现示例，遵循 **DDD + 六边形架构 + CQRS + EDA + Event Sourcing** 混合架构。

---

## 📚 完整示例

### 目录结构

```
libs/domain/job/
├── domain/
│   ├── job.aggregate.ts              # 聚合根
│   ├── job-item.entity.ts            # 实体
│   ├── job-id.vo.ts                  # 值对象：ID
│   ├── job-title.vo.ts               # 值对象：标题
│   ├── job-status.vo.ts              # 值对象：状态
│   ├── events/
│   │   ├── job-created.domain-event.ts
│   │   ├── job-started.domain-event.ts
│   │   └── job-completed.domain-event.ts
│   ├── ports/
│   │   ├── job.repository.ts         # 仓储 Port（Secondary）
│   │   ├── event-store.port.ts       # 事件存储 Port（Secondary）
│   │   └── job-command.port.ts       # 命令 Port（Primary）
│   └── services/
│       └── job-domain.service.ts     # 领域服务
├── application/
│   ├── commands/
│   │   ├── create-job.command.ts
│   │   ├── create-job.handler.ts
│   │   ├── start-job.command.ts
│   │   └── start-job.handler.ts
│   ├── queries/
│   │   ├── get-job.query.ts
│   │   ├── get-job.handler.ts
│   │   ├── list-jobs.query.ts
│   │   └── list-jobs.handler.ts
│   └── dto/
│       └── job.dto.ts
├── infrastructure/
│   ├── repositories/
│   │   ├── event-sourced-job.repository.ts    # 事件溯源仓储
│   │   └── clickhouse-job-read.repository.ts  # 读模型仓储
│   ├── adapters/
│   │   ├── postgres-event-store.adapter.ts    # 事件存储适配器
│   │   └── kafka-event-bus.adapter.ts         # 事件总线适配器
│   └── projectors/
│       └── job.projector.ts           # 事件投影器
└── interface/
    └── controllers/
        └── job.controller.ts
```

---

## 1. 领域层

### 1.1 值对象

```typescript
// job-id.vo.ts
import { ValueObject } from '@oksai/kernel';
import { Result } from '@oksai/result';
import { ValidationError } from '@oksai/exceptions';

/**
 * Job ID 值对象
 *
 * 职责：封装 Job 的唯一标识符
 * 特性：不可变、自验证
 */
export class JobId extends ValueObject<{ value: string }> {
  private constructor(props: { value: string }) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  /**
   * 生成新的 Job ID
   */
  static generate(): JobId {
    return new JobId({ value: uuid() });
  }

  /**
   * 从字符串创建 Job ID
   */
  static fromString(id: string): Result<JobId, ValidationError> {
    if (!id || id.trim().length === 0) {
      return Result.fail(new ValidationError('Job ID 不能为空', 'jobId'));
    }

    return Result.ok(new JobId({ value: id }));
  }
}
```

```typescript
// job-title.vo.ts
import { ValueObject } from '@oksai/kernel';
import { Result } from '@oksai/result';
import { ValidationError } from '@oksai/exceptions';

/**
 * Job 标题值对象
 *
 * 业务规则：
 * - 不能为空
 * - 长度在 1-200 个字符之间
 */
export class JobTitle extends ValueObject<{ value: string }> {
  private constructor(props: { value: string }) {
    super(props);
  }

  get value(): string {
    return this.props.value;
  }

  static create(title: string): Result<JobTitle, ValidationError> {
    if (!title || title.trim().length === 0) {
      return Result.fail(new ValidationError('Job 标题不能为空', 'title'));
    }

    if (title.length > 200) {
      return Result.fail(
        new ValidationError('Job 标题不能超过 200 个字符', 'title'),
      );
    }

    return Result.ok(new JobTitle({ value: title.trim() }));
  }
}
```

```typescript
// job-status.vo.ts
/**
 * Job 状态枚举
 */
export enum JobStatus {
  PENDING = 'pending',
  RUNNING = 'running',
  COMPLETED = 'completed',
  FAILED = 'failed',
  CANCELLED = 'cancelled',
}

/**
 * Job 状态值对象
 */
export class JobStatusVO extends ValueObject<{ value: JobStatus }> {
  private constructor(props: { value: JobStatus }) {
    super(props);
  }

  get value(): JobStatus {
    return this.props.value;
  }

  static pending(): JobStatusVO {
    return new JobStatusVO({ value: JobStatus.PENDING });
  }

  static running(): JobStatusVO {
    return new JobStatusVO({ value: JobStatus.RUNNING });
  }

  static completed(): JobStatusVO {
    return new JobStatusVO({ value: JobStatus.COMPLETED });
  }

  static failed(): JobStatusVO {
    return new JobStatusVO({ value: JobStatus.FAILED });
  }

  isPending(): boolean {
    return this.value === JobStatus.PENDING;
  }

  isRunning(): boolean {
    return this.value === JobStatus.RUNNING;
  }

  canStart(): boolean {
    return this.isPending();
  }

  canComplete(): boolean {
    return this.isRunning();
  }
}
```

### 1.2 聚合根

```typescript
// job.aggregate.ts
import { AggregateRoot } from '@oksai/kernel';
import { Result } from '@oksai/result';
import { DomainError, ValidationError } from '@oksai/exceptions';
import { JobId } from './job-id.vo';
import { JobTitle } from './job-title.vo';
import { JobStatusVO, JobStatus } from './job-status.vo';
import { JobCreatedEvent } from './events/job-created.domain-event';
import { JobStartedEvent } from './events/job-started.domain-event';
import { JobCompletedEvent } from './events/job-completed.domain-event';

/**
 * Job 聚合根
 *
 * 职责：
 * - 管理 Job 的完整性
 * - 确保业务规则一致性
 * - 触发领域事件
 *
 * 六边形架构：
 * - 领域核心，无外部依赖
 * - 定义 Primary/Secondary Port
 */
export class Job extends AggregateRoot<JobProps> {
  private constructor(props: JobProps) {
    super(props);
  }

  // ==================== Getters ====================

  get id(): JobId {
    return this.props.id;
  }

  get title(): JobTitle {
    return this.props.title;
  }

  get status(): JobStatusVO {
    return this.props.status;
  }

  get tenantId(): string {
    return this.props.tenantId;
  }

  get createdAt(): Date {
    return this.props.createdAt;
  }

  get updatedAt(): Date {
    return this.props.updatedAt;
  }

  // ==================== 业务方法 ====================

  /**
   * 启动 Job
   *
   * 业务规则：
   * - 只能启动 Pending 状态的 Job
   * - 触发 JobStartedEvent
   */
  start(): Result<void, DomainError> {
    if (!this.status.canStart()) {
      return Result.fail(
        new DomainError(`Job 不能启动，当前状态：${this.status.value}`),
      );
    }

    this.props.status = JobStatusVO.running();
    this.props.updatedAt = new Date();

    this.addDomainEvent(new JobStartedEvent(this.id, this.tenantId));

    return Result.ok();
  }

  /**
   * 完成 Job
   *
   * 业务规则：
   * - 只能完成 Running 状态的 Job
   * - 触发 JobCompletedEvent
   */
  complete(): Result<void, DomainError> {
    if (!this.status.canComplete()) {
      return Result.fail(
        new DomainError(`Job 不能完成，当前状态：${this.status.value}`),
      );
    }

    this.props.status = JobStatusVO.completed();
    this.props.updatedAt = new Date();

    this.addDomainEvent(new JobCompletedEvent(this.id, this.tenantId));

    return Result.ok();
  }

  // ==================== 工厂方法 ====================

  /**
   * 创建 Job（新 Job）
   *
   * 业务规则：
   * - 标题必须有效
   * - 默认状态为 Pending
   * - 触发 JobCreatedEvent
   */
  static create(props: CreateJobProps): Result<Job, ValidationError> {
    // 验证标题
    const titleResult = JobTitle.create(props.title);
    if (titleResult.isFail()) {
      return Result.fail(titleResult.value);
    }

    // 创建 Job
    const job = new Job({
      id: JobId.generate(),
      title: titleResult.value,
      status: JobStatusVO.pending(),
      tenantId: props.tenantId,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 触发领域事件
    job.addDomainEvent(new JobCreatedEvent(job.id, job.title, job.tenantId));

    return Result.ok(job);
  }

  /**
   * 从事件流重建（Event Sourcing）
   *
   * 通过重放事件历史来恢复 Job 的状态
   */
  static reconstitute(events: DomainEvent[]): Job {
    let job: Job | null = null;

    for (const event of events) {
      if (event instanceof JobCreatedEvent) {
        job = new Job({
          id: event.jobId,
          title: event.title,
          status: JobStatusVO.pending(),
          tenantId: event.tenantId,
          createdAt: event.occurredAt,
          updatedAt: event.occurredAt,
        });
      } else if (event instanceof JobStartedEvent && job) {
        job.props.status = JobStatusVO.running();
        job.props.updatedAt = event.occurredAt;
      } else if (event instanceof JobCompletedEvent && job) {
        job.props.status = JobStatusVO.completed();
        job.props.updatedAt = event.occurredAt;
      }
    }

    if (!job) {
      throw new Error('Cannot reconstitute Job: no events provided');
    }

    return job;
  }
}

// ==================== 类型定义 ====================

interface JobProps {
  id: JobId;
  title: JobTitle;
  status: JobStatusVO;
  tenantId: string;
  createdAt: Date;
  updatedAt: Date;
}

interface CreateJobProps {
  title: string;
  tenantId: string;
}
```

### 1.3 领域事件

```typescript
// events/job-created.domain-event.ts
import { IDomainEvent } from '@oksai/kernel';
import { JobId } from '../job-id.vo';
import { JobTitle } from '../job-title.vo';

/**
 * Job 创建事件
 *
 * 特性：
 * - 不可变
 * - 包含完整的创建信息
 * - 用于 Event Sourcing 和 EDA
 */
export class JobCreatedEvent implements IDomainEvent {
  readonly eventType = 'job.created';
  readonly occurredAt: Date;
  readonly aggregateId: JobId;

  constructor(
    public readonly jobId: JobId,
    public readonly title: JobTitle,
    public readonly tenantId: string,
  ) {
    this.occurredAt = new Date();
    this.aggregateId = jobId;
  }

  /**
   * 序列化为 JSON（用于事件存储）
   */
  toJSON(): object {
    return {
      eventType: this.eventType,
      occurredAt: this.occurredAt.toISOString(),
      jobId: this.jobId.value,
      title: this.title.value,
      tenantId: this.tenantId,
    };
  }

  /**
   * 从 JSON 反序列化（用于重建事件）
   */
  static fromJSON(json: any): JobCreatedEvent {
    const jobId = JobId.fromString(json.jobId).value;
    const title = JobTitle.create(json.title).value;

    const event = new JobCreatedEvent(jobId, title, json.tenantId);
    (event as any).occurredAt = new Date(json.occurredAt);

    return event;
  }
}
```

### 1.4 Ports（六边形架构核心）

```typescript
// ports/job.repository.ts
import { Job } from '../job.aggregate';
import { JobId } from '../job-id.vo';

/**
 * Job 仓储 Port（Secondary Port）
 *
 * 六边形架构：
 * - 领域层定义的接口
 * - 基础设施层实现
 * - 用于持久化和重建聚合
 */
export interface IJobRepository {
  /**
   * 保存 Job（追加事件）
   */
  save(job: Job): Promise<void>;

  /**
   * 通过 ID 查找 Job（从事件流重建）
   */
  findById(id: JobId): Promise<Job | null>;

  /**
   * 查找租户下的所有 Job
   */
  findByTenantId(tenantId: string): Promise<Job[]>;
}
```

```typescript
// ports/event-store.port.ts
import { IDomainEvent } from '@oksai/kernel';

/**
 * 事件存储 Port（Secondary Port）
 *
 * 六边形架构：
 * - 领域层定义的接口
 * - 基础设施层实现（如 PostgreSQL）
 *
 * Event Sourcing：
 * - 追加事件
 * - 读取事件流
 */
export interface IEventStore {
  /**
   * 追加事件到事件流
   */
  append(streamId: string, events: IDomainEvent[]): Promise<void>;

  /**
   * 读取事件流
   */
  getEvents(streamId: string): Promise<IDomainEvent[]>;

  /**
   * 读取租户的所有事件
   */
  getEventsByTenant(tenantId: string): Promise<IDomainEvent[]>;
}
```

```typescript
// ports/job-command.port.ts
import { Result } from '@oksai/result';
import { Job } from '../job.aggregate';

/**
 * Job 命令 Port（Primary Port）
 *
 * 六边形架构：
 * - 领域层定义的接口
 * - 应用层实现
 * - 定义业务用例
 */
export interface IJobCommandPort {
  /**
   * 创建 Job
   */
  createJob(title: string, tenantId: string): Promise<Result<Job, Error>>;

  /**
   * 启动 Job
   */
  startJob(jobId: string, tenantId: string): Promise<Result<void, Error>>;

  /**
   * 完成 Job
   */
  completeJob(jobId: string, tenantId: string): Promise<Result<void, Error>>;
}
```

---

## 🎯 关键模式

### 1. 六边形架构模式

```typescript
// ✅ 好的实践：领域层定义 Port
// domain/ports/job.repository.ts
export interface IJobRepository {
  save(job: Job): Promise<void>;
  findById(id: JobId): Promise<Job | null>;
}

// ✅ 好的实践：基础设施层实现 Port
// infrastructure/repositories/event-sourced-job.repository.ts
export class EventSourcedJobRepository implements IJobRepository {
  constructor(private readonly eventStore: IEventStore) {}

  async save(job: Job): Promise<void> {
    const events = job.domainEvents;
    await this.eventStore.append(job.id.value, events);
    job.clearDomainEvents();
  }

  async findById(id: JobId): Promise<Job | null> {
    const events = await this.eventStore.getEvents(id.value);
    if (events.length === 0) return null;
    return Job.reconstitute(events);
  }
}
```

### 2. Event Sourcing 模式

```typescript
// ✅ 好的实践：从事件流重建聚合
static reconstitute(events: DomainEvent[]): Job {
  let job: Job | null = null;

  for (const event of events) {
    if (event instanceof JobCreatedEvent) {
      job = new Job({ ...event });
    } else if (event instanceof JobStartedEvent && job) {
      job.apply(event);  // 应用事件
    }
  }

  return job!;
}

// ❌ 避免的做法：直接从数据库读取状态
static fromDatabase(row: JobRow): Job {
  return new Job({
    id: row.id,
    status: row.status,  // 直接读取状态，丢失历史
  });
}
```

---

## 📖 最佳实践

### ✅ 推荐做法

1. **领域层无依赖**：只依赖 `@oksai/kernel`、`@oksai/result` 等共享库
2. **定义 Port 接口**：领域层定义接口，基础设施层实现
3. **Event Sourcing**：所有状态变更通过事件
4. **领域事件**：在业务方法中触发事件
5. **多租户隔离**：所有聚合包含 tenantId

### ❌ 避免做法

1. **领域层依赖 ORM**：违反六边形架构
2. **直接修改状态**：应该通过业务方法
3. **跳过事件**：所有变更必须有对应事件
4. **忽略租户**：多租户必须全链路隔离

---

## 📚 附录：不同架构级别的示例

### Level 1：简单 CRUD（Country 字典表）

**适用场景**：静态数据、配置管理、字典表

```typescript
// domain/model/country.entity.ts
import { Entity } from '@oksai/shared/kernel';
import { CountryId } from './country-id.vo';

export interface CountryProps {
  id: CountryId;
  code: string; // 国家代码（CN, US）
  name: string; // 国家名称（中国, 美国）
  continent: string; // 所属洲
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 国家实体（简单实体，非聚合根）
 *
 * Level 1 特点：
 * - 无聚合根（简单 Entity）
 * - 无领域事件
 * - 无复杂业务规则
 * - 纯数据模型
 */
export class Country extends Entity<CountryProps> {
  private constructor(props: CountryProps) {
    super(props);
  }

  get id(): CountryId {
    return this.props.id;
  }

  get code(): string {
    return this.props.code;
  }

  get name(): string {
    return this.props.name;
  }

  /**
   * 创建国家（简单验证）
   */
  static create(props: CreateCountryProps): Country {
    if (!props.code || props.code.length !== 2) {
      throw new Error('国家代码必须是 2 位字母');
    }

    if (!props.name || props.name.length < 2) {
      throw new Error('国家名称不能为空');
    }

    return new Country({
      id: CountryId.generate(),
      code: props.code.toUpperCase(),
      name: props.name,
      continent: props.continent,
      createdAt: new Date(),
      updatedAt: new Date(),
    });
  }

  /**
   * 更新国家名称（简单更新）
   */
  updateName(newName: string): void {
    if (!newName || newName.length < 2) {
      throw new Error('国家名称不能为空');
    }

    this.props.name = newName;
    this.props.updatedAt = new Date();
  }
}

// ❌ Level 1 不需要：
// - 聚合根（AggregateRoot）
// - 领域事件（DomainEvent）
// - 事件溯源（Event Sourcing）
// - CQRS
// - Outbox
```

**Level 1 架构组件**：

```
domain/
  ├── model/           # 简单实体（Entity）
  ├── repositories/    # 仓储接口（CRUD）
  └── ports/           # 端口定义

application/
  ├── services/        # 应用服务（CRUD）
  └── dto/             # DTO

infrastructure/
  ├── persistence/     # 持久化（MikroORM）
  └── adapters/        # 适配器
```

---

### Level 2：业务领域（User 用户管理）

**适用场景**：用户管理、权限管理、文档管理

```typescript
// domain/model/user.aggregate.ts
import { AggregateRoot } from '@oksai/shared/kernel';
import { UserId } from './user-id.vo';
import { Email } from './email.vo';
import { UserName } from './user-name.vo';
import { UserRole } from './user-role.vo';
import { UserCreatedEvent } from '../events/user-created.event';
import { UserNameUpdatedEvent } from '../events/user-name-updated.event';

export interface UserProps {
  id: UserId;
  email: Email;
  name: UserName;
  role: UserRole;
  tenantId: string; // 多租户
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 用户聚合根
 *
 * Level 2 特点：
 * - 聚合根（AggregateRoot）
 * - 值对象（Email, UserName）
 * - 领域事件（UserCreatedEvent）
 * - 业务规则验证
 * - 多租户隔离
 *
 * ❌ 不需要：
 * - Event Sourcing
 * - CQRS
 * - Outbox
 */
export class User extends AggregateRoot<UserProps> {
  private constructor(props: UserProps) {
    super(props);
  }

  get id(): UserId {
    return this.props.id;
  }

  get email(): Email {
    return this.props.email;
  }

  get name(): UserName {
    return this.props.name;
  }

  get role(): UserRole {
    return this.props.role;
  }

  get isActive(): boolean {
    return this.props.isActive;
  }

  /**
   * 创建用户
   */
  static create(props: CreateUserProps): Result<User, ValidationError> {
    // 1. 验证值对象
    const emailResult = Email.create(props.email);
    if (emailResult.isFailure) {
      return Result.fail(emailResult.error);
    }

    const nameResult = UserName.create(props.name);
    if (nameResult.isFailure) {
      return Result.fail(nameResult.error);
    }

    // 2. 创建聚合
    const user = new User({
      id: UserId.generate(),
      email: emailResult.value,
      name: nameResult.value,
      role: props.role || UserRole.USER,
      tenantId: props.tenantId,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 3. 触发领域事件（Level 2 需要）
    user.addDomainEvent(
      new UserCreatedEvent(user.id, user.email, user.tenantId),
    );

    return Result.ok(user);
  }

  /**
   * 更新用户名
   */
  updateName(newName: UserName): Result<void, DomainError> {
    // 1. 验证业务规则
    if (!this.isActive) {
      return Result.fail(new DomainError('不能修改已禁用用户的信息'));
    }

    // 2. 更新状态
    this.props.name = newName;
    this.props.updatedAt = new Date();

    // 3. 触发领域事件（Level 2 需要）
    this.addDomainEvent(
      new UserNameUpdatedEvent(this.id, newName, this.tenantId),
    );

    return Result.ok();
  }

  /**
   * 禁用用户
   */
  deactivate(): Result<void, DomainError> {
    if (!this.isActive) {
      return Result.fail(new DomainError('用户已被禁用'));
    }

    this.props.isActive = false;
    this.props.updatedAt = new Date();

    this.addDomainEvent(new UserDeactivatedEvent(this.id, this.tenantId));

    return Result.ok();
  }
}
```

**Level 2 架构组件**：

```
domain/
  ├── model/           # 聚合根、实体、值对象
  ├── events/          # 领域事件 ✅
  ├── services/        # 领域服务
  ├── repositories/    # 仓储接口
  └── ports/           # 端口定义

application/
  ├── services/        # 应用服务
  ├── dto/             # DTO
  └── event-handlers/  # 事件处理器 ✅

infrastructure/
  ├── persistence/     # 持久化（MikroORM）
  ├── adapters/        # 适配器
  └── publishers/      # 事件发布器 ✅

❌ 不需要：
- Event Sourcing
- CQRS（Command/Query 分离）
- Outbox/Inbox
- ClickHouse 读模型
- Projector
```

**Level 2 vs Level 3 对比**：

| 特性               | Level 2（用户管理） | Level 3（Job 管理）    |
| :----------------- | :------------------ | :--------------------- |
| **聚合根**         | ✅ User             | ✅ Job                 |
| **值对象**         | ✅ Email, UserName  | ✅ JobTitle, JobStatus |
| **领域事件**       | ✅ UserCreatedEvent | ✅ JobCreatedEvent     |
| **事件发布**       | ✅ EventBus         | ✅ EventBus            |
| **Event Sourcing** | ❌                  | ✅ Event Store         |
| **CQRS**           | ❌                  | ✅ Command/Query       |
| **Outbox**         | ❌                  | ✅ 可靠发布            |
| **读模型**         | ❌                  | ✅ ClickHouse          |
| **Projector**      | ❌                  | ✅ 事件投影            |

---

## 🔗 参考资源

- [架构设计文档](../../../guidelines/archi/archi.md)
- [架构选择指南](../../../guidelines/archi/archi-13-architecture-selection.md) ⭐
- [编码规范](../../../guidelines/spec/spec.md)
- [应用层示例](./application-layer.md)
- [examples/README.md](./README.md) - 示例库索引
