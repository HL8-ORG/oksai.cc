# 架构选择指南

[返回目录](./archi.md)

---

## 一、架构级别定义

本项目采用 **DDD + 六边形架构 + CQRS + EDA + Event Sourcing** 混合架构，但**不是所有模块都需要完整实现**。

根据模块复杂度，将架构分为三个级别：

| 级别        | 名称      | 适用场景                | 架构模式                                   |
| :---------- | :-------- | :---------------------- | :----------------------------------------- |
| **Level 1** | 简单 CRUD | 静态数据、配置管理      | DDD（基础）+ 六边形                        |
| **Level 2** | 业务领域  | 中等复杂度业务逻辑      | DDD + 六边形 + EDA                         |
| **Level 3** | 复杂领域  | 高复杂度、需要审计/分析 | DDD + 六边形 + CQRS + EDA + Event Sourcing |

---

## 二、级别判断标准

### 2.1 Level 1：简单 CRUD

**特征**：

- ✅ 简单的增删改查操作
- ✅ 无复杂业务规则
- ✅ 无需事件驱动
- ✅ 无需审计历史
- ✅ 数据量小，无需读模型优化

**示例模块**：

- 字典表（国家、城市、货币）
- 配置管理（系统配置、租户配置）
- 标签系统（简单标签管理）
- 静态资源管理（文件元数据）

**架构组件**：

```
domain/
  ├── model/           # 简单实体（无聚合根）
  ├── repositories/    # 仓储接口（CRUD）
  └── ports/           # 端口定义

application/
  ├── services/        # 应用服务（CRUD 操作）
  └── dto/             # 数据传输对象

infrastructure/
  ├── persistence/     # 持久化（MikroORM）
  └── adapters/        # 适配器

❌ 不需要：
- 聚合根（AggregatRoot）
- 领域事件（DomainEvent）
- Event Sourcing
- CQRS
- Outbox/Inbox
```

---

### 2.2 Level 2：业务领域

**特征**：

- ✅ 中等复杂度业务规则
- ✅ 需要领域事件通知其他模块
- ✅ 需要聚合根保护业务规则
- ✅ 需要值对象验证
- ❌ 不需要完整审计历史
- ❌ 不需要读模型优化

**示例模块**：

- 用户管理（用户创建、更新、角色分配）
- 权限管理（角色、权限分配）
- 通知管理（消息发送、状态跟踪）
- 文档管理（文档创建、版本控制）

**架构组件**：

```
domain/
  ├── model/           # 聚合根、实体、值对象
  ├── events/          # 领域事件 ✅
  ├── services/        # 领域服务
  ├── repositories/    # 仓储接口
  └── ports/           # 端口定义

application/
  ├── services/        # 应用服务
  ├── dto/             # 数据传输对象
  └── event-handlers/  # 事件处理器 ✅

infrastructure/
  ├── persistence/     # 持久化（MikroORM）
  ├── adapters/        # 适配器
  └── publishers/      # 事件发布器 ✅

✅ 需要：
- 聚合根（AggregateRoot）
- 领域事件（DomainEvent）
- 事件发布（EventBus）
- 值对象（ValueObject）

❌ 不需要：
- Event Sourcing
- CQRS（Command/Query 分离）
- Outbox/Inbox
- ClickHouse 读模型
```

---

### 2.3 Level 3：复杂领域（完整混合架构）

**特征**：

- ✅ 高复杂度业务规则
- ✅ 需要完整审计历史（时间旅行）
- ✅ 需要读写分离（性能优化）
- ✅ 需要事件溯源（Event Sourcing）
- ✅ 需要跨模块事件驱动
- ✅ 需要数据分析（读模型优化）

**示例模块**：

- **Job 领域**（任务执行、状态跟踪、完整审计）
- **订单系统**（订单创建、支付、发货、退款）
- **支付系统**（交易记录、审计、对账）
- **库存管理**（库存变更、预警、分析）
- **数据仓库**（数据接入、转换、分析）

**架构组件**：

```
domain/
  ├── model/           # 聚合根、实体、值对象
  ├── events/          # 领域事件 ✅
  ├── services/        # 领域服务
  ├── repositories/    # 仓储接口
  └── ports/           # 端口定义

application/
  ├── commands/        # 命令（写操作）✅ CQRS
  ├── queries/         # 查询（读操作）✅ CQRS
  ├── handlers/        # 命令/查询处理器
  ├── dto/             # 数据传输对象
  └── event-handlers/  # 事件处理器

infrastructure/
  ├── persistence/     # Event Store（PostgreSQL）✅
  ├── read-models/     # 读模型（ClickHouse）✅
  ├── adapters/        # 适配器
  ├── projections/     # 投影器 ✅
  ├── outbox/          # Outbox 模式 ✅
  └── inbox/           # Inbox 模式 ✅

✅ 需要完整架构：
- 聚合根（AggregateRoot）
- 领域事件（DomainEvent）
- Event Sourcing（事件溯源）
- CQRS（命令查询分离）
- Outbox/Inbox（可靠事件发布）
- ClickHouse（读模型优化）
- Projector（投影器）
```

