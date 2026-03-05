# Drizzle ORM 对 Event Sourcing 支持评估

**评估日期**: 2026-03-04  
**评估范围**: Drizzle ORM 0.45.x 对 Event Sourcing 架构的支持能力  
**评估人**: AI Architect  

---

## 📋 执行摘要

### 总体评分：⭐⭐⭐ (3/5)

**结论**：Drizzle ORM **可以支持** Event Sourcing，但需要**大量自定义实现**，缺少开箱即用的特性。

---

## 一、Drizzle ORM 特性分析

### 1.1 核心特性

```typescript
// 当前项目使用
Drizzle ORM: 0.45.1
Drizzle Kit: 0.31.9

核心优势：
  ✅ 类型安全 (TypeScript 优先)
  ✅ 轻量级 (无运行时开销)
  ✅ 性能优秀 (接近原生 SQL)
  ✅ SQL-like API (熟悉 SQL 可快速上手)
  ✅ Schema as Code (代码即 Schema)

核心劣势：
  ❌ 无 Unit of Work 模式
  ❌ 无 Identity Map
  ❌ 无脏检查 (Dirty Checking)
  ❌ 无自动变更追踪
  ❌ 无事件钩子 (Lifecycle Hooks 有限)
```

### 1.2 当前项目使用情况

```typescript
// libs/database/src/schema/
├── api-key.schema.ts         (86 行)
├── better-auth.schema.ts     (280 行)
├── oauth.schema.ts           (116 行)
├── webhook.schema.ts         (148 行)
└── index.ts                  (10 行)

// 使用模式
import { eq, and, gt, isNull } from "drizzle-orm";

// 查询示例
const result = await db
  .select()
  .from(oauthClients)
  .where(eq(oauthClients.id, clientId));
```

**评价**：
- ✅ 基础 CRUD 操作良好
- ✅ 类型安全
- ⚠️ 无复杂业务逻辑封装
- ⚠️ 无领域模型抽象

---

## 二、Event Sourcing 核心需求

### 2.1 Event Sourcing 必需特性

| 特性 | 重要性 | Drizzle 支持 |
|:---|:---:|:---:|
| **事件存储** | 🔴 必须 | ✅ 可实现 |
| **事件追加** | 🔴 必须 | ✅ 可实现 |
| **事件读取** | 🔴 必须 | ✅ 可实现 |
| **事件版本管理** | 🔴 必须 | ⚠️ 需自实现 |
| **Unit of Work** | 🟡 重要 | ❌ 不支持 |
| **Identity Map** | 🟡 重要 | ❌ 不支持 |
| **事件钩子** | 🟡 重要 | ⚠️ 有限 |
| **快照支持** | 🟢 可选 | ⚠️ 需自实现 |
| **事件重放** | 🔴 必须 | ⚠️ 需自实现 |
| **并发控制** | 🔴 必须 | ⚠️ 需自实现 |
| **事务支持** | 🔴 必须 | ✅ 支持 |

---

## 三、详细评估

### 3.1 事件存储 ✅ 可实现

**需求**：存储领域事件到数据库

**Drizzle 实现**：

```typescript
// ✅ 事件表定义
import { pgTable, text, timestamp, jsonb, integer } from "drizzle-orm/pg-core";

export const domainEvents = pgTable("domain_events", {
  eventId: text("event_id").primaryKey(),
  eventType: text("event_type").notNull(),
  aggregateId: text("aggregate_id").notNull(),
  aggregateType: text("aggregate_type").notNull(),
  version: integer("version").notNull(),
  payload: jsonb("payload").notNull(),
  metadata: jsonb("metadata").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ✅ 事件存储实现
export class DrizzleEventStore implements EventStore {
  constructor(private db: NodePgDatabase) {}

  async append(event: DomainEvent): Promise<void> {
    await this.db.insert(domainEvents).values({
      eventId: event.eventId,
      eventType: event.eventType,
      aggregateId: event.aggregateId,
      aggregateType: event.aggregateType,
      version: event.version,
      payload: event.payload,
      metadata: event.metadata,
    });
  }
}
```

