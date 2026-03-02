# 认证系统技术规格

## 一、概述

基于 Better Auth 实现完整的认证系统，对齐 Cal.com 的认证功能，支持多种认证方式、双因素认证、SAML SSO、API Key 认证等企业级特性。

## 二、Cal.com 认证功能对标

### 2.1 核心认证方式

| 认证方式 | Cal.com | oksai.cc | 技术方案 | 优先级 |
|---------|---------|----------|----------|--------|
| 邮箱密码登录 | ✅ | 🎯 | Better Auth Credentials Provider | P0 |
| Magic Link | ✅ | 🎯 | Better Auth Email Provider | P0 |
| Google OAuth | ✅ | 🎯 | Better Auth OAuth Provider | P0 |
| SAML SSO | ✅ | 🎯 | 自定义 SAML 集成 + Better Auth | P2 |
| 用户模拟 | ✅ | 🎯 | 自定义 Provider | P3 |
| API Key | ✅ | 🎯 | 自定义 Strategy + NestJS Guard | P1 |

### 2.2 高级特性

| 功能特性 | Cal.com | oksai.cc | 技术方案 | 优先级 |
|---------|---------|----------|----------|--------|
| 双因素认证 (2FA/TOTP) | ✅ | 🎯 | Better Auth Two-Factor Plugin | P1 |
| 备用码 | ✅ | 🎯 | Better Auth Two-Factor Plugin | P1 |
| 密码重置 | ✅ | 🎯 | Better Auth 内置 | P0 |
| 邮箱验证 | ✅ | 🎯 | Better Auth 内置 | P0 |
| Session 管理 | ✅ JWT | 🎯 JWT | Better Auth JWT Strategy | P0 |
| Session 缓存 | ✅ LRU | 🎯 | 自定义缓存层 | P2 |
| 自定义 Session 超时 | ✅ | 🎯 | Better Auth Session Config | P1 |
| 并发登录控制 | ✅ | 🎯 | 自定义 Session Store | P2 |

### 2.3 用户管理

| 用户功能 | Cal.com | oksai.cc | 优先级 |
|---------|---------|----------|--------|
| 用户注册/登录 | ✅ | 🎯 | P0 |
| 用户资料管理 | ✅ | 🎯 | P0 |
| 头像上传 | ✅ | 🎯 | P1 |
| 用户名/昵称 | ✅ | 🎯 | P0 |
| 邮箱修改 | ✅ | 🎯 | P1 |
| 密码修改 | ✅ | 🎯 | P0 |
| 账户锁定 | ✅ | 🎯 | P2 |
| 用户角色系统 | ✅ | 🎯 | P0 |

### 2.4 企业级功能

| 企业功能 | Cal.com | oksai.cc | 技术方案 | 优先级 |
|---------|---------|----------|----------|--------|
| SAML SSO (BoxyHQ) | ✅ | 🎯 | @boxyhq/saml-jackson | P2 |
| 组织/团队管理 | ✅ | 🎯 | Better Auth Organization Plugin | P1 |
| 组织角色 | ✅ | 🎯 | 自定义角色系统 | P1 |
| OAuth 2.0 Platform | ✅ | 🎯 | 自定义 OAuth Server | P3 |
| 白标/自定义域名 | ✅ | 🎯 | 多租户架构 | P3 |

## 三、技术架构设计

### 3.1 整体架构

