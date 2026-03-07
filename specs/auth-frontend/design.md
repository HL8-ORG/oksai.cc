# 认证前端对齐 设计

## 概述

对齐后端已实现的 Better Auth 认证功能到前端 Web 应用（web-admin），提供完整的用户认证体验，包括邮箱密码登录/注册、OAuth 登录、邮箱验证、密码重置、2FA 设置等功能。

## 问题陈述

后端已经基于 Better Auth 实现了完整的认证系统（见 `specs/authentication/`），但前端 Web 应用的认证功能尚未完全对齐：

1. **前端路由已存在但不完整**：登录、注册等页面文件已创建，但实现不完整
2. **Better Auth 客户端未集成**：缺少 Better Auth React 客户端配置
3. **认证状态管理缺失**：没有统一的会话管理和状态同步
4. **用户体验不连贯**：认证流程的用户体验需要优化
5. **缺少完整的错误处理**：前端对认证错误（如会话过期、网络错误）的处理不完善

## 用户故事

### 主用户故事

```gherkin
作为 Web 应用用户
我想要通过前端界面安全便捷地登录和注册账号
以便于访问应用的所有功能
```

### 验收标准（INVEST 原则）

| 原则            | 说明   | 检查点                                   |
| :-------------- | :----- | :--------------------------------------- |
| **I**ndependent | 独立性 | ✅ 前端认证功能独立于其他功能模块        |
| **N**egotiable  | 可协商 | ✅ UI/UX 设计可以根据用户反馈调整        |
| **V**aluable    | 有价值 | ✅ 提供完整的认证体验，确保安全性        |
| **E**stimable   | 可估算 | ✅ 基于已有后端 API，前端工作量可估算    |
| **S**mall       | 足够小 | ✅ 分 4 个 Phase 实现，每个 Phase 1-2 周 |
| **T**estable    | 可测试 | ✅ 有明确的验收场景和 E2E 测试           |

### 相关用户故事

- 作为新用户，我希望通过邮箱快速注册账号，以便开始使用应用
- 作为注册用户，我希望使用邮箱密码或 OAuth 登录，以便灵活选择登录方式
- 作为注册用户，我希望收到邮箱验证邮件并完成验证，以便激活账号
- 作为忘记密码的用户，我希望通过邮箱重置密码，以便重新获得访问权限
- 作为安全意识强的用户，我希望设置 2FA，以便提升账号安全性
- 作为用户，我希望在会话过期时自动跳转到登录页，以便重新认证

## 用户流程设计

### 用户旅程地图

```
新用户注册 → 邮箱验证 → 设置资料 → 开始使用
    ↓            ↓          ↓          ↓
 注册页面    验证页面    个人设置    仪表盘

已有用户登录 → 验证 2FA（如启用） → 访问应用
     ↓              ↓                 ↓
  登录页面      2FA 验证页面       仪表盘
```

### 关键用户流程

#### 流程 1：邮箱密码注册

1. 用户访问注册页面（`/register`）
2. 输入邮箱、密码、姓名
3. 点击"注册"按钮
4. 系统发送验证邮件
5. 用户看到"请验证邮箱"提示
6. 用户点击邮件中的验证链接
7. 跳转到验证成功页面
8. 自动登录并跳转到仪表盘

#### 流程 2：邮箱密码登录

1. 用户访问登录页面（`/login`）
2. 输入邮箱和密码
3. 点击"登录"按钮
4. 如已启用 2FA，跳转到 2FA 验证页面
5. 输入 2FA 验证码（或备用码）
6. 登录成功，跳转到仪表盘

#### 流程 3：OAuth 登录

1. 用户在登录页点击"使用 Google 登录"
2. 跳转到 Google OAuth 授权页面
3. 用户授权后，回调到 `/auth/callback/google`
4. 系统创建或关联账号
5. 自动登录并跳转到仪表盘

#### 流程 4：密码重置

