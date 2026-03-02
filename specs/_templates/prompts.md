# {功能名称} 提示词

## 同步实现状态

审查 `{feature}` 已实现内容，并更新 `specs/{feature}/implementation.md`。

## 开始开发新功能

按照工作流程开发 `{feature}`：

1. **用户故事**：在 `specs/{feature}/design.md` 中定义用户故事（使用 INVEST 原则）
2. **BDD 场景**：在 `features/{feature}.feature` 中编写验收场景
3. **TDD 循环**：
   - 🔴 Red: 编写失败的单元测试
   - 🟢 Green: 用最简代码让测试通过
   - 🔵 Refactor: 优化代码结构
4. **代码实现**：按照 DDD 分层实现功能

详见 `specs/_templates/workflow.md`。

## 生成测试

为 `{component}` 编写测试，遵循现有测试模式（使用 Vitest）。

## 代码审查

从以下角度审查改动：类型安全、错误处理、安全性、边界情况。

## 继续开发功能

继续处理 `{feature}`。请先阅读 `specs/{feature}/implementation.md` 了解当前状态。

## 生成 BDD 场景

为 `{feature}` 编写 BDD 场景：

1. 分析 `specs/{feature}/design.md` 中的用户故事
2. 识别正常流程（Happy Path）
3. 识别异常流程（Error Cases）
4. 识别边界条件（Edge Cases）
5. 编写 `features/{feature}.feature` 文件

## TDD 开发

使用 TDD 方式开发 `{component}`：

1. 🔴 **Red**: 先编写失败的单元测试
2. 🟢 **Green**: 用最简单的方式让测试通过
3. 🔵 **Refactor**: 优化代码，保持测试通过

示例：
```typescript
// 🔴 Red
describe('{Entity}', () => {
  describe('{method}', () => {
    it('should {behavior} when {condition}', () => {
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
// 优化代码结构，提取验证逻辑，增强可读性
```

## 生成带截图的文档

为 `{feature}` 生成带截图的文档：

1. 在浏览器中打开该功能
2. 使用浏览器扩展对关键 UI 状态截图
3. 将截图保存到 `specs/{feature}/docs/screenshots/`
4. 创建/更新 `specs/{feature}/docs/README.md`，包含：
   - 功能概览
   - 使用方式（带截图的分步说明）
   - 配置选项
   - 常见用例

## 提升文档为公开版本

将内部文档提升为公开的 Mintlify 文档：

1. 审阅 `specs/{feature}/docs/README.md`
2. 复制/改写内容到 `docs/{feature}.mdx`
3. 将截图移动到 `docs/images/{feature}/`
4. 更新 `docs/mint.json` 导航
5. 确保文案适合客户阅读（不含内部细节）

## 验证工作流程完成度

检查 `{feature}` 是否完成所有开发步骤：

- [ ] 用户故事已定义（符合 INVEST 原则）
- [ ] BDD 场景已编写并通过
- [ ] TDD 循环已完成（Red-Green-Refactor）
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试已编写
- [ ] 代码已 Review
- [ ] 文档已生成
