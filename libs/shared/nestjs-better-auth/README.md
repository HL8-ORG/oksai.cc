# @oksai/nestjs-better-auth

[![npm version](https://badge.fury.io/js/@oksai%2Fnestjs-better-auth.svg)](https://badge.fury.io/js/@oksai%2Fnestjs-better-auth)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)

Better Auth 的 NestJS 集成模块，提供开箱即用的认证守卫、装饰器和中间件。

## 特性

- ✅ **动态模块** - 支持 `forRoot` 和 `forRootAsync` 配置
- ✅ **全局认证守卫** - 自动保护所有路由
- ✅ **装饰器支持** - `@AllowAnonymous()`, `@Roles()`, `@Session` 等
- ✅ **多上下文支持** - HTTP, GraphQL, WebSocket, RPC
- ✅ **插件兼容** - 支持 Better Auth admin 和 organization 插件
- ✅ **钩子系统** - 前置/后置钩子用于自定义逻辑

## 安装

```bash
pnpm add @oksai/nestjs-better-auth better-auth

# 或
npm install @oksai/nestjs-better-auth better-auth
# 或
yarn add @oksai/nestjs-better-auth better-auth
```

### 可选依赖

如果使用 GraphQL 或 WebSocket 支持：

```bash
pnpm add @nestjs/graphql graphql
# 或
pnpm add @nestjs/websockets @nestjs/platform-socket.io
```

## 快速开始

### 1. 创建 Better Auth 实例

```typescript
// auth.config.ts
import { betterAuth } from 'better-auth';

export const auth = betterAuth({
  database: {
    // 数据库配置
  },
  // 其他配置
});
```

### 2. 导入 AuthModule

```typescript
// app.module.ts
import { Module } from '@nestjs/common';
import { AuthModule } from '@oksai/nestjs-better-auth';
import { auth } from './auth.config';

@Module({
  imports: [
    AuthModule.forRoot({
      auth,
      isGlobal: true, // 可选，默认为 true
    }),
  ],
})
export class AppModule {}
```

### 3. 使用装饰器保护路由

```typescript
// users.controller.ts
import { Controller, Get } from '@nestjs/common';
import { AllowAnonymous, Roles, Session } from '@oksai/nestjs-better-auth';

@Controller('users')
export class UsersController {
  @Get('profile')
  getProfile(@Session() session: any) {
    return session.user;
  }

  @Get('public')
  @AllowAnonymous()
  getPublicData() {
    return { message: 'This is public' };
  }

  @Get('admin-only')
  @Roles(['admin'])
  getAdminData() {
    return { message: 'Admin only' };
  }
}
```

## 配置选项

### AuthModuleOptions

| 选项                        | 类型                | 默认值  | 说明                          |
| --------------------------- | ------------------- | ------- | ----------------------------- |
| `auth`                      | `Auth`              | 必填    | Better Auth 实例              |
| `isGlobal`                  | `boolean`           | `true`  | 是否为全局模块                |
| `disableGlobalAuthGuard`    | `boolean`           | `false` | 禁用全局认证守卫              |
| `disableControllers`        | `boolean`           | `false` | 禁用控制器（仅提供守卫/服务） |
| `disableTrustedOriginsCors` | `boolean`           | `false` | 禁用自动 CORS 配置            |
| `disableBodyParser`         | `boolean`           | `false` | 禁用自定义 Body 解析          |
| `enableRawBodyParser`       | `boolean`           | `false` | 启用原始 Body（用于 webhook） |
| `middleware`                | `ExpressMiddleware` | -       | 自定义中间件                  |

### forRootAsync

```typescript
AuthModule.forRootAsync({
  useFactory: async () => {
    const auth = betterAuth({
      // 配置
    });
    return { auth };
  },
});
```

## 装饰器

### @AllowAnonymous()

允许未认证用户访问路由。

```typescript
@Get('public')
@AllowAnonymous()
getPublicData() {}
```

### @OptionalAuth()

允许未认证用户访问，但如果已认证则提供会话信息。

```typescript
@Get('optional')
@OptionalAuth()
getOptionalData(@Session() session: any) {
  if (session) {
    return { user: session.user };
  }
  return { user: null };
}
```

### @Roles(roles)

限制只有特定角色的用户才能访问（需要 Better Auth admin 插件）。

```typescript
@Get('admin')
@Roles(['admin'])
getAdminData() {}
```

### @OrgRoles(roles)

限制只有特定组织角色的用户才能访问（需要 Better Auth organization 插件）。

```typescript
@Get('org-admin')
@OrgRoles(['owner', 'admin'])
getOrgAdminData() {}
```

### @Session()

注入当前用户会话到控制器方法。

```typescript
@Get('profile')
getProfile(@Session() session: any) {
  return session.user;
}
```

### 钩子装饰器

```typescript
@Hook()
export class AuthHooks {
  @BeforeHook('/sign-in')
  async beforeSignIn(ctx: AuthHookContext) {
    console.log('User signing in:', ctx.body);
  }

  @AfterHook('/sign-up')
  async afterSignUp(ctx: AuthHookContext) {
    console.log('New user registered:', ctx.body);
  }
}
```

## 使用 AuthService

```typescript
import { Injectable } from '@nestjs/common';
import { AuthService } from '@oksai/nestjs-better-auth';

@Injectable()
export class UsersService {
  constructor(private readonly authService: AuthService) {}

  async getCurrentUser(headers: Headers) {
    const session = await this.authService.api.getSession({ headers });
    return session?.user;
  }
}
```

## GraphQL 支持

模块自动支持 GraphQL 上下文，无需额外配置：

```typescript
@Resolver()
export class UsersResolver {
  @Query(() => User)
  @Roles(['admin'])
  async currentUser(@Session() session: any) {
    return session.user;
  }
}
```

## WebSocket 支持

模块自动支持 WebSocket 上下文：

```typescript
@WebSocketGateway()
export class EventsGateway {
  @SubscribeMessage('events')
  async handleEvent(@Session() session: any) {
    // session 从 handshake.headers 中获取
    return { userId: session?.user?.id };
  }
}
```

## 示例项目

查看 [示例目录](./examples) 获取完整示例。

## API 文档

详细的 API 文档请查看 [docs](./docs) 目录。

## 开发

### 构建

```bash
pnpm build
```

### 测试

```bash
pnpm test
pnpm test:watch
pnpm test:coverage
```

### 代码检查

```bash
pnpm check
pnpm check:fix
```

## 许可证

MIT © Oksai Team

## 贡献

欢迎贡献！请查看 [贡献指南](./CONTRIBUTING.md)。

## 支持

如有问题，请提交 [Issue](https://github.com/your-org/oksai/issues)。
