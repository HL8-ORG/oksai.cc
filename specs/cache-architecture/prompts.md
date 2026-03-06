# {功能名称} 提示词

---

## 开发流程

### 同步实现状态

审查 `{feature}` 已实现内容，并更新 `specs/{feature}/implementation.md`。

### 开始开发新功能

按照工作流程开发 `{feature}`：

1. **用户故事**：在 `specs/{feature}/design.md` 中定义用户故事（使用 INVEST 原则）
2. **BDD 场景**：在 `features/{feature}.feature` 中编写验收场景
3. **TDD 循环**：
   - 🔴 Red: 编写失败的单元测试
   - 🟢 Green: 用最简代码让测试通过
   - 🔵 Refactor: 优化代码结构
4. **代码实现**：按照 DDD 分层实现功能

详见 `specs/_templates/workflow.md`。

### 继续开发功能

继续处理 `{feature}`。请先阅读 `specs/{feature}/implementation.md` 了解当前状态。

---

## 测试相关

### 生成测试

为 `{component}` 编写测试，遵循现有测试模式（使用 Vitest）。

### 生成测试 Fixture

为 `{Entity}` 创建测试数据工厂：

1. 创建 `{entity}.fixture.ts`
2. 实现 `createDefault()` 方法
3. 实现 `createInvalid()` 方法
4. 实现 `createWithOverrides()` 方法

### 生成 Mock 对象

为 `{Dependency}` 创建 Mock 实现：

```typescript
class Mock{Dependency} implements I{Dependency} {
  // 实现 interface 方法
}
```

### 运行测试检查

检查 `{feature}` 的测试状态：

1. 运行单元测试：`pnpm vitest run`
2. 检查覆盖率：`pnpm vitest run --coverage`
3. 更新 `implementation.md` 中的覆盖率数据

### TDD 开发

使用 TDD 方式开发 `{component}`：

1. 🔴 **Red**: 先编写失败的单元测试
2. 🟢 **Green**: 用最简单的方式让测试通过
3. 🔵 **Refactor**: 优化代码，保持测试通过

示例：
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
// 优化代码结构，提取验证逻辑，增强可读性
```

---

## BDD 相关

### 生成 BDD 场景

为 `{feature}` 编写 BDD 场景：

1. 分析 `specs/{feature}/design.md` 中的用户故事
2. 识别正常流程（Happy Path）
3. 识别异常流程（Error Cases）
4. 识别边界条件（Edge Cases）
5. 编写 `features/{feature}.feature` 文件

### 实现 BDD 步骤定义

为 `{feature}.feature` 实现步骤定义：

1. 创建 `features/step-definitions/{feature}.steps.ts`
2. 实现 Given 步骤
3. 实现 When 步骤
4. 实现 Then 步骤

---

## 代码审查

### 代码审查

从以下角度审查改动：类型安全、错误处理、安全性、边界情况。

### 测试审查

审查 `{feature}` 的测试质量：

- [ ] 测试命名清晰（`should {behavior} when {condition}`）
- [ ] 使用 AAA 模式（Arrange-Act-Assert）
- [ ] 覆盖正常流程、异常流程、边界条件
- [ ] Mock 使用正确
- [ ] 测试独立、可重复执行

---

## 文档相关

### 生成带截图的文档

为 `{feature}` 生成带截图的文档：

1. 在浏览器中打开该功能
2. 使用浏览器扩展对关键 UI 状态截图
3. 将截图保存到 `specs/{feature}/docs/screenshots/`
4. 创建/更新 `specs/{feature}/docs/README.md`，包含：
   - 功能概览
   - 使用方式（带截图的分步说明）
   - 配置选项
   - 常见用例

### 提升文档为公开版本

将内部文档提升为公开的 Mintlify 文档：

1. 审阅 `specs/{feature}/docs/README.md`
2. 复制/改写内容到 `docs/{feature}.mdx`
3. 将截图移动到 `docs/images/{feature}/`
4. 更新 `docs/mint.json` 导航
5. 确保文案适合客户阅读（不含内部细节）

---

## 检查清单

### 验证工作流程完成度

检查 `{feature}` 是否完成所有开发步骤：

- [ ] 用户故事已定义（符合 INVEST 原则）
- [ ] BDD 场景已编写并通过
- [ ] TDD 循环已完成（Red-Green-Refactor）
- [ ] 单元测试覆盖率 > 80%
- [ ] 集成测试已编写
- [ ] 代码已 Review
- [ ] 文档已生成

### 发布前检查

检查 `{feature}` 是否可以发布：

- [ ] 所有测试通过
- [ ] 覆盖率达标（领域层 >90%，总体 >80%）
- [ ] 无 TypeScript 错误
- [ ] 无 Lint 错误
- [ ] 文档已更新
- [ ] CHANGELOG 已更新