**评价**：
- ✅ **可实现**：JSONB 支持灵活的事件存储
- ✅ **类型安全**：TypeScript 类型推断
- ⚠️ **需要手动序列化**：复杂对象需要 JSON 序列化

---

### 3.2 Unit of Work ❌ 不支持

**需求**：管理事务边界，确保一组操作原子性提交

**理想实现**（MikroORM 风格）：

```typescript
// ✅ MikroORM 风格
await em.transactional(async (em) => {
  const user = em.create(User, { name: "Alice" });
  em.persist(user);
  
  const order = em.create(Order, { userId: user.id });
  em.persist(order);
  
  // 自动提交，无需手动 flush
});
```

**Drizzle 实现**：

```typescript
// ⚠️ 需要手动管理
await this.db.transaction(async (tx) => {
  // 1. 插入用户
  const [user] = await tx
    .insert(users)
    .values({ name: "Alice" })
    .returning();

  // 2. 插入订单
  await tx.insert(orders).values({ userId: user.id });

  // ⚠️ 缺少：
  // - 实体变更追踪
  // - 自动脏检查
  // - 延迟加载
  // - Identity Map
});
```

**评价**：
- ✅ **支持事务**：基本的 ACID 事务
- ❌ **无 Unit of Work**：需要手动管理
- ❌ **无变更追踪**：需要手动跟踪实体变更
- ❌ **无 Identity Map**：可能导致重复查询

**ES 影响**：🔴 **高**

```
Event Sourcing 需要：
  1. 聚合根状态变更
  2. 生成领域事件
  3. 事件持久化
  4. 原子性提交

缺少 UoW：
  - 需要手动管理事务边界
  - 需要手动跟踪变更
  - 代码复杂度增加
```

---

### 3.3 事件钩子 ⚠️ 有限

**需求**：在实体生命周期事件中触发业务逻辑

**理想实现**（TypeORM/MikroORM 风格）：

```typescript
// ✅ MikroORM 风格
@Entity()
export class User {
  @BeforeCreate()
  beforeCreate() {
    this.createdAt = new Date();
    this.addDomainEvent(new UserCreatedEvent(this));
  }

  @AfterUpdate()
  afterUpdate() {
    this.addDomainEvent(new UserUpdatedEvent(this));
  }
}
```

**Drizzle 实现**：

```typescript
// ❌ 无装饰器钩子
// ⚠️ 需要手动实现

export class UserRepository {
  async save(user: User): Promise<void> {
    // 手动触发钩子
    if (user.isNew()) {
      user.beforeCreate();
    } else {
      user.beforeUpdate();
    }

    // 手动持久化
    await this.db.insert(users).values(user.toSnapshot());

    // 手动触发事件
    const events = user.getDomainEvents();
    for (const event of events) {
      await this.eventStore.append(event);
    }
  }
}
```

**评价**：
- ❌ **无装饰器钩子**：需要手动实现
- ❌ **无生命周期管理**：需要手动调用
- ⚠️ **代码重复**：每个 Repository 都需要重复逻辑

**ES 影响**：🟡 **中**

```
Event Sourcing 需要：
  - 聚合根状态变更时生成事件
  - 事件自动收集
  - 事件持久化

缺少钩子：
  - 需要在 Repository 中手动处理
  - 容易遗漏事件
  - 代码维护成本高
```

---

### 3.4 事件版本管理 ⚠️ 需自实现

**需求**：管理事件版本，支持并发控制

**实现方案**：

```typescript
// ✅ 事件版本表
export const domainEvents = pgTable("domain_events", {
  // ...
  version: integer("version").notNull(),
  // ...
});

// ⚠️ 并发控制需要手动实现
export class DrizzleEventStore {
  async append(event: DomainEvent): Promise<void> {
    await this.db.transaction(async (tx) => {
      // 1. 查询当前版本
      const lastEvent = await tx
        .select({ version: domainEvents.version })
        .from(domainEvents)
        .where(eq(domainEvents.aggregateId, event.aggregateId))
        .orderBy(desc(domainEvents.version))
        .limit(1);

      const expectedVersion = lastEvent[0]?.version ?? 0;

      // 2. 乐观锁检查
      if (event.version !== expectedVersion + 1) {
        throw new ConcurrencyException(
          `版本冲突：期望 ${expectedVersion + 1}，实际 ${event.version}`
        );
      }

      // 3. 插入事件
      await tx.insert(domainEvents).values(event);
    });
  }
}
```