1. 用户在登录页点击"忘记密码"
2. 跳转到忘记密码页面（`/forgot-password`）
3. 输入邮箱地址
4. 点击"发送重置邮件"按钮
5. 用户收到邮件，点击重置链接
6. 跳转到重置密码页面（`/reset-password`）
7. 输入新密码
8. 密码重置成功，跳转到登录页

#### 流程 5：2FA 设置

1. 用户登录后，进入个人设置或 2FA 设置页（`/2fa-setup`）
2. 点击"启用 2FA"
3. 显示 TOTP 二维码和备用码
4. 用户使用验证器 App 扫描二维码
5. 输入验证器显示的 6 位验证码
6. 2FA 设置成功
7. 保存备用码（建议下载或打印）

## UI/UX 设计

### 页面布局

**登录/注册页面布局**：

```
┌─────────────────────────────────────────────────┐
│  Logo + 应用名称                                │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌─────────────────────────────────┐           │
│  │  登录/注册表单                  │           │
│  │  - 标题                         │           │
│  │  - 邮箱输入框                   │           │
│  │  - 密码输入框                   │           │
│  │  - 记住我 / 忘记密码            │           │
│  │  - 登录按钮                     │           │
│  │  - 分隔线                       │           │
│  │  - OAuth 按钮（Google、GitHub） │           │
│  │  - 切换到注册/登录链接          │           │
│  └─────────────────────────────────┘           │
│                                                 │
└─────────────────────────────────────────────────┘
```

**2FA 设置页面布局**：

```
┌─────────────────────────────────────────────────┐
│  页面标题：启用两步验证                         │
├─────────────────────────────────────────────────┤
│                                                 │
│  步骤 1：扫描二维码                             │
│  ┌──────────────────────┐                      │
│  │  [QR Code Image]     │                      │
│  │  或手动输入密钥      │                      │
│  └──────────────────────┘                      │
│                                                 │
│  步骤 2：输入验证码                             │
│  [______] (6 位数字)                           │
│                                                 │
│  步骤 3：保存备用码                             │
│  ┌──────────────────────────────┐              │
│  │ 备用码 1: xxxx-xxxx          │              │
│  │ 备用码 2: xxxx-xxxx          │              │
│  │ ...                          │              │
│  └──────────────────────────────┘              │
│  [下载备用码]  [我已保存备用码]                │
│                                                 │
└─────────────────────────────────────────────────┘
```

### 组件结构

```
认证页面组件
├── LoginPage
│   ├── AuthLayout (通用布局)
│   ├── LoginForm (登录表单)
│   │   ├── EmailInput
│   │   ├── PasswordInput
│   │   ├── RememberMeCheckbox
│   │   └── SubmitButton
│   ├── OAuthButtons (OAuth 登录按钮)
│   │   ├── GoogleButton
│   │   └── GitHubButton
│   └── AuthFooter (底部链接)
│       ├── ForgotPasswordLink
│       └── RegisterLink
│
├── RegisterPage
│   ├── AuthLayout
│   ├── RegisterForm
│   │   ├── NameInput
│   │   ├── EmailInput
│   │   ├── PasswordInput
│   │   ├── ConfirmPasswordInput
│   │   └── SubmitButton
│   ├── OAuthButtons
│   └── AuthFooter
│       └── LoginLink
│
├── TwoFactorSetupPage
│   ├── PageHeader
│   ├── QRCodeDisplay
│   ├── ManualKeyDisplay
│   ├── VerificationCodeInput
│   ├── BackupCodesDisplay
│   └── ActionButtons
│
├── ForgotPasswordPage
│   ├── AuthLayout
│   ├── ForgotPasswordForm
│   │   ├── EmailInput
│   │   └── SubmitButton
│   └── BackToLoginLink
│
└── ResetPasswordPage
    ├── AuthLayout
    ├── ResetPasswordForm
    │   ├── NewPasswordInput
    │   ├── ConfirmPasswordInput
    │   └── SubmitButton
    └── BackToLoginLink
```

