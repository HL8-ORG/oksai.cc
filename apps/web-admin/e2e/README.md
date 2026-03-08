# E2E 测试（Playwright）

本目录包含认证前端功能的端到端（E2E）测试。

## 测试文件

| 文件                    | 描述           | 测试场景                 |
| :---------------------- | :------------- | :----------------------- |
| `auth-login.spec.ts`    | 登录流程测试   | 邮箱密码登录、OAuth 登录 |
| `auth-register.spec.ts` | 注册流程测试   | 用户注册、邮箱验证       |
| `auth-2fa.spec.ts`      | 双因素认证测试 | 2FA 设置、2FA 验证       |

## 运行测试

### 首次运行

1. **安装 Playwright 浏览器**

```bash
pnpm exec playwright install
```

2. **启动开发服务器**（新终端）

```bash
pnpm dev
```

3. **运行 E2E 测试**

```bash
# 运行所有测试
pnpm test:e2e

# UI 模式（推荐）
pnpm test:e2e:ui

# 调试模式
pnpm test:e2e:debug

# 生成测试代码
pnpm test:e2e:codegen
```

### 测试命令

| 命令                    | 说明                  |
| :---------------------- | :-------------------- |
| `pnpm test:e2e`         | 运行所有 E2E 测试     |
| `pnpm test:e2e:ui`      | UI 模式（可视化调试） |
| `pnpm test:e2e:debug`   | 调试模式（逐步执行）  |
| `pnpm test:e2e:codegen` | 自动生成测试代码      |
| `pnpm test:e2e:report`  | 查看测试报告          |

### 运行特定测试

```bash
# 运行单个文件
pnpm exec playwright test auth-login.spec.ts

# 运行特定测试
pnpm exec playwright test -g "应该显示登录页面"

# 运行特定项目（浏览器）
pnpm exec playwright test --project=chromium
```

## 测试配置

配置文件：`../playwright.config.ts`

### 主要配置

- **测试目录**: `./e2e`
- **基础 URL**: `http://localhost:3001`
- **浏览器**: Chromium（默认）
- **重试次数**: CI 上 2 次，本地 0 次
- **并发**: CI 上 1 个 worker，本地不限制

### 添加新浏览器

编辑 `playwright.config.ts`:

```typescript
projects: [
  {
    name: "chromium",
    use: { ...devices["Desktop Chrome"] },
  },
  {
    name: "firefox",
    use: { ...devices["Desktop Firefox"] },
  },
  {
    name: "webkit",
    use: { ...devices["Desktop Safari"] },
  },
],
```

## 编写测试

### 基本结构

```typescript
import { test, expect } from '@playwright/test';

test.describe('功能名称', () => {
  test.beforeEach(async ({ page }) => {
    // 每个测试前的准备工作
    await page.goto('/login');
  });

  test('应该显示页面标题', async ({ page }) => {
    // 验证页面标题
    await expect(page.locator('h1')).toContainText('登录');
  });
});
```

### 最佳实践

1. **使用语义化选择器**

```typescript
// ✅ 好：使用角色和文本
await page.getByRole('button', { name: '登录' });
await page.getByLabel('邮箱地址');
await page.getByText('登录成功');

// ❌ 差：使用 CSS 选择器
await page.locator('.btn-primary');
await page.locator('#email-input');
```

2. **等待策略**

```typescript
// 等待元素出现
await expect(page.locator('text=成功')).toBeVisible();

// 等待导航完成
await page.waitForURL('**/dashboard');

// 等待请求完成
await page.waitForResponse('**/api/auth/login');
```

3. **使用 Page Object Model**

```typescript
// page-objects/LoginPage.ts
export class LoginPage {
  constructor(private page: Page) {}

  async login(email: string, password: string) {
    await this.page.fill('input[name="email"]', email);
    await this.page.fill('input[name="password"]', password);
    await this.page.click('button[type="submit"]');
  }
}
```

4. **处理认证状态**

```typescript
// 在测试前登录
test.beforeEach(async ({ page }) => {
  // 登录操作
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
});
```

## 调试技巧

### 1. 截图和视频

失败时自动保存（已配置）：

- 截图：`test-results/` 目录
- 视频：`test-results/` 目录

### 2. Trace Viewer

```bash
# 运行测试并生成 trace
pnpm exec playwright test --trace on

# 查看 trace
pnpm exec playwright show-trace trace.zip
```

### 3. 调试模式

```bash
# 逐步调试
pnpm test:e2e:debug

# 或在代码中设置断点
await page.pause();
```

### 4. UI 模式

```bash
# 可视化调试
pnpm test:e2e:ui
```

## CI/CD 集成

### GitHub Actions 示例

```yaml
name: E2E Tests

on: [push, pull_request]

jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v4
      - uses: pnpm/action-setup@v2
      - uses: actions/setup-node@v4
        with:
          node-version: '20'
          cache: 'pnpm'
      - run: pnpm install
      - run: pnpm exec playwright install --with-deps
      - run: pnpm test:e2e
      - uses: actions/upload-artifact@v4
        if: always()
        with:
          name: playwright-report
          path: playwright-report/
```

## 测试报告

### HTML 报告

测试完成后自动生成：

```bash
pnpm test:e2e:report
```

报告位置：`playwright-report/index.html`

### 测试结果

测试结果和截图保存在 `test-results/` 目录。

## 常见问题

### Q: 如何测试需要登录的功能？

**A:** 使用 `beforeEach` 钩子预先登录：

```typescript
test.beforeEach(async ({ page }) => {
  await page.goto('/login');
  await page.fill('input[name="email"]', 'test@example.com');
  await page.fill('input[name="password"]', 'password');
  await page.click('button[type="submit"]');
  await page.waitForURL('**/dashboard');
});
```

### Q: 如何测试 OAuth 登录？

**A:** 使用 `context.waitForEvent('page')` 监听新窗口：

```typescript
const [newPage] = await Promise.all([
  context.waitForEvent('page'),
  page.click('button:has-text("GitHub")'),
]);
expect(newPage.url()).toContain('github.com');
```

### Q: 如何模拟 API 响应？

**A:** 使用 `page.route()` 拦截请求：

```typescript
await page.route('**/api/auth/login', (route) => {
  route.fulfill({
    status: 200,
    contentType: 'application/json',
    body: JSON.stringify({ success: true }),
  });
});
```

### Q: 测试运行很慢怎么办？

**A:** 优化建议：

1. 使用 `--project=chromium` 只运行单个浏览器
2. 使用 `test.only` 只运行特定测试
3. 禁用视频录制（测试通过时）
4. 使用 `test.describe.parallel()` 并行运行

## 参考资料

- [Playwright 文档](https://playwright.dev/)
- [测试最佳实践](https://playwright.dev/docs/best-practices)
- [API 参考](https://playwright.dev/docs/api/class-page)