```
┌─────────────────────────────────────────────────────────────┐
│                     oksai.cc 认证架构                        │
├─────────────────────────────────────────────────────────────┤
│                                                             │
│  ┌────────────────────────────────────────────────────┐    │
│  │            Web 应用 (TanStack Start)               │    │
│  │  ┌─────────┐  ┌─────────┐  ┌─────────┐            │    │
│  │  │ 邮箱密码 │  │  Magic  │  │  OAuth  │            │    │
│  │  │  Login  │  │  Link   │  │ Google  │            │    │
│  │  └────┬────┘  └────┬────┘  └────┬────┘            │    │
│  │       └────────────┴─────────────┘                 │    │
│  │                      ▼                             │    │
│  │  ┌────────────────────────────────────────────┐   │    │
│  │  │           Better Auth Core                 │   │    │
│  │  │  - JWT Session Strategy                   │   │    │
│  │  │  - Drizzle Adapter                        │   │    │
│  │  │  - Email Provider (Magic Link)            │   │    │
│  │  │  - Credentials Provider                   │   │    │
│  │  │  - OAuth Provider (Google)                │   │    │
│  │  └────────────────────────────────────────────┘   │    │
│  │                      │                             │    │
│  │  ┌───────────────────┴───────────────────┐       │    │
│  │  │      Better Auth Plugins              │       │    │
│  │  │  - Two-Factor (TOTP + Backup Codes)   │       │    │
│  │  │  - Organization (Teams)                │       │    │
│  │  │  - Admin (Role Management)             │       │    │
│  │  └───────────────────────────────────────┘       │    │
│  └──────────────────────────────────────────────────┘    │
│                         │                                 │
│  ┌──────────────────────┴────────────────────────────┐   │
│  │           API Gateway (NestJS)                    │   │
│  │                                                   │   │
│  │  ┌────────────────────────────────────────────┐  │   │
│  │  │    nestjs-better-auth 集成模块            │  │   │
│  │  │  - AuthGuard (全局守卫)                  │  │   │
│  │  │  - Decorators (@Roles, @OrgRoles)        │  │   │
│  │  │  - Hooks (前置/后置钩子)                 │  │   │
│  │  │  - Session Injection (@Session)          │  │   │
│  │  └────────────────────────────────────────────┘  │   │
│  │                     │                             │   │
│  │  ┌──────────────────┴──────────────────┐        │   │
│  │  │      自定义认证策略                 │        │   │
│  │  │  - API Key Strategy                 │        │   │
│  │  │  - OAuth Client Credentials         │        │   │
│  │  │  - SAML Strategy                    │        │   │
│  │  └─────────────────────────────────────┘        │   │
│  └─────────────────────────────────────────────────┘   │
│                         │                                │
│  ┌──────────────────────┴────────────────────────────┐  │
│  │            SAML SSO (可选)                         │  │
│  │  - @boxyhq/saml-jackson                           │  │
│  │  - /api/auth/saml/authorize                       │  │
│  │  - /api/auth/saml/callback                        │  │
│  └───────────────────────────────────────────────────┘  │
│                         │                                │
│  ┌──────────────────────┴────────────────────────────┐  │
│  │          PostgreSQL (Drizzle ORM)                 │  │
│  │  ┌──────────┐ ┌──────────┐ ┌─────────────────┐   │  │
│  │  │   user   │ │ account  │ │  session        │   │  │
│  │  │ password │ │   token  │ │ verification    │   │  │
│  │  │  api_key │ │  totp    │ │ backup_code     │   │  │
│  │  └──────────┘ └──────────┘ └─────────────────┘   │  │
│  └───────────────────────────────────────────────────┘  │
│                                                          │
└──────────────────────────────────────────────────────────┘
```

### 3.2 数据库设计

#### 3.2.1 Better Auth 核心表

```typescript
// 用户表
export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  
  // 自定义字段
  username: text("username").unique(),
  locale: text("locale").default("zh-CN"),
  timezone: text("timezone").default("Asia/Shanghai"),
  role: text("role").default("user").notNull(), // user, admin
  locked: boolean("locked").default(false),
});

// 账户表 (OAuth / Credentials)
export const accounts = pgTable("account", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  accountId: text("account_id").notNull(),
  providerId: text("provider_id").notNull(), // credentials, google, email
  accessToken: text("access_token"),
  refreshToken: text("refresh_token"),
  expiresAt: timestamp("expires_at"),
  scope: text("scope"),
  idToken: text("id_token"),
  sessionState: text("session_state"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
});

// Session 表
export const sessions = pgTable("session", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  expiresAt: timestamp("expires_at").notNull(),
  token: text("token").notNull().unique(),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  ipAddress: text("ip_address"),
  userAgent: text("user_agent"),
});

// 验证 Token (Magic Link, Email Verification)
export const verifications = pgTable("verification", {
  id: text("id").primaryKey(),
  identifier: text("identifier").notNull(),
  value: text("value").notNull(),
  expiresAt: timestamp("expires_at").notNull(),
  createdAt: timestamp("created_at").$defaultFn(() => /* 10 minutes */),
  updatedAt: timestamp("updated_at").$defaultFn(() => /* 10 minutes */),
});
```

