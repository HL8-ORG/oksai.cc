# 后端模版上下文地图

基于 Jiang & Nam (2025) 的开发者上下文五分类法，快速定位后端开发所需信息。

---

## 🗺️ 快速导航

### 按开发阶段查找

| 阶段           | 需要阅读的文件                                 | 关键章节                |
| :------------- | :--------------------------------------------- | :---------------------- |
| **开始新功能** | design.md → workflow.md                        | 用户故事、领域设计      |
| **领域层开发** | design.md "领域层" → workflow.md "TDD 循环"    | 聚合根、实体、值对象    |
| **应用层开发** | design.md "应用层" → workflow.md "Handler TDD" | Command、Query、Handler |
| **基础设施层** | design.md "基础设施层"                         | Repository、Adapter     |
| **编写测试**   | testing.md → workflow.md "TDD 循环"            | 领域层、应用层测试      |
| **遇到问题**   | prompts.md → decisions.md                      | 常见问题、技术决策      |

### 按任务类型查找

| 任务类型              | 主要参考                   | 辅助参考                  |
| :-------------------- | :------------------------- | :------------------------ |
| **创建聚合根**        | design.md "领域层"         | workflow.md "TDD 循环"    |
| **创建 Handler**      | design.md "应用层"         | workflow.md "Handler TDD" |
| **实现 Repository**   | design.md "基础设施层"     | testing.md "集成测试"     |
| **编写领域测试**      | testing.md "领域层测试"    | workflow.md "TDD Red"     |
| **编写 Handler 测试** | testing.md "应用层测试"    | workflow.md "TDD Red"     |
| **定义 BDD 场景**     | workflow.md "BDD 场景设计" | design.md "用户故事"      |

---

## 📋 五分类内容地图

### 1️⃣ 约定（Conventions）

**定义**：编码风格、命名模式、格式规则

| 约定类型     | 位置        | 关键内容                       |
| :----------- | :---------- | :----------------------------- |
| **代码模式** | AGENTS.md   | 领域层测试模式、应用层测试模式 |
| **命名规范** | design.md   | 聚合根命名、Command/Query 命名 |
| **文件组织** | workflow.md | DDD 分层目录结构               |
| **测试约定** | testing.md  | AAA 模式、Mock 策略            |

**快速查找**：

```bash
# 查找 DDD 分层约定
grep -n "领域层\|应用层\|基础设施层" design.md

# 查找测试模式
grep -n "测试模式\|AAA" AGENTS.md testing.md
```

---

### 2️⃣ 指南（Guidelines）

**定义**：决策启发式、工作流模式

| 指南类型     | 位置                 | 关键内容                              |
| :----------- | :------------------- | :------------------------------------ |
| **开发流程** | workflow.md          | 用户故事 → BDD → TDD → 实现           |
| **TDD 循环** | workflow.md "阶段三" | Red-Green-Refactor                    |
| **测试策略** | testing.md           | 单元测试 70% + 集成测试 20% + E2E 10% |
| **性能优化** | decisions.md         | 缓存策略、数据库优化                  |

**关键决策点**：

- **TDD 循环**：先写失败的测试（Red）→ 最简实现（Green）→ 优化代码（Refactor）
- **测试金字塔**：单元测试 > 集成测试 > E2E 测试
- **DDD 分层**：领域层 → 应用层 → 基础设施层
- **CQRS**：Command（写）+ Query（读）分离

---

### 3️⃣ 项目信息（Project Information）

**定义**：架构、依赖、领域知识

| 信息类型     | 位置                 | 关键内容                      |
| :----------- | :------------------- | :---------------------------- |
| **技术栈**   | AGENTS.md            | NestJS、MikroORM、Better Auth |
| **架构设计** | design.md "技术设计" | 领域层、应用层、基础设施层    |
| **依赖关系** | design.md "依赖关系" | 共享模块、外部依赖            |
| **领域知识** | 各功能 design.md     | 功能特定的业务逻辑            |

**技术栈概览**：

