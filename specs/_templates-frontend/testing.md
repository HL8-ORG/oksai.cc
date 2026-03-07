# {功能名称} 测试计划

## 测试策略

遵循前端测试金字塔：组件测试 60% | E2E 测试 30% | 视觉测试 10%

---

## 组件测试（60%）

### 测试工具

- **测试框架**：Vitest + Testing Library
- **断言库**：Vitest（内置 expect）
- **Mock 工具**：vi.fn() / vi.mock()
- **用户交互**：@testing-library/user-event
- **可访问性**：jest-axe

### 页面组件测试

| 页面    | 测试文件                 | 测试用例         | 状态 |
| :------ | :----------------------- | :--------------- | :--: |
| {Page1} | `routes/{page}.test.tsx` | 渲染、路由、权限 |  ⏳  |
| {Page2} | `routes/{page}.test.tsx` | 渲染、路由、权限 |  ⏳  |

### 业务组件测试

| 组件         | 测试文件                          | 测试用例          | 状态 |
| :----------- | :-------------------------------- | :---------------- | :--: |
| {Component1} | `components/{component}.test.tsx` | Props、状态、事件 |  ⏳  |
| {Component2} | `components/{component}.test.tsx` | Props、状态、事件 |  ⏳  |

### 测试模式

完整示例参考 `examples/component-test.md`，包含：

- ✅ 基础渲染测试（加载、错误、空状态）
- ✅ 用户交互测试（点击、输入、表单提交）
- ✅ 可访问性测试（jest-axe）
- ✅ Hook 集成测试
- ✅ Mock 最佳实践

关键模式：

```typescript
// 测试结构
describe('{Component}', () => {
  describe('Rendering', () => {
    /* 渲染测试 */
  });
  describe('User Interactions', () => {
    /* 交互测试 */
  });
  describe('Accessibility', () => {
    /* 可访问性测试 */
  });
});

// 测试命名
it('should {behavior} when {condition}', () => {
  /* ... */
});
```

### Mock 策略

| 依赖      | Mock 方式                           | 说明           |
| :-------- | :---------------------------------- | :------------- |
| API Hooks | `vi.mock('@/hooks/useResource')`    | Mock 数据返回  |
| Router    | `vi.mock('@tanstack/react-router')` | Mock 路由导航  |
| Context   | `<MockProvider>`                    | 提供测试上下文 |
| 外部库    | `vi.mock('library-name')`           | Mock 第三方库  |

**原则**：

- Mock 外部依赖，不 Mock 实现细节
- Mock 应该简单、可预测
- 使用 `beforeEach` 清理 Mock

#### 表单测试

```typescript
// {form}.test.tsx
describe('{Form}Component', () => {
  const mockSubmit = vi.fn();

  it('should submit form with valid data', async () => {
    const user = userEvent.setup();
    render(<{Form}Component onSubmit={mockSubmit} />);

    await user.type(screen.getByLabelText(/email/i), 'test@example.com');
    await user.type(screen.getByLabelText(/password/i), 'password123');
    await user.click(screen.getByRole('button', { name: /submit/i }));

    await waitFor(() => {
      expect(mockSubmit).toHaveBeenCalledWith({
        email: 'test@example.com',
        password: 'password123',
      });
    });
  });

  it('should show validation errors', async () => {
    const user = userEvent.setup();
    render(<{Form}Component onSubmit={mockSubmit} />);

    await user.click(screen.getByRole('button', { name: /submit/i }));

    expect(await screen.findByText(/email is required/i)).toBeInTheDocument();
    expect(mockSubmit).not.toHaveBeenCalled();
  });
});
```

### Mock 策略

| 依赖      | Mock 方式                           | 说明           |
| :-------- | :---------------------------------- | :------------- |
| API Hooks | `vi.mock('@/hooks/useResource')`    | Mock 数据返回  |
| Router    | `vi.mock('@tanstack/react-router')` | Mock 路由导航  |
| Context   | `<MockProvider>`                    | 提供测试上下文 |
| 外部库    | `vi.mock('library-name')`           | Mock 第三方库  |

#### Mock 示例

```typescript
// hooks/__mocks__/use{Resource}.ts
export const use{Resource} = vi.fn(() => ({
  data: mockData,
  isLoading: false,
  error: null,
}));

// 测试中使用
vi.mock('@/hooks/use{Resource}', () => ({
  use{Resource}: () => ({
    data: mockData,
    isLoading: false,
    error: null,
  }),
}));
```

---

## E2E 测试（30%）

### 测试工具

- **测试框架**：Playwright
- **浏览器**：Chromium / Firefox / WebKit
- **断言库**：Playwright（内置 expect）

### 关键用户流程测试

| 流程    | 测试文件                | 测试场景     | 状态 |
| :------ | :---------------------- | :----------- | :--: |
| {流程1} | `e2e/{feature}.spec.ts` | 完整用户流程 |  ⏳  |
| {流程2} | `e2e/{feature}.spec.ts` | 表单提交流程 |  ⏳  |

### E2E 测试模式

使用 Playwright 进行端到端测试。关键场景：

- ✅ 关键用户流程（登录、注册、核心操作）
- ✅ 多页面导航
- ✅ 表单提交和验证
- ✅ 错误处理

关键模式：

```typescript
// e2e/{feature}.spec.ts
test('should complete user flow', async ({ page }) => {
  // 等待页面加载
  await expect(page.locator('h1')).toContainText('{Feature}');

  // 执行用户操作
  await page.fill('[name="field"]', 'value');
  await page.click('button[type="submit"]');

  // 验证结果
  await expect(page.locator('.success')).toBeVisible();
});
```

### E2E 测试数据管理