#### 3.2.2 2FA 表 (Better Auth Two-Factor Plugin)

```typescript
// TOTP 配置
export const twoFactorCredentials = pgTable("two_factor_credential", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  secret: text("secret").notNull(), // 加密存储
  createdAt: timestamp("created_at").notNull().defaultNow(),
});

// 备用码
export const backupCodes = pgTable("backup_code", {
  id: text("id").primaryKey(),
  userId: text("user_id").notNull().references(() => users.id),
  code: text("code").notNull(), // 加密存储
  usedAt: timestamp("used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
});
```

#### 3.2.3 API Key 表 (自定义)

```typescript
export const apiKeys = pgTable("api_key", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  userId: text("user_id").notNull().references(() => users.id),
  teamId: text("team_id"),
  name: text("name"),
  hashedKey: text("hashed_key").notNull().unique(),
  prefix: text("prefix").notNull(), // 用于识别，如 "oks_abc123"
  expiresAt: timestamp("expires_at"),
  lastUsedAt: timestamp("last_used_at"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  revokedAt: timestamp("revoked_at"),
});
```

### 3.3 Better Auth 配置

#### 3.3.1 核心配置

```typescript
// libs/auth/config/auth.config.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { twoFactor } from "better-auth/plugins";
import { organization } from "better-auth/plugins";
import { admin } from "better-auth/plugins";
import { db } from "@oksai/database";

export const auth = betterAuth({
  // 数据库适配器
  database: drizzleAdapter(db, {
    provider: "pg",
  }),
  
  // 邮箱密码认证
  emailAndPassword: {
    enabled: true,
    requireEmailVerification: true,
    minPasswordLength: 8,
    maxPasswordLength: 128,
  },
  
  // Session 配置
  session: {
    expiresIn: 60 * 60 * 24 * 7, // 7 天
    updateAge: 60 * 60 * 24,     // 每天更新一次
    cookieCache: {
      enabled: true,
      maxAge: 60 * 5, // 5 分钟
    },
  },
  
  // 邮箱验证
  emailVerification: {
    sendOnSignUp: true,
    autoSignInAfterVerification: true,
    expiresIn: 60 * 60, // 1 小时
    sendVerificationEmail: async ({ user, token }) => {
      // TODO: 集成邮件服务
      await sendEmail({
        to: user.email,
        subject: "验证您的邮箱",
        html: `<a href="${process.env.NEXT_PUBLIC_URL}/verify-email?token=${token}">点击验证</a>`,
      });
    },
  },
  
  // 插件
  plugins: [
    // 2FA 认证
    twoFactor({
      issuer: "oksai.cc",
      totpOptions: {
        digits: 6,
        period: 30,
      },
      backupCodesCount: 10,
    }),
    
    // 组织/团队
    organization({
      allowUserToCreateOrganization: true,
      membershipLimit: 100,
    }),
    
    // 管理员功能
    admin({
      adminRole: "admin",
      defaultRole: "user",
    }),
  ],
  
  // 高级选项
  advanced: {
    cookiePrefix: "oksai",
    useSecureCookies: process.env.NODE_ENV === "production",
    generateId: () => crypto.randomUUID(),
  },
  
  // 日志
  logger: {
    disabled: process.env.NODE_ENV === "test",
    level: "debug",
  },
});
```

#### 3.3.2 OAuth Provider 配置

```typescript
// libs/auth/config/providers/oauth.providers.ts
import { google } from "@better-auth/social-providers";

export const oauthProviders = {
  google: google({
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
    scope: [
      "openid",
      "email",
      "profile",
      "https://www.googleapis.com/auth/calendar",
      "https://www.googleapis.com/auth/calendar.events",
    ],
  }),
};
```

