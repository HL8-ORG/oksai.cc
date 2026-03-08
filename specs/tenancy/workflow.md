# 开发工作流程：用户故事 → BDD → TDD

本文档描述了从需求到实现的完整开发工作流程。

---

## 一、工作流程概览

### 1.1 完整开发流程

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  用户故事     │ →  │  BDD 场景    │ →  │  TDD 循环    │ →  │  代码实现    │
│  User Story  │    │  Scenario    │    │  Red-Green   │    │  Production  │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
      ↓                   ↓                   ↓                   ↓
  业务需求            验收标准            单元测试            领域代码
  业务语言            Gherkin语法         技术实现            基础设施
```

### 1.2 各阶段目标

| 阶段 | 目标 | 产出物 | 参与者 |
|:---|:---|:---|:---|
| **用户故事** | 明确业务需求 | 用户故事卡片 | 产品经理、用户 |
| **BDD 场景** | 定义验收标准 | Feature 文件 | 产品经理、开发者、测试 |
| **TDD 循环** | 驱动代码设计 | 单元测试 + 实现 | 开发者 |
| **代码实现** | 完成功能开发 | 生产代码 | 开发者 |

---

## 二、阶段一：用户故事（User Story）

### 2.1 用户故事模板

```gherkin
作为 <角色>
我想要 <功能>
以便于 <价值>
```

### 2.2 用户故事示例

```gherkin
Feature: {功能名称}

作为 {用户类型}
我想要 {执行的动作}
以便于 {获得的收益}
```

### 2.3 用户故事验收标准（INVEST 原则）

| 原则 | 说明 | 检查点 |
|:---|:---|:---|
| **I**ndependent | 独立性 | 故事之间没有依赖关系 |
| **N**egotiable | 可协商 | 细节可以讨论 |
| **V**aluable | 有价值 | 对用户有明确价值 |
| **E**stimable | 可估算 | 能够估算工作量 |
| **S**mall | 足够小 | 一个迭代内能完成 |
| **T**estable | 可测试 | 有明确的验收标准 |

---

## 三、阶段二：BDD 场景设计

### 3.1 从用户故事到场景

```
用户故事 → 拆分场景 → 编写 Gherkin → 定义步骤
```

### 3.2 场景设计示例

```gherkin
# features/{feature}.feature
Feature: {功能名称}
  {用户故事描述}

  Background:
    Given 系统初始化状态

  @happy-path
  Scenario: 成功场景
    Given 前置条件
    When 执行动作
    Then 期望结果

  @validation
  Scenario: 验证失败场景
    Given 前置条件
    When 执行动作
    Then 失败并返回错误信息

  @business-rule
  Scenario: 业务规则场景
    Given 业务规则条件
    When 执行动作
    Then 符合业务规则的期望结果
```

### 3.3 步骤定义实现

```typescript
// features/step-definitions/{feature}.steps.ts
import { Given, When, Then } from '@cucumber/cucumber';
import { expect } from 'vitest';

let result: any;
let error: Error;

// ==================== Given ====================

Given('前置条件描述', async () => {
  // 设置测试数据和状态
});

// ==================== When ====================

When('执行动作描述', async () => {
  try {
    result = await someAction();
  } catch (e) {
    error = e;
  }
});

// ==================== Then ====================

Then('期望结果描述', () => {
  expect(result).toBeDefined();
});

