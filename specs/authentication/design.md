# 认证系统设计

## 概述

基于 Better Auth 实现完整的认证系统，对齐 Cal.com 的认证功能，支持多种认证方式、双因素认证、SAML SSO、API Key 认证等企业级特性。

## 问题陈述

企业级应用需要完整的用户认证系统，包括：
- 多种认证方式（邮箱密码、OAuth、Magic Link）满足不同用户习惯
- 双因素认证（2FA）提升安全性
- API Key 认证支持第三方集成
- SAML SSO 满足企业客户需求

## 用户故事

### 主用户故事

```gherkin
作为应用用户
我想要使用邮箱密码、OAuth 或 Magic Link 登录系统
以便于安全便捷地访问应用功能
```

### 验收标准（INVEST 原则）

| 原则 | 说明 | 检查点 |
|:---|:---|:---|
| **I**ndependent | 独立性 | ✅ 各种认证方式独立实现，互不依赖 |
| **N**egotiable | 可协商 | ✅ 认证方式和优先级可以根据需求调整 |
| **V**aluable | 有价值 | ✅ 满足用户安全登录的基本需求 |
| **E**stimable | 可估算 | ✅ 基于成熟框架（Better Auth），工作量可估算 |
| **S**mall | 足够小 | ✅ 分 4 个 Phase 实现，每个 Phase 1-3 周 |
| **T**estable | 可测试 | ✅ 有明确的验收标准和测试用例 |

### 相关用户故事

- 作为新用户，我希望通过邮箱注册账号，以便开始使用应用
- 作为注册用户，我希望使用 Google/GitHub OAuth 登录，以便快速登录
- 作为安全意识强的用户，我希望启用 2FA，以便保护账户安全
- 作为开发者，我希望使用 API Key 访问 API，以便集成到我的应用中
- 作为企业用户，我希望使用 SAML SSO 登录，以便与企业身份系统集成
- 作为忘记密码的用户，我希望重置密码，以便重新获得访问权限

## BDD 场景设计

### 正常流程（Happy Path）

```gherkin
Feature: 用户注册和登录

  Scenario: 用户通过邮箱密码注册
    Given 用户访问注册页面
    When 用户输入邮箱 "test@example.com" 和密码 "SecurePass123"
    And 用户点击注册按钮
    Then 系统创建用户账号
    And 系统发送邮箱验证邮件
    And 用户看到"请验证邮箱"提示

  Scenario: 用户通过邮箱密码登录
    Given 用户已注册且邮箱已验证
    When 用户输入邮箱 "test@example.com" 和密码 "SecurePass123"
    And 用户点击登录按钮
    Then 系统验证凭据成功
    And 用户获得 Session Token
    And 用户重定向到首页

  Scenario: 用户通过 Google OAuth 登录
    Given 用户访问登录页面
    When 用户点击"使用 Google 登录"按钮
    And 用户在 Google 页面授权
    Then 系统创建或关联用户账号
    And 用户获得 Session Token
    And 用户重定向到首页

  Scenario: 用户通过 Magic Link 登录
    Given 用户访问登录页面
    When 用户输入邮箱 "test@example.com"
    And 用户点击"发送 Magic Link"按钮
    Then 系统发送包含 Magic Link 的邮件
    When 用户点击邮件中的 Magic Link
    Then 系统验证 Token 成功
    And 用户获得 Session Token
    And 用户重定向到首页
```

### 异常流程（Error Cases）

```gherkin
Feature: 认证失败处理

  Scenario: 邮箱密码登录失败 - 邮箱未验证
    Given 用户已注册但邮箱未验证
    When 用户尝试登录
    Then 系统拒绝登录
    And 用户看到"请先验证邮箱"错误提示
    And 系统提供"重新发送验证邮件"选项

  Scenario: 邮箱密码登录失败 - 密码错误
    Given 用户已注册且邮箱已验证
    When 用户输入错误密码
    Then 系统拒绝登录
    And 用户看到"邮箱或密码错误"提示

  Scenario: 注册失败 - 邮箱已存在
    Given 邮箱 "test@example.com" 已被注册
    When 用户尝试使用相同邮箱注册
    Then 系统拒绝注册
    And 用户看到"邮箱已被注册"错误提示

  Scenario: 2FA 验证失败 - 验证码错误
    Given 用户已启用 2FA
    And 用户输入正确的邮箱密码
    When 用户输入错误的 2FA 验证码
    Then 系统拒绝登录
    And 用户看到"验证码错误"提示

  Scenario: API Key 认证失败 - Key 已过期
    Given API Key 已过期
    When 客户端使用该 API Key 访问 API
    Then 系统返回 401 Unauthorized
    And 响应包含"API Key 已过期"错误信息
```

### 边界条件（Edge Cases）