---

## 三、决策树

```
开始
  │
  ├─ 是否需要完整审计历史？
  │   └─ YES → Level 3
  │
  ├─ 是否需要数据分析/读模型优化？
  │   └─ YES → Level 3
  │
  ├─ 是否需要跨模块事件通知？
  │   ├─ YES → 继续判断
  │   │     │
  │   │     ├─ 是否有复杂业务规则？
  │   │     │   └─ YES → Level 2
  │   │     │
  │   │     └─ NO → Level 2
  │   │
  │   └─ NO → 继续判断
  │         │
  │         ├─ 是否有业务规则验证？
  │         │   └─ YES → Level 2
  │         │
  │         └─ NO → Level 1
```

---

## 四、示例对比

### 4.1 Level 1：字典表（国家列表）

```typescript
// domain/model/country.entity.ts
export class Country extends Entity<CountryProps> {
  get code(): string {
    return this.props.code;
  }

  get name(): string {
    return this.props.name;
  }

  static create(props: CreateCountryProps): Country {
    return new Country({
      id: CountryId.generate(),
      ...props,
    });
  }
}

// application/services/country.service.ts
export class CountryService {
  constructor(private readonly countryRepo: CountryRepository) {}

  async create(dto: CreateCountryDto): Promise<CountryDto> {
    const country = Country.create(dto);
    await this.countryRepo.save(country);
    return this.toDto(country);
  }

  async findAll(): Promise<CountryDto[]> {
    const countries = await this.countryRepo.findAll();
    return countries.map(this.toDto);
  }
}
```

**特点**：

- ❌ 无聚合根（简单实体）
- ❌ 无领域事件
- ❌ 无 CQRS
- ❌ 无 Event Sourcing
- ✅ 简单的 CRUD 操作

---

### 4.2 Level 2：用户管理

```typescript
// domain/model/user.aggregate.ts
export class User extends AggregateRoot<UserProps> {
  private constructor(props: UserProps) {
    super(props);
  }

  static create(props: CreateUserProps): Result<User> {
    // 验证业务规则
    const emailResult = Email.create(props.email);
    if (emailResult.isFailure) {
      return Result.fail(emailResult.error);
    }

    const user = new User({
      id: UserId.generate(),
      email: emailResult.value,
      name: props.name,
      role: props.role || UserRole.USER,
      isActive: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    // 触发领域事件
    user.addDomainEvent(new UserCreatedEvent(user.id, user.email));

    return Result.ok(user);
  }

  updateName(newName: UserName): Result<void> {
    if (!this.isActive) {
      return Result.fail(new Error('不能修改已禁用用户的信息'));
    }

    this.props.name = newName;
    this.props.updatedAt = new Date();
    this.addDomainEvent(new UserNameUpdatedEvent(this.id, newName));

    return Result.ok();
  }
}

// application/services/user.service.ts
export class UserService {
  constructor(
    private readonly userRepo: UserRepository,
    private readonly eventBus: EventBus,
  ) {}

  async create(dto: CreateUserDto): Promise<UserDto> {
    const userResult = User.create(dto);
    if (userResult.isFailure) {
      throw new ValidationException(userResult.error);
    }

    const user = userResult.value;
    await this.userRepo.save(user);

    // 发布领域事件
    await this.eventBus.publishAll(user.domainEvents);
    user.clearDomainEvents();

    return this.toDto(user);
  }
}
```

**特点**：

- ✅ 聚合根（保护业务规则）
- ✅ 领域事件（通知其他模块）
- ✅ 值对象（Email、UserName）
- ✅ 事件发布（EventBus）
- ❌ 无 CQRS（直接查询写模型）
- ❌ 无 Event Sourcing
- ❌ 无 Outbox（简单事件发布即可）

---

### 4.3 Level 3：Job 领域（完整混合架构）

