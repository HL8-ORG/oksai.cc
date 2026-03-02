# AGENTS.md — {功能名称}

## 项目背景

{简要说明该功能做什么}

## 开始前

1. 阅读 `specs/{feature}/design.md`
2. 查看 `specs/{feature}/implementation.md` 了解当前进度
3. 参考 `specs/_templates/workflow.md` 了解开发工作流程
4. 参考 `{relevant directories}` 中的现有实现模式

## 开发工作流程

遵循 `specs/_templates/workflow.md` 中的标准流程：

1. **用户故事**：在 `design.md` 中定义用户故事（符合 INVEST 原则）
2. **BDD 场景**：编写验收场景（Given-When-Then）
3. **TDD 循环**：
   - 🔴 Red: 编写失败的测试
   - 🟢 Green: 最简实现
   - 🔵 Refactor: 优化代码
4. **代码实现**：按照 DDD 分层实现

## 代码模式

{需要遵循的关键模式、参考实现}

### 领域层测试模式

```typescript
// {entity}.aggregate.spec.ts
describe('{Entity}', () => {
  describe('{method}', () => {
    it('should {behavior} when {condition}', () => {
      // Arrange - 准备测试数据
      const props = { /* 测试数据 */ };
      
      // Act - 执行操作
      const result = Entity.create(props);
      
      // Assert - 验证结果
      expect(result.isOk()).toBe(true);
      expect(result.value.property).toBe(expected);
    });
  });
});
```

### 应用层测试模式

```typescript
// {command}.handler.spec.ts
describe('{Command}Handler', () => {
  let handler: CommandHandler;
  let mockRepo: MockRepository;

  beforeEach(() => {
    mockRepo = new MockRepository();
    handler = new CommandHandler(mockRepo);
  });

  it('should execute successfully', async () => {
    // Arrange
    const command = CommandFixture.createDefault();

    // Act
    const result = await handler.execute(command);

    // Assert
    expect(result.isOk()).toBe(true);
  });
});
```

## 不要做

- 不要添加 `design.md` 之外的功能
- 不要跳过测试（遵循 TDD：先写测试）
- 不要跳过 BDD 场景（确保验收标准明确）
- {该功能特有的禁止项}

## 测试策略

### 单元测试（70%）
- 领域层：聚合根、实体、值对象
- 应用层：Command Handler、Query Handler
- 测试命名：`should {behavior} when {condition}`

### 集成测试（20%）
- 基础设施层：Repository 实现
- 应用层：多个组件协作

### E2E 测试（10%）
- 关键业务流程
- API 端到端验证

## 常见问题

### Q: 如何确定何时编写测试？
**A:** 遵循 TDD 原则，先写失败的测试（Red），再写最简代码（Green），最后优化（Refactor）。

### Q: 测试应该覆盖哪些场景？
**A:** 参考 BDD 场景文件（`features/{feature}.feature`），至少覆盖：
- 正常流程（Happy Path）
- 异常流程（Error Cases）
- 边界条件（Edge Cases）

### Q: 如何保证代码质量？
**A:** 
1. 所有公共 API 都有 TSDoc 注释
2. 测试覆盖率 > 80%
3. 遵循项目代码规范（Biome）
4. 代码 Review 通过