**评价**：
- ✅ **可实现**：需要手动实现乐观锁
- ⚠️ **复杂度中等**：需要事务 + 版本检查
- ⚠️ **性能开销**：每次写入都需要查询最新版本

---

### 3.5 事件重放 ⚠️ 需自实现

**需求**：从事件流重建聚合根

**实现方案**：

```typescript
// ✅ 事件重放实现
export class DrizzleEventStore {
  async load(aggregateId: string): Promise<DomainEvent[]> {
    const events = await this.db
      .select()
      .from(domainEvents)
      .where(eq(domainEvents.aggregateId, aggregateId))
      .orderBy(domainEvents.version);

    return events.map(this.deserializeEvent);
  }
}

// ✅ 聚合根重建
export class TenantRepository {
  async findById(id: TenantId): Promise<Tenant | null> {
    // 1. 加载事件流
    const events = await this.eventStore.load(id.value);

    if (events.length === 0) {
      return null;
    }

    // 2. 重建聚合根
    const tenant = Tenant.fromEvents(events);

    return tenant;
  }
}

// ✅ 聚合根基类
export abstract class AggregateRoot {
  private changes: DomainEvent[] = [];

  static fromEvents(events: DomainEvent[]): AggregateRoot {
    const aggregate = new (this as any)();
    
    for (const event of events) {
      aggregate.apply(event);
    }

    return aggregate;
  }

  abstract apply(event: DomainEvent): void;
}
```

**评价**：
- ✅ **可实现**：需要手动实现
- ⚠️ **性能问题**：大量事件时重建慢
- ⚠️ **需要快照**：长事件流需要快照优化

---

### 3.6 快照支持 ⚠️ 需自实现

**需求**：定期保存聚合根快照，加速重建

**实现方案**：

```typescript
// ✅ 快照表
export const aggregateSnapshots = pgTable("aggregate_snapshots", {
  aggregateId: text("aggregate_id").primaryKey(),
  aggregateType: text("aggregate_type").notNull(),
  version: integer("version").notNull(),
  snapshot: jsonb("snapshot").notNull(),
  createdAt: timestamp("created_at").defaultNow().notNull(),
});

// ✅ 快照存储实现
export class DrizzleSnapshotStore {
  async save(aggregate: AggregateRoot): Promise<void> {
    await this.db
      .insert(aggregateSnapshots)
      .values({
        aggregateId: aggregate.id.value,
        aggregateType: aggregate.constructor.name,
        version: aggregate.version,
        snapshot: aggregate.toSnapshot(),
      })
      .onConflictDoUpdate({
        target: aggregateSnapshots.aggregateId,
        set: {
          version: aggregate.version,
          snapshot: aggregate.toSnapshot(),
          createdAt: new Date(),
        },
      });
  }

  async load(aggregateId: string): Promise<Snapshot | null> {
    const snapshot = await this.db
      .select()
      .from(aggregateSnapshots)
      .where(eq(aggregateSnapshots.aggregateId, aggregateId))
      .limit(1);

    return snapshot[0] ?? null;
  }
}

// ✅ 使用快照的聚合根重建
export class TenantRepository {
  async findById(id: TenantId): Promise<Tenant | null> {
    // 1. 加载快照
    const snapshot = await this.snapshotStore.load(id.value);

    let tenant: Tenant;
    let fromVersion = 0;

    if (snapshot) {
      // 从快照恢复
      tenant = Tenant.fromSnapshot(snapshot);
      fromVersion = snapshot.version;
    } else {
      // 无快照，创建新实例
      tenant = new Tenant();
    }

    // 2. 加载快照后的事件
    const events = await this.db
      .select()
      .from(domainEvents)
      .where(
        and(
          eq(domainEvents.aggregateId, id.value),
          gt(domainEvents.version, fromVersion)
        )
      )
      .orderBy(domainEvents.version);

    // 3. 应用事件
    for (const event of events) {
      tenant.apply(event);
    }

    return tenant;
  }
}
```