```gherkin
Feature: 认证边界条件处理

  Scenario: 密码重置链接过期
    Given 用户请求密码重置
    And 密码重置链接已过期（超过 1 小时）
    When 用户点击重置链接
    Then 系统提示"链接已过期，请重新申请"
    And 系统提供"重新发送"选项

  Scenario: OAuth 账户关联
    Given 用户已通过邮箱注册
    And Google 账户使用相同邮箱
    When 用户使用 Google OAuth 登录
    Then 系统自动关联到现有账号
    And 用户保留原有数据

  Scenario: 并发登录控制
    Given 系统配置为不允许并发登录
    And 用户在设备 A 已登录
    When 用户在设备 B 再次登录
    Then 设备 A 的 Session 被撤销
    And 设备 B 登录成功

  Scenario: Session 过期
    Given 用户 Session 已过期（7 天后）
    When 用户访问需要认证的页面
    Then 系统重定向到登录页面
    And 显示"会话已过期，请重新登录"提示
```

## 技术设计

### 领域层

**聚合根/实体**：
- **User**: 用户实体，包含基本信息、认证状态、角色等
- **Session**: 会话实体，包含 Token、过期时间、设备信息

**值对象**：
- **Email**: 邮箱值对象，验证格式
- **Password**: 密码值对象，加密存储
- **ApiKey**: API Key 值对象，包含前缀和哈希值

**领域事件**：
- **UserRegisteredEvent**: 用户注册成功事件
- **UserLoggedInEvent**: 用户登录成功事件
- **EmailVerifiedEvent**: 邮箱验证成功事件
- **TwoFactorEnabledEvent**: 2FA 启用事件
- **ApiKeyCreatedEvent**: API Key 创建事件

**业务规则**：
- 密码长度至少 8 位，最多 128 位
- Session 有效期 7 天，可配置
- API Key 格式为 `oks_<random_string>`
- 2FA 验证码 6 位，有效期 30 秒
- 邮箱验证链接有效期 1 小时

### 应用层

**Command**：
- **RegisterUserCommand**: 用户注册命令
- **SignInCommand**: 用户登录命令
- **SignOutCommand**: 用户登出命令
- **VerifyEmailCommand**: 邮箱验证命令
- **ResetPasswordCommand**: 密码重置命令
- **EnableTwoFactorCommand**: 启用 2FA 命令
- **CreateApiKeyCommand**: 创建 API Key 命令

**Query**：
- **GetCurrentUserQuery**: 获取当前用户查询
- **GetApiKeysQuery**: 获取 API Keys 查询
- **GetSessionsQuery**: 获取会话列表查询

**Handler**：
- **AuthCommandHandler**: 处理认证相关命令，调用 Better Auth API
- **UserQueryHandler**: 处理用户相关查询

### 基础设施层

**Repository**：
- **UserRepository**: 用户存储实现（Drizzle ORM）
- **SessionRepository**: 会话存储实现（Drizzle ORM）
- **ApiKeyRepository**: API Key 存储实现（Drizzle ORM）

**Adapter**：
- **BetterAuthAdapter**: Better Auth 适配器
- **EmailServiceAdapter**: 邮件服务适配器（Nodemailer）
- **OAuthProviderAdapter**: OAuth Provider 适配器（Google、GitHub）

### 数据库变更

Better Auth 核心表 + 自定义扩展：

```sql
-- 用户表
CREATE TABLE "user" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  email TEXT NOT NULL UNIQUE,
  email_verified BOOLEAN NOT NULL DEFAULT FALSE,
  name TEXT,
  image TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  
  -- 自定义扩展字段
  username TEXT UNIQUE,
  locale TEXT DEFAULT 'zh-CN',
  timezone TEXT DEFAULT 'Asia/Shanghai',
  role TEXT DEFAULT 'user' NOT NULL,
  locked BOOLEAN DEFAULT FALSE
);

-- 账户表 (OAuth / Credentials)
CREATE TABLE "account" (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id),
  account_id TEXT NOT NULL,
  provider_id TEXT NOT NULL,
  access_token TEXT,
  refresh_token TEXT,
  expires_at TIMESTAMP,
  scope TEXT,
  id_token TEXT,
  session_state TEXT,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- Session 表
CREATE TABLE "session" (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id),
  expires_at TIMESTAMP NOT NULL,
  token TEXT NOT NULL UNIQUE,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW(),
  ip_address TEXT,
  user_agent TEXT
);

-- 验证 Token (Magic Link, Email Verification)
CREATE TABLE "verification" (
  id TEXT PRIMARY KEY,
  identifier TEXT NOT NULL,
  value TEXT NOT NULL,
  expires_at TIMESTAMP NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- TOTP 配置 (2FA)
CREATE TABLE "two_factor_credential" (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id),
  secret TEXT NOT NULL,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- 备用码 (2FA)
CREATE TABLE "backup_code" (
  id TEXT PRIMARY KEY,
  user_id TEXT NOT NULL REFERENCES "user"(id),
  code TEXT NOT NULL,
  used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW()
);

-- API Key
CREATE TABLE "api_key" (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id TEXT NOT NULL REFERENCES "user"(id),
  team_id TEXT,
  name TEXT,
  hashed_key TEXT NOT NULL UNIQUE,
  prefix TEXT NOT NULL,
  expires_at TIMESTAMP,
  last_used_at TIMESTAMP,
  created_at TIMESTAMP NOT NULL DEFAULT NOW(),
  revoked_at TIMESTAMP
);

-- 索引
CREATE INDEX idx_user_email ON "user"(email);
CREATE INDEX idx_session_token ON "session"(token);
CREATE INDEX idx_api_key_prefix ON "api_key"(prefix);
CREATE INDEX idx_api_key_hashed_key ON "api_key"(hashed_key);
```

