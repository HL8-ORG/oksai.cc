# 认证前端对齐 实现

## 状态

🔴 未开始

---

## UI 实现进度

### 页面组件

| 页面         | 路由               | 静态 UI | 交互 | API 集成 | 响应式 | 状态 |
| :----------- | :----------------- | :-----: | :--: | :------: | :----: | :--: |
| 登录页       | `/login`           |   ✅    |  ⏳  |    ⏳    |   ⏳   |  🟡  |
| 注册页       | `/register`        |   ✅    |  ⏳  |    ⏳    |   ⏳   |  🟡  |
| 邮箱验证页   | `/verify-email`    |   ✅    |  ⏳  |    ⏳    |   ⏳   |  🟡  |
| 忘记密码页   | `/forgot-password` |   ✅    |  ⏳  |    ⏳    |   ⏳   |  🟡  |
| 重置密码页   | `/reset-password`  |   ✅    |  ⏳  |    ⏳    |   ⏳   |  🟡  |
| 2FA 设置页   | `/2fa-setup`       |   ✅    |  ⏳  |    ⏳    |   ⏳   |  🟡  |
| OAuth 回调页 | `/auth/callback/*` |   ⏳    |  ⏳  |    ⏳    |   ⏳   |  ⏳  |

### 业务组件

| 组件              | 功能             | Props | 状态 | 样式 | 测试 | 状态 |
| :---------------- | :--------------- | :---: | :--: | :--: | :--: | :--: |
| LoginForm         | 登录表单         |  ⏳   |  ⏳  |  ⏳  |  ⏳  |  ⏳  |
| RegisterForm      | 注册表单         |  ⏳   |  ⏳  |  ⏳  |  ⏳  |  ⏳  |
| OAuthButtons      | OAuth 登录按钮组 |  ⏳   |  ⏳  |  ⏳  |  ⏳  |  ⏳  |
| TwoFactorSetup    | 2FA 设置组件     |  ⏳   |  ⏳  |  ⏳  |  ⏳  |  ⏳  |
| PasswordResetForm | 密码重置表单     |  ⏳   |  ⏳  |  ⏳  |  ⏳  |  ⏳  |

---

## API 集成进度

| API Hook           | 端点                            | 查询/变更 | 缓存 | 错误处理 | 加载状态 | 状态 |
| :----------------- | :------------------------------ | :-------: | :--: | :------: | :------: | :--: |
| `useSession`       | `GET /api/auth/session`         |   查询    |  ⏳  |    ⏳    |    ⏳    |  ⏳  |
| `useSignIn`        | `POST /api/auth/sign-in/email`  |   变更    |  -   |    ⏳    |    ⏳    |  ⏳  |
| `useSignUp`        | `POST /api/auth/sign-up/email`  |   变更    |  -   |    ⏳    |    ⏳    |  ⏳  |
| `useSignOut`       | `POST /api/auth/sign-out`       |   变更    |  -   |    ⏳    |    ⏳    |  ⏳  |
| `useOAuthSignIn`   | `GET /api/auth/oauth/*`         |   变更    |  -   |    ⏳    |    ⏳    |  ⏳  |
| `useVerifyEmail`   | `POST /api/auth/verify-email`   |   变更    |  -   |    ⏳    |    ⏳    |  ⏳  |
| `useResetPassword` | `POST /api/auth/reset-password` |   变更    |  -   |    ⏳    |    ⏳    |  ⏳  |
| `useTwoFactor`     | `POST /api/auth/2fa/*`          |   变更    |  -   |    ⏳    |    ⏳    |  ⏳  |

---

## BDD 场景进度