**评价**：
- ✅ **可实现**：完全手动实现
- ⚠️ **需要策略**：何时创建快照（每 N 个事件）
- ⚠️ **存储开销**：需要额外存储快照

---

### 3.7 事务支持 ✅ 支持

**需求**：ACID 事务

**Drizzle 实现**：

```typescript
// ✅ 事务支持
await this.db.transaction(async (tx) => {
  // 1. 保存聚合根
  await tx.insert(tenants).values(tenant.toSnapshot());

  // 2. 保存事件
  for (const event of tenant.getDomainEvents()) {
    await tx.insert(domainEvents).values(event);
  }

  // 自动提交，失败自动回滚
});
```

**评价**：
- ✅ **完全支持**：ACID 事务
- ✅ **嵌套事务**：支持 Savepoint
- ✅ **隔离级别**：可配置

---

### 3.8 并发控制 ⚠️ 需自实现

**需求**：乐观锁 / 悲观锁

**实现方案**：

```typescript
// ⚠️ 乐观锁（推荐）
export class DrizzleEventStore {
  async append(event: DomainEvent): Promise<void> {
    await this.db.transaction(async (tx) => {
      // 1. 查询当前版本
      const lastEvent = await tx
        .select({ version: domainEvents.version })
        .from(domainEvents)
        .where(eq(domainEvents.aggregateId, event.aggregateId))
        .orderBy(desc(domainEvents.version))
        .limit(1);

      const expectedVersion = lastEvent[0]?.version ?? 0;

      // 2. 版本检查
      if (event.version !== expectedVersion + 1) {
        throw new ConcurrencyException();
      }

      // 3. 插入事件
      await tx.insert(domainEvents).values(event);
    });
  }
}

// ⚠️ 悲观锁
const tenant = await this.db.execute(sql`
  SELECT * FROM tenants 
  WHERE id = ${id} 
  FOR UPDATE
`);
```

**评价**：
- ✅ **支持**：可通过 SQL 实现
- ⚠️ **需要手动实现**：无内置支持
- ⚠️ **性能开销**：乐观锁需要额外查询

---

## 四、与其他 ORM 对比

### 4.1 功能对比表

| 特性 | Drizzle ORM | MikroORM | Prisma | TypeORM |
|:---|:---:|:---:|:---:|:---:|
| **类型安全** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ |
| **性能** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐ |
| **Unit of Work** | ❌ | ✅ | ❌ | ⚠️ |
| **Identity Map** | ❌ | ✅ | ❌ | ❌ |
| **生命周期钩子** | ❌ | ✅ | ⚠️ | ✅ |
| **事件溯源支持** | ⚠️ | ✅ | ❌ | ⚠️ |
| **学习曲线** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐ |
| **迁移工具** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ |
| **社区活跃度** | ⭐⭐⭐⭐ | ⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐⭐ |
| **ES 适配难度** | 🔴 高 | 🟢 低 | 🔴 高 | 🟡 中 |

### 4.2 MikroORM 示例对比

#### Drizzle ORM (当前)

```typescript
// ❌ 需要手动管理一切
export class TenantRepository {
  constructor(
    private db: NodePgDatabase,
    private eventStore: EventStore
  ) {}

  async save(tenant: Tenant): Promise<void> {
    await this.db.transaction(async (tx) => {
      // 1. 保存状态
      await tx
        .insert(tenants)
        .values(tenant.toSnapshot())
        .onConflictDoUpdate({
          target: tenants.id,
          set: tenant.toSnapshot(),
        });

      // 2. 保存事件
      const events = tenant.getDomainEvents();
      for (const event of events) {
        await this.eventStore.append(event);
      }

      // 3. 清空事件
      tenant.clearEvents();
    });
  }

  async findById(id: TenantId): Promise<Tenant | null> {
    // 1. 查询状态
    const snapshot = await this.db
      .select()
      .from(tenants)
      .where(eq(tenants.id, id.value))
      .limit(1);

    if (!snapshot[0]) {
      return null;
    }

    // 2. 加载事件
    const events = await this.eventStore.load(id.value);

    // 3. 重建聚合根
    const tenant = Tenant.fromSnapshot(snapshot[0]);
    for (const event of events) {
      tenant.apply(event);
    }

    return tenant;
  }
}
```

