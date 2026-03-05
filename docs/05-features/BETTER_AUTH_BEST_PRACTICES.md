# Better Auth 最佳实践配置指南

> 基于 [Better Auth 官方最佳实践](https://better-auth.com/docs) 和项目技能文档

## 📋 目录

- [环境变量](#环境变量)
- [核心配置](#核心配置)
- [会话管理](#会话管理)
- [安全配置](#安全配置)
- [插件推荐](#插件推荐)
- [常见陷阱](#常见陷阱)

## 🔐 环境变量

### 必需的环境变量

```env
# 加密密钥（至少32字符）
# 生成方式：openssl rand -base64 32
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters-long

# 应用基础 URL
BETTER_AUTH_URL=http://localhost:3000

# 数据库连接
DATABASE_URL=postgresql://user:pass@localhost:5432/db
```

### 可选的环境变量

```env
# OAuth 提供商
GITHUB_CLIENT_ID=your-github-client-id
GITHUB_CLIENT_SECRET=your-github-client-secret
GOOGLE_CLIENT_ID=your-google-client-id
GOOGLE_CLIENT_SECRET=your-google-client-secret

# Redis（用于会话缓存）
REDIS_URL=redis://localhost:6379

# CORS
CORS_ORIGIN=http://localhost:5173
```

### ⚠️ 重要提示

**Better Auth 会自动读取环境变量**：

- 如果设置了 `BETTER_AUTH_SECRET`，**不要**在配置中再设置 `secret`
- 如果设置了 `BETTER_AUTH_URL`，**不要**在配置中再设置 `baseURL`

```typescript
// ❌ 错误：重复设置
betterAuth({
  secret: process.env.BETTER_AUTH_SECRET, // 不需要
  baseURL: process.env.BETTER_AUTH_URL, // 不需要
});

// ✅ 正确：让 Better Auth 自动读取
betterAuth({
  // BETTER_AUTH_SECRET 和 BETTER_AUTH_URL 会自动使用
  database: drizzleAdapter(db, { provider: 'pg' }),
});
```

## ⚙️ 核心配置

### 数据库适配器

**使用正确的导入路径**（支持 Tree-shaking）：

```typescript
// ✅ 正确
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { prismaAdapter } from 'better-auth/adapters/prisma';
import { mongodbAdapter } from 'better-auth/adapters/mongodb';

// ❌ 错误
import { drizzleAdapter } from 'better-auth'; // 不支持 tree-shaking
```

**Model 名称 vs 表名**：

Better Auth 使用 ORM model 名称，不是数据库表名：

```typescript
// Prisma schema
model User {
  id    String @id
  email String @unique
  // ...
  @@map("users") // 表名是 users
}

// Better Auth 配置
database: prismaAdapter(prisma, {
  // ✅ 使用 Prisma model 名称（User -> user）
  // ❌ 不是表名 "users"
})
```

### 邮箱/密码登录

```typescript
emailAndPassword: {
  enabled: true,
  requireEmailVerification: false, // 生产环境建议 true
}
```

### OAuth 配置

```typescript
socialProviders: {
  github: {
    clientId: process.env.GITHUB_CLIENT_ID!,
    clientSecret: process.env.GITHUB_CLIENT_SECRET!,
  },
  google: {
    clientId: process.env.GOOGLE_CLIENT_ID!,
    clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
  },
}
```

## 🔄 会话管理

### 存储优先级

Better Auth 会话存储有优先级：

1. **secondaryStorage**（Redis/KV）→ 会话存储在 Redis
2. **session.storeSessionInDatabase: true** → 同时存储在数据库
3. **无数据库 + cookieCache** → 完全无状态模式

### Cookie 缓存策略

```typescript
session: {
  expiresIn: 60 * 60 * 24 * 7, // 7 天过期
  updateAge: 60 * 60 * 24,     // 每天更新一次

  cookieCache: {
    enabled: true,
    maxAge: 60 * 5, // 5 分钟缓存

    // 缓存策略（三选一）
    // - 'compact' (默认) - 最小体积，Base64url + HMAC
    // - 'jwt' - 标准 JWT，可读但已签名
    // - 'jwe' - 加密，最高安全性
    version: 1, // 改变此值可使所有会话失效
  },
}
```

### ⚠️ Cookie 缓存限制

**自定义会话字段不会被缓存**，每次都会从数据库重新获取：

```typescript
// 假设你在 session 中添加了自定义字段
session: {
  customData: 'some-value';
}

// ❌ customData 不会在 cookie 缓存中
// ✅ 每次请求都会从数据库获取完整的 session
```

### Redis 集成（推荐）

```typescript
import { Redis } from 'ioredis';

const redis = new Redis(process.env.REDIS_URL);

betterAuth({
  secondaryStorage: {
    get: (key) => redis.get(key),
    set: (key, value, ttl) => redis.set(key, value, 'EX', ttl),
    delete: (key) => redis.del(key),
  },

  session: {
    // 同时存储在数据库（可选）
    storeSessionInDatabase: true,
  },
});
```

## 🛡️ 安全配置

### 基础安全

```typescript
advanced: {
  // 强制 HTTPS cookies（生产环境）
  useSecureCookies: process.env.NODE_ENV === 'production',

  // IP 地址提取（用于代理环境）
  ipAddress: {
    ipAddressHeaders: ['x-forwarded-for', 'x-real-ip'],
  },

  // 自定义 ID 生成
  generateId: false, // 使用默认的 CUID2
  // 或使用其他策略
  // generateId: 'uuid',  // UUID
  // generateId: 'serial', // 自增 ID
}
```

### 速率限制

```typescript
rateLimit: {
  enabled: true,
  window: 60,        // 60 秒窗口
  max: 100,          // 最多 100 次请求
  storage: 'database', // 存储位置
  // 可选: 'memory' | 'database' | 'secondary-storage'
}
```

### ⚠️ 危险选项（谨慎使用）

```typescript
advanced: {
  // ❌ 危险：禁用 CSRF 检查
  disableCSRFCheck: false,

  // ❌ 危险：禁用 Origin 检查
  disableOriginCheck: false,
}
```

## 🔌 插件推荐

### 导入方式

**使用独立路径**（支持 Tree-shaking）：

```typescript
// ✅ 正确
import { twoFactor } from 'better-auth/plugins/two-factor';
import { organization } from 'better-auth/plugins/organization';

// ❌ 错误
import { twoFactor } from 'better-auth/plugins';
```

### 常用插件

```typescript
import { twoFactor } from 'better-auth/plugins/two-factor';
import { organization } from 'better-auth/plugins/organization';
import { admin } from 'better-auth/plugins/admin';
import { apiKey } from 'better-auth/plugins/api-key';
import { jwt } from 'better-auth/plugins/jwt';

betterAuth({
  plugins: [
    twoFactor(), // 双因素认证
    organization(), // 组织管理
    admin(), // 管理员功能
    apiKey(), // API Key 管理
    jwt(), // JWT 支持
  ],
});
```

### 邮件相关插件

```typescript
import { magicLink } from 'better-auth/plugins/magic-link';
import { emailOtp } from 'better-auth/plugins/email-otp';

betterAuth({
  plugins: [
    magicLink(), // 魔法链接登录
    emailOtp(), // 邮箱验证码
  ],
});
```

### 运行 CLI 生成 Schema

**添加/修改插件后，务必重新运行 CLI**：

```bash
# 生成 schema（Drizzle/Prisma）
npx @better-auth/cli@latest generate

# 应用 schema（内置适配器）
npx @better-auth/cli@latest migrate
```

## 🪝 Hooks

### 端点 Hooks

```typescript
import { createAuthMiddleware } from 'better-auth/api'

hooks: {
  before: [
    {
      matcher: (path) => path.startsWith('/api/auth/sign-in'),
      handler: createAuthMiddleware(async (ctx) => {
        console.log('登录前:', ctx.path)
      }),
    },
  ],
  after: [
    {
      matcher: (path) => path === '/api/auth/sign-in/email',
      handler: createAuthMiddleware(async (ctx) => {
        console.log('登录后:', ctx.context.returned)
      }),
    },
  ],
}
```

### 数据库 Hooks

```typescript
databaseHooks: {
  user: {
    create: {
      before: async (user) => {
        // 修改用户数据
        return { ...user, role: 'member' }
      },
      after: async (user) => {
        // 发送欢迎邮件
        await sendWelcomeEmail(user.email)
      },
    },
  },
  session: {
    create: {
      after: async (session) => {
        console.log('新会话创建:', session.id)
      },
    },
  },
}
```

## 🐛 常见陷阱

### 1. Model 名称混淆

**问题**：配置使用 ORM model 名称，不是数据库表名

**解决**：

```typescript
// Prisma model: User -> table: users
// Better Auth: 使用 "user"，不是 "users"
database: prismaAdapter(prisma); // 自动处理
```

### 2. 插件 Schema 未更新

**问题**：添加插件后未重新生成 schema

**解决**：

```bash
npx @better-auth/cli@latest generate
pnpm db:push  # 或 drizzle-kit push
```

### 3. Secondary Storage 陷阱

**问题**：配置 Redis 后，会话默认不存储在数据库

**解决**：

```typescript
session: {
  storeSessionInDatabase: true, // 同时存储在数据库
}
```

### 4. Cookie 缓存限制

**问题**：自定义会话字段不会被缓存

**解决**：每次请求都会从数据库获取完整会话

### 5. 无状态模式

**问题**：没有数据库时，会话只在 cookie 中，过期即登出

**解决**：

```typescript
// 方案 1：添加数据库
database: drizzleAdapter(db, { provider: 'pg' });

// 方案 2：添加 Redis
secondaryStorage: {
  /* ... */
}
```

### 6. 邮箱更改流程

**问题**：更改邮箱时会先发送到当前邮箱，再发送到新邮箱

**解决**：

```typescript
user: {
  changeEmail: {
    enabled: true,
    // 自定义邮件发送逻辑
    sendChangeEmailVerification: async ({ user, newEmail, url }) => {
      // 发送验证邮件
    },
  },
}
```

## 📊 配置检查清单

### 基础配置

- [ ] 设置 `BETTER_AUTH_SECRET` 环境变量
- [ ] 设置 `BETTER_AUTH_URL` 环境变量
- [ ] 配置数据库适配器
- [ ] 启用邮箱/密码登录
- [ ] 配置 OAuth 提供商（可选）

### 安全配置

- [ ] 生产环境启用 `useSecureCookies`
- [ ] 配置 `trustedOrigins`
- [ ] 启用 `rateLimit`
- [ ] 配置 IP 地址提取（如果使用代理）

### 会话管理

- [ ] 配置会话过期时间
- [ ] 启用 `cookieCache`
- [ ] 配置 Redis（可选，推荐）
- [ ] 设置 `storeSessionInDatabase`（如果使用 Redis）

### 插件

- [ ] 添加需要的插件
- [ ] 运行 `npx @better-auth/cli@latest generate`
- [ ] 同步数据库 schema
- [ ] 客户端添加对应插件

### 测试

- [ ] 测试邮箱注册/登录
- [ ] 测试 OAuth 登录
- [ ] 测试会话持久化
- [ ] 测试登出功能
- [ ] 测试速率限制

## 📚 相关资源

- [Better Auth 官方文档](https://better-auth.com/docs)
- [配置选项参考](https://better-auth.com/docs/reference/options)
- [LLMs.txt](https://better-auth.com/llms.txt)
- [GitHub 仓库](https://github.com/better-auth/better-auth)
- [项目实现指南](./BETTER_AUTH_INTEGRATION.md)

## 🎯 当前项目状态

### ✅ 已实现

- [x] 环境变量配置（BETTER_AUTH_SECRET, BETTER_AUTH_URL）
- [x] Drizzle ORM 适配器
- [x] 邮箱/密码登录
- [x] GitHub OAuth
- [x] Google OAuth
- [x] 会话管理（7天过期）
- [x] Cookie 缓存（5分钟）
- [x] 速率限制
- [x] IP 地址提取

### 📋 待优化

- [ ] Redis 集成（secondaryStorage）
- [ ] 添加插件（twoFactor, organization, admin）
- [ ] 邮箱验证流程
- [ ] 密码重置功能
- [ ] API Key 管理

---

**💡 提示**：遵循这些最佳实践可以确保 Better Auth 的安全性、性能和可维护性。