### 交互设计

| 交互元素       | 触发方式  | 反馈效果                    | 说明                     |
| :------------- | :-------- | :-------------------------- | :----------------------- |
| 登录按钮       | 点击      | 显示加载动画，禁用按钮      | 防止重复提交             |
| OAuth 按钮     | 点击      | 跳转到 OAuth Provider       | 新窗口或当前窗口         |
| 密码显示/隐藏  | 点击图标  | 切换密码明文/密文           | 眼睛图标切换             |
| 表单验证失败   | 提交时    | 字段下方显示红色错误提示    | 实时验证                 |
| 网络错误       | 请求失败  | Toast 提示 + 重试按钮       | 全局错误处理             |
| 会话过期       | 请求 401  | 自动跳转登录页 + Toast 提示 | 保存当前路径，登录后返回 |
| 2FA 验证码输入 | 输入 6 位 | 自动提交验证                | 提升用户体验             |

### 响应式设计

| 断点                    | 布局变化           | 特殊处理                  |
| :---------------------- | :----------------- | :------------------------ |
| Mobile (< 640px)        | 单列布局，全宽表单 | 简化 OAuth 按钮显示       |
| Tablet (640px - 1024px) | 居中卡片布局       | 保持标准间距              |
| Desktop (> 1024px)      | 居中卡片布局       | 可选：左侧插图 + 右侧表单 |

### 视觉设计规范

**配色方案**（遵循项目设计系统）：

- 主色：`blue-600` - 主要操作按钮
- 辅助色：`gray-500` - 次要操作
- 成功色：`green-500` - 成功提示
- 错误色：`red-500` - 错误提示
- 警告色：`yellow-500` - 警告提示

**间距规范**：

- 表单字段间距：`space-y-4` (1rem)
- 卡片内边距：`p-6` 或 `p-8`
- 按钮间距：`space-x-4` 或 `space-y-2`

**字体规范**：

- 标题：`text-2xl font-bold`
- 正文：`text-base`
- 小字：`text-sm text-muted-foreground`

## 技术设计

### 路由设计

| 路由路径                | 页面组件             | 访问权限 | 说明              |
| :---------------------- | :------------------- | :------- | :---------------- |
| `/login`                | `LoginPage`          | 公开     | 登录页面          |
| `/register`             | `RegisterPage`       | 公开     | 注册页面          |
| `/verify-email`         | `VerifyEmailPage`    | 公开     | 邮箱验证页面      |
| `/forgot-password`      | `ForgotPasswordPage` | 公开     | 忘记密码页面      |
| `/reset-password`       | `ResetPasswordPage`  | 公开     | 重置密码页面      |
| `/2fa-setup`            | `TwoFactorSetupPage` | 需登录   | 2FA 设置页面      |
| `/auth/callback/google` | `OAuthCallbackPage`  | 公开     | Google OAuth 回调 |
| `/auth/callback/github` | `OAuthCallbackPage`  | 公开     | GitHub OAuth 回调 |

**路由配置示例**：

```typescript
// routes/login.tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/login')({
  component: LoginPage,
  beforeLoad: ({ context }) => {
    // 如果已登录，跳转到首页
    if (context.session) {
      throw redirect({ to: '/dashboard' });
    }
  },
});
```

### 组件设计

#### 页面组件（Page Components）

**LoginPage**：

- **职责**：处理用户登录，支持邮箱密码和 OAuth
- **路径**：`src/routes/login.tsx`
- **状态**：使用 TanStack Query 管理登录状态
- **数据获取**：调用 Better Auth API

#### 业务组件（Business Components）

**LoginForm**：

- **职责**：邮箱密码登录表单
- **Props**：
  ```typescript
  interface LoginFormProps {
    onSuccess?: (session: Session) => void;
    redirectTo?: string;
  }
  ```
- **状态**：表单状态、加载状态、错误状态
- **依赖**：`react-hook-form`, `zod`, `useSignIn` hook

