# 库合并：@oksai/repository → @oksai/event-store

**日期**: 2026-03-09  
**类型**: 重构  
**状态**: ✅ 已完成

---

## 背景

`@oksai/repository` 是一个提供 `EventSourcedRepository` 基类的小型库，用于支持事件溯源模式。经过分析发现：

1. **未被使用**: 该库在整个项目中未被任何地方引用
2. **职责重叠**: 其功能与事件存储紧密相关
3. **维护成本**: 单独维护一个 32 行的库增加了复杂度

---

## 决策

将 `@oksai/repository` 的功能合并到 `@oksai/event-store` 中。

**理由**:

- ✅ 符合单一职责原则：事件溯源相关功能集中在一个库
- ✅ 减少维护成本：少一个库的构建、测试、发布流程
- ✅ 更清晰的依赖关系：避免循环依赖
- ✅ 更好的发现性：用户在寻找事件溯源功能时会直接查看 event-store

---

## 实施步骤

### 1. 迁移代码

**源文件**: `libs/shared/repository/src/event-sourced.repository.ts`  
**目标文件**: `libs/shared/event-store/src/lib/event-sourced.repository.ts`

**改进**:

- ✅ 添加完整的 TSDoc 注释
- ✅ 添加 `domainEventToStoredEvent()` 私有方法处理事件转换
- ✅ 修复类型错误（`UniqueEntityID` 转 string）
- ✅ 移除不存在的 `version` 属性

### 2. 更新依赖

**`@oksai/event-store/package.json`**:

```diff
  "dependencies": {
+   "@mikro-orm/core": "catalog:",
+   "@oksai/database": "workspace:*",
    "@oksai/kernel": "workspace:*"
  },
```

### 3. 更新导出

**`libs/shared/event-store/src/index.ts`**:

```diff
+ // 仓储
+ export { EventSourcedRepository } from "./lib/event-sourced.repository.js";
```

### 4. 删除旧库

```bash
rm -rf libs/shared/repository
```

### 5. 更新文档

更新所有引用：

- `docs/03-guides/mikro-orm-usage-guide.md`
- `docs/04-migration/mikro-orm-migration-plan.md`
- `docs/04-migration/mikro-orm-migration-progress.md`
- `docs/03-guides/typescript-configuration.md`

**变更**:

```diff
- import { EventSourcedRepository } from '@oksai/repository';
+ import { EventSourcedRepository } from '@oksai/event-store';
```

---

## 使用示例

### 之前

```typescript
import { EventSourcedRepository } from '@oksai/repository';

export class OrderRepository extends EventSourcedRepository<Order> {
  // ...
}
```

### 之后

```typescript
import { EventSourcedRepository } from '@oksai/event-store';

export class OrderRepository extends EventSourcedRepository<Order> {
  constructor(em: EntityManager, eventStore: EventStorePort) {
    super(em, eventStore, Order);
  }

  async findByCustomerId(customerId: string): Promise<Order[]> {
    return this.em.find(Order, { customerId });
  }
}
```

---

## API 变更

### EventSourcedRepository

**构造函数**:

```typescript
constructor(
  protected readonly em: EntityManager,
  protected readonly eventStore: EventStorePort,
  protected readonly entityClass: new (...args: any[]) => T
)
```

**方法**:

- `async save(aggregate: T): Promise<void>` - 保存聚合根并发布领域事件
- `async findById(id: string | { toString(): string }): Promise<T | null>` - 根据ID查找聚合根

**私有方法**:

- `private domainEventToStoredEvent(event: DomainEvent): StoredEvent` - 转换领域事件为存储事件

---

## 影响

### 破坏性变更

❌ **无** - `@oksai/repository` 从未被使用

### 新增功能

✅ `@oksai/event-store` 现在包含 `EventSourcedRepository` 类

### 库数量

- **之前**: 16 个共享库
- **之后**: 15 个共享库

---

## 验证

### 构建测试

```bash
pnpm nx build @oksai/event-store
```

**结果**: ✅ 构建成功

### 类型检查

```bash
pnpm nx typecheck @oksai/event-store
```

**结果**: ✅ 无类型错误

---

## 后续工作

1. ✅ 在实际项目中使用 `EventSourcedRepository`（如 `Tenant` 聚合根）
2. ✅ 添加单元测试
3. ✅ 更新 API 文档

---

## 相关文档

- **评价报告**: `docs/reports/libs-shared-infrastructure-assessment.md`
- **MikroORM 使用指南**: `docs/03-guides/mikro-orm-usage-guide.md`
- **事件存储文档**: `libs/shared/event-store/README.md` (待创建)

---

**执行者**: oksai.cc 团队  
**审核日期**: 2026-03-09