Then('错误信息包含 {string}', (message: string) => {
  expect(error.message).toContain(message);
});
```

---

## 四、阶段三：TDD 开发循环

### 4.1 双循环开发模式

```
┌─────────────────────────────────────────────────────────────────┐
│                    外层循环：BDD                                 │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │  Feature: {功能名称}                                       │  │
│  │  Scenario: {场景描述}                                      │  │
│  │    Given... When... Then...                               │  │
│  └───────────────────────────────────────────────────────────┘  │
│                              ↓                                   │
│  ┌───────────────────────────────────────────────────────────┐  │
│  │              内层循环：TDD                                 │  │
│  │  ┌─────────────────────────────────────────────────────┐  │  │
│  │  │  🔴 Red: 编写失败的单元测试                         │  │  │
│  │  │  🟢 Green: 用最简单的方式让测试通过                 │  │  │
│  │  │  🔵 Refactor: 优化代码，保持测试通过                │  │  │
│  │  └─────────────────────────────────────────────────────┘  │  │
│  └───────────────────────────────────────────────────────────┘  │
└─────────────────────────────────────────────────────────────────┘
```

### 4.2 TDD 循环示例

#### 🔴 Red: 编写失败的测试

```typescript
// {entity}.aggregate.spec.ts
describe('{Entity}', () => {
  describe('{method}', () => {
    it('should {behavior} when {condition}', () => {
      // Arrange
      const props = { /* 测试数据 */ };
      
      // Act
      const result = Entity.create(props);
      
      // Assert
      expect(result.isOk()).toBe(true);
      expect(result.value.property).toBe(expected);
    });

    it('should fail when {validation}', () => {
      const result = Entity.create({ /* 无效数据 */ });
      
      expect(result.isFail()).toBe(true);
      expect(result.value.message).toContain('错误信息');
    });
  });
});
```

#### 🟢 Green: 最简实现

```typescript
// {entity}.aggregate.ts
export class Entity extends AggregateRoot<EntityProps> {
  static create(props: CreateProps): Result<Entity, ValidationError> {
    // 验证
    if (!props.required) {
      return Result.fail(new ValidationError('必填字段不能为空', 'required'));
    }

    // 创建
    const entity = new Entity({
      id: EntityId.generate(),
      ...props,
      createdAt: new Date(),
      updatedAt: new Date()
    });

    // 触发事件
    entity.addDomainEvent(new EntityCreatedEvent(entity.id));

    return Result.ok(entity);
  }
}
```

#### 🔵 Refactor: 优化代码

```typescript
// {entity}.aggregate.ts
export class Entity extends AggregateRoot<EntityProps> {
  static create(props: CreateProps): Result<Entity, ValidationError> {
    const errors = this.validate(props);
    if (errors.length > 0) {
      return Result.fail(errors[0]);
    }

    const entity = new Entity(this.initializeProps(props));
    entity.emitCreatedEvent();

    return Result.ok(entity);
  }

  private static validate(props: CreateProps): ValidationError[] {
    const errors: ValidationError[] = [];

    if (!props.required?.trim()) {
      errors.push(new ValidationError('必填字段不能为空', 'required'));
    }

    return errors;
  }

  private static initializeProps(props: CreateProps): EntityProps {
    return {
      id: EntityId.generate(),
      ...props,
      createdAt: new Date(),
      updatedAt: new Date()
    };
  }

  private emitCreatedEvent(): void {
    this.addDomainEvent(new EntityCreatedEvent(this.id));
  }
}
```

---

## 五、阶段四：应用层与基础设施层

### 5.1 Command Handler TDD

```typescript
// {command}.handler.spec.ts
describe('{Command}Handler', () => {
  let handler: CommandHandler;
  let mockRepo: MockRepository;
  let mockEventBus: MockEventBus;

  beforeEach(() => {
    mockRepo = new MockRepository();
    mockEventBus = new MockEventBus();
    handler = new CommandHandler(mockRepo, mockEventBus);
  });

  describe('execute', () => {
    it('should execute successfully', async () => {
      // Arrange
      const command = CommandFixture.createDefault();

      // Act
      const result = await handler.execute(command);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(mockRepo.saveCalls).toHaveLength(1);
    });

    it('should publish events after saving', async () => {
      const command = CommandFixture.createDefault();

      await handler.execute(command);

      expect(mockEventBus.publishedEvents).toHaveLength(1);
    });
  });
});
```

### 5.2 Command Handler 实现

```typescript
// {command}.handler.ts
@CommandHandler(Command)
export class CommandHandler implements ICommandHandler<Command, Result<string>> {
  constructor(
    private readonly repository: IRepository,
    private readonly eventBus: IEventBus
  ) {}

