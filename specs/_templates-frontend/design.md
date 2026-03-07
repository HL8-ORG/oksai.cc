# {功能名称} 设计

## 概述

{用 2-3 句话说明该功能做什么，用户如何使用它}

## 问题陈述

{该功能要解决什么问题？为什么要做？}

## 用户故事

### 主用户故事

```gherkin
作为 {用户类型}
我想要 {执行的动作}
以便于 {获得的收益}
```

### 验收标准（INVEST 原则）

| 原则            | 说明   | 检查点                  |
| :-------------- | :----- | :---------------------- |
| **I**ndependent | 独立性 | ✅ 故事之间没有依赖关系 |
| **N**egotiable  | 可协商 | ✅ 细节可以讨论         |
| **V**aluable    | 有价值 | ✅ 对用户有明确价值     |
| **E**stimable   | 可估算 | ✅ 能够估算工作量       |
| **S**mall       | 足够小 | ✅ 一个迭代内能完成     |
| **T**estable    | 可测试 | ✅ 有明确的验收标准     |

### 相关用户故事

- 作为{用户类型}，我希望{动作}，以便{收益}
- 作为{用户类型}，我希望{动作}，以便{收益}

## 用户流程设计

### 用户旅程地图

```
用户进入 → 查看信息 → 执行操作 → 获得反馈 → 完成目标
   ↓          ↓          ↓          ↓          ↓
 {页面1}    {页面2}    {页面3}    {页面4}    {页面5}
```

### 关键用户流程

#### 流程 1：{流程名称}

1. 用户从 {入口} 进入
2. 在 {页面} 执行 {动作}
3. 系统 {响应}
4. 用户看到 {结果}
5. 用户可以 {后续操作}

#### 流程 2：{流程名称}

{描述另一个关键流程}

## UI/UX 设计

### Wireframe / 设计稿

**页面布局**：

```
┌─────────────────────────────────────┐
│  Header / Navigation                │
├─────────────────────────────────────┤
│                                     │
│  Main Content Area                  │
│                                     │
│  - Component 1                      │
│  - Component 2                      │
│  - Component 3                      │
│                                     │
├─────────────────────────────────────┤
│  Footer / Actions                   │
└─────────────────────────────────────┘
```

**组件结构**：

```
Page
├── Header
│   ├── Title
│   └── Actions
├── Content
│   ├── FilterBar (可选)
│   ├── DataList
│   │   ├── ListItem × N
│   │   └── Pagination
│   └── EmptyState (无数据时)
└── Footer
    └── PrimaryAction
```

### 交互设计

| 交互元素    | 触发方式    | 反馈效果    | 说明       |
| :---------- | :---------- | :---------- | :--------- |
| {按钮/链接} | {点击/悬停} | {动画/提示} | {交互说明} |
| {表单字段}  | {输入/聚焦} | {验证提示}  | {交互说明} |

### 响应式设计

| 断点                    | 布局变化           | 特殊处理           |
| :---------------------- | :----------------- | :----------------- |
| Mobile (< 640px)        | 单列布局、折叠导航 | 简化显示、触摸优化 |
| Tablet (640px - 1024px) | 双列布局           | 侧边栏收缩         |
| Desktop (> 1024px)      | 多列布局、完整功能 | 全部功能可见       |

### 视觉设计规范

**配色方案**：

- 主色：`{颜色值}` - {用途}
- 辅助色：`{颜色值}` - {用途}
- 警告色：`{颜色值}` - {用途}

**间距规范**：

- 组件间距：`{值}`
- 内边距：`{值}`
- 外边距：`{值}`

**字体规范**：

- 标题：`{字体}` `{字号}` `{字重}`
- 正文：`{字体}` `{字号}` `{字重}`

## 技术设计

### 路由设计

| 路由路径      | 页面组件                | 访问权限           | 说明       |
| :------------ | :---------------------- | :----------------- | :--------- |
| `/{path}`     | `{Page}Component`       | {公开/登录/管理员} | {页面说明} |
| `/{path}/:id` | `{Page}DetailComponent` | {权限}             | {页面说明} |

**路由配置示例**：

```typescript
// routes/{feature}.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/{feature}')({
  component: {Feature}Page,
  beforeLoad: ({ context }) => {
    // 权限检查
  },
});
```

### 组件设计

#### 页面组件（Page Components）

**{PageName}Page**：

- **职责**：{页面职责}
- **路径**：`src/routes/{path}.tsx`
- **状态**：{本地/全局状态}
- **数据获取**：{API 调用 / 路由 loader}

#### 业务组件（Business Components）

**{ComponentName}**：

