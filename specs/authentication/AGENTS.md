# AGENTS.md — 认证系统

## 项目背景

基于 Better Auth 实现完整的认证系统，对齐 Cal.com 的认证功能，支持多种认证方式（邮箱密码、Magic Link、OAuth）、双因素认证（2FA/TOTP）、API Key 认证、SAML SSO 等企业级特性。

## 开始前

1. **阅读技术规格**
   - 阅读 `specs/authentication/design.md` 了解完整的技术设计
   - 阅读 `specs/authentication/implementation.md` 了解当前实现进度
   - 阅读 `specs/authentication/decisions.md` 了解架构决策

2. **了解现有实现**
   - 查看 `libs/auth/nestjs-better-auth/src/` 了解 NestJS 集成
   - 查看 `libs/database/src/schema/` 了解数据库 Schema
   - 参考 Cal.com 认证实现：`/home/arligle/forks/cal.com/packages/features/auth/`

3. **学习 Better Auth**
   - [Better Auth 官方文档](https://www.better-auth.com)
   - [Better Auth GitHub](https://github.com/better-auth/better-auth)
   - 重点了解：Credentials Provider、Email Provider、OAuth Provider、Two-Factor Plugin

4. **准备开发环境**
   - 确保数据库已启动（`pnpm docker:up`）
   - 确保环境变量已配置（`.env`）
   - 确保依赖已安装（`pnpm install`）

## 代码模式

### Better Auth 配置模式

```typescript
// libs/auth/config/auth.config.ts
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { db } from "@oksai/database";

export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: "pg" }),
  emailAndPassword: { enabled: true },
  // ... 其他配置
});
```

### NestJS 集成模式

```typescript
// apps/gateway/src/app.module.ts
import { AuthModule } from "@oksai/nestjs-better-auth";
import { auth } from "@oksai/auth/config";

@Module({
  imports: [
    AuthModule.forRoot({ auth }),
    // ...
  ],
})
export class AppModule {}
```

### Drizzle Schema 扩展模式

```typescript
// libs/database/src/schema/auth.schema.ts
import { pgTable, text, timestamp, boolean } from "drizzle-orm/pg-core";

export const users = pgTable("user", {
  id: text("id").primaryKey().$defaultFn(() => crypto.randomUUID()),
  email: text("email").notNull().unique(),
  // Better Auth 核心字段
  emailVerified: boolean("email_verified").notNull().default(false),
  name: text("name"),
  image: text("image"),
  createdAt: timestamp("created_at").notNull().defaultNow(),
  updatedAt: timestamp("updated_at").notNull().defaultNow(),
  
  // 自定义扩展字段
  username: text("username").unique(),
  locale: text("locale").default("zh-CN"),
  timezone: text("timezone").default("Asia/Shanghai"),
  role: text("role").default("user").notNull(),
  locked: boolean("locked").default(false),
});
```

### API 路由模式

```typescript
// apps/gateway/src/modules/auth/auth.controller.ts
import { Controller, Post, Body } from "@nestjs/common";
import { AuthService } from "./auth.service";
import { AllowAnonymous } from "@oksai/nestjs-better-auth";

@Controller("auth")
export class AuthController {
  constructor(private readonly authService: AuthService) {}

  @Post("sign-in/email")
  @AllowAnonymous()
  async signInWithEmail(@Body() body: SignInDto) {
    return this.authService.signInWithEmail(body);
  }
}
```

### 前端集成模式

```typescript
// apps/web-admin/src/lib/auth-client.ts
import { createAuthClient } from "better-auth/react";

export const authClient = createAuthClient({
  baseURL: process.env.NEXT_PUBLIC_API_URL,
});

export const { useSession, signIn, signOut, signUp } = authClient;
```

## 不要做

### 不要偏离技术规格

- ❌ 不要添加 `design.md` 之外的功能
- ❌ 不要使用 NextAuth.js（我们使用 Better Auth）
- ❌ 不要使用 Prisma（我们使用 Drizzle ORM）
- ❌ 不要跳过单元测试和集成测试

### 不要破坏现有集成

- ❌ 不要修改 `libs/auth/nestjs-better-auth/` 的核心逻辑
- ❌ 不要破坏与 Better Auth 插件的兼容性
- ❌ 不要引入与现有 Schema 冲突的表结构

### 不要忽视安全性

- ❌ 不要明文存储密码或 API Key
- ❌ 不要在日志中输出敏感信息
- ❌ 不要跳过输入验证
- ❌ 不要使用弱加密算法

### 不要跳过文档

- ❌ 不要省略 TSDoc 注释（公共 API 必须有文档）
- ❌ 不要忘记更新 `implementation.md` 的进度
- ❌ 不要忘记在 `decisions.md` 记录重要决策

## 开发流程

### 1. 开始新功能前

```bash
# 1. 查看当前进度
cat specs/authentication/implementation.md

# 2. 创建功能分支
git checkout -b feature/auth-email-verification

# 3. 阅读相关设计
cat specs/authentication/design.md
```

### 2. 实现过程中

```bash
# 1. 编写代码（遵循代码模式）

# 2. 编写单元测试
pnpm vitest run libs/auth/src/**/*.spec.ts

# 3. 运行 lint
pnpm lint

# 4. 更新进度
# 编辑 specs/authentication/implementation.md
```

### 3. 完成功能后

```bash
# 1. 运行完整测试
pnpm test

# 2. 运行 lint 和格式化
pnpm check:fix

# 3. 更新文档
# - 更新 implementation.md 的完成项
# - 如有决策，更新 decisions.md

# 4. 提交代码
git add .
git commit -m "feat(auth): implement email verification"
```

## 常见问题

### Q: 如何添加新的 OAuth Provider？

**A:** 参考 Google OAuth 的实现：

1. 在 `libs/auth/config/providers/oauth.providers.ts` 添加配置
2. 在 Better Auth 配置中注册 Provider
3. 创建回调路由
4. 测试 OAuth 流程

### Q: 如何自定义用户字段？

**A:** 在 `libs/database/src/schema/auth.schema.ts` 扩展 `users` 表：

```typescript
export const users = pgTable("user", {
  // ... Better Auth 核心字段
  customField: text("custom_field"),
});
```

然后生成迁移：

```bash
pnpm db:generate
pnpm db:migrate
```

### Q: 如何集成 2FA？

**A:** 使用 Better Auth Two-Factor Plugin：

1. 在 `auth.config.ts` 中启用插件
2. 创建 2FA 相关 API
3. 前端集成 2FA UI

### Q: 如何调试认证问题？

**A:**

1. 启用 Better Auth 日志（设置 `logger.level: "debug"`）
2. 检查数据库中的 session 和 user 表
3. 使用浏览器开发者工具查看 Cookie 和 Network 请求
4. 参考 Cal.com 的实现进行对比

## 参考资源

- [Better Auth 官方文档](https://www.better-auth.com)
- [Better Auth GitHub](https://github.com/better-auth/better-auth)
- [Cal.com 认证实现](/home/arligle/forks/cal.com/packages/features/auth/)
- [NestJS 认证文档](https://docs.nestjs.com/security/authentication)
- [Drizzle ORM 文档](https://orm.drizzle.team)
- [OWASP 认证最佳实践](https://cheatsheetseries.owasp.org/cheatsheets/Authentication_Cheat_Sheet.html)

## 联系方式

如有疑问，请在项目 GitHub Issues 中提问或联系团队。
