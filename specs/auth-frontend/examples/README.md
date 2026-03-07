# 前端模版示例库

本目录包含前端开发的标准代码示例，遵循单一事实来源原则。

---

## 📚 示例索引

### API 集成示例

| 文件           | 描述                          | 关键模式             |
| :------------- | :---------------------------- | :------------------- |
| `api-hooks.md` | TanStack Query Hooks 完整示例 | 查询、变更、缓存失效 |

### 组件开发示例

| 文件      | 描述             | 关键模式                          |
| :-------- | :--------------- | :-------------------------------- |
| `form.md` | 表单处理完整示例 | React Hook Form + Zod、验证、提交 |

### 测试示例

| 文件                | 描述             | 关键模式                   |
| :------------------ | :--------------- | :------------------------- |
| `component-test.md` | 组件测试完整示例 | 渲染、交互、Mock、可访问性 |

---

## 🎯 使用方式

### 开发时参考

1. **集成 API**：参考 `api-hooks.md` - TanStack Query 完整示例
2. **实现表单**：参考 `form.md` - React Hook Form + Zod 完整示例
3. **编写测试**：参考 `component-test.md` - Testing Library 完整示例

### 代码审查标准

示例代码代表团队的编码标准：

- 命名约定
- 代码组织
- 错误处理
- 测试覆盖

---

## 📋 示例质量标准

每个示例必须包含：

- ✅ **完整可运行**：可直接复制使用
- ✅ **类型安全**：完整的 TypeScript 类型
- ✅ **错误处理**：展示错误处理模式
- ✅ **注释清晰**：关键决策点有中文注释
- ✅ **遵循约定**：符合 AGENTS.md 中的约定

---

## 🔗 与模版文档的关系

```
模版文档（指导性）        示例代码（演示性）
    ↓                       ↓
design.md          →  api-hooks.example.ts
  (决策点)              (完整实现)

workflow.md        →  page-component.example.tsx
  (开发流程)            (完整流程)

testing.md         →  component-test.example.ts
  (测试策略)            (完整测试)
```

**原则**：

- 模版文档说明 **WHY** 和 **WHEN**
- 示例代码展示 **HOW**
- 避免在模版文档中重复示例代码

---

## 🛠️ 维护指南

### 添加新示例

1. **创建文件**：遵循命名约定 `{type}.example.{ext}`
2. **编写完整示例**：包含所有必要的导入和类型
3. **添加注释**：解释关键决策点
4. **更新索引**：在本 README 中添加条目
5. **验证可运行**：确保代码可复制使用

### 更新现有示例

1. **保持向后兼容**：避免破坏现有引用
2. **更新注释**：反映变更的原因
3. **测试影响范围**：检查引用该示例的文档
4. **更新相关文档**：同步更新设计文档

---

## 📖 示例使用场景

### 场景 1：新功能开发

```
1. 阅读 design.md 了解需求
2. 参考 workflow.md 了解流程
3. 复制相关示例作为起点
4. 根据具体需求修改
```

### 场景 2：代码审查

```
1. 检查代码是否符合示例标准
2. 验证错误处理是否完整
3. 确认类型定义是否完整
4. 检查命名是否符合约定
```

### 场景 3：问题排查

```
1. 对比示例代码和实际代码
2. 检查是否遗漏错误处理
3. 验证类型定义是否匹配
4. 确认导入是否正确
```

---

## 🎨 代码风格

示例代码遵循以下风格：

```typescript
// ✅ 好的示例
/**
 * 用户列表组件 - 展示用户列表
 *
 * 关键模式：
 * - TanStack Query 数据获取
 * - 加载和错误状态处理
 * - 空状态展示
 */
export function UserList() {
  // 数据获取
  const { data: users, isLoading, error } = useUsers();

  // 加载状态
  if (isLoading) {
    return <UserListSkeleton />;
  }

  // 错误状态
  if (error) {
    return <ErrorMessage error={error} />;
  }

  // 空状态
  if (!users?.length) {
    return <EmptyState message="暂无用户" />;
  }

  // 正常渲染
  return (
    <ul role="list">
      {users.map(user => (
        <UserListItem key={user.id} user={user} />
      ))}
    </ul>
  );
}

// ❌ 避免的写法
export function UserList() {
  const { data } = useUsers();  // 缺少错误处理
  return <div>{data?.map(u => <div>{u.name}</div>)}</div>;  // 缺少可访问性
}
```

---

## 📚 参考资源

### 官方文档

- [TanStack Query](https://tanstack.com/query/latest)
- [React Hook Form](https://react-hook-form.com/)
- [Testing Library](https://testing-library.com/)
- [Playwright](https://playwright.dev/)

### 内部文档

- [设计指南](../design.md)
- [测试策略](../testing.md)
- [代码约定](../AGENTS.md)
- [上下文地图](../CONTEXT-MAP.md)

---

**维护者**：前端团队
**最后更新**：2026-03-07
