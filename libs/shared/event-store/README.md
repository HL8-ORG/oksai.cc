# @oksai/event-store

事件存储模块 - 事件溯源、事件追加、事件流读取

## 功能特性

### 1. 事件存储核心

- **StoredEvent**: 存储事件实体，表示已持久化的领域事件
- **EventStream**: 事件流值对象，管理聚合根的事件序列
- **EventStorePort**: 事件存储端口接口，由基础设施层实现

### 2. 事件溯源仓储

- **EventSourcedRepository**: 支持事件溯源的仓储基类
  - 自动保存聚合根
  - 自动提取和发布领域事件
  - 简化事件溯源实现

### 3. 扩展功能

- **SyncableAggregateRoot**: 可同步的聚合根（ETL 场景）
- **AIEnabledAggregateRoot**: AI 增强的聚合根（向量化场景）

## 安装

```bash
pnpm add @oksai/event-store
```

## 快速开始

### 1. 基础使用

```typescript
import {
  StoredEvent,
  EventStream,
  type EventStorePort,
} from '@oksai/event-store';

// 创建存储事件
const event = StoredEvent.create({
  eventName: 'TaskCreated',
  aggregateId: 'task-123',
  payload: { title: '新任务', description: '任务描述' },
  eventVersion: 1,
});

// 使用事件存储端口
class PostgresEventStore implements EventStorePort {
  async append(aggregateId: string, events: StoredEvent[]): Promise<void> {
    // 追加事件到存储
  }

  async load(aggregateId: string): Promise<EventStream> {
    // 加载事件流
  }
}
```

### 2. 使用 EventSourcedRepository

```typescript
import {
  EventSourcedRepository,
  type EventStorePort,
} from '@oksai/event-store';
import type { EntityManager } from '@mikro-orm/core';
import { Order } from './order.aggregate';

// 定义订单仓储
export class OrderRepository extends EventSourcedRepository<Order> {
  constructor(em: EntityManager, eventStore: EventStorePort) {
    super(em, eventStore, Order);
  }

  // 添加自定义查询方法
  async findByCustomerId(customerId: string): Promise<Order[]> {
    return this.em.find(Order, { customerId });
  }

  async findPendingOrders(): Promise<Order[]> {
    return this.em.find(Order, { status: 'pending' });
  }
}

// 使用仓储
const orderRepo = new OrderRepository(em, eventStore);

// 保存订单（自动发布领域事件）
await orderRepo.save(order);

// 查询订单
const order = await orderRepo.findById('order-123');
const customerOrders = await orderRepo.findByCustomerId('customer-456');
```

### 3. 实现事件存储

```typescript
import {
  StoredEvent,
  EventStream,
  type EventStorePort,
} from '@oksai/event-store';
import { Injectable } from '@nestjs/common';

@Injectable()
export class PostgresEventStore implements EventStorePort {
  constructor(private readonly prisma: PrismaService) {}

  async append(
    aggregateId: string,
    events: StoredEvent[],
    expectedVersion?: number,
  ): Promise<void> {
    // 使用事务保存事件
    await this.prisma.$transaction(async (tx) => {
      // 1. 乐观锁检查（如果提供了 expectedVersion）
      if (expectedVersion !== undefined) {
        const currentVersion = await this.getCurrentVersion(aggregateId);
        if (currentVersion !== expectedVersion) {
          throw new OptimisticLockError(
            `版本冲突：期望 ${expectedVersion}，实际 ${currentVersion}`,
          );
        }
      }

      // 2. 保存事件
      for (const event of events) {
        await tx.eventStore.create({
          data: {
            eventId: event.eventId,
            eventName: event.eventName,
            aggregateId: event.aggregateId,
            payload: event.payload,
            eventVersion: event.eventVersion,
            occurredAt: event.occurredAt,
            status: event.status,
            metadata: event.metadata,
          },
        });
      }
    });
  }

  async load(aggregateId: string): Promise<EventStream> {
    const events = await this.prisma.eventStore.findMany({
      where: { aggregateId },
      orderBy: { eventVersion: 'asc' },
    });

    return EventStream.fromEvents(
      aggregateId,
      events.map((e) => StoredEvent.fromProps(e)),
    );
  }

  async loadFromVersion(
    aggregateId: string,
    fromVersion: number,
  ): Promise<EventStream> {
    const events = await this.prisma.eventStore.findMany({
      where: {
        aggregateId,
        eventVersion: { gte: fromVersion },
      },
      orderBy: { eventVersion: 'asc' },
    });

    return EventStream.fromEvents(
      aggregateId,
      events.map((e) => StoredEvent.fromProps(e)),
    );
  }

  async hasEvents(aggregateId: string): Promise<boolean> {
    const count = await this.prisma.eventStore.count({
      where: { aggregateId },
    });
    return count > 0;
  }

  private async getCurrentVersion(aggregateId: string): Promise<number> {
    const latestEvent = await this.prisma.eventStore.findFirst({
      where: { aggregateId },
      orderBy: { eventVersion: 'desc' },
    });
    return latestEvent?.eventVersion ?? 0;
  }
}
```