- **职责**：{组件职责}
- **Props**：
  ```typescript
  interface {ComponentName}Props {
    // 必需属性
    required: string;
    // 可选属性
    optional?: number;
    // 回调函数
    onAction?: (data: DataType) => void;
  }
  ```
- **状态**：{内部状态}
- **依赖**：{依赖的其他组件或 hooks}

#### 通用组件（Shared Components）

{列出需要使用的通用组件，如：Button、Input、Table 等}

### 状态管理

**全局状态（TanStack Query / Zustand）**：

```typescript
// 使用 TanStack Query 管理服务器状态
const { data, isLoading, error } = useQuery({
  queryKey: ['{resource}'],
  queryFn: fetch{Resource},
});

// 使用 Zustand 管理客户端状态（如需要）
const use{Feature}Store = create<{Feature}State>((set) => ({
  // 状态
  // 操作
}));
```

**本地状态（useState）**：

| 组件        | 状态        | 类型   | 用途       |
| :---------- | :---------- | :----- | :--------- |
| {Component} | {stateName} | {Type} | {用途说明} |

### API 集成

使用 TanStack Query 进行 API 集成。完整示例参考 `examples/api-hooks.md`。

关键模式：

- **查询（useQuery）**：数据获取，自动缓存
- **变更（useMutation）**：数据修改，缓存失效
- **预加载（prefetchQuery）**：提升用户体验
- **乐观更新**：立即更新 UI，失败时回滚

决策点：

- 缓存策略：staleTime、refetchOnWindowFocus
- 错误处理：统一 toast 提示
- 缓存失效：精确的 queryKey 失效

### 表单处理

使用 React Hook Form + Zod 进行表单验证。完整示例参考 `examples/form.md`。

关键模式：

- **Schema 定义**：Zod schema 定义验证规则
- **类型推导**：使用 `z.infer` 自动推导类型
- **表单集成**：`useForm` + `zodResolver`
- **错误处理**：统一的错误样式和显示

决策点：

- 验证时机：onBlur vs onChange
- 数组字段：useFieldArray
- 受控组件：Controller 包装

### 错误处理

**错误边界（Error Boundary）**：

```typescript
// components/ErrorBoundary.tsx
<ErrorBoundary
  fallback={<ErrorFallback />}
  onError={(error) => logError(error)}
>
  <{Feature}Page />
</ErrorBoundary>
```

**全局错误处理**：

- API 错误：使用 toast 提示用户
- 网络错误：显示重试按钮
- 权限错误：重定向到登录页

### 加载状态

| 场景         | 加载组件             | 说明           |
| :----------- | :------------------- | :------------- |
| 页面初始加载 | `<PageLoader />`     | 全屏加载动画   |
| 列表加载     | `<SkeletonList />`   | 骨架屏         |
| 按钮操作     | `<Button loading />` | 按钮内加载图标 |

### 性能优化

**代码分割**：

```typescript
// 路由级别懒加载
const {Feature}Page = lazy(() => import('./routes/{feature}'));
```

**列表虚拟化**（如果需要）：

```typescript
// 大列表使用虚拟滚动
import { VirtualList } from '@tanstack/virtual-core';
```

**图片优化**：

- 使用 Next.js Image 组件（如果适用）
- 懒加载非关键图片
- 使用 WebP 格式

## BDD 场景设计

### 正常流程（Happy Path）

```gherkin
Scenario: {场景名称}
  Given 用户在 {页面}
  And {前置条件}
  When 用户执行 {动作}
  Then 应该看到 {结果}
  And 可以执行 {后续操作}
```

### 异常流程（Error Cases）

```gherkin
Scenario: {场景名称} - 验证失败
  Given 用户在 {页面}
  When 用户输入 {无效数据}
  And 提交表单
  Then 应该看到 {错误提示}
  And 表单不应提交
```

### 边界条件（Edge Cases）

```gherkin
Scenario: {场景名称} - 边界条件
  Given {边界条件}
  When 用户执行 {动作}
  Then 应该看到 {期望结果}
```

## 可访问性设计（A11y）

### WCAG 2.1 AA 标准

- [ ] **可感知**：所有非文本内容有替代文本
- [ ] **可操作**：所有功能可通过键盘访问
- [ ] **可理解**：内容可读、可预测
- [ ] **健壮性**：兼容辅助技术

### 键盘导航

| 快捷键   | 功能           | 说明         |
| :------- | :------------- | :----------- |
| `Tab`    | 聚焦下一个元素 | 遵循视觉顺序 |
| `Enter`  | 激活按钮/链接  | 提交表单     |
| `Escape` | 关闭弹窗       | 取消操作     |

### ARIA 标签

