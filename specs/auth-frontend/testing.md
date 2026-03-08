# 认证前端测试策略

## 测试目标

为认证前端功能编写完整的测试覆盖，确保：

- ✅ 核心认证流程稳定可靠
- ✅ 用户体验符合预期
- ✅ 错误处理正确
- ✅ 代码重构时快速发现问题

## 测试策略

遵循前端测试金字塔：**组件测试 60% | E2E 测试 30% | 视觉测试 10%**

---

## Phase 1: 组件测试（60%）

### 测试工具

- **测试框架**：Vitest + Testing Library
- **断言库**：Vitest（内置 expect）
- **Mock 工具**：vi.fn() / vi.mock()
- **用户交互**：@testing-library/user-event
- **可访问性**：jest-axe

### 1.1 Hooks 测试

| Hook           | 测试文件                | 优先级 | 状态 |
| :------------- | :---------------------- | :----: | :--- |
| useSignIn      | `hooks/useAuth.spec.ts` |   高   | ⏳   |
| useSignUp      | `hooks/useAuth.spec.ts` |   高   | ⏳   |
| useSignOut     | `hooks/useAuth.spec.ts` |   高   | ⏳   |
| useAuthSession | `hooks/useAuth.spec.ts` |   高   | ⏳   |

**测试用例**：

```typescript
describe('useSignIn', () => {
  it('should sign in successfully with valid credentials', async () => {});
  it('should show error for invalid credentials', async () => {});
  it('should invalidate session cache on success', async () => {});
  it('should show toast on success', async () => {});
  it('should show toast on error', async () => {});
  it('should handle 2FA redirect', async () => {});
});
```

### 1.2 表单组件测试

| 组件               | 测试文件                          | 优先级 | 状态 |
| :----------------- | :-------------------------------- | :----: | :--- |
| LoginPage          | `routes/login.spec.tsx`           |   高   | ⏳   |
| RegisterPage       | `routes/register.spec.tsx`        |   高   | ⏳   |
| ForgotPasswordPage | `routes/forgot-password.spec.tsx` |   中   | ⏳   |
| ResetPasswordPage  | `routes/reset-password.spec.tsx`  |   中   | ⏳   |
| TwoFactorSetup     | `routes/2fa-setup.spec.tsx`       |   中   | ⏳   |
| TwoFactorVerify    | `routes/2fa-verify.spec.tsx`      |   中   | ⏳   |

**测试用例**：

```typescript
describe('LoginPage', () => {
  it('should render correctly', () => {});
  it('should validate email format', async () => {});
  it('should require password', async () => {});
  it('should submit with valid data', async () => {});
  it('should show error message', async () => {});
  it('should disable submit button when loading', async () => {});
  it('should navigate to dashboard on success', async () => {});
  it('should be accessible', async () => {});
});
```

### 1.3 认证状态测试

| 组件         | 测试文件                                 | 优先级 | 状态 |
| :----------- | :--------------------------------------- | :----: | :--- |
| AuthProvider | `components/auth/auth-provider.spec.tsx` |   高   | ⏳   |
| OAuthButtons | `components/auth/oauth-buttons.spec.tsx` |   中   | ⏳   |

---

## Phase 2: E2E 测试（30%）

### 测试工具

- **测试框架**：Playwright
- **浏览器**：Chromium
- **断言库**：Playwright（内置 expect）

### 2.1 登录流程测试

**测试文件**: `e2e/auth-login.spec.ts`

| 测试场景               | 状态 |
| :--------------------- | :--: |
| 邮箱密码登录成功       |  ⏳  |
| 登录失败（错误密码）   |  ⏳  |
| 登录失败（用户不存在） |  ⏳  |
| 登录失败（邮箱未验证） |  ⏳  |
| 2FA 登录流程           |  ⏳  |
| OAuth 登录流程         |  ⏳  |
| 记住我功能             |  ⏳  |

**测试示例**：

```typescript
test('should login with valid credentials', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');
  await expect(page).toHaveURL('/dashboard');
});

test('should login with 2FA', async ({ page }) => {
  await page.goto('/login');
  await page.fill('[name="email"]', '2fa@example.com');
  await page.fill('[name="password"]', 'password123');
  await page.click('button[type="submit"]');

  // 应该跳转到 2FA 验证页面
  await expect(page).toHaveURL('/2fa-verify');

  // 输入验证码
  await page.fill('[name="code"]', '123456');
  await page.click('button[type="submit"]');

  // 应该跳转到 dashboard
  await expect(page).toHaveURL('/dashboard');
});
```

### 2.2 注册流程测试

**测试文件**: `e2e/auth-register.spec.ts`