### 4. NestJS 集成

```typescript
import { Module } from '@nestjs/common';
import { PostgresEventStore } from './postgres-event-store';

@Module({
  providers: [
    {
      provide: 'EventStorePort',
      useClass: PostgresEventStore,
    },
  ],
  exports: ['EventStorePort'],
})
export class EventStoreModule {}
```

## API 文档

### StoredEvent

存储事件实体，表示已持久化的领域事件。

```typescript
interface StoredEventProps {
  eventId: string; // 事件 ID
  eventName: string; // 事件名称
  aggregateId: string; // 聚合根 ID
  payload: Record<string, unknown>; // 事件负载
  eventVersion: number; // 事件版本
  occurredAt: Date; // 事件发生时间
  status: StoredEventStatus; // 事件状态
  metadata?: Record<string, unknown>; // 元数据
}

class StoredEvent {
  static create(props: {
    eventName: string;
    aggregateId: string;
    payload: Record<string, unknown>;
    eventVersion?: number;
    metadata?: Record<string, unknown>;
  }): StoredEvent;

  static fromProps(props: StoredEventProps): StoredEvent;

  withStatus(status: StoredEventStatus): StoredEvent;
}
```

### EventStream

事件流值对象，管理聚合根的事件序列。

```typescript
class EventStream {
  readonly aggregateId: string;
  readonly events: StoredEvent[];
  readonly version: number;

  static fromEvents(aggregateId: string, events: StoredEvent[]): EventStream;

  hasEvents(): boolean;
  latestVersion(): number;
}
```

### EventStorePort

事件存储端口接口，由基础设施层实现。

```typescript
interface EventStorePort {
  append(
    aggregateId: string,
    events: StoredEvent[],
    expectedVersion?: number,
  ): Promise<void>;

  load(aggregateId: string): Promise<EventStream>;
  loadFromVersion(
    aggregateId: string,
    fromVersion: number,
  ): Promise<EventStream>;
  hasEvents(aggregateId: string): Promise<boolean>;
}
```

### EventSourcedRepository

支持事件溯源的仓储基类。

```typescript
abstract class EventSourcedRepository<T extends AggregateRoot<any>> {
  constructor(
    em: EntityManager,
    eventStore: EventStorePort,
    entityClass: new (...args: any[]) => T,
  );

  // 保存聚合根并发布领域事件
  async save(aggregate: T): Promise<void>;

  // 根据ID查找聚合根
  async findById(id: string | { toString(): string }): Promise<T | null>;
}
```

## 最佳实践

### 1. 事件命名规范

```typescript
// ✅ 好的命名
'TaskCreated';
'TaskStatusChanged';
'TaskAssignedToUser';

// ❌ 避免
'task_created';
'TaskCreatedEvent';
'CREATED';
```

### 2. 事件版本管理

```typescript
// 初始版本
const event1 = StoredEvent.create({
  eventName: 'TaskCreated',
  aggregateId: 'task-123',
  payload: { title: '任务' },
  eventVersion: 1, // 初始版本
});

// 事件演进（新增字段）
const event2 = StoredEvent.create({
  eventName: 'TaskCreated',
  aggregateId: 'task-456',
  payload: {
    title: '任务',
    priority: 'high', // 新增字段
  },
  eventVersion: 2, // 版本递增
});
```

### 3. 幂等性处理

```typescript
// 使用 eventId 确保幂等性
async append(aggregateId: string, events: StoredEvent[]): Promise<void> {
  for (const event of events) {
    const existing = await this.prisma.eventStore.findUnique({
      where: { eventId: event.eventId },
    });

    if (existing) {
      // 事件已存在，跳过
      continue;
    }

    // 保存新事件
    await this.prisma.eventStore.create({
      data: { ...event },
    });
  }
}
```

### 4. 乐观锁

```typescript
// 保存时检查版本
await eventStore.append(
  aggregateId,
  events,
  aggregate.version, // 期望的当前版本
);

// 如果版本冲突，会抛出 OptimisticLockError
```

## 测试

```bash
# 运行测试
pnpm test

# 测试覆盖率
pnpm test:coverage
```

## 构建

```bash
# 构建库
pnpm build

# 监听模式
pnpm build:watch
```

## 类型检查

```bash
pnpm typecheck
```

## 相关文档

- **事件溯源模式**: `docs/guides/event-sourcing.md` (待创建)
- **CQRS 模式**: `libs/shared/cqrs/README.md`
- **DDD 核心基类**: `libs/shared/kernel/README.md`

## License

AGPL-3.0