**OAuthButtons**：

- **职责**：OAuth 登录按钮组
- **Props**：
  ```typescript
  interface OAuthButtonsProps {
    providers: ('google' | 'github')[];
    redirectTo?: string;
  }
  ```
- **状态**：无状态
- **依赖**：Better Auth OAuth API

**TwoFactorSetup**：

- **职责**：2FA 设置流程
- **Props**：
  ```typescript
  interface TwoFactorSetupProps {
    onComplete?: () => void;
  }
  ```
- **状态**：步骤状态、验证码输入、备用码
- **依赖**：`useTwoFactor` hook, QR Code 库

#### 通用组件（Shared Components）

- `Button` - 通用按钮组件
- `Input` - 输入框组件
- `Label` - 表单标签组件
- `Card` - 卡片容器组件
- `Alert` - 提示信息组件
- `Toast` - Toast 通知组件

### 状态管理

**全局状态（TanStack Query + Zustand）**：

```typescript
// 使用 Better Auth React hooks 管理会话
const { data: session, isPending, error } = useSession();

// 使用 Zustand 管理认证 UI 状态（如需要）
const useAuthUIStore = create<AuthUIState>((set) => ({
  showLoginModal: false,
  redirectAfterLogin: null,
  setShowLoginModal: (show) => set({ showLoginModal: show }),
  setRedirectAfterLogin: (path) => set({ redirectAfterLogin: path }),
}));
```

**本地状态（useState）**：

| 组件           | 状态           | 类型     | 用途              |
| :------------- | :------------- | :------- | :---------------- |
| LoginForm      | `showPassword` | boolean  | 切换密码显示/隐藏 |
| TwoFactorSetup | `currentStep`  | number   | 当前设置步骤      |
| TwoFactorSetup | `backupCodes`  | string[] | 生成的备用码      |

### API 集成

使用 Better Auth React 客户端 + TanStack Query 进行 API 集成。

**Better Auth 客户端配置**：

```typescript
// lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

export const { useSession, signIn, signOut, signUp } = authClient;
```

**API Hooks 示例**：

```typescript
// hooks/useAuth.ts
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { signIn, signUp, signOut } from '@/lib/auth-client';
import { toast } from 'sonner';

export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: signIn.email,
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ['session'] });
      toast.success('登录成功');
    },
    onError: (error) => {
      toast.error(error.message || '登录失败，请重试');
    },
  });
}

export function useSignUp() {
  return useMutation({
    mutationFn: signUp.email,
    onSuccess: () => {
      toast.success('注册成功，请查收验证邮件');
    },
    onError: (error) => {
      toast.error(error.message || '注册失败，请重试');
    },
  });
}
```

### 表单处理

使用 React Hook Form + Zod 进行表单验证。

**登录表单 Schema**：

```typescript
import { z } from 'zod';

const loginSchema = z.object({
  email: z.string().email('邮箱格式不正确'),
  password: z.string().min(8, '密码至少 8 位'),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;
```

**注册表单 Schema**：

```typescript
const registerSchema = z
  .object({
    name: z.string().min(2, '姓名至少 2 个字符'),
    email: z.string().email('邮箱格式不正确'),
    password: z
      .string()
      .min(8, '密码至少 8 位')
      .regex(/[A-Z]/, '密码至少包含一个大写字母')
      .regex(/[a-z]/, '密码至少包含一个小写字母')
      .regex(/[0-9]/, '密码至少包含一个数字'),
    confirmPassword: z.string(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: '两次密码输入不一致',
    path: ['confirmPassword'],
  });

type RegisterFormData = z.infer<typeof registerSchema>;
```

### 错误处理

**全局错误处理**：