#### 3.3.3 Magic Link 配置

```typescript
// libs/auth/config/providers/magic-link.provider.ts
import { createTransport } from "nodemailer";

export const magicLinkConfig = {
  expiresIn: 10 * 60, // 10 分钟
  sendMagicLink: async ({ email, token, url }) => {
    const transporter = createTransport({
      host: process.env.SMTP_HOST,
      port: 587,
      auth: {
        user: process.env.SMTP_USER,
        pass: process.env.SMTP_PASSWORD,
      },
    });
    
    await transporter.sendMail({
      from: process.env.SMTP_FROM,
      to: email,
      subject: "登录到 oksai.cc",
      html: `
        <h1>点击下方链接登录</h1>
        <a href="${url}">${url}</a>
        <p>链接将在 10 分钟后失效</p>
      `,
    });
  },
};
```

### 3.4 NestJS 集成

#### 3.4.1 API Key 认证策略

```typescript
// libs/auth/strategies/api-key.strategy.ts
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { PassportStrategy } from "@nestjs/passport";
import { HeaderAPIKeyStrategy } from "passport-headerapikey";
import { db } from "@oksai/database";
import { eq } from "drizzle-orm";
import { apiKeys } from "@oksai/database/schema";
import { createHash } from "crypto";

@Injectable()
export class ApiKeyStrategy extends PassportStrategy(HeaderAPIKeyStrategy, "api-key") {
  constructor() {
    super(
      { header: "X-API-Key", prefix: "" },
      true,
      async (apiKey: string, done: (err: Error | null, user?: any) => void) => {
        try {
          // 提取前缀 (oks_abc123 -> oks)
          const prefix = apiKey.substring(0, 3);
          
          // Hash API Key
          const hashedKey = createHash("sha256").update(apiKey).digest("hex");
          
          // 查询 API Key
          const [keyRecord] = await db
            .select()
            .from(apiKeys)
            .where(eq(apiKeys.prefix, prefix))
            .where(eq(apiKeys.hashedKey, hashedKey))
            .limit(1);
          
          if (!keyRecord) {
            return done(new UnauthorizedException("Invalid API Key"), null);
          }
          
          // 检查是否过期
          if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
            return done(new UnauthorizedException("API Key expired"), null);
          }
          
          // 检查是否已撤销
          if (keyRecord.revokedAt) {
            return done(new UnauthorizedException("API Key revoked"), null);
          }
          
          // 更新 lastUsedAt
          await db
            .update(apiKeys)
            .set({ lastUsedAt: new Date() })
            .where(eq(apiKeys.id, keyRecord.id));
          
          // 返回用户信息
          return done(null, {
            id: keyRecord.userId,
            apiKeyId: keyRecord.id,
            type: "api_key",
          });
        } catch (error) {
          return done(error, null);
        }
      }
    );
  }
}
```

#### 3.4.2 API Key 守卫

```typescript
// libs/auth/guards/api-key.guard.ts
import { Injectable, ExecutionContext } from "@nestjs/common";
import { AuthGuard } from "@nestjs/passport";

@Injectable()
export class ApiKeyGuard extends AuthGuard("api-key") {
  canActivate(context: ExecutionContext) {
    return super.canActivate(context);
  }
}
```

#### 3.4.3 SAML SSO 集成 (Phase 2)

```typescript
// libs/auth/sso/saml.service.ts
import { Injectable } from "@nestjs/common";
import { JacksonService } from "@boxyhq/saml-jackson";

@Injectable()
export class SamlAuthService {
  constructor(private readonly jacksonService: JacksonService) {}
  
  async getAuthorizationUrl(params: { tenant: string; product: string }) {
    const { authorizationUrl } = await this.jacksonService.oauth.authorize({
      ...params,
      redirect_uri: `${process.env.NEXT_PUBLIC_URL}/api/auth/saml/callback`,
    });
    return authorizationUrl;
  }
  
  async handleCallback(params: { code: string; state: string }) {
    const { access_token } = await this.jacksonService.oauth.token({
      ...params,
      redirect_uri: `${process.env.NEXT_PUBLIC_URL}/api/auth/saml/callback`,
    });
    
    const profile = await this.jacksonService.oauth.userInfo(access_token);
    return profile;
  }
}
```

