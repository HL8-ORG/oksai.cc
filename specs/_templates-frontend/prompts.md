# {功能名称} 提示词

---

## 开发流程

### 同步实现状态

审查 `{feature}` 已实现内容，并更新 `specs/{feature}/implementation.md`。

检查项：

- [ ] 页面组件实现状态
- [ ] API 集成状态
- [ ] 测试覆盖率
- [ ] 响应式适配状态
- [ ] 可访问性检查

### 开始开发新功能

按照工作流程开发 `{feature}`：

1. **用户故事**：在 `specs/{feature}/design.md` 中定义用户故事（使用 INVEST 原则）
2. **UI/UX 设计**：绘制 Wireframe，定义交互流程
3. **组件开发**：
   - 创建路由
   - 实现页面组件
   - 实现业务组件
   - 集成 API
4. **测试验证**：
   - 组件测试
   - E2E 测试
   - 可访问性测试

详见 `specs/_templates-frontend/workflow.md`。

### 继续开发功能

继续处理 `{feature}`。请先阅读 `specs/{feature}/implementation.md` 了解当前状态。

---

## 组件开发

### 创建页面组件

创建 `{PageName}` 页面组件：

1. 创建路由：`src/routes/{path}.tsx`
2. 创建页面：`src/pages/{path}/{PageName}.tsx`
3. 配置权限（如需要）
4. 集成子组件
   参考 workflow.md "组件开发顺序" 章节。

### 创建业务组件

创建 `{ComponentName}` 业务组件：

1. 定义 Props 接口
2. 实现组件逻辑
3. 添加样式
4. 编写测试：`src/components/{Component}.test.tsx`
   参考 examples/component-test.md 测试模式。

### 创建表单组件

创建 `{FormName}` 表单组件：

1. 定义 Zod Schema
2. 使用 `useForm` + `zodResolver`
3. 完成验证和提交处理
   参考 `examples/form.md` 完整示例。

---

## API 集成

### 创建 API Hook

为 `{resource}` 创建 TanStack Query hooks。参考 `examples/api-hooks.md` 完整示例。
查询 Hook（GET）：

```typescript
export function use{Resource}(id: string) {
  return useQuery({
    queryKey: ['{resource}', id],
    queryFn: () => apiClient.get{Resource}(id),
    enabled: !!id,
  });
}
```

变更 Hook（POST/PUT/DELETE）：

```typescript
export function use{Action}() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: apiClient.{action},
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['{resource}'] });
      toast.success('操作成功');
    },
  });
}
```

### 处理加载和错误状态

为 `{Component}` 添加加载和错误状态处理。
参考 testing.md "测试模式" 章节的错误处理模式。
关键模式：

```typescript
const { data, isLoading, error } = use{Resource}();
if (isLoading) return <LoadingSkeleton />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;
return <DataView data={data} />;
```

2. **变更 Hook**（POST/PUT/DELETE）：

   ```typescript
   // hooks/use{Action}.ts
   export function use{Action}() {
     const queryClient = useQueryClient();

     return useMutation({
       mutationFn: apiClient.{action},
       onSuccess: () => {
         queryClient.invalidateQueries({ queryKey: ['{resource}'] });
         toast.success('操作成功');
       },
       onError: (error) => {
         toast.error(error.message);
       },
     });
   }
   ```

### 处理加载和错误状态

为 `{Component}` 添加加载和错误状态处理：

```typescript
const { data, isLoading, error } = use{Resource}();

if (isLoading) return <LoadingSpinner />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;

return <DataView data={data} />;
```

---

## 测试相关

### 生成组件测试

为 `{Component}` 编写组件测试，遵循 `examples/component-test.md` 模式。
关键检查项：

- [ ] 渲染测试：默认、加载、错误、空状态
- [ ] 交互测试：用户点击、输入、表单提交
- [ ] 可访问性测试：jest-axe 无违规
- [ ] Props 变化响应

### 生成 E2E 测试

为 `{feature}` 编写 E2E 测试。参考 testing.md E2E 测试模式。
关键场景：

- 关键用户流程（登录、表单提交）
- 多页面导航
- 错误处理
- 响应式布局

### 运行测试检查

检查 `{feature}` 的测试状态：

1. 运行组件测试：`pnpm vitest run`
2. 检查覆盖率：`pnpm vitest run --coverage`
3. 运行 E2E 测试：`pnpm playwright test`
4. 更新 `implementation.md` 中的覆盖率数据

---

## 样式相关

### 实现响应式布局

为 `{Component}` 添加响应式布局：

```typescript
<div className="
  grid
  grid-cols-1
  sm:grid-cols-2
  md:grid-cols-3
  lg:grid-cols-4
  gap-4
">
  {items.map(item => <Item key={item.id} {...item} />)}
</div>
```

断点：

- Mobile: < 640px
- Tablet: 640px - 1024px
- Desktop: > 1024px

### 添加加载状态

为 `{Component}` 添加加载骨架屏：

```typescript
export function {Component}Skeleton() {
  return (
    <div className="animate-pulse">
      <div className="h-4 bg-gray-200 rounded w-3/4 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-1/2 mb-4"></div>
      <div className="h-4 bg-gray-200 rounded w-5/6"></div>
    </div>
  );
}
```