```typescript
// lib/api-error-handler.ts
import { toast } from 'sonner';

export function handleAuthError(error: any) {
  if (error.status === 401) {
    // 会话过期，跳转登录页
    toast.error('会话已过期，请重新登录');
    window.location.href = `/login?redirect=${window.location.pathname}`;
  } else if (error.status === 403) {
    toast.error('权限不足');
  } else if (error.status === 429) {
    toast.error('请求过于频繁，请稍后再试');
  } else {
    toast.error(error.message || '操作失败，请重试');
  }
}
```

**Error Boundary**：

```typescript
// components/ErrorBoundary.tsx
import { ErrorBoundary } from 'react-error-boundary';

function ErrorFallback({ error, resetErrorBoundary }) {
  return (
    <div className="flex flex-col items-center justify-center min-h-screen">
      <h2>出现错误</h2>
      <p>{error.message}</p>
      <button onClick={resetErrorBoundary}>重试</button>
    </div>
  );
}

export function AuthErrorBoundary({ children }) {
  return (
    <ErrorBoundary FallbackComponent={ErrorFallback}>
      {children}
    </ErrorBoundary>
  );
}
```

### 加载状态

| 场景         | 加载组件             | 说明           |
| :----------- | :------------------- | :------------- |
| 页面初始加载 | `<PageLoader />`     | 全屏加载动画   |
| 表单提交     | `<Button loading />` | 按钮内加载图标 |
| Session 检查 | `<SessionLoader />`  | 居中加载动画   |
| 骨架屏       | `<Skeleton />`       | 表单字段骨架屏 |

### 性能优化

**代码分割**：

```typescript
// 路由级别懒加载
const TwoFactorSetupPage = lazy(() => import('./routes/2fa-setup'));
```

**图片优化**：

- 使用 WebP 格式的 Logo 图片
- 懒加载非关键图片
- 使用合适的图片尺寸

**Bundle 优化**：

- 按需引入 Better Auth 客户端功能
- 使用 Tree Shaking 优化
- 分离 vendor chunk

## BDD 场景设计

### 正常流程（Happy Path）

```gherkin
Feature: 用户注册和登录

  Scenario: 用户通过邮箱密码注册
    Given 用户访问注册页面 "/register"
    When 用户输入邮箱 "test@example.com" 和密码 "SecurePass123"
    And 用户点击注册按钮
    Then 应该看到 "注册成功，请查收验证邮件" 提示
    And 系统发送验证邮件到 "test@example.com"

  Scenario: 用户通过邮箱密码登录
    Given 用户已注册且邮箱已验证
    And 用户访问登录页面 "/login"
    When 用户输入邮箱 "test@example.com" 和密码 "SecurePass123"
    And 用户点击登录按钮
    Then 应该重定向到仪表盘页面 "/dashboard"
    And 应该看到用户会话信息

  Scenario: 用户通过 Google OAuth 登录
    Given 用户访问登录页面 "/login"
    When 用户点击 "使用 Google 登录" 按钮
    Then 应该跳转到 Google OAuth 授权页面
    When 用户授权成功
    Then 应该回调到 "/auth/callback/google"
    And 应该重定向到仪表盘页面 "/dashboard"

  Scenario: 用户设置 2FA
    Given 用户已登录
    And 用户访问 2FA 设置页面 "/2fa-setup"
    When 用户扫描二维码并输入验证码
    Then 应该显示 "2FA 设置成功" 提示
    And 应该显示备用码列表
```

### 异常流程（Error Cases）

```gherkin
Feature: 认证失败处理

  Scenario: 登录失败 - 邮箱未验证
    Given 用户已注册但邮箱未验证
    When 用户尝试登录
    Then 应该看到 "请先验证邮箱" 错误提示
    And 应该提供 "重新发送验证邮件" 选项

  Scenario: 登录失败 - 密码错误
    Given 用户已注册且邮箱已验证
    When 用户输入错误密码
    Then 应该看到 "邮箱或密码错误" 提示

  Scenario: 注册失败 - 邮箱已存在
    Given 邮箱 "test@example.com" 已被注册
    When 用户尝试使用相同邮箱注册
    Then 应该看到 "邮箱已被注册" 错误提示

  Scenario: 2FA 验证失败 - 验证码错误
    Given 用户已启用 2FA
    And 用户输入正确的邮箱密码
    When 用户输入错误的 2FA 验证码
    Then 应该看到 "验证码错误" 提示
    And 应该提供 "使用备用码" 选项

  Scenario: 密码重置链接过期
    Given 用户请求密码重置
    And 密码重置链接已过期（超过 1 小时）
    When 用户点击重置链接
    Then 应该看到 "链接已过期，请重新申请" 提示
    And 应该提供 "重新发送" 按钮
```