### API 变更

**新增接口**：

认证相关：
- `POST /api/auth/sign-up/email`: 邮箱注册
- `POST /api/auth/sign-in/email`: 邮箱密码登录
- `POST /api/auth/sign-out`: 登出
- `GET /api/auth/session`: 获取当前会话
- `POST /api/auth/verify-email`: 验证邮箱
- `POST /api/auth/forgot-password`: 忘记密码
- `POST /api/auth/reset-password`: 重置密码
- `POST /api/auth/sign-in/magic-link`: Magic Link 登录
- `GET /api/auth/callback/google`: Google OAuth 回调
- `GET /api/auth/callback/github`: GitHub OAuth 回调
- `GET /api/auth/oauth/providers`: 获取可用 OAuth Provider

2FA 相关：
- `POST /api/auth/2fa/enable`: 启用 2FA
- `POST /api/auth/2fa/disable`: 禁用 2FA
- `POST /api/auth/2fa/verify`: 验证 2FA 代码

API Key 相关：
- `GET /api/api-keys`: 获取 API Keys
- `POST /api/api-keys`: 创建 API Key
- `DELETE /api/api-keys/:id`: 撤销 API Key

**请求/响应结构**：

```typescript
// 注册请求
interface SignUpRequest {
  email: string;
  password: string;
  name?: string;
}

// 登录请求
interface SignInRequest {
  email: string;
  password: string;
  rememberMe?: boolean;
}

// Session 响应
interface SessionResponse {
  user: {
    id: string;
    email: string;
    name: string | null;
    image: string | null;
    emailVerified: boolean;
    role: string;
  };
  session: {
    id: string;
    expiresAt: string;
  };
}

// API Key 创建请求
interface CreateApiKeyRequest {
  name?: string;
  expiresAt?: string;
}

// API Key 响应
interface ApiKeyResponse {
  id: string;
  name: string | null;
  prefix: string;
  createdAt: string;
  expiresAt: string | null;
  lastUsedAt: string | null;
  // 仅创建时返回完整 key
  key?: string;
}
```

### UI 变更

**新增页面/组件**：
- **LoginPage**: 登录页面（邮箱密码、OAuth、Magic Link）
- **RegisterPage**: 注册页面
- **VerifyEmailPage**: 邮箱验证页面
- **ForgotPasswordPage**: 忘记密码页面
- **ResetPasswordPage**: 重置密码页面
- **TwoFactorSettingsPage**: 2FA 设置页面
- **ApiKeyManagementPage**: API Key 管理页面

**用户流程**：
1. 用户进入登录页面，选择认证方式
2. 邮箱密码：输入凭据 -> 验证 -> 登录成功
3. OAuth：点击按钮 -> 跳转授权 -> 回调 -> 登录成功
4. Magic Link：输入邮箱 -> 收到邮件 -> 点击链接 -> 登录成功
5. 2FA 用户：输入邮箱密码 -> 输入 2FA 验证码 -> 登录成功

## 边界情况

需要处理的重要边界情况：

- **邮箱未验证登录**: 拒绝登录，提供重新发送验证邮件选项
- **OAuth 账户关联**: 相同邮箱自动关联到现有账号
- **密码重置链接过期**: 提示过期，提供重新申请选项
- **2FA 验证码错误**: 提示错误，允许使用备用码
- **API Key 过期**: 返回 401 Unauthorized
- **Session 过期**: 重定向到登录页面
- **并发登录**: 可配置允许/禁止（默认允许）

## 范围外

该功能明确不包含的内容：

- LDAP/Active Directory 集成（企业版特性）
- SCIM 用户供应（企业版特性）
- WebAuthn/Passkeys（P3 优先级）
- 微信 OAuth（中国市场，P2 优先级）
- 多步骤认证流程（P3 优先级）