| 场景           | Feature 文件                | 状态 | E2E 测试 |
| :------------- | :-------------------------- | :--: | :------: |
| 邮箱密码登录   | `e2e/auth-login.spec.ts`    |  ⏳  |    ❌    |
| 邮箱密码注册   | `e2e/auth-register.spec.ts` |  ⏳  |    ❌    |
| OAuth 登录流程 | `e2e/auth-oauth.spec.ts`    |  ⏳  |    ❌    |
| 邮箱验证流程   | `e2e/auth-verify.spec.ts`   |  ⏳  |    ❌    |
| 密码重置流程   | `e2e/auth-reset.spec.ts`    |  ⏳  |    ❌    |
| 2FA 设置流程   | `e2e/auth-2fa.spec.ts`      |  ⏳  |    ❌    |
| 登录失败处理   | 同上各文件                  |  ⏳  |    ❌    |
| 会话过期处理   | `e2e/auth-session.spec.ts`  |  ⏳  |    ❌    |

---

## 组件测试进度

| 组件              | 测试文件                       | 渲染 | 交互 | Props | 状态 | 覆盖率 |
| :---------------- | :----------------------------- | :--: | :--: | :---: | :--: | :----: |
| LoginForm         | `login-form.test.tsx`          |  ⏳  |  ⏳  |  ⏳   |  ⏳  |   -%   |
| RegisterForm      | `register-form.test.tsx`       |  ⏳  |  ⏳  |  ⏳   |  ⏳  |   -%   |
| OAuthButtons      | `oauth-buttons.test.tsx`       |  ⏳  |  ⏳  |  ⏳   |  ⏳  |   -%   |
| TwoFactorSetup    | `two-factor-setup.test.tsx`    |  ⏳  |  ⏳  |  ⏳   |  ⏳  |   -%   |
| PasswordResetForm | `password-reset-form.test.tsx` |  ⏳  |  ⏳  |  ⏳   |  ⏳  |   -%   |

---

## 响应式适配进度

| 断点                | 布局 | 导航 | 字体 | 间距 | 测试 | 状态 |
| :------------------ | :--: | :--: | :--: | :--: | :--: | :--: |
| Mobile (< 640px)    |  ⏳  |  ⏳  |  ⏳  |  ⏳  |  ⏳  |  ⏳  |
| Tablet (640-1024px) |  ⏳  |  ⏳  |  ⏳  |  ⏳  |  ⏳  |  ⏳  |
| Desktop (> 1024px)  |  ⏳  |  ⏳  |  ⏳  |  ⏳  |  ⏳  |  ⏳  |

---

## 可访问性检查

- [ ] 键盘导航完整
- [ ] ARIA 标签正确
- [ ] 颜色对比度达标
- [ ] 屏幕阅读器兼容
- [ ] 焦点管理合理

---

## 测试覆盖率

| 类型       |     目标      | 实际 | 状态 |
| :--------- | :-----------: | :--: | :--: |
| 组件测试   |     >80%      |  -%  |  ⏳  |
| E2E 测试   | 100% 关键流程 |  -%  |  ⏳  |
| 总体覆盖率 |     >70%      |  -%  |  ⏳  |

---

## 性能指标

| 指标                     |  目标  | 实际 | 状态 |
| :----------------------- | :----: | :--: | :--: |
| First Contentful Paint   | < 1.5s |  -   |  ⏳  |
| Largest Contentful Paint | < 2.5s |  -   |  ⏳  |
| Time to Interactive      | < 3.0s |  -   |  ⏳  |
| Cumulative Layout Shift  | < 0.1  |  -   |  ⏳  |

---

## 已完成

- ✅ 创建 spec 目录结构
- ✅ 后端认证功能已完整实现（Better Auth）
- ✅ 前端路由文件已创建（login, register, 2fa-setup 等）

## 进行中

- 🟡 分析现有前端路由实现
- 🟡 确认 API 集成点

## 阻塞项

## 下一步

1. 完善设计文档（design.md）：定义完整的用户流程和技术设计
2. 分析现有前端实现：检查现有路由的实现程度
3. 集成 Better Auth 客户端：配置 auth-client
4. 实现核心认证流程：登录、注册、会话管理
5. 实现 OAuth 登录：Google、GitHub OAuth
6. 实现 2FA 功能：TOTP 设置和验证
7. 编写测试：组件测试 + E2E 测试

---

## 会话备注