| 测试场景                     | 状态 |
| :--------------------------- | :--: |
| 注册成功（显示验证邮件提示） |  ⏳  |
| 注册失败（邮箱已存在）       |  ⏳  |
| 注册失败（密码强度不够）     |  ⏳  |
| 邮箱验证流程                 |  ⏳  |

### 2.3 密码重置测试

**测试文件**: `e2e/auth-password-reset.spec.ts`

| 测试场景         | 状态 |
| :--------------- | :--: |
| 发送重置邮件成功 |  ⏳  |
| 重置密码成功     |  ⏳  |
| 重置链接过期     |  ⏳  |

### 2.4 会话管理测试

**测试文件**: `e2e/auth-session.spec.ts`

| 测试场景       | 状态 |
| :------------- | :--: |
| 登出成功       |  ⏳  |
| 会话过期重定向 |  ⏳  |
| 访问受保护页面 |  ⏳  |

---

## Phase 3: 视觉回归测试（10%）

### 关键页面截图

| 页面                    | 状态 |
| :---------------------- | :--: |
| 登录页 - 默认状态       |  ⏳  |
| 登录页 - 错误状态       |  ⏳  |
| 注册页 - 默认状态       |  ⏳  |
| 2FA 设置页 - 扫码步骤   |  ⏳  |
| 2FA 设置页 - 备用码步骤 |  ⏳  |

---

## Mock 策略

### Better Auth Client Mock

```typescript
// src/test/mocks/auth-client.ts
export const mockAuthClient = {
  signIn: {
    email: vi.fn(),
    social: vi.fn(),
  },
  signUp: {
    email: vi.fn(),
  },
  signOut: vi.fn(),
  getSession: vi.fn(),
  useSession: vi.fn(() => ({
    data: { session: null, user: null },
    isPending: false,
  })),
  twoFactor: {
    enable: vi.fn(),
    verifyTotp: vi.fn(),
    verifyBackupCode: vi.fn(),
  },
};
```

### Router Mock

```typescript
vi.mock('@tanstack/react-router', () => ({
  useNavigate: () => vi.fn(),
  useSearch: () => vi.fn(() => ({})),
  createFileRoute: () => ({
    component: (component: any) => component,
  }),
}));
```

### Toast Mock

```typescript
vi.mock('sonner', () => ({
  toast: {
    success: vi.fn(),
    error: vi.fn(),
    info: vi.fn(),
  },
}));
```

---

## 测试环境配置

### Vitest 配置

```typescript
// apps/web-admin/vitest.config.ts
export default defineConfig({
  test: {
    environment: 'jsdom',
    setupFiles: ['./src/test/setup.ts'],
    globals: true,
    coverage: {
      provider: 'v8',
      reporter: ['text', 'html', 'json'],
    },
  },
});
```

### Playwright 配置

```typescript
// apps/web-admin/playwright.config.ts
export default defineConfig({
  testDir: './e2e',
  use: {
    baseURL: 'http://localhost:3001',
  },
  webServer: {
    command: 'pnpm dev:web',
    url: 'http://localhost:3001',
    reuseExistingServer: !process.env.CI,
  },
});
```

---

## 测试命令

```bash
# 组件测试
pnpm vitest                    # 运行所有组件测试
pnpm vitest watch              # 监听模式
pnpm vitest coverage           # 生成覆盖率报告

# E2E 测试
pnpm playwright test           # 运行所有 E2E 测试
pnpm playwright test --ui      # UI 模式
pnpm playwright test --debug   # 调试模式

# 特定测试
pnpm vitest useAuth.spec.ts    # 运行特定文件
pnpm playwright test auth-login.spec.ts
```

---

## 测试覆盖率目标

| 类型       |     目标      | 实际 | 状态 |
| :--------- | :-----------: | :--: | :--: |
| 组件测试   |     >80%      |  -%  |  ⏳  |
| E2E 测试   | 100% 关键流程 |  -%  |  ⏳  |
| 总体覆盖率 |     >70%      |  -%  |  ⏳  |

---

## 测试清单

### 组件测试清单

- [ ] useSignIn Hook
- [ ] useSignUp Hook
- [ ] useSignOut Hook
- [ ] useAuthSession Hook
- [ ] LoginPage 组件
- [ ] RegisterPage 组件
- [ ] ForgotPasswordPage 组件
- [ ] ResetPasswordPage 组件
- [ ] TwoFactorSetup 组件
- [ ] TwoFactorVerify 组件
- [ ] OAuthButtons 组件
- [ ] AuthProvider 组件

### E2E 测试清单

- [ ] 邮箱密码登录成功
- [ ] 登录失败（错误密码）
- [ ] 2FA 登录流程
- [ ] OAuth 登录流程
- [ ] 注册流程
- [ ] 邮箱验证流程
- [ ] 密码重置流程
- [ ] 登出流程
- [ ] 会话过期处理

---

**文档更新日期**: 2026-03-07