#### MikroORM (理想)

```typescript
// ✅ 自动管理
export class TenantRepository {
  constructor(private em: EntityManager) {}

  async save(tenant: Tenant): Promise<void> {
    // 自动 Unit of Work
    this.em.persist(tenant);
    
    // 自动 flush，自动持久化事件
    await this.em.flush();
  }

  async findById(id: TenantId): Promise<Tenant | null> {
    // 自动加载，Identity Map 缓存
    return this.em.findOne(Tenant, { id });
  }
}

// ✅ 聚合根自动事件管理
@Entity()
export class Tenant extends AggregateRoot {
  @Property()
  name: string;

  // 生命周期钩子
  @BeforeCreate()
  @BeforeUpdate()
  beforeCommit() {
    // 自动收集事件
    this.addDomainEvent(new TenantUpdatedEvent(this));
  }
}
```

**代码量对比**：
- Drizzle: ~50 行 (Repository + 手动事件管理)
- MikroORM: ~20 行 (自动事件管理)

---

## 五、实际场景评估

### 5.1 简单场景：用户注册

**需求**：用户注册，发送欢迎邮件

**Drizzle 实现**：

```typescript
// ✅ 简单场景，Drizzle 足够
export class UserService {
  async register(dto: RegisterDto): Promise<User> {
    return this.db.transaction(async (tx) => {
      // 1. 创建用户
      const [user] = await tx
        .insert(users)
        .values({
          email: dto.email,
          name: dto.name,
        })
        .returning();

      // 2. 发布事件
      await tx.insert(domainEvents).values({
        eventType: "UserRegistered",
        payload: { userId: user.id },
      });

      return user;
    });
  }
}
```

**评价**：✅ **适合** - 简单场景，Drizzle 足够

---

### 5.2 中等场景：订单创建

**需求**：创建订单，扣减库存，发送通知

**Drizzle 实现**：

```typescript
// ⚠️ 复杂度增加，需要手动管理
export class OrderService {
  async createOrder(dto: CreateOrderDto): Promise<Order> {
    return this.db.transaction(async (tx) => {
      // 1. 创建订单
      const [order] = await tx
        .insert(orders)
        .values({
          userId: dto.userId,
          status: "pending",
        })
        .returning();

      // 2. 扣减库存
      for (const item of dto.items) {
        const [product] = await tx
          .select()
          .from(products)
          .where(eq(products.id, item.productId))
          .for("UPDATE"); // 悲观锁

        if (product.stock < item.quantity) {
          throw new Error("库存不足");
        }

        await tx
          .update(products)
          .set({ stock: sql`${products.stock} - ${item.quantity}` })
          .where(eq(products.id, item.productId));
      }

      // 3. 发布事件
      await tx.insert(domainEvents).values([
        {
          eventType: "OrderCreated",
          payload: { orderId: order.id },
        },
        {
          eventType: "StockDeducted",
          payload: { items: dto.items },
        },
      ]);

      return order;
    });
  }
}
```

**评价**：🟡 **可用但复杂** - 需要手动管理事务和事件

---

### 5.3 复杂场景：OAuth 2.0 授权

**需求**：完整的 OAuth 2.0 授权流程，支持撤销、刷新、审计

**Drizzle 实现**：