```typescript
<button
  aria-label="{操作描述}"
  aria-busy={isLoading}
  aria-disabled={isDisabled}
>
  {按钮文本}
</button>
```

### 颜色对比度

- 文本对比度：至少 4.5:1（AA 级）
- 大文本对比度：至少 3:1
- 使用工具：[WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

## 边界情况

{需要处理的重要边界情况}

- **无数据**：显示 Empty State，提供引导操作
- **加载失败**：显示错误信息，提供重试按钮
- **网络断开**：显示离线提示，缓存数据
- **权限不足**：显示权限说明，提供申请入口
- **长列表**：分页或虚拟滚动，避免性能问题
- **大文件上传**：显示进度条，支持断点续传

## 范围外

{该功能明确不包含的内容}

- {不在范围内 1}
- {不在范围内 2}

## 测试策略

### 组件测试（60%）

**测试工具**：Vitest + Testing Library

**测试重点**：

- 组件渲染正确性
- 用户交互行为
- Props 变化响应
- 状态管理

**测试示例**：

```typescript
// {Component}.test.tsx
describe('{Component}', () => {
  it('should render correctly', () => {
    render(<{Component} {...defaultProps} />);
    expect(screen.getByText('{预期文本}')).toBeInTheDocument();
  });

  it('should handle user interaction', async () => {
    const onAction = vi.fn();
    render(<{Component} onAction={onAction} />);

    await userEvent.click(screen.getByRole('button'));
    expect(onAction).toHaveBeenCalledWith({ expected: 'data' });
  });
});
```

### E2E 测试（30%）

**测试工具**：Playwright

**测试场景**：

- 关键用户流程
- 多组件协作
- 真实浏览器环境

**测试示例**：

```typescript
// e2e/{feature}.spec.ts
test('should complete user flow', async ({ page }) => {
  await page.goto('/{feature}');
  await page.fill('[name="field"]', 'value');
  await page.click('button[type="submit"]');
  await expect(page.locator('.success-message')).toBeVisible();
});
```

### 视觉回归测试（10%）

**测试工具**：Playwright / Percy / Chromatic

**测试重点**：

- 关键页面截图对比
- 组件视觉一致性
- 响应式布局验证

### 测试覆盖率目标

- 组件覆盖率：>80%
- 关键流程 E2E：100%
- 总体覆盖率：>70%

---

## 风险评估

| 风险               | 影响 | 概率 | 缓解措施                      |
| :----------------- | :--: | :--: | :---------------------------- |
| 浏览器兼容性问题   |  高  |  中  | 使用 Polyfill，测试主流浏览器 |
| 性能问题（大列表） |  高  |  中  | 实现虚拟滚动，分页加载        |
| API 延迟/失败      |  中  |  高  | Loading 状态，错误重试机制    |
| 移动端适配问题     |  中  |  中  | 响应式设计，真机测试          |

### 回滚计划

{如果出现问题如何回滚}

---

## 依赖关系

### 内部依赖

- **组件库**：`@{org}/ui-components` - 基础 UI 组件
- **工具库**：`@{org}/utils` - 通用工具函数
- **Hook 库**：`@{org}/hooks` - 共享 Hooks

### 外部依赖

- **API**：`{API 名称}` - {用途}
- **第三方服务**：{服务名称} - {用途}

### 设计依赖

- **设计系统**：{设计系统名称/链接}
- **图标库**：{图标库名称}
- **字体**：{字体名称}

## 实现计划

### Phase 1: 静态页面与路由（1-2 天）

- [ ] 创建路由配置
- [ ] 实现页面基础布局
- [ ] 创建静态 UI 组件
- [ ] 配置导航菜单

### Phase 2: 组件开发（3-4 天）

- [ ] 实现核心业务组件
- [ ] 集成 UI 组件库
- [ ] 实现表单与验证
- [ ] 编写组件测试

### Phase 3: API 集成（2-3 天）

- [ ] 实现 API hooks
- [ ] 集成 TanStack Query
- [ ] 处理加载与错误状态
- [ ] 实现乐观更新（如需要）

### Phase 4: 交互与优化（2-3 天）

- [ ] 实现交互细节（动画、过渡）
- [ ] 响应式适配
- [ ] 性能优化
- [ ] 可访问性优化

### Phase 5: 测试与文档（1-2 天）

- [ ] 编写 E2E 测试
- [ ] 视觉回归测试
- [ ] 生成使用文档
- [ ] 添加代码注释

## 参考资料

- [前端开发工作流程](./workflow.md)
- [组件测试指南](./testing.md)
- [设计系统文档](../../docs/design-system/README.md)
- {其他参考文档}