```
核心框架：
  - NestJS（后端框架）
  - MikroORM（ORM）
  - Better Auth（认证）

DDD 架构：
  - 领域层（聚合根、实体、值对象）
  - 应用层（Command、Query、Handler）
  - 基础设施层（Repository、Adapter）

测试：
  - Vitest（测试框架）
  - Cucumber（BDD 测试）
  - Supertest（E2E 测试）
```

---

### 4️⃣ LLM 指令（LLM Directives）

**定义**：行为指令、输出格式要求

| 指令类型     | 位置                     | 关键内容                   |
| :----------- | :----------------------- | :------------------------- |
| **行为约束** | AGENTS.md "不要做"       | 不添加额外功能、不跳过测试 |
| **工作流程** | AGENTS.md "开发工作流程" | 遵循 workflow.md 标准流程  |
| **代码规范** | AGENTS.md "代码模式"     | 使用指定的测试模式         |
| **质量标准** | AGENTS.md "测试策略"     | 领域层 >90%、应用层 >85%   |
| **响应格式** | prompts.md               | 各种场景的提示词模板       |

**关键约束**：

```
✅ 必须做：
  - 阅读设计文档再开始开发
  - 遵循 TDD 循环（Red-Green-Refactor）
  - 编写领域层和应用层测试
  - 使用共享模块（Logger、Exceptions）
  - 遵循 DDD 分层架构

❌ 禁止做：
  - 添加 design.md 之外的功能
  - 跳过测试（遵循 TDD）
  - 使用 import type 导入 Service
  - 跳过领域层直接实现基础设施
```

---

### 5️⃣ 示例（Examples）

**定义**：标准代码样例、输入输出示范

| 示例类型          | 位置                           | 关键内容                    |
| :---------------- | :----------------------------- | :-------------------------- |
| **完整 TDD 循环** | workflow.md "完整工作流程示例" | Red-Green-Refactor 完整流程 |
| **领域层测试**    | AGENTS.md、testing.md          | 聚合根测试示例              |
| **应用层测试**    | AGENTS.md、testing.md          | Handler 测试示例            |
| **BDD 场景**      | workflow.md "BDD 场景设计"     | Gherkin 语法示例            |

**示例索引**：

#### 领域层示例

```typescript
// 1. 聚合根创建（workflow.md "TDD 循环示例"）
export class Entity extends AggregateRoot<Props> {
  static create(props: CreateProps): Result<Entity, ValidationError> {
    // 验证逻辑
    if (!props.required) {
      return Result.fail(new ValidationError('必填字段不能为空'));
    }

    // 创建实体
    const entity = new Entity({
      id: EntityId.generate(),
      ...props,
    });

    // 触发领域事件
    entity.addDomainEvent(new EntityCreatedEvent(entity.id));

    return Result.ok(entity);
  }
}
```

#### 应用层示例