### 3.5 前端集成

#### 3.5.1 TanStack Start 客户端配置

```typescript
// apps/web-admin/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000",
});

// 导出 hooks
export const {
  useSession,
  signIn,
  signOut,
  signUp,
  useUser,
} = authClient;
```

#### 3.5.2 登录页面示例

```typescript
// apps/web-admin/src/routes/login.tsx
import { createFileRoute } from "@tanstack/react-router";
import { signIn } from "~/lib/auth-client";

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    
    await signIn.email({
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    });
  };
  
  return (
    <form onSubmit={handleLogin}>
      <input name="email" type="email" placeholder="Email" required />
      <input name="password" type="password" placeholder="Password" required />
      <button type="submit">登录</button>
    </form>
  );
}
```

## 四、API 路由设计

### 4.1 认证相关路由

| 路由 | 方法 | 描述 | 认证 |
|------|------|------|------|
| `/api/auth/sign-in/email` | POST | 邮箱密码登录 | ❌ |
| `/api/auth/sign-up/email` | POST | 邮箱注册 | ❌ |
| `/api/auth/sign-out` | POST | 登出 | ✅ |
| `/api/auth/session` | GET | 获取当前会话 | ✅ |
| `/api/auth/verify-email` | POST | 验证邮箱 | ❌ |
| `/api/auth/forgot-password` | POST | 忘记密码 | ❌ |
| `/api/auth/reset-password` | POST | 重置密码 | ❌ |
| `/api/auth/sign-in/magic-link` | POST | Magic Link 登录 | ❌ |
| `/api/auth/callback/google` | GET | Google OAuth 回调 | ❌ |
| `/api/auth/2fa/enable` | POST | 启用 2FA | ✅ |
| `/api/auth/2fa/disable` | POST | 禁用 2FA | ✅ |
| `/api/auth/2fa/verify` | POST | 验证 2FA 代码 | ✅ |
| `/api/api-keys` | GET | 获取 API Keys | ✅ |
| `/api/api-keys` | POST | 创建 API Key | ✅ |
| `/api/api-keys/:id` | DELETE | 撤销 API Key | ✅ |

## 五、安全考虑

### 5.1 密码安全

- ✅ 使用 bcryptjs 加密（Better Auth 内置）
- ✅ 最小长度 8 位，最大 128 位
- ✅ 要求包含大小写字母、数字、特殊字符（可选）
- ✅ 登录失败次数限制（可配置）
- ✅ 账户锁定机制（可配置）

### 5.2 Session 安全

- ✅ JWT Token 签名验证
- ✅ HttpOnly Cookie
- ✅ Secure Cookie (生产环境)
- ✅ SameSite=Lax
- ✅ Session 过期时间可配置
- ✅ 支持 Session 撤销

### 5.3 2FA 安全

- ✅ TOTP Secret 加密存储
- ✅ 备用码加密存储
- ✅ 备用码使用后立即失效
- ✅ 2FA 禁用需要验证当前 2FA 代码

### 5.4 API Key 安全

- ✅ API Key 不明文存储（SHA256 hash）
- ✅ API Key 前缀用于快速识别
- ✅ 支持 API Key 过期时间
- ✅ 支持 API Key 撤销
- ✅ 记录 lastUsedAt

### 5.5 CORS 和 CSRF

- ✅ 严格的 CORS 配置
- ✅ CSRF Token 保护（可选）
- ✅ trustedOrigins 配置

## 六、环境变量

```bash
# Better Auth
BETTER_AUTH_SECRET=<your-secret-key>
NEXT_PUBLIC_URL=https://your-domain.com

# Google OAuth
GOOGLE_CLIENT_ID=<client-id>
GOOGLE_CLIENT_SECRET=<client-secret>

# Email (SMTP)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=<password>
SMTP_FROM=noreply@example.com

# SAML SSO (Optional)
SAML_DATABASE_URL=postgresql://...
SAML_CLIENT_SECRET_VERIFIER=<verifier>

# Encryption
CALENDSO_ENCRYPTION_KEY=<32-byte-key>
```