  async execute(command: Command): Promise<Result<string, ApplicationError>> {
    // 1. 业务验证
    const entity = await this.repository.findById(command.id);
    if (!entity) {
      return Result.fail(new ApplicationError('实体不存在', 'NOT_FOUND'));
    }

    // 2. 执行业务逻辑
    const result = entity.doSomething(command.params);
    if (result.isFail()) {
      return Result.fail(new ApplicationError(result.value.message));
    }

    // 3. 保存
    await this.repository.save(entity);

    // 4. 发布领域事件
    await this.eventBus.publishAll(entity.domainEvents);
    entity.clearDomainEvents();

    return Result.ok(entity.id);
  }
}
```

---

## 六、完整工作流程示例

### 6.1 示例：实现"{功能名称}"功能

#### Step 1: 编写用户故事

```gherkin
作为 {用户类型}
我想要 {执行的动作}
以便于 {获得的收益}
```

#### Step 2: 编写 BDD 场景

```gherkin
# features/{feature}.feature
Feature: {功能名称}

  Scenario: 成功场景描述
    Given 前置条件
    When 执行动作
    Then 期望结果

  Scenario: 失败场景描述
    Given 前置条件
    When 执行动作
    Then 失败并返回错误信息
```

#### Step 3: TDD 循环

```typescript
// 🔴 Red
describe('{Entity}', () => {
  describe('{method}', () => {
    it('should {behavior}', () => {
      const result = Entity.create({ /* 数据 */ });
      expect(result.isOk()).toBe(true);
    });
  });
});

// 🟢 Green
export class Entity extends AggregateRoot<EntityProps> {
  static create(props: CreateProps): Result<Entity, ValidationError> {
    // 最简实现
    return Result.ok(new Entity({ ...props }));
  }
}

// 🔵 Refactor
// 优化代码结构，提取方法，增强可读性
```

#### Step 4: 在 Handler 中应用

```typescript
// {command}.handler.ts
async execute(command: Command): Promise<Result<string, ApplicationError>> {
  const entity = Entity.create(command.params);
  if (entity.isFail()) {
    return Result.fail(new ApplicationError(entity.value.message));
  }

  await this.repository.save(entity.value);
  await this.eventBus.publishAll(entity.value.domainEvents);

  return Result.ok(entity.value.id);
}
```

#### Step 5: 验证 BDD 场景通过

```bash
$ pnpm vitest run

Feature: {功能名称}
  Scenario: 成功场景描述
    ✅ Given 前置条件
    ✅ When 执行动作
    ✅ Then 期望结果

  Scenario: 失败场景描述
    ✅ Given 前置条件
    ✅ When 执行动作
    ✅ Then 失败并返回错误信息

2 scenarios (2 passed)
6 steps (6 passed)
```

---

## 七、开发检查清单

### 7.1 用户故事检查清单

- [ ] 使用标准模板（作为...我想要...以便于...）
- [ ] 符合 INVEST 原则
- [ ] 有明确的验收标准
- [ ] 已与产品经理确认需求

### 7.2 BDD 场景检查清单

- [ ] 覆盖正常流程（Happy Path）
- [ ] 覆盖异常流程（Error Cases）
- [ ] 覆盖边界条件（Edge Cases）
- [ ] 场景独立、可重复执行
- [ ] 步骤定义清晰

### 7.3 TDD 循环检查清单

- [ ] 先写失败的测试（Red）
- [ ] 用最简代码让测试通过（Green）
- [ ] 优化代码结构（Refactor）
- [ ] 测试覆盖所有业务规则
- [ ] 测试命名清晰表达意图

### 7.4 代码实现检查清单

- [ ] 领域逻辑在聚合根/实体中
- [ ] 值对象不可变
- [ ] 领域事件正确触发
- [ ] 仓储接口定义在领域层
- [ ] 基础设施实现正确

---

## 八、常用命令

```bash
# 运行 BDD 测试
pnpm vitest run features/

# 运行单元测试（TDD）
pnpm vitest run src/**/*.spec.ts

# 监听模式运行测试
pnpm vitest watch

# 运行特定测试文件
pnpm vitest run path/to/file.spec.ts

# 运行测试并生成覆盖率
pnpm vitest run --coverage

# 运行所有测试
pnpm vitest run
```

---

## 九、参考资源

- [测试指南文档系列](../../specs-testing/README.md)
- [单元测试最佳实践](../../specs-testing/02-unit-testing.md)
- [BDD 测试方法](../../specs-testing/03-bdd-testing.md)
- [TDD 方法论](../../specs-testing/04-tdd-methodology.md)
- [DDD 架构中的测试](../../specs-testing/05-testing-in-ddd.md)
