# 认证系统常用提示词

## 同步实现状态

审查 `authentication` 已实现内容，并更新 `specs/authentication/implementation.md`。

**示例命令：**
```bash
/spec sync authentication
```

**检查要点：**
- 已完成的认证功能（邮箱密码、OAuth、Magic Link 等）
- 数据库 Schema 创建情况
- API 路由实现情况
- 前端页面完成情况
- 测试覆盖率

---

## 生成测试

为认证系统的 `{component}` 编写测试，遵循现有测试模式。

**示例：**
- 为 API Key Strategy 编写单元测试
- 为邮箱验证流程编写集成测试
- 为登录页面编写 E2E 测试

**测试模式：**
```bash
# 单元测试
pnpm vitest run libs/auth/src/**/*.spec.ts

# 集成测试
pnpm vitest run apps/gateway/src/**/*.integration.spec.ts

# E2E 测试
pnpm vitest run e2e/**/*.spec.ts
```

---

## 代码审查

从以下角度审查认证系统改动：

1. **类型安全**：所有 API 都有完整的 TypeScript 类型定义
2. **错误处理**：认证失败有明确的错误提示
3. **安全性**：密码、API Key 等敏感信息加密存储
4. **边界情况**：处理邮箱未验证、账户锁定、2FA 错误等场景

**审查清单：**
- [ ] 敏感信息是否加密存储
- [ ] 是否有输入验证
- [ ] 错误信息是否清晰
- [ ] 是否有足够的日志记录
- [ ] 是否有相应的测试

---

## 继续开发认证功能

继续处理 `authentication`。请先阅读 `specs/authentication/implementation.md` 了解当前状态。

**示例命令：**
```bash
/spec continue authentication
```

**常见任务：**
- 继续实现邮箱密码登录
- 继续实现 OAuth 登录
- 继续实现 2FA 功能
- 继续实现 API Key 认证

---

## 实现邮箱密码登录

实现邮箱密码注册和登录功能，参考 Cal.com 的实现：

**Cal.com 参考路径：**
- `/home/arligle/forks/cal.com/packages/features/auth/lib/next-auth-options.ts`
- `/home/arligle/forks/cal.com/packages/features/auth/lib/verifyPassword.ts`

**实现步骤：**
1. 配置 Better Auth Credentials Provider
2. 创建注册 API (`/api/auth/sign-up/email`)
3. 创建登录 API (`/api/auth/sign-in/email`)
4. 实现密码加密验证（bcryptjs）
5. 编写单元测试

---

## 实现 Magic Link 登录

实现 Magic Link 登录功能，参考 Cal.com 的实现：

**Cal.com 参考路径：**
- `/home/arligle/forks/cal.com/packages/features/auth/lib/sendVerificationRequest.ts`

**实现步骤：**
1. 配置 Better Auth Email Provider
2. 创建 Magic Link API (`/api/auth/sign-in/magic-link`)
3. 实现邮件发送逻辑（nodemailer）
4. 处理 Magic Link 回调
5. 编写集成测试

---

## 实现 Google OAuth 登录

实现 Google OAuth 登录功能，参考 Cal.com 的实现：

**Cal.com 参考路径：**
- `/home/arligle/forks/cal.com/packages/features/auth/lib/next-auth-options.ts` (Google Provider 部分)

**实现步骤：**
1. 配置 Google OAuth Provider（@better-auth/social-providers）
2. 创建 OAuth 回调 API (`/api/auth/callback/google`)
3. 处理 OAuth 流程
4. 实现 OAuth 账户关联（相同邮箱自动关联）
5. 编写集成测试

---

## 实现 2FA/TOTP 认证

实现双因素认证（2FA/TOTP）功能，参考 Cal.com 的实现：

**Cal.com 参考路径：**
- `/home/arligle/forks/cal.com/apps/web/app/api/auth/two-factor/totp/`

**实现步骤：**
1. 启用 Better Auth Two-Factor Plugin
2. 创建 2FA 设置 API (`/api/auth/2fa/enable`)
3. 创建 2FA 验证 API (`/api/auth/2fa/verify`)
4. 生成 QR Code（qrcode 库）
5. 实现备用码生成和使用
6. 编写单元测试和集成测试

---

## 实现 API Key 认证

实现 API Key 认证功能，参考 Cal.com 的实现：

**Cal.com 参考路径：**
- `/home/arligle/forks/cal.com/apps/api/v2/src/modules/auth/strategies/api-auth/`

**实现步骤：**
1. 创建 API Key Schema（api_keys 表）
2. 实现 API Key Strategy（passport-headerapikey）
3. 实现 API Key Guard（NestJS）
4. 创建 API Key 管理 API（创建、撤销、列表）
5. 编写单元测试和集成测试

---

## 对比 Cal.com 认证实现

对比 oksai.cc 和 Cal.com 的认证实现，找出差异和改进点：

**对比要点：**
1. 认证框架：Better Auth vs NextAuth.js
2. Session 管理：JWT vs Database
3. 2FA 实现：Better Auth Plugin vs 自定义实现
4. SAML SSO：BoxyHQ Jackson（两者一致）
5. API Key：Passport Strategy vs 自定义 Guard

**参考路径：**
- Cal.com: `/home/arligle/forks/cal.com/packages/features/auth/`
- oksai.cc: `specs/authentication/design.md`

---

## 生成带截图的文档

为 `authentication` 生成带截图的文档：

1. 启动应用（`pnpm dev`）
2. 打开浏览器到登录页面（http://localhost:3000/login）
3. 对关键 UI 状态截图：
   - 登录页面
   - 注册页面
   - 邮箱验证页面
   - 密码重置页面
   - 2FA 设置页面
   - API Key 管理页面
4. 将截图保存到 `specs/authentication/docs/screenshots/`
5. 创建/更新 `specs/authentication/docs/README.md`，包含：
   - 功能概览
   - 使用方式（带截图的分步说明）
   - 配置选项
   - 常见用例

---

## 提升文档为公开版本

将内部文档提升为公开的 Mintlify 文档：

1. 审阅 `specs/authentication/docs/README.md`
2. 复制/改写内容到 `docs/authentication.mdx`
3. 将截图移动到 `docs/images/authentication/`
4. 更新 `docs/mint.json` 导航
5. 确保文案适合客户阅读（不含内部细节）

---

## 安全审计

对认证系统进行安全审计：

**审计要点：**
1. 密码存储：是否使用 bcryptjs 加密
2. Session 安全：JWT 签名验证、HttpOnly Cookie
3. 2FA 安全：TOTP Secret 加密存储
4. API Key 安全：SHA256 hash、前缀识别
5. CORS 和 CSRF：严格的 CORS 配置
6. 输入验证：所有输入都有验证
7. 日志记录：不记录敏感信息

**参考：**
- [OWASP 认证最佳实践](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

## 性能优化

优化认证系统性能：

**优化要点：**
1. Session 缓存：使用 LRU Cache 缓存 Session
2. 数据库查询：优化查询，添加索引
3. API Key 查询：使用 prefix 快速定位
4. JWT 验证：缓存公钥验证结果
5. 并发登录控制：使用 Redis 存储 Session 状态

---

**文档版本：** 1.0.0  
**最后更新：** 2026年3月2日
