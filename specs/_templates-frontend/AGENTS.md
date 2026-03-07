# AGENTS.md — {功能名称}（前端）

## 项目背景

{简要说明该功能做什么}

## 开始前

1. 阅读 `specs/{feature}/design.md`
2. 查看 `specs/{feature}/implementation.md` 了解当前进度
3. 参考 `specs/_templates-frontend/workflow.md` 了解开发工作流程
4. 参考 `{relevant directories}` 中的现有实现模式

## 开发工作流程

遵循 `specs/_templates-frontend/workflow.md` 中的标准流程：

1. **用户故事**：在 `design.md` 中定义用户故事（符合 INVEST 原则）
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

## 代码模式

关键模式参考 `examples/` 目录中的完整示例。

### 组件测试模式

参考 `examples/component-test.md` 完整示例。

关键模式：

- 使用 Testing Library 的 accessible queries
- AAA 模式（Arrange-Act-Assert）
- Mock 外部依赖，不 Mock 宙现细节
- 可访问性测试（jest-axe）

### API Hook 模式

参考 `examples/api-hooks.md` 完整示例。
关键模式：

- 查询（useQuery）：数据获取，自动缓存
- 变更（useMutation）：数据修改，缓存失效
- 错误处理：统一 toast 提示

### 表单处理模式

参考 `examples/form.md` 完整示例。
关键模式：

- Schema 定义（Zod）：验证规则
- 类型推导：`z.infer<typeof schema>`
- 表单集成：`useForm` + `zodResolver`
- 错误处理：统一样式和显示

### API Hook 模式

```typescript
// hooks/use{Resource}.ts
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';

export function use{Resource}(id: string) {
  return useQuery({
    queryKey: ['{resource}', id],
    queryFn: () => apiClient.get{Resource}(id),
    enabled: !!id,
  });
}

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

### 表单处理模式

```typescript
// components/{Form}.tsx
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const schema = z.object({
  name: z.string().min(1, '姓名不能为空'),
  email: z.string().email('邮箱格式不正确'),
});

type FormData = z.infer<typeof schema>;

export function {Form}() {
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<FormData>({
    resolver: zodResolver(schema),
  });

  const onSubmit = async (data: FormData) => {
    // 处理提交
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <Input
        {...register('name')}
        error={errors.name?.message}
      />
      <Button type="submit" loading={isSubmitting}>
        提交
      </Button>
    </form>
  );
}
```

## 不要做

- 不要添加 `design.md` 之外的功能
- 不要跳过可访问性检查
- 不要使用内联样式（除非动态计算）
- 不要忽略加载和错误状态
- 不要使用 testid 查询（优先使用 accessible queries）
- {该功能特有的禁止项}

## 测试策略

### 组件测试（60%）

- 渲染测试：验证组件正确渲染
- 交互测试：验证用户交互行为
- 状态测试：验证状态变化
- 测试命名：`should {behavior} when {condition}`

### E2E 测试（30%）

- 关键用户流程
- 表单提交场景
- 错误处理场景

### 视觉测试（10%）

- 关键页面截图对比
- 响应式布局验证

## 常见问题

### Q: 如何确定组件是否需要测试？

**A:**

- ✅ 业务组件：必须测试
- ✅ 表单组件：必须测试
- ✅ 复杂交互组件：必须测试
- ❌ 简单展示组件：可选

### Q: 如何处理异步数据？

**A:** 使用 TanStack Query：

```typescript
const { data, isLoading, error } = use{Resource}();

if (isLoading) return <LoadingSkeleton />;
if (error) return <ErrorMessage error={error} />;
if (!data) return <EmptyState />;

return <DataView data={data} />;
```

### Q: 如何保证代码质量？

**A:**

1. 所有组件有完整 TypeScript 类型
2. 测试覆盖率 > 70%
3. 遵循项目代码规范（ESLint + Prettier）
4. 可访问性检查通过
5. 代码 Review 通过

### Q: 如何优化性能？

**A:**

1. 使用 React.memo 避免不必要渲染
2. 使用 useMemo/useCallback 优化计算
3. 路由级代码分割
4. 图片懒加载
5. 虚拟滚动（长列表）

## 技术栈

### 核心技术

- **框架**：React 18+ / TanStack Start
- **路由**：@tanstack/react-router
- **状态管理**：@tanstack/react-query + Zustand
- **表单**：react-hook-form + zod
- **样式**：Tailwind CSS
- **测试**：Vitest + Testing Library + Playwright

### 开发工具

- **类型检查**：TypeScript 5+
- **代码规范**：ESLint + Prettier / Biome
- **包管理**：pnpm
- **构建工具**：Vite

## 响应式断点

- **Mobile**: < 640px
- **Tablet**: 640px - 1024px
- **Desktop**: > 1024px

使用 Tailwind CSS 断点：

- `sm:` - 640px
- `md:` - 768px
- `lg:` - 1024px
- `xl:` - 1280px

## 可访问性清单

- [ ] 所有图片有 alt 属性
- [ ] 表单字段有 label 关联
- [ ] 按钮有明确的文本或 aria-label
- [ ] 颜色对比度符合 WCAG AA 标准（4.5:1）
- [ ] 键盘导航完整可用
- [ ] 焦点顺序合理
- [ ] 动画可关闭（prefers-reduced-motion）
- [ ] 屏幕阅读器兼容