### 边界条件（Edge Cases）

```gherkin
Feature: 认证边界条件处理

  Scenario: 会话过期
    Given 用户会话已过期（7 天后）
    When 用户访问需要认证的页面
    Then 应该重定向到登录页面
    And 应该显示 "会话已过期，请重新登录" 提示
    And 登录后应该跳转回原页面

  Scenario: 网络错误
    Given 用户提交登录表单
    When 网络请求失败
    Then 应该显示 "网络错误，请检查网络连接" 提示
    And 应该提供 "重试" 按钮

  Scenario: OAuth 账户关联
    Given 用户已通过邮箱注册
    And Google 账户使用相同邮箱
    When 用户使用 Google OAuth 登录
    Then 应该自动关联到现有账号
    And 应该保留原有用户数据

  Scenario: 并发登录控制
    Given 系统配置为不允许并发登录
    And 用户在设备 A 已登录
    When 用户在设备 B 再次登录
    Then 设备 A 的会话应该被撤销
    And 设备 B 登录成功
```

## 可访问性设计（A11y）

### WCAG 2.1 AA 标准

- [x] **可感知**：所有非文本内容有替代文本
- [x] **可操作**：所有功能可通过键盘访问
- [x] **可理解**：内容可读、可预测
- [x] **健壮性**：兼容辅助技术

### 键盘导航

| 快捷键   | 功能           | 说明         |
| :------- | :------------- | :----------- |
| `Tab`    | 聚焦下一个元素 | 遵循视觉顺序 |
| `Enter`  | 激活按钮/链接  | 提交表单     |
| `Escape` | 关闭弹窗       | 取消操作     |

### ARIA 标签

```typescript
<button
  aria-label="使用 Google 账号登录"
  aria-busy={isLoading}
  aria-disabled={isDisabled}
>
  <GoogleIcon />
  使用 Google 登录
</button>

<input
  type="email"
  aria-label="邮箱地址"
  aria-describedby="email-error"
  aria-invalid={!!errors.email}
/>
{errors.email && (
  <span id="email-error" role="alert">
    {errors.email.message}
  </span>
)}
```

### 颜色对比度