```typescript
// 🔴 复杂度高，容易出错
export class OAuthService {
  async authorize(dto: AuthorizeDto): Promise<AuthorizationCode> {
    return this.db.transaction(async (tx) => {
      // 1. 验证客户端
      const client = await tx
        .select()
        .from(oauthClients)
        .where(eq(oauthClients.clientId, dto.clientId));

      if (!client[0]) {
        throw new Error("客户端不存在");
      }

      // 2. 验证用户
      const user = await tx
        .select()
        .from(users)
        .where(eq(users.id, dto.userId));

      if (!user[0]) {
        throw new Error("用户不存在");
      }

      // 3. 检查权限
      const hasPermission = await this.checkPermission(
        tx,
        dto.userId,
        dto.scope
      );
      if (!hasPermission) {
        throw new Error("权限不足");
      }

      // 4. 创建授权码
      const code = generateCode();
      const [authCode] = await tx
        .insert(oauthAuthorizationCodes)
        .values({
          code,
          clientId: dto.clientId,
          userId: dto.userId,
          redirectUri: dto.redirectUri,
          scope: dto.scope,
          expiresAt: new Date(Date.now() + 600000), // 10分钟
        })
        .returning();

      // 5. 记录审计日志
      await tx.insert(auditLogs).values({
        action: "oauth.authorize",
        userId: dto.userId,
        clientId: dto.clientId,
        metadata: {
          scope: dto.scope,
          ip: dto.ip,
        },
      });

      // 6. 发布事件
      await tx.insert(domainEvents).values([
        {
          eventType: "OAuthAuthorizationRequested",
          aggregateId: authCode.id,
          payload: {
            userId: dto.userId,
            clientId: dto.clientId,
            scope: dto.scope,
          },
        },
        {
          eventType: "AuditLogCreated",
          aggregateId: authCode.id,
          payload: {
            action: "oauth.authorize",
          },
        },
      ]);

      return authCode;
    });
  }
}
```

**问题**：
- ❌ 事务边界不清晰
- ❌ 事件管理复杂
- ❌ 容易遗漏事件
- ❌ 难以测试

**评价**：🔴 **不推荐** - 复杂场景，Drizzle 力不从心

---

## 六、迁移成本评估

### 6.1 继续使用 Drizzle

**成本**：
```
短期 (2-3 个月):
  - ✅ 无迁移成本
  - ✅ 立即可用
  - ⚠️ 需要实现 Event Store (15-20 人天)
  - ⚠️ 需要实现 Unit of Work (10-15 人天)
  - ⚠️ 需要实现快照机制 (5-10 人天)

长期 (6-12 个月):
  - ⚠️ 代码复杂度高
  - ⚠️ 维护成本增加
  - ⚠️ 容易出错
  - ⚠️ 测试困难
```

**总成本**：30-45 人天 (基础设施) + 持续维护成本

---

### 6.2 迁移到 MikroORM

**成本**：
```
迁移 (1-2 个月):
  - ⚠️ 学习成本 (1 周)
  - ⚠️ Schema 迁移 (2-3 周)
  - ⚠️ Repository 重构 (2-3 周)
  - ⚠️ 测试迁移 (1 周)

长期 (6-12 个月):
  - ✅ 代码简洁
  - ✅ 维护成本低
  - ✅ 开发效率高
  - ✅ 测试容易
```

**总成本**：40-60 人天 (迁移) + 低维护成本

---

### 6.3 混合方案

**方案**：关键领域使用 MikroORM，简单领域继续使用 Drizzle

```
迁移到 MikroORM:
  - OAuth 2.0 (复杂)
  - 数据分析 (复杂)

继续使用 Drizzle:
  - 用户认证 (简单)
  - 消息通知 (简单)
```

**成本**：20-30 人天 (部分迁移)

**风险**：
- ⚠️ 两套 ORM 共存
- ⚠️ 事务跨 ORM 困难
- ⚠️ 团队需要掌握两套技术

---

## 七、性能评估

### 7.1 查询性能

| 操作 | Drizzle | MikroORM | 说明 |
|:---|:---:|:---:|:---|
| **简单查询** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Drizzle 略快 |
| **复杂查询** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐⭐ | Drizzle 略快 |
| **批量插入** | ⭐⭐⭐⭐⭐ | ⭐⭐⭐ | Drizzle 明显更快 |
| **聚合根加载** | ⭐⭐⭐ | ⭐⭐⭐⭐⭐ | MikroORM 更快 (Identity Map) |
| **事件重放** | ⭐⭐⭐ | ⭐⭐⭐⭐ | 差不多 |

### 7.2 内存占用