## 测试策略

### 单元测试（70%）

**领域层测试**：
- Email 值对象验证
- Password 值对象加密验证
- ApiKey 值对象生成验证
- User 实体创建和验证

**应用层测试**：
- RegisterUserCommand 处理
- SignInCommand 处理
- VerifyEmailCommand 处理
- CreateApiKeyCommand 处理

### 集成测试（20%）

- 完整登录流程测试
- OAuth 登录流程测试
- Magic Link 流程测试
- 2FA 启用/验证流程测试
- API Key 创建/使用/撤销测试
- Repository 实现测试

### E2E 测试（10%）

- 用户注册到登录完整流程
- 2FA 启用到验证流程
- API Key 使用流程
- 密码重置流程

### 测试覆盖率目标

- 领域层：>90%
- 应用层：>85%
- 总体：>80%

详见 [测试计划](./testing.md)

---

## 风险评估

| 风险 | 影响 | 概率 | 缓解措施 |
|:---|:---:|:---:|:---|
| Better Auth 框架不成熟 | 高 | 中 | 参考成熟实现（Cal.com）、保持框架可替换性 |
| 安全漏洞（密码泄露、Session 劫持） | 高 | 低 | 使用标准加密算法、定期安全审计、遵循 OWASP 最佳实践 |
| OAuth Provider 变更 API | 中 | 低 | 抽象 OAuth 适配层、监控 Provider 更新 |
| 性能瓶颈（Session 查询、数据库压力） | 中 | 中 | 使用 JWT Session、添加缓存层、数据库索引优化 |
| 用户数据迁移问题 | 高 | 低 | 完整迁移测试、保留回滚方案 |
| 第三方依赖升级导致兼容性问题 | 中 | 中 | 锁定依赖版本、定期更新测试 |

### 回滚计划

如果认证系统出现严重问题：

1. **立即回滚**：使用数据库快照恢复到上一个稳定版本
2. **降级方案**：保留旧的认证系统作为备份
3. **用户通知**：通过邮件和系统通知告知用户
4. **数据恢复**：从备份中恢复用户数据和 Session
5. **问题排查**：记录错误日志，分析根本原因

**回滚步骤：**
```bash
# 1. 停止服务
pnpm stop

# 2. 恢复数据库
pg_restore -d oksai_db backup_20260302.dump

# 3. 切换到旧版本代码
git checkout tags/v1.0.0

# 4. 重启服务
pnpm start:prod
```

---

## 依赖关系

### 内部依赖

- **@oksai/nestjs-better-auth**: Better Auth 的 NestJS 集成
- **@oksai/database**: Drizzle ORM 数据库访问层
- **@oksai/email**: 邮件发送服务

### 外部依赖

- **Better Auth**: 认证框架（核心依赖）
- **Drizzle ORM**: 数据库 ORM
- **Passport.js**: API Key 认证策略
- **Nodemailer**: 邮件发送
- **BoxyHQ Jackson**: SAML SSO（Phase 2）

## 实现计划

### Phase 1: 核心认证（P0） - 2 周

- [x] Better Auth 核心配置
- [x] 数据库 Schema 创建
- [x] 邮件服务集成
- [x] 邮箱密码注册/登录
- [x] 邮箱验证
- [x] 密码重置
- [x] Magic Link 登录
- [x] Google/GitHub OAuth 登录
- [x] 前端登录/注册页面
- [x] 集成测试（18 个测试用例）

**状态：** ✅ 已完成（2026-03-02）

### Phase 2: 高级特性（P1） - 2-3 周

- [ ] 2FA/TOTP 认证（Better Auth Two-Factor Plugin）
- [ ] 备用码生成和使用
- [ ] API Key 认证（Passport Strategy + NestJS Guard）
- [ ] 自定义 Session 超时
- [ ] 组织/团队管理（Better Auth Organization Plugin）

### Phase 3: 企业级功能（P2） - 2-3 周

- [ ] SAML SSO 集成（@boxyhq/saml-jackson）
- [ ] 组织角色管理
- [ ] Session 缓存优化（LRU Cache）
- [ ] 并发登录控制
- [ ] 用户模拟功能

### Phase 4: Platform OAuth（P3） - 3-4 周

- [ ] OAuth 2.0 授权服务器
- [ ] Access Token / Refresh Token
- [ ] Platform OAuth Clients
- [ ] Webhook 支持

## 参考资料

- [开发工作流程](../_templates/workflow.md)
- [Better Auth 官方文档](https://www.better-auth.com)
- [Cal.com 认证实现](/home/arligle/forks/cal.com/packages/features/auth/)
- [BoxyHQ SAML Jackson](https://github.com/boxyhq/jackson)
- [NestJS Passport](https://docs.nestjs.com/security/authentication)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)