## 七、测试策略

### 7.1 单元测试

- ✅ 密码验证逻辑
- ✅ API Key 验证逻辑
- ✅ 2FA TOTP 验证
- ✅ Session 提取逻辑

### 7.2 集成测试

- ✅ 完整登录流程
- ✅ OAuth 登录流程
- ✅ Magic Link 流程
- ✅ 2FA 启用/验证流程
- ✅ API Key 创建/使用/撤销

### 7.3 E2E 测试

- ✅ 用户注册到登录完整流程
- ✅ 2FA 启用到验证流程
- ✅ API Key 使用流程

## 八、迁移计划

### 8.1 Phase 0: 准备工作

- [x] Better Auth + NestJS 集成（nestjs-better-auth）
- [x] Drizzle ORM 数据库层
- [ ] 邮件服务集成

### 8.2 Phase 1: 核心认证 (P0)

**目标：** 实现基本的用户注册登录

- [ ] Better Auth 核心配置
- [ ] 数据库 Schema 创建
- [ ] 邮箱密码注册/登录
- [ ] 邮箱验证
- [ ] 密码重置
- [ ] Magic Link 登录
- [ ] Google OAuth 登录
- [ ] 前端登录/注册页面

### 8.3 Phase 2: 高级特性 (P1)

**目标：** 企业级安全特性

- [ ] 2FA/TOTP 认证
- [ ] 备用码
- [ ] API Key 认证
- [ ] 自定义 Session 超时
- [ ] 组织/团队管理（Better Auth Organization Plugin）

### 8.4 Phase 3: 企业级功能 (P2)

**目标：** SAML SSO 和高级管理

- [ ] SAML SSO 集成（@boxyhq/saml-jackson）
- [ ] 组织角色管理
- [ ] Session 缓存优化
- [ ] 并发登录控制
- [ ] 用户模拟功能

### 8.5 Phase 4: Platform OAuth (P3)

**目标：** 开放平台 API

- [ ] OAuth 2.0 授权服务器
- [ ] Access Token / Refresh Token
- [ ] Platform OAuth Clients
- [ ] Webhook 支持

## 九、边界情况

### 9.1 认证失败处理

| 场景 | 处理方式 |
|------|----------|
| 邮箱未验证 | 提示验证邮箱，允许重新发送 |
| 密码错误 | 提示错误，记录失败次数 |
| 账户锁定 | 提示联系管理员 |
| 2FA 代码错误 | 提示错误，允许使用备用码 |
| API Key 过期 | 返回 401 Unauthorized |
| Session 过期 | 重定向到登录页面 |

### 9.2 特殊场景

| 场景 | 处理方式 |
|------|----------|
| 并发登录 | 可配置允许/禁止 |
| OAuth 账户关联 | 自动关联相同邮箱 |
| 密码重置 | 发送邮件，链接 1 小时有效 |
| 邮箱修改 | 需要验证新邮箱 |

## 十、监控和日志

### 10.1 关键指标

- 登录成功率/失败率
- 注册转化率
- 2FA 启用率
- API Key 使用统计
- Session 活跃度

### 10.2 日志记录

- 登录/登出事件
- 2FA 启用/禁用事件
- API Key 创建/撤销事件
- 异常登录行为（IP 变更、地理位置变更）

## 十一、参考资源

- [Better Auth 官方文档](https://www.better-auth.com)
- [Cal.com 认证实现](/home/arligle/forks/cal.com/packages/features/auth/)
- [BoxyHQ SAML Jackson](https://github.com/boxyhq/jackson)
- [NestJS Passport](https://docs.nestjs.com/security/authentication)
- [OWASP Authentication Cheat Sheet](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

---

**文档版本：** 1.0.0  
**最后更新：** 2026年3月2日  
**维护者：** oksai.cc 团队