```
Drizzle:
  - ✅ 轻量级
  - ✅ 无额外开销
  - ⚠️ 需要手动管理缓存

MikroORM:
  - ⚠️ 中等
  - ⚠️ Identity Map 占用内存
  - ✅ 自动缓存管理
```

---

## 八、最终评估

### 8.1 Drizzle 对 ES 支持评分

| 维度 | 评分 | 说明 |
|:---|:---:|:---|
| **事件存储** | ⭐⭐⭐⭐ | 可实现，需手动序列化 |
| **Unit of Work** | ⭐ | 不支持，需完全自实现 |
| **事件钩子** | ⭐⭐ | 有限支持，需手动实现 |
| **并发控制** | ⭐⭐⭐ | 支持，需手动实现 |
| **快照机制** | ⭐⭐⭐ | 可实现，需自实现 |
| **事务支持** | ⭐⭐⭐⭐⭐ | 完全支持 |
| **类型安全** | ⭐⭐⭐⭐⭐ | 优秀 |
| **开发体验** | ⭐⭐⭐ | 需要大量样板代码 |
| **维护成本** | ⭐⭐ | 高 |

**总体评分：⭐⭐⭐ (3/5)**

---

### 8.2 适用场景

#### ✅ 适合使用 Drizzle

```
1. 简单 Event Sourcing
   - 事件流短 (< 100 个事件)
   - 聚合根简单
   - 无复杂业务规则

2. 性能优先
   - 高并发场景
   - 批量操作多
   - 内存占用敏感

3. 团队熟悉 SQL
   - SQL 背景强
   - 不想学习复杂 ORM
   - 喜欢手动控制
```

#### ❌ 不适合使用 Drizzle

```
1. 复杂 Event Sourcing
   - 事件流长 (> 1000 个事件)
   - 聚合根复杂
   - 复杂业务规则

2. 领域模型复杂
   - 深层对象图
   - 多对多关系
   - 需要延迟加载

3. 团队规模大
   - 需要统一规范
   - 减少样板代码
   - 提高开发效率
```

---

## 九、建议方案

### 方案 A：继续使用 Drizzle ⭐⭐⭐

**适用条件**：
- ✅ 团队规模小 (1-2 人)
- ✅ 时间紧迫
- ✅ Event Sourcing 范围小 (1-2 个领域)
- ✅ 团队熟悉 SQL

**实施步骤**：
```
1. 实现 Event Store 基础设施 (2-3 周)
2. 实现简化的 Unit of Work (1-2 周)
3. 实现快照机制 (1 周)
4. 编写工具类和装饰器 (1 周)
5. 充分测试 (1-2 周)

总计：6-9 周
```

**长期成本**：⚠️ **高** - 需要持续维护基础设施代码

---

### 方案 B：迁移到 MikroORM ⭐⭐⭐⭐⭐ (推荐)

**适用条件**：
- ✅ 长期项目
- ✅ 团队规模 > 2 人
- ✅ Event Sourcing 范围大
- ✅ 追求代码质量

**实施步骤**：
```
1. 学习 MikroORM (1 周)
2. 迁移 Schema (2-3 周)
3. 实现 Event Store (1-2 周)
4. 迁移核心领域 (3-4 周)
5. 充分测试 (1-2 周)

总计：8-12 周
```

**长期成本**：✅ **低** - 自动化管理，维护简单

---

### 方案 C：混合方案 ⭐⭐

**适用条件**：
- ⚠️ 渐进迁移
- ⚠️ 资源有限

**实施步骤**：
```
1. 关键领域迁移到 MikroORM (4-6 周)
2. 简单领域继续使用 Drizzle
3. 统一事件总线

风险：
  - 两套技术栈
  - 事务跨 ORM 困难
```

**长期成本**：⚠️ **中** - 需要维护两套技术

---

## 十、结论

### 10.1 最终建议

**如果项目符合以下条件，建议继续使用 Drizzle**：
- ✅ 简单 Event Sourcing 场景
- ✅ 团队小、时间紧
- ✅ 预算有限

**如果项目符合以下条件，建议迁移到 MikroORM**：
- ✅ 复杂 Event Sourcing 场景
- ✅ 长期项目、团队规模 > 2
- ✅ 追求代码质量和开发效率