- 文本对比度：至少 4.5:1（AA 级）
- 大文本对比度：至少 3:1
- 使用工具：[WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

## 边界情况

需要处理的重要边界情况：

- **无数据**：显示 Empty State，提供引导操作
- **加载失败**：显示错误信息，提供重试按钮
- **网络断开**：显示离线提示，缓存数据
- **权限不足**：显示权限说明，提供申请入口
- **会话过期**：自动跳转登录页，保存当前路径
- **OAuth 失败**：显示失败原因，提供重试或返回登录页选项
- **2FA 验证码过期**：提示验证码已过期，允许重新输入
- **备用码用尽**：提示备用码已用完，引导用户重新生成

## 范围外

该功能明确不包含的内容：

- LDAP/Active Directory 集成（企业版特性）
- SAML SSO 集成（后端已实现，前端延后）
- WebAuthn/Passkeys（P3 优先级）
- 微信 OAuth（中国市场，P2 优先级）
- 手机号登录（未规划）
- 多步骤认证流程（P3 优先级）
- 用户管理后台（管理员功能，不在认证功能范围内）

## 测试策略

### 组件测试（60%）

**测试工具**：Vitest + Testing Library

**测试重点**：

- 登录表单验证和提交
- 注册表单验证和提交
- OAuth 按钮点击和跳转
- 2FA 设置流程
- 错误提示显示
- 加载状态显示

**测试示例**：

```typescript
// login-form.test.tsx
describe('LoginForm', () => {
  it('should render login form correctly', () => {
    render(<LoginForm />);

    expect(screen.getByLabelText(/邮箱/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/密码/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /登录/i })).toBeInTheDocument();
  });

  it('should show validation error for invalid email', async () => {
    render(<LoginForm />);

    await userEvent.type(screen.getByLabelText(/邮箱/i), 'invalid-email');
    await userEvent.click(screen.getByRole('button', { name: /登录/i }));

    expect(await screen.findByText(/邮箱格式不正确/i)).toBeInTheDocument();
  });

  it('should call onSuccess after successful login', async () => {
    const onSuccess = vi.fn();
    render(<LoginForm onSuccess={onSuccess} />);

    await userEvent.type(screen.getByLabelText(/邮箱/i), 'test@example.com');
    await userEvent.type(screen.getByLabelText(/密码/i), 'SecurePass123');
    await userEvent.click(screen.getByRole('button', { name: /登录/i }));

    await waitFor(() => {
      expect(onSuccess).toHaveBeenCalledWith(expect.objectContaining({
        user: expect.objectContaining({ email: 'test@example.com' }),
      }));
    });
  });
});
```

### E2E 测试（30%）

**测试工具**：Playwright

**测试场景**：

- 完整登录流程
- 完整注册流程
- OAuth 登录流程
- 密码重置流程
- 2FA 设置流程
- 会话过期处理

**测试示例**：

```typescript
// e2e/auth-login.spec.ts
test('should complete email login flow', async ({ page }) => {
  await page.goto('/login');

  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'SecurePass123');
  await page.click('button[type="submit"]');

  await expect(page).toHaveURL('/dashboard');
  await expect(page.locator('[data-testid="user-menu"]')).toBeVisible();
});

test('should show error for invalid credentials', async ({ page }) => {
  await page.goto('/login');

  await page.fill('[name="email"]', 'test@example.com');
  await page.fill('[name="password"]', 'wrong-password');
  await page.click('button[type="submit"]');

  await expect(page.locator('.error-message')).toContainText('邮箱或密码错误');
});
```

### 视觉回归测试（10%）

**测试工具**：Playwright / Percy / Chromatic

**测试重点**：

- 登录页面截图对比
- 注册页面截图对比
- 2FA 设置页面截图对比
- 响应式布局验证

### 测试覆盖率目标

- 组件覆盖率：>80%
- 关键流程 E2E：100%
- 总体覆盖率：>70%

---

## 风险评估

| 风险                     | 影响 | 概率 | 缓解措施                           |
| :----------------------- | :--: | :--: | :--------------------------------- |
| Better Auth 客户端兼容性 |  高  |  低  | 参考官方文档，测试主要场景         |
| 浏览器兼容性问题         |  中  |  中  | 使用 Polyfill，测试主流浏览器      |
| 性能问题（大型表单）     |  低  |  低  | 表单优化，使用 React Hook Form     |
| API 延迟/失败            |  中  |  高  | Loading 状态，错误重试机制         |
| 移动端适配问题           |  中  |  中  | 响应式设计，真机测试               |
| OAuth Provider 变更      |  中  |  低  | 监控 Provider 更新，保持代码灵活性 |

### 回滚计划

如果前端认证功能出现严重问题：

1. **功能开关**：使用 Feature Flag 快速禁用新功能
2. **版本回滚**：回滚到上一个稳定的前端版本
3. **降级方案**：使用基础的邮箱密码登录，禁用 OAuth 和 2FA
4. **用户通知**：通过 Toast 和系统通知告知用户

**回滚步骤**：

```bash
# 1. 禁用 Feature Flag
# 在配置中心关闭新认证功能

# 2. 回滚前端代码
git checkout tags/web-v1.0.0

# 3. 重新构建和部署
pnpm build
pnpm deploy

# 4. 验证功能
# 测试基础登录功能是否正常
```

---

## 依赖关系

### 内部依赖

- **@oksai/nestjs-better-auth**：后端认证 API（已实现）
- **@oksai/auth/config**：Better Auth 配置（已实现）
- **@oksai/database**：数据库 Schema（已实现）

### 外部依赖

- **better-auth/react**：Better Auth React 客户端
- **@tanstack/react-query**：数据获取和缓存
- **react-hook-form**：表单管理
- **zod**：Schema 验证
- **sonner**：Toast 通知

### 设计依赖

- **Tailwind CSS**：样式系统
- **Lucide Icons**：图标库
- **设计系统**：项目统一的 UI 组件库

## 实现计划

### Phase 1: Better Auth 客户端集成（1 周）

- [ ] 安装 Better Auth React 客户端
- [ ] 配置 auth-client
- [ ] 实现会话管理（useSession hook）
- [ ] 实现全局认证状态
- [ ] 配置 API 拦截器（错误处理、Token 刷新）
- [ ] 编写单元测试

**验收标准**：

- ✅ 可以获取当前用户会话
- ✅ 会话过期自动跳转登录页
- ✅ 错误统一处理

### Phase 2: 核心认证流程（2 周）

- [ ] 实现登录页面（LoginForm）
- [ ] 实现注册页面（RegisterForm）
- [ ] 实现邮箱验证页面（VerifyEmailPage）
- [ ] 实现忘记密码页面（ForgotPasswordPage）
- [ ] 实现重置密码页面（ResetPasswordPage）
- [ ] 集成 TanStack Query（useSignIn, useSignUp hooks）
- [ ] 编写组件测试
- [ ] 编写 E2E 测试

**验收标准**：

- ✅ 可以通过邮箱密码注册和登录
- ✅ 邮箱验证流程完整
- ✅ 密码重置流程完整
- ✅ 表单验证正确
- ✅ 错误提示友好

### Phase 3: OAuth 登录集成（1 周）

- [ ] 实现 OAuth 登录按钮（Google、GitHub）
- [ ] 实现 OAuth 回调页面（OAuthCallbackPage）
- [ ] 处理 OAuth 账户关联逻辑
- [ ] 优化 OAuth 用户体验（加载状态、错误处理）
- [ ] 编写组件测试
- [ ] 编写 E2E 测试

**验收标准**：

- ✅ 可以通过 Google OAuth 登录
- ✅ 可以通过 GitHub OAuth 登录
- ✅ OAuth 账户自动关联
- ✅ OAuth 失败有明确提示

### Phase 4: 2FA 功能和优化（1 周）

- [ ] 实现 2FA 设置页面（TwoFactorSetupPage）
- [ ] 实现 2FA 验证流程（登录时）
- [ ] 实现备用码显示和下载
- [ ] 性能优化（代码分割、懒加载）
- [ ] 响应式适配
- [ ] 可访问性优化
- [ ] 编写组件测试
- [ ] 编写 E2E 测试
- [ ] 生成文档和截图

**验收标准**：

- ✅ 可以设置 2FA
- ✅ 可以使用 2FA 验证登录
- ✅ 可以查看和使用备用码
- ✅ 移动端体验良好
- ✅ 可访问性达标（WCAG AA）
- ✅ 性能指标达标

## 参考资料

- [Better Auth 官方文档](https://www.better-auth.com)
- [Better Auth React 客户端](https://www.better-auth.com/docs/client/react)
- [TanStack Query 文档](https://tanstack.com/query/latest)
- [React Hook Form 文档](https://react-hook-form.com)
- [Zod 文档](https://zod.dev)
- [前端开发工作流程](./workflow.md)
- [后端认证实现](../authentication/design.md)
- [NestJS Better Auth 集成](../nestjs-better-auth/design.md)