```typescript
// domain/model/job.aggregate.ts
export class Job extends AggregateRoot<JobProps> {
  static create(props: CreateJobProps): Job {
    const job = new Job({
      id: JobId.create(),
      title: props.title,
      status: JobStatus.PENDING,
      tenantId: props.tenantId,
      createdBy: props.createdBy,
      createdAt: new Date(),
    });

    job.addDomainEvent(new JobCreatedEvent(job.id, job.title, job.tenantId));

    return job;
  }

  start(): void {
    if (this.status !== JobStatus.PENDING) {
      throw new JobDomainException('只有待处理的任务可以启动');
    }

    this.props.status = JobStatus.RUNNING;
    this.props.startedAt = new Date();

    this.addDomainEvent(new JobStartedEvent(this.id, this.startedAt));
  }
}

// application/commands/handlers/create-job.handler.ts
export class CreateJobHandler
  implements CommandHandler<CreateJobCommand, string>
{
  constructor(
    private readonly jobRepo: JobRepository,
    private readonly outbox: OutboxPort,
  ) {}

  async execute(command: CreateJobCommand): Promise<Result<string>> {
    // 1. 创建聚合
    const job = Job.create({
      title: command.payload.title,
      tenantId: command.payload.tenantId,
      createdBy: command.payload.userId,
    });

    // 2. 保存到 Event Store（事件溯源）
    await this.jobRepo.save(job);

    // 3. 写入 Outbox（可靠事件发布）
    for (const domainEvent of job.domainEvents) {
      await this.outbox.save(this.toIntegrationEvent(domainEvent, command));
    }

    // 4. 清理事件
    job.clearDomainEvents();

    return Result.ok(job.id);
  }
}

// infrastructure/projections/job.projector.ts
export class JobProjector {
  constructor(private readonly clickhouse: ClickHouseClient) {}

  async handleJobCreated(event: JobCreatedEvent): Promise<void> {
    // 投影到读模型（ClickHouse）
    await this.clickhouse.insert('jobs', {
      id: event.jobId,
      title: event.title,
      status: 'PENDING',
      tenant_id: event.tenantId,
      created_at: event.occurredAt,
    });
  }
}
```

**特点**：

- ✅ 聚合根（复杂业务规则）
- ✅ 领域事件（事件驱动）
- ✅ Event Sourcing（事件溯源）
- ✅ CQRS（命令/查询分离）
- ✅ Outbox（可靠事件发布）
- ✅ ClickHouse（读模型优化）
- ✅ Projector（投影器）

---

## 五、迁移策略

### 5.1 从 Level 1 升级到 Level 2

**触发条件**：

- 需要跨模块通知
- 需要审计关键操作

**迁移步骤**：

1. 引入聚合根和值对象
2. 添加领域事件
3. 实现事件发布器
4. 更新应用服务

### 5.2 从 Level 2 升级到 Level 3

**触发条件**：

- 需要完整审计历史
- 读性能成为瓶颈
- 需要数据分析

**迁移步骤**：

1. 实现 CQRS 分离
2. 引入 Event Sourcing
3. 实现 Outbox 模式
4. 创建 ClickHouse 读模型
5. 实现 Projector

---

## 六、最佳实践

### ✅ 推荐做法

1. **从简单开始**：先用 Level 1，根据需要升级
2. **按需升级**：只有在真正需要时才引入复杂性
3. **保持一致**：同一级别模块使用相同架构
4. **文档化决策**：在 design.md 中记录架构选择理由

### ❌ 避免做法

1. **过度设计**：简单模块使用完整架构（浪费资源）
2. **过早优化**：过早引入 CQRS 和 Event Sourcing
3. **架构混乱**：同一模块混用不同级别的架构
4. **忽略业务**：技术驱动架构选择（应该业务驱动）

---

## 七、快速参考表

| 模块类型 | 推荐级别 | 是否需要 ES | 是否需要 CQRS | 是否需要 Outbox |
| :------- | :------- | :---------- | :------------ | :-------------- |
| 字典表   | Level 1  | ❌          | ❌            | ❌              |
| 配置管理 | Level 1  | ❌          | ❌            | ❌              |
| 用户管理 | Level 2  | ❌          | ❌            | ❌              |
| 权限管理 | Level 2  | ❌          | ❌            | ❌              |
| 文档管理 | Level 2  | ❌          | ❌            | ❌              |
| Job 管理 | Level 3  | ✅          | ✅            | ✅              |
| 订单系统 | Level 3  | ✅          | ✅            | ✅              |
| 支付系统 | Level 3  | ✅          | ✅            | ✅              |
| 库存管理 | Level 3  | ✅          | ✅            | ✅              |
| 数据仓库 | Level 3  | ✅          | ✅            | ✅              |

---

## 八、决策清单

在开始开发新模块前，回答以下问题：

```markdown
## 架构级别决策清单

### 1. 业务复杂度

- [ ] 是否有复杂业务规则？（聚合根、值对象）
- [ ] 是否需要跨模块通知？（领域事件）
- [ ] 是否需要审计历史？（Event Sourcing）

### 2. 性能需求

- [ ] 读操作是否频繁？（CQRS）
- [ ] 是否需要数据分析？（ClickHouse 读模型）
- [ ] 数据量是否大？（读模型优化）

### 3. 可靠性需求

- [ ] 事件是否必须送达？（Outbox）
- [ ] 是否需要重试机制？（Outbox）
- [ ] 是否需要幂等处理？（Inbox）

### 4. 推荐架构级别

- Level 1：0-1 项 YES
- Level 2：2-3 项 YES
- Level 3：4+ 项 YES

### 5. 架构组件清单

- [ ] 聚合根（AggregateRoot）
- [ ] 值对象（ValueObject）
- [ ] 领域事件（DomainEvent）
- [ ] Event Sourcing
- [ ] CQRS（Command/Query）
- [ ] Outbox
- [ ] Inbox
- [ ] ClickHouse 读模型
- [ ] Projector
```

---

[返回目录](./archi.md)