### 10.2 oksai.cc 项目建议

**当前情况**：
- 📊 2 人团队
- ⏰ 时间资源有限
- 🎯 需要快速交付

**推荐方案**：**方案 A (继续使用 Drizzle)**

**理由**：
1. ✅ 无迁移成本
2. ✅ 可快速开始
3. ✅ 团队已熟悉
4. ⚠️ 需要投入 6-9 周搭建基础设施

**长期建议**：
- 📈 如果项目扩展到 3+ 人
- 📈 如果 Event Sourcing 范围扩大
- 📈 考虑迁移到 MikroORM

---

## 附录：代码示例

### A. Drizzle Event Store 完整实现

```typescript
// libs/shared/event-store/src/drizzle-event-store.ts
import type { NodePgDatabase } from "drizzle-orm/node-postgres";
import { eq, and, gt, desc } from "drizzle-orm";
import type { DomainEvent, EventStore, SnapshotStore } from "./types";

export class DrizzleEventStore implements EventStore {
  constructor(
    private db: NodePgDatabase,
    private eventsTable: any,
    private snapshotsTable?: any
  ) {}

  async append(event: DomainEvent): Promise<void> {
    await this.db.transaction(async (tx) => {
      // 乐观锁检查
      const lastEvent = await tx
        .select({ version: this.eventsTable.version })
        .from(this.eventsTable)
        .where(eq(this.eventsTable.aggregateId, event.aggregateId))
        .orderBy(desc(this.eventsTable.version))
        .limit(1);

      const expectedVersion = lastEvent[0]?.version ?? 0;

      if (event.version !== expectedVersion + 1) {
        throw new Error(
          `并发冲突：期望版本 ${expectedVersion + 1}，实际 ${event.version}`
        );
      }

      // 插入事件
      await tx.insert(this.eventsTable).values(event);
    });
  }

  async load(aggregateId: string): Promise<DomainEvent[]> {
    const events = await this.db
      .select()
      .from(this.eventsTable)
      .where(eq(this.eventsTable.aggregateId, aggregateId))
      .orderBy(this.eventsTable.version);

    return events;
  }

  async loadFromVersion(
    aggregateId: string,
    version: number
  ): Promise<DomainEvent[]> {
    const events = await this.db
      .select()
      .from(this.eventsTable)
      .where(
        and(
          eq(this.eventsTable.aggregateId, aggregateId),
          gt(this.eventsTable.version, version)
        )
      )
      .orderBy(this.eventsTable.version);

    return events;
  }
}

export class DrizzleSnapshotStore implements SnapshotStore {
  constructor(private db: NodePgDatabase, private snapshotsTable: any) {}

  async save(snapshot: any): Promise<void> {
    await this.db
      .insert(this.snapshotsTable)
      .values(snapshot)
      .onConflictDoUpdate({
        target: this.snapshotsTable.aggregateId,
        set: {
          version: snapshot.version,
          snapshot: snapshot.snapshot,
          updatedAt: new Date(),
        },
      });
  }

  async load(aggregateId: string): Promise<any | null> {
    const snapshots = await this.db
      .select()
      .from(this.snapshotsTable)
      .where(eq(this.snapshotsTable.aggregateId, aggregateId))
      .limit(1);

    return snapshots[0] ?? null;
  }
}
```

### B. 简化的 Unit of Work

```typescript
// libs/shared/unit-of-work/src/drizzle-unit-of-work.ts
import type { NodePgDatabase } from "drizzle-orm/node-postgres";

export class DrizzleUnitOfWork {
  private operations: (() => Promise<void>)[] = [];

  constructor(private db: NodePgDatabase) {}

  add(operation: () => Promise<void>): void {
    this.operations.push(operation);
  }

  async commit(): Promise<void> {
    await this.db.transaction(async (tx) => {
      for (const operation of this.operations) {
        await operation();
      }
    });

    this.operations = [];
  }

  async rollback(): Promise<void> {
    this.operations = [];
  }
}
```

---

**文档版本**: 1.0  
**最后更新**: 2026-03-04  
**下次评审**: 2026-04-04