```typescript
// 2. Command Handler（workflow.md "Handler TDD"）
@CommandHandler(Command)
export class CommandHandler
  implements ICommandHandler<Command, Result<string>>
{
  constructor(
    private readonly repository: IRepository,
    private readonly eventBus: IEventBus,
  ) {}

  async execute(command: Command): Promise<Result<string, ApplicationError>> {
    // 1. 业务验证
    const entity = await this.repository.findById(command.id);
    if (!entity) {
      return Result.fail(new ApplicationError('实体不存在'));
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

#### 测试示例

```typescript
// 3. 领域层测试（testing.md "领域层测试"）
describe('{Entity}', () => {
  describe('{method}', () => {
    it('should {behavior} when {condition}', () => {
      // Arrange
      const props = {
        /* 测试数据 */
      };

      // Act
      const result = Entity.create(props);

      // Assert
      expect(result.isOk()).toBe(true);
      expect(result.value.property).toBe(expected);
    });
  });
});
```

---

## 🔍 场景化查找

### 场景 1：开始开发新功能

**阅读顺序**：

1. **design.md**（15 分钟）：阅读用户故事、领域设计、技术设计
2. **workflow.md**（10 分钟）：了解开发流程（用户故事 → BDD → TDD）
3. **AGENTS.md**（5 分钟）：了解代码模式和约束

**总阅读时间**：约 30 分钟

### 场景 2：实现领域层

**阅读顺序**：

1. **design.md "领域层"**：了解聚合根、实体、值对象设计
2. **workflow.md "TDD 循环"**：查看 Red-Green-Refactor 流程
3. **testing.md "领域层测试"**：了解测试策略
4. **prompts.md "生成测试"**：获取提示词

**总阅读时间**：约 20 分钟

### 场景 3：实现应用层

**阅读顺序**：

1. **design.md "应用层"**：了解 Command、Query、Handler 设计
2. **workflow.md "Handler TDD"**：查看 Handler 实现流程
3. **testing.md "应用层测试"**：了解测试策略
4. **prompts.md "生成 Handler 测试"**：获取提示词

**总阅读时间**：约 15 分钟

### 场景 4：编写测试

**阅读顺序**：

1. **testing.md**：了解测试策略和覆盖率目标
2. **AGENTS.md "测试模式"**：查看测试代码示例
3. **workflow.md "TDD 循环"**：查看 Red-Green-Refactor 流程
4. **prompts.md "生成测试"**：获取提示词

**总阅读时间**：约 20 分钟

### 场景 5：遇到技术问题

**阅读顺序**：

1. **prompts.md "常见问题"**：查找类似问题
2. **decisions.md**：查找相关技术决策
3. **使用提示词**：`prompts.md` 中的相关提示词

**总阅读时间**：约 10 分钟

---

## 📚 外部资源引用

### 共享模块

- **@oksai/logger**：统一日志记录
- **@oksai/exceptions**：DDD 分层异常
- **@oksai/constants**：错误码、事件名称
- **@oksai/config**：环境配置
- **@oksai/context**：租户上下文

### 测试文档

- **specs-testing/README.md**：测试指南
- **specs-testing/02-unit-testing.md**：单元测试最佳实践
- **specs-testing/03-bdd-testing.md**：BDD 测试方法

### NestJS 文档

- **NestJS 官方文档**：https://nestjs.com/
- **MikroORM 文档**：https://mikro-orm.io/
- **Better Auth 文档**：https://better-auth.com/

---

## 🎯 快速参考卡片

### 开发前必读（核心文档）

```
✅ design.md         - 功能设计（用户故事、领域设计、技术设计）
✅ workflow.md       - 开发工作流程（用户故事 → BDD → TDD）
✅ AGENTS.md         - AI 助手指令（代码模式、约束）
```

### 开发中参考（详细指南）

```
📋 testing.md        - 测试策略和示例
📋 prompts.md        - 提示词库
📋 decisions.md      - 技术决策记录
```

### 开发后文档（可选）

```
📄 docs/README.md    - 用户使用文档
📄 future-work.md    - 后续工作计划
```

---

## 📝 上下文地图使用建议

### 快速查找流程

```bash
# 1. 确定任务类型（如：创建聚合根）
# 2. 查看上下文地图 → 找到主要参考文件
# 3. 阅读主要参考文件
# 4. 按需阅读辅助参考文件
```

### 场景化阅读

- 🚀 **快速开始**：仅阅读核心文档（约 30 分钟）
- 📖 **深度学习**：阅读全部文档（约 2 小时）
- 🔍 **按需查找**：使用上下文地图快速定位
- 📝 **定期审查**：使用审计清单优化文档质量

---

**使用建议**：

- 🚀 **快速开始**：仅阅读核心文档（约 30 分钟）
- 📖 **深度学习**：阅读全部文档（约 2 小时）
- 🔍 **按需查找**：使用上下文地图快速定位
- 📝 **定期审查**：使用审计清单优化文档质量

**维护提示**：

- 更新内容时，同步更新上下文地图
- 添加新示例时，在示例索引中记录
- 发现重复内容时，立即合并或引用

---

**参考来源**：Jiang & Nam (2025) - Empirical Study of Developer-Provided Context