```typescript
// e2e/fixtures/test-data.ts
export const testUsers = {
  admin: {
    email: 'admin@test.com',
    password: 'Admin123!',
  },
  user: {
    email: 'user@test.com',
    password: 'User123!',
  },
};

// e2e/helpers/auth.ts
export async function login(page, user) {
  await page.goto('/login');
  await page.fill('[name="email"]', user.email);
  await page.fill('[name="password"]', user.password);
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
}
```

---

## 视觉回归测试（10%）

### 测试工具

- **Playwright**：截图对比
- **Percy** / **Chromatic**：视觉差异检测（可选）

### 关键页面截图

| 页面               | 状态 | 截图对比 | 状态 |
| :----------------- | :--- | :------- | :--: |
| {Page1} - 默认状态 | ⏳   | ⏳       |  ⏳  |
| {Page1} - 加载状态 | ⏳   | ⏳       |  ⏳  |
| {Page1} - 错误状态 | ⏳   | ⏳       |  ⏳  |

### 视觉测试示例

```typescript
// e2e/{feature}.visual.spec.ts
import { test, expect } from '@playwright/test';

test.describe('{Feature} Visual Tests', () => {
  test('should match default state snapshot', async ({ page }) => {
    await page.goto('/{feature}');
    await expect(page).toHaveScreenshot('{feature}-default.png');
  });

  test('should match mobile layout snapshot', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 });
    await page.goto('/{feature}');
    await expect(page).toHaveScreenshot('{feature}-mobile.png');
  });

  test('should match dark theme snapshot', async ({ page }) => {
    await page.emulateMedia({ colorScheme: 'dark' });
    await page.goto('/{feature}');
    await expect(page).toHaveScreenshot('{feature}-dark.png');
  });
});
```

---

## 可访问性测试

### 测试工具

- **axe-core**：自动检测可访问性问题
- **jest-axe**：集成到组件测试
- **Playwright Accessibility**：E2E 可访问性测试

### 可访问性检查清单

- [ ] 所有图片有 alt 属性
- [ ] 表单字段有 label 关联
- [ ] 按钮有明确的文本或 aria-label
- [ ] 颜色对比度符合 WCAG AA 标准
- [ ] 键盘导航完整可用
- [ ] 焦点顺序合理
- [ ] 屏幕阅读器兼容

### 可访问性测试示例

```typescript
// {component}.test.tsx
import { axe } from 'jest-axe';

describe('{Component} Accessibility', () => {
  it('should have no accessibility violations', async () => {
    const { container } = render(<{Component} {...defaultProps} />);
    const results = await axe(container);
    expect(results).toHaveNoViolations();
  });
});
```

---

## 测试覆盖率目标

- [ ] 组件测试覆盖率 > 80%
- [ ] 关键用户流程 E2E 覆盖率 100%
- [ ] 总体覆盖率 > 70%

---

## 测试命令

```bash
# 运行组件测试
pnpm vitest run

# 运行特定组件测试
pnpm vitest run src/components/{component}.test.tsx

# 监听模式
pnpm vitest watch

# 运行覆盖率
pnpm vitest run --coverage

# 运行 E2E 测试
pnpm playwright test

# 运行特定 E2E 测试
pnpm playwright test e2e/{feature}.spec.ts

# 运行视觉回归测试
pnpm playwright test --grep "Visual"

# 更新快照
pnpm playwright test --update-snapshots

# 运行所有测试
pnpm test
```

---

## 测试最佳实践

### 1. 测试用户行为，而非实现细节

```typescript
// ✅ 推荐：测试用户行为
await user.click(screen.getByRole('button', { name: /submit/i }));
expect(screen.getByText('Success')).toBeInTheDocument();

// ❌ 避免：测试实现细节
expect(component.state.isSubmitted).toBe(true);
```

### 2. 使用 accessible queries

```typescript
// ✅ 推荐：使用角色和文本
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText(/email/i);
screen.getByText(/welcome/i);

// ❌ 避免：使用 testid 或 selector
screen.getByTestId('submit-button');
container.querySelector('.btn-primary');
```

### 3. Mock 外部依赖

```typescript
// Mock API hooks
vi.mock('@/hooks/useResource', () => ({
  useResource: () => ({
    data: mockData,
    isLoading: false,
  }),
}));

// Mock router
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: '123' }),
}));
```

### 4. 测试异步行为

```typescript
import { waitFor } from '@testing-library/react';

it('should load data', async () => {
  render(<{Component} />);

  await waitFor(() => {
    expect(screen.getByText('Loaded Data')).toBeInTheDocument();
  });
});
```

### 2. 使用 accessible queries

```typescript
// ✅ 推荐：使用角色和文本
screen.getByRole('button', { name: /submit/i });
screen.getByLabelText(/email/i);
screen.getByText(/welcome/i);

// ❌ 避免：使用 testid 或实现细节
screen.getByTestId('submit-button');
screen.getBySelector('.btn-primary');
```

### 3. Mock 外部依赖

```typescript
// Mock API hooks
vi.mock('@/hooks/useResource', () => ({
  useResource: () => ({
    data: mockData,
    isLoading: false,
  }),
}));

// Mock router
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useParams: () => ({ id: '123' }),
}));
```

### 4. 测试异步行为

```typescript
import { waitFor } from '@testing-library/react';

it('should load data', async () => {
  render(<{Component} />);

  // 等待数据加载
  await waitFor(() => {
    expect(screen.getByText('Loaded Data')).toBeInTheDocument();
  });
});
```

---

## 参考资料

- [Testing Library 文档](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright 文档](https://playwright.dev/)
- [Vitest 文档](https://vitest.dev/)
- [jest-axe 文档](https://github.com/nickcolley/jest-axe)
