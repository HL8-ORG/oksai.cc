# @oksai/auth-config

Better Auth 配置模块，为 oksai.cc 提供统一的认证配置。

## 功能特性

- ✅ 邮箱密码认证
- ✅ Magic Link 登录
- ✅ OAuth 登录（Google）
- ✅ 邮箱验证
- ✅ 密码重置
- ✅ Session 管理（JWT）
- ✅ 双因素认证（2FA/TOTP）- Phase 2
- ✅ 组织/团队管理 - Phase 2
- ✅ 管理员角色 - Phase 2

## 安装

```bash
pnpm install --filter @oksai/auth-config
```

## 使用方法

### 1. 创建 Better Auth 实例

```typescript
import { createBetterAuth } from "@oksai/auth-config";
import { db } from "@oksai/database";

export const auth = createBetterAuth({
  db,
  baseURL: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",
  secret: process.env.BETTER_AUTH_SECRET,
  
  // 功能开关
  requireEmailVerification: true,
  enable2FA: false, // Phase 2
  enableOrganization: false, // Phase 2
  enableAdmin: false, // Phase 2
  
  // 回调函数
  sendVerificationEmail: async ({ user, url }) => {
    // 发送验证邮件
  },
  sendResetPasswordEmail: async ({ user, url }) => {
    // 发送密码重置邮件
  },
});
```

### 2. 集成到 NestJS

```typescript
import { Module } from "@nestjs/common";
import { AuthModule } from "@oksai/nestjs-better-auth";
import { auth } from "./auth.config";

@Module({
  imports: [
    AuthModule.forRoot({
      auth,
      isGlobal: true,
    }),
  ],
})
export class AuthFeatureModule {}
```

### 3. 使用装饰器保护路由

```typescript
import { Controller, Get } from "@nestjs/common";
import { Session, AllowAnonymous } from "@oksai/nestjs-better-auth";

@Controller("api")
export class AppController {
  @Get("profile")
  getProfile(@Session() session: any) {
    return session.user;
  }
  
  @Get("public")
  @AllowAnonymous()
  getPublic() {
    return "This is public";
  }
}
```

## 配置选项

| 选项 | 类型 | 默认值 | 说明 |
|------|------|--------|------|
| `db` | `Database` | - | Drizzle ORM 数据库实例 |
| `baseURL` | `string` | - | 应用基础 URL |
| `secret` | `string` | - | 认证密钥 |
| `requireEmailVerification` | `boolean` | `true` | 是否要求邮箱验证 |
| `enable2FA` | `boolean` | `false` | 是否启用双因素认证 |
| `enableOrganization` | `boolean` | `false` | 是否启用组织/团队管理 |
| `enableAdmin` | `boolean` | `false` | 是否启用管理员功能 |
| `sessionExpiresIn` | `number` | `604800` | Session 过期时间（秒），默认 7 天 |

## 环境变量

```bash
# Better Auth
BETTER_AUTH_SECRET=your-secret-key
NEXT_PUBLIC_URL=http://localhost:3000

# Google OAuth (Phase 1)
GOOGLE_CLIENT_ID=your-client-id
GOOGLE_CLIENT_SECRET=your-client-secret

# Email (Phase 1)
SMTP_HOST=smtp.example.com
SMTP_PORT=587
SMTP_USER=user@example.com
SMTP_PASSWORD=password
SMTP_FROM=noreply@example.com
```

## 开发状态

- [x] Phase 0: 基础架构
- [ ] Phase 1: 核心认证（进行中）
- [ ] Phase 2: 高级特性
- [ ] Phase 3: 企业级功能

## 相关文档

- [认证系统技术规格](../../specs/authentication/design.md)
- [实现进度](../../specs/authentication/implementation.md)
- [架构决策](../../specs/authentication/decisions.md)
- [Better Auth 官方文档](https://www.better-auth.com)

## License

MIT
