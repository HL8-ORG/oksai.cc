# NestJS Better Auth 集成

[Better Auth](https://www.better-auth.com/) 的 NestJS 综合集成库，为您的 NestJS 应用程序提供无缝的身份验证和授权功能。

## 安装

在您的 NestJS 项目中安装此库：

```bash
# 使用 npm
npm install @oksai/nestjs-better-auth

# 使用 yarn
yarn add @oksai/nestjs-better-auth

# 使用 pnpm
pnpm add @oksai/nestjs-better-auth

# 使用 bun
bun add @oksai/nestjs-better-auth
```

## 前置要求

> [!IMPORTANT]
> 需要 `better-auth` >= 1.3.8。旧版本已弃用且不受支持。

开始之前，请确保您已具备：

- 一个正常运行的 NestJS 应用程序
- Better Auth (>= 1.3.8) 已安装并配置完成 ([安装指南](https://www.better-auth.com/docs/installation))

## 基础配置

**1. 禁用 Body Parser**

禁用 NestJS 的内置 body parser，以便 Better Auth 能够处理原始请求体：

```ts title="main.ts"
import { NestFactory } from "@nestjs/core";
import { AppModule } from "./app.module";

async function bootstrap() {
  const app = await NestFactory.create(AppModule, {
    // 别担心，库会自动重新添加默认的 body parser。
    bodyParser: false,
  });
  await app.listen(process.env.PORT ?? 3333);
}
bootstrap();
```

> [!IMPORTANT]
> **副作用：** 由于我们禁用了 NestJS 的内置 body parser，`NestFactory.create()` 中的 `rawBody: true` 选项将无效。
> 如果您需要访问 `req.rawBody`（例如用于 webhook 签名验证），请改用 `AuthModule.forRoot()` 中的 `enableRawBodyParser` 选项。
> 详见[模块选项](#模块选项)。

> [!NOTE]
> Fastify 平台已完全支持。如需使用 Fastify，请安装所需依赖：
> ```bash
> npm install @nestjs/platform-fastify fastify
> ```

**2. 导入 AuthModule**

在您的根模块中导入 `AuthModule`：

```ts title="app.module.ts"
import { Module } from "@nestjs/common";
import { AuthModule } from "@oksai/nestjs-better-auth";
import { auth } from "./auth";

@Module({
  imports: [AuthModule.forRoot({ auth })],
})
export class AppModule {}
```

## 路由保护

**默认全局保护**：此模块会全局注册一个 `AuthGuard`。所有路由默认受保护，除非您使用 `@AllowAnonymous()` 明确允许访问，或使用 `@OptionalAuth()` 标记为可选。

GraphQL 同样受支持，工作方式与 REST 相同：全局守卫同样适用于解析器，您可以在查询和变更上使用 `@AllowAnonymous()`/`@OptionalAuth()`。

WebSocket 也受支持，工作方式与 REST 和 GraphQL 相同：您可以在任何连接上使用 `@AllowAnonymous()`/`@OptionalAuth()`，但必须在所有连接上设置 AuthGuard，可以在 Gateway 或 Message 级别设置，如下所示：

```ts
import { SubscribeMessage, WebSocketGateway } from "@nestjs/websockets";
import { UseGuards } from "@nestjs/common";
import { AuthGuard } from '@oksai/nestjs-better-auth';

@WebSocketGateway({
	path: "/ws",
	namespace: "test",
	cors: {
		origin: "*",
	},
})
@UseGuards(AuthGuard)
export class TestGateway { /* ... */ }
```

完整示例请查看 [test gateway](./tests/shared/test-gateway.ts)。

## 装饰器

Better Auth 提供了多个装饰器来增强您的身份验证设置：

### Session 装饰器

在控制器中访问用户会话：

```ts title="user.controller.ts"
import { Controller, Get } from "@nestjs/common";
import { Session, UserSession } from "@oksai/nestjs-better-auth";

@Controller("users")
export class UserController {
  @Get("me")
  async getProfile(@Session() session: UserSession) {
    return session;
  }
}
```

### AllowAnonymous 和 OptionalAuth 装饰器

控制特定路由的身份验证要求：

```ts title="app.controller.ts"
import { Controller, Get } from "@nestjs/common";
import { AllowAnonymous, OptionalAuth } from "@oksai/nestjs-better-auth";

@Controller("users")
export class UserController {
  @Get("public")
  @AllowAnonymous() // 允许匿名访问（无需身份验证）
  async publicRoute() {
    return { message: "这是一个公开路由" };
  }

  @Get("optional")
  @OptionalAuth() // 此路由的身份验证是可选的
  async optionalRoute(@Session() session: UserSession) {
    return { authenticated: !!session, session };
  }
}
```

或者，作为类装饰器应用于整个控制器：

```ts title="app.controller.ts"
@AllowAnonymous() // 此控制器内的所有路由都是公开的
@Controller("public")
export class PublicController {
  /* */
}

@OptionalAuth() // 所有路由的身份验证都是可选的
@Controller("optional")
export class OptionalController {
  /* */
}
```

### 基于角色的访问控制

此库为不同的使用场景提供两个角色装饰器：

| 装饰器 | 检查内容 | 使用场景 |
|--------|----------|----------|
| `@Roles()` | 仅 `user.role` | 系统级角色 ([admin 插件](https://www.better-auth.com/docs/plugins/admin)) |
| `@OrgRoles()` | 仅组织成员角色 | 组织级角色 ([organization 插件](https://www.better-auth.com/docs/plugins/organization)) |

> [!IMPORTANT]
> 这些装饰器是**有意分开**的，以防止权限提升。`@Roles()` 装饰器只检查 `user.role`，**不**检查组织成员角色。这确保了组织管理员无法绕过系统级管理员保护。

#### @Roles() - 系统级角色

使用 `@Roles()` 进行系统级管理员保护。它只检查 Better Auth [admin 插件](https://www.better-auth.com/docs/plugins/admin)的 `user.role` 字段。

```ts title="admin.controller.ts"
import { Controller, Get } from "@nestjs/common";
import { Roles } from "@oksai/nestjs-better-auth";

@Controller("admin")
export class AdminController {
  @Roles(["admin"])
  @Get("dashboard")
  async adminDashboard() {
    // 只有 user.role = 'admin' 的用户可以访问
    // 组织管理员无法访问此路由
    return { message: "系统管理员仪表盘" };
  }
}

// 或作为类装饰器
@Roles(["admin"])
@Controller("admin")
export class AdminController {
  /* 所有路由都需要 user.role = 'admin' */
}
```

#### @OrgRoles() - 组织级角色

使用 `@OrgRoles()` 进行组织范围的保护。它只检查组织成员角色，并需要活跃组织（会话中的 `activeOrganizationId`）。

```ts title="org.controller.ts"
import { Controller, Get } from "@nestjs/common";
import { OrgRoles, Session, UserSession } from "@oksai/nestjs-better-auth";

@Controller("org")
export class OrgController {
  @OrgRoles(["owner", "admin"])
  @Get("settings")
  async getOrgSettings(@Session() session: UserSession) {
    // 只有组织所有者/管理员可以访问（需要 activeOrganizationId）
    // 系统管理员 (user.role = 'admin') 在没有组织上下文时无法访问
    return { orgId: session.session.activeOrganizationId };
  }

  @OrgRoles(["owner"])
  @Get("billing")
  async getOrgBilling() {
    // 只有组织所有者可以访问
    return { message: "账单设置" };
  }
}
```

> [!NOTE]
> 两个角色装饰器都接受您定义的任何角色字符串。Better Auth 的 organization 插件提供默认角色（`owner`、`admin`、`member`），但您可以配置自定义角色。组织创建者自动获得 `owner` 角色。

### 组合装饰器（便捷方法）

库为常见用例提供了便捷的组合装饰器，封装了 `@Roles()` 和 `@OrgRoles()`：

#### 系统管理员装饰器

```ts title="admin.controller.ts"
import { Controller, Get, Delete } from "@nestjs/common";
import { AdminOnly, SuperAdminOnly } from "@oksai/nestjs-better-auth";

@Controller("admin")
export class AdminController {
  @AdminOnly() // 等同于 @Roles(["admin"])
  @Get("users")
  async listUsers() {
    // 只有 user.role = 'admin' 的用户可以访问
    return { users: [] };
  }

  @SuperAdminOnly() // 等同于 @Roles(["superadmin"])
  @Delete("users/:id")
  async deleteUser() {
    // 只有 user.role = 'superadmin' 的用户可以访问
    return { success: true };
  }
}
```

#### 组织角色装饰器

```ts title="org.controller.ts"
import { Controller, Get, Post } from "@nestjs/common";
import { OwnerOnly, OrgAdminOnly, MemberOnly } from "@oksai/nestjs-better-auth";

@Controller("org")
export class OrgController {
  @OwnerOnly() // 等同于 @OrgRoles(["owner"])
  @Delete("organization")
  async deleteOrganization() {
    // 只有组织所有者可以访问
    return { success: true };
  }

  @OrgAdminOnly() // 等同于 @OrgRoles(["owner", "admin"])
  @Post("members")
  async addMember() {
    // 只有组织所有者和管理员可以访问
    return { success: true };
  }

  @MemberOnly() // 等同于 @OrgRoles(["owner", "admin", "member"])
  @Get("resources")
  async getResources() {
    // 所有组织成员都可以访问
    return { resources: [] };
  }
}
```

可用的组合装饰器：

| 装饰器            | 等同于                              | 使用场景                       |
| ----------------- | ----------------------------------- | ------------------------------ |
| `@AdminOnly()`    | `@Roles(["admin"])`                 | 系统级管理员路由（用户管理等） |
| `@SuperAdminOnly()` | `@Roles(["superadmin"])`          | 最高权限路由（系统设置等）     |
| `@OwnerOnly()`    | `@OrgRoles(["owner"])`              | 删除组织、转让所有权           |
| `@OrgAdminOnly()` | `@OrgRoles(["owner", "admin"])`     | 成员管理、组织设置             |
| `@MemberOnly()`   | `@OrgRoles(["owner", "admin", "member"])` | 组织资源访问             |

### Hook 装饰器

> [!IMPORTANT]
> 要使用 `@Hook`、`@BeforeHook`、`@AfterHook`，请在您的 `betterAuth(...)` 配置中设置 `hooks: {}`（空对象）。您仍然可以添加自己的 Better Auth hooks；`hooks: {}`（空对象）只是最低要求。

启用 hooks 的最小 Better Auth 配置：

```ts title="auth.ts"
import { betterAuth } from "better-auth";

export const auth = betterAuth({
  basePath: "/api/auth",
  // 其他 better-auth 选项...
  hooks: {}, // 使用 hooks 的最低要求。详见上文。
});
```

创建与 NestJS 依赖注入集成的自定义 hooks：

```ts title="hooks/sign-up.hook.ts"
import { Injectable } from "@nestjs/common";
import {
  BeforeHook,
  Hook,
  AuthHookContext,
} from "@oksai/nestjs-better-auth";
import { SignUpService } from "./sign-up.service";

@Hook()
@Injectable()
export class SignUpHook {
  constructor(private readonly signUpService: SignUpService) {}

  @BeforeHook("/sign-up/email")
  async handle(ctx: AuthHookContext) {
    // 自定义逻辑，如强制邮箱域名注册
    // 验证失败时可以抛出 APIError
    await this.signUpService.execute(ctx);
  }
}
```

在模块中注册您的 hooks：

```ts title="app.module.ts"
import { Module } from "@nestjs/common";
import { AuthModule } from "@oksai/nestjs-better-auth";
import { SignUpHook } from "./hooks/sign-up.hook";
import { SignUpService } from "./sign-up.service";
import { auth } from "./auth";

@Module({
  imports: [AuthModule.forRoot({ auth })],
  providers: [SignUpHook, SignUpService],
})
export class AppModule {}
```

## AuthService

`AuthService` 由 `AuthModule` 自动提供，可以注入到您的控制器中以访问 Better Auth 实例及其 API 端点。

```ts title="users.controller.ts"
import { Controller, Get, Post, Request, Body } from "@nestjs/common";
import { AuthService } from "@oksai/nestjs-better-auth";
import { fromNodeHeaders } from "better-auth/node";
import type { Request as ExpressRequest } from "express";
import { auth } from "../auth";

@Controller("users")
export class UsersController {
  constructor(private authService: AuthService<typeof auth>) {}

  @Get("accounts")
  async getAccounts(@Request() req: ExpressRequest) {
    // 将请求头传递给 auth API
    const accounts = await this.authService.api.listUserAccounts({
      headers: fromNodeHeaders(req.headers),
    });

    return { accounts };
  }

  @Post("api-keys")
  async createApiKey(@Request() req: ExpressRequest, @Body() body) {
    // 使用请求头访问插件特定功能
    // createApiKey 是插件添加的方法，不是核心 API 的一部分
    return this.authService.api.createApiKey({
      ...body,
      headers: fromNodeHeaders(req.headers),
    });
  }
}
```

当使用扩展 Auth 类型的插件时，使用泛型访问扩展功能，如上所示的 `AuthService<typeof auth>`。这确保了在使用插件特定 API 方法（如 `createApiKey`）时的类型安全。

## 请求对象访问

您可以通过请求对象访问会话和用户：

```ts
import { Controller, Get, Request } from "@nestjs/common";
import type { Request as ExpressRequest } from "express";

@Controller("users")
export class UserController {
  @Get("me")
  async getProfile(@Request() req: ExpressRequest) {
    return {
      session: req.session, // 会话已附加到请求
      user: req.user, // 用户对象已附加到请求
    };
  }
}
```

请求对象提供：

- `req.session`：包含用户数据和身份验证状态的完整会话对象
- `req.user`：从会话中用户对象的直接引用（对 Sentry 等可观察性工具很有用）

### 高级：禁用全局 AuthGuard

如果您更喜欢自己管理守卫，可以禁用全局守卫，然后按控制器/路由应用 `@UseGuards(AuthGuard)`，或通过 `APP_GUARD` 注册。

```ts title="app.module.ts"
import { Module } from "@nestjs/common";
import { AuthModule } from "@oksai/nestjs-better-auth";
import { auth } from "./auth";

@Module({
  imports: [
    AuthModule.forRoot({
      auth,
      disableGlobalAuthGuard: true,
    }),
  ],
})
export class AppModule {}
```

```ts title="app.controller.ts"
import { Controller, Get, UseGuards } from "@nestjs/common";
import { AuthGuard } from "@oksai/nestjs-better-auth";

@Controller("users")
@UseGuards(AuthGuard)
export class UserController {
  @Get("me")
  async getProfile() {
    return { message: "受保护的路由" };
  }
}
```

## 模块选项

配置 `AuthModule.forRoot()` 时，您可以提供选项来自定义行为：

```typescript
AuthModule.forRoot({
  auth,
  platform: "express", // 或 "fastify"
  disableTrustedOriginsCors: false,
  disableBodyParser: false,
  enableRawBodyParser: false,
  disableGlobalAuthGuard: false,
  disableControllers: false,
});
```

可用选项：

| 选项                        | 默认值      | 描述                                                                                                                                                                     |
| --------------------------- | ----------- | ------------------------------------------------------------------------------------------------------------------------------------------------------------------------ |
| `platform`                  | `"express"` | 使用的平台：`"express"` 或 `"fastify"`。如果未指定则自动检测。使用 Fastify 时，需安装 `@nestjs/platform-fastify` 和 `fastify`。                                            |
| `disableTrustedOriginsCors` | `false`     | 设置为 `true` 时，禁用 `trustedOrigins` 中指定的来源的自动 CORS 配置。如果您想手动处理 CORS 配置，请使用此选项。                                                            |
| `disableBodyParser`         | `false`     | 设置为 `true` 时，禁用自动 body parser 中间件。如果您想手动处理请求体解析，请使用此选项。                                                                                   |
| `enableRawBodyParser`       | `false`     | 设置为 `true` 时，启用原始请求体解析并将其附加到 `req.rawBody`。用于需要原始未解析请求体的 webhook 签名验证。**注意：** 由于此库禁用了 NestJS 的内置 body parser，NestJS 的 `rawBody: true` 选项无效 - 请改用此选项。 |
| `disableGlobalAuthGuard`    | `false`     | 设置为 `true` 时，不会将 `AuthGuard` 注册为全局守卫。如果您更喜欢手动应用 `AuthGuard` 或通过 `APP_GUARD` 自己注册，请使用此选项。                                             |
| `disableControllers`        | `false`     | 设置为 `true` 时，不会注册任何控制器。如果您想手动处理路由，请使用此选项。                                                                                                   |
| `middleware`                | `undefined` | 可选的中间件函数，包装 Better Auth 处理器。接收 `(req, res, next)` 参数。用于集成需要请求上下文的库，如 MikroORM 的 RequestContext。                                           |

### 使用自定义中间件

您可以提供一个自定义中间件函数来包装 Better Auth 处理器。这在集成需要请求上下文的库（如 MikroORM）时特别有用：

```typescript
import { RequestContext } from '@mikro-orm/core';

AuthModule.forRoot({
  auth,
  middleware: (req, res, next) => {
    RequestContext.create(orm.em, next);
  },
});
```

中间件接收标准的 Express 中间件参数 `(req, res, next)`，其中 `next` 是调用 Better Auth 处理器的函数。