### 实现空状态

为 `{Component}` 添加空状态展示：

```typescript
export function EmptyState() {
  return (
    <div className="text-center py-12">
      <EmptyIcon className="mx-auto h-12 w-12 text-gray-400" />
      <h3 className="mt-2 text-sm font-medium text-gray-900">暂无数据</h3>
      <p className="mt-1 text-sm text-gray-500">开始创建第一个项目</p>
      <div className="mt-6">
        <Button>创建项目</Button>
      </div>
    </div>
  );
}
```

---

## 可访问性

### 添加 ARIA 标签

为 `{Component}` 添加 ARIA 标签：

```typescript
<button
  aria-label="{操作描述}"
  aria-busy={isLoading}
  aria-disabled={isDisabled}
  aria-expanded={isOpen}
>
  {children}
</button>
```

### 实现键盘导航

为 `{Component}` 添加键盘导航支持：

```typescript
const handleKeyDown = (event: KeyboardEvent) => {
  if (event.key === 'Enter' || event.key === ' ') {
    handleAction();
  }
  if (event.key === 'Escape') {
    handleClose();
  }
};
```

### 运行可访问性检查

使用 jest-axe 检查可访问性：

```typescript
import { axe } from 'jest-axe';

it('should have no accessibility violations', async () => {
  const { container } = render(<{Component} />);
  const results = await axe(container);
  expect(results).toHaveNoViolations();
});
```

---

## 代码审查

### 代码审查

从以下角度审查改动：

- **类型安全**：TypeScript 类型完整
- **组件设计**：职责清晰、Props 合理
- **性能优化**：避免不必要的重渲染
- **可访问性**：ARIA 标签、键盘导航
- **响应式**：多设备适配
- **错误处理**：完善的错误提示

### 测试审查

审查 `{feature}` 的测试质量：

- [ ] 测试命名清晰（`should {behavior} when {condition}`）
- [ ] 使用 accessible queries（`getByRole`, `getByText`）
- [ ] 覆盖正常流程、异常流程、边界条件
- [ ] Mock 使用正确
- [ ] 测试独立、可重复执行

---

## 文档相关

### 生成带截图的文档

为 `{feature}` 生成带截图的文档：

1. 在浏览器中打开该功能
2. 对关键 UI 状态截图：
   - 默认状态
   - 加载状态
   - 错误状态
   - 空状态
3. 将截图保存到 `specs/{feature}/docs/screenshots/`
4. 创建/更新 `specs/{feature}/docs/README.md`，包含：
   - 功能概览
   - 使用方式（带截图的分步说明）
   - 配置选项
   - 常见用例

### 生成组件文档

为 `{Component}` 生成使用文档：

````typescript
/**
 * {ComponentName} - {简短描述}
 *
 * @example
 * ```tsx
 * <{ComponentName}
 *   prop1="value"
 *   prop2={123}
 *   onAction={(data) => console.log(data)}
 * />
 * ```
 *
 * @param {ComponentNameProps} props - 组件属性
 * @returns JSX.Element
 */
export function {ComponentName}(props: {ComponentName}Props) {
  // ...
}
````

---

## 检查清单

### 验证工作流程完成度

检查 `{feature}` 是否完成所有开发步骤：

- [ ] 用户故事已定义（符合 INVEST 原则）
- [ ] UI/UX 设计已完成（Wireframe + 交互设计）
- [ ] 组件已实现（页面 + 业务 + 通用）
- [ ] API 已集成（Hooks + 状态管理）
- [ ] 组件测试覆盖率 > 80%
- [ ] E2E 测试已编写
- [ ] 可访问性检查通过
- [ ] 响应式适配完成
- [ ] 文档已生成

### 发布前检查

检查 `{feature}` 是否可以发布：

- [ ] 所有测试通过
- [ ] 覆盖率达标（>70%）
- [ ] 无 TypeScript 错误
- [ ] 无 ESLint 警告
- [ ] 性能指标达标
- [ ] 文档已更新
- [ ] CHANGELOG 已更新

---

## 常见问题

### Q: 如何处理大量数据列表？

**A:** 使用虚拟滚动或分页：

```typescript
// 虚拟滚动（适合上千条数据）
import { useVirtualizer } from '@tanstack/react-virtual';

// 分页（适合一般场景）
const { data } = useQuery({
  queryKey: ['items', page],
  queryFn: () => fetchItems(page),
});
```

### Q: 如何优化表单性能？

**A:**

1. 使用 `react-hook-form` 减少重渲染
2. 拆分复杂表单为多个步骤
3. 使用 `useMemo` 优化计算属性
4. 延迟验证（`mode: 'onBlur'`）

### Q: 如何处理文件上传？

**A:**

```typescript
const { mutate: upload } = useMutation({
  mutationFn: (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return apiClient.uploadFile(formData);
  },
});

// 使用
<input
  type="file"
  onChange={(e) => {
    const file = e.target.files?.[0];
    if (file) upload(file);
  }}
/>
```
