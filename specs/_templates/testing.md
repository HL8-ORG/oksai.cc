# {功能名称} 测试计划

## 测试策略

遵循测试金字塔：单元测试 70% | 集成测试 20% | E2E 测试 10%

---

## 单元测试（70%）

### 领域层

| 组件 | 测试文件 | 测试用例 | 状态 |
|:---|:---|:---|:---:|
| {Entity} | `{entity}.aggregate.spec.ts` | 创建、验证、业务规则 | ⏳ |
| {ValueObject} | `{vo}.vo.spec.ts` | 不变性、验证 | ⏳ |

### 应用层

| 组件 | 测试文件 | 测试用例 | 状态 |
|:---|:---|:---|:---:|
| {Command}Handler | `{command}.handler.spec.ts` | 成功、失败、事件发布 | ⏳ |
| {Query}Handler | `{query}.handler.spec.ts` | 查询结果、空结果 | ⏳ |

### 测试模式

```typescript
// AAA 模式
it('should {behavior} when {condition}', () => {
  // Arrange - 准备测试数据
  const props = { /* 测试数据 */ };

  // Act - 执行操作
  const result = Entity.create(props);

  // Assert - 验证结果
  expect(result.isOk()).toBe(true);
});
```

---

## 集成测试（20%）

| 组件 | 测试文件 | 测试内容 | 状态 |
|:---|:---|:---|:---:|
| {Repository} | `{repo}.repository.int-spec.ts` | CRUD 操作、事务 | ⏳ |
| 多组件协作 | `{feature}.int-spec.ts` | 组件间交互 | ⏳ |

---

## E2E 测试（10%）

| 场景 | 测试文件 | 测试内容 | 状态 |
|:---|:---|:---|:---:|
| 关键业务流程 | `{feature}.e2e-spec.ts` | API 端到端验证 | ⏳ |

---

## BDD 场景

| 场景类型 | Feature 文件 | 步骤定义 | 状态 |
|:---|:---|:---|:---:|
| Happy Path | `features/{feature}.feature` | `{feature}.steps.ts` | ⏳ |
| Error Cases | 同上 | 同上 | ⏳ |
| Edge Cases | 同上 | 同上 | ⏳ |

---

## 测试覆盖率目标

- [ ] 领域层覆盖率 > 90%
- [ ] 应用层覆盖率 > 85%
- [ ] 总体覆盖率 > 80%

---

## 测试命令

```bash
# 运行单元测试
pnpm vitest run src/**/*.spec.ts

# 运行集成测试
pnpm vitest run src/**/*.int-spec.ts

# 运行 E2E 测试
pnpm vitest run src/**/*.e2e-spec.ts

# 运行覆盖率
pnpm vitest run --coverage

# 监听模式
pnpm vitest watch
```

---

## 测试数据 Fixtures

创建测试数据工厂：

```typescript
// {entity}.fixture.ts
export class EntityFixture {
  static createDefault(overrides?: Partial<EntityProps>): Entity {
    return Entity.create({
      id: 'test-id',
      name: '测试实体',
      ...overrides,
    }).value;
  }

  static createInvalid(): CreateEntityProps {
    return {
      name: '', // 故意设置为无效值
    };
  }
}
```

---

## Mock 策略

| 依赖 | Mock 方式 | 说明 |
|:---|:---|:---|
| Repository | `MockRepository` | 内存实现 |
| EventBus | `MockEventBus` | 记录发布事件 |
| 外部服务 | `vi.fn()` | Vitest mock |

```typescript
// Mock Repository 示例
class MockRepository implements IRepository {
  private items: Map<string, Entity> = new Map();

  async save(entity: Entity): Promise<void> {
    this.items.set(entity.id, entity);
  }

  async findById(id: string): Promise<Entity | null> {
    return this.items.get(id) ?? null;
  }
}
```

---

## 参考资料

- [测试指南](../../specs-testing/README.md)
- [单元测试最佳实践](../../specs-testing/02-unit-testing.md)
- [Mock 与 Stub 指南](../../specs-testing/07-mocking-guide.md)
