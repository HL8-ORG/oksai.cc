# NestJS Better Auth 集成

## 概述

@oksai/nestjs-better-auth 是一个将 Better Auth 认证框架无缝集成到 NestJS 应用的库，提供开箱即用的认证模块、全局守卫、装饰器和中间件，支持 HTTP、GraphQL、WebSocket 等多种执行上下文。

## 使用方式

### 第 1 步：安装依赖

```bash
pnpm add @oksai/nestjs-better-auth better-auth
```

**可选依赖：**
```bash
# 如果使用 GraphQL
pnpm add @nestjs/graphql graphql

# 如果使用 WebSocket
pnpm add @nestjs/websockets
```

### 第 2 步：配置 AuthModule

在 AppModule 中导入并配置 AuthModule：

```typescript
import { Module } from '@nestjs/common';
import { AuthModule } from '@oksai/nestjs-better-auth';
import { auth } from './auth.config'; // Better Auth 配置

@Module({
  imports: [
    AuthModule.forRoot({
      auth, // Better Auth 实例
      isGlobal: true, // 全局模块（默认 true）
      // 其他可选配置...
    }),
  ],
})
export class AppModule {}
```

**配置选项：**

| 选项 | 类型 | 默认值 | 说明 |
|:---|:---|:---|:---|
| auth | Auth | 必需 | Better Auth 实例 |
| isGlobal | boolean | true | 全局模块 |
| disableGlobalAuthGuard | boolean | false | 禁用全局守卫 |
| disableTrustedOriginsCors | boolean | false | 禁用自动 CORS |
| disableBodyParser | boolean | false | 禁用自定义 Body 解析 |
| enableRawBodyParser | boolean | false | 启用原始 Body（webhook） |

![AuthModule 配置示例](./screenshots/auth-module-config.png)

### 第 3 步：使用装饰器保护路由

在控制器中使用装饰器保护路由：

```typescript
import { Controller, Get, Post, Body } from '@nestjs/common';
import { 
  AllowAnonymous, 
  OptionalAuth, 
  Roles, 
  Session 
} from '@oksai/nestjs-better-auth';

@Controller('api')
export class AppController {
  // 公开路由，无需认证
  @Get('public')
  @AllowAnonymous()
  getPublicData() {
    return { message: 'This is public data' };
  }

  // 需要认证的路由
  @Get('profile')
  getProfile(@Session session: any) {
    return session.user;
  }

  // 可选认证（无会话也允许）
  @Get('optional')
  @OptionalAuth()
  getOptionalData(@Session session: any) {
    if (session) {
      return { message: `Hello, ${session.user.name}` };
    }
    return { message: 'Hello, guest' };
  }

  // 需要特定角色
  @Get('admin')
  @Roles(['admin'])
  getAdminData() {
    return { message: 'Admin only data' };
  }
}
```

![装饰器使用示例](./screenshots/decorators-usage.png)

### 第 4 步：GraphQL 集成（可选）

如果使用 GraphQL，需要配置 GraphQL Module：

```typescript
import { Module } from '@nestjs/common';
import { GraphQLModule } from '@nestjs/graphql';
import { AuthModule } from '@oksai/nestjs-better-auth';
import { auth } from './auth.config';

@Module({
  imports: [
    GraphQLModule.forRoot({
      // GraphQL 配置
    }),
    AuthModule.forRoot({ auth }),
  ],
})
export class AppModule {}
```

在 Resolver 中使用装饰器：

```typescript
import { Resolver, Query, Args, Context } from '@nestjs/graphql';
import { Roles, Session } from '@oksai/nestjs-better-auth';

@Resolver()
export class UserResolver {
  @Query(() => User)
  @Roles(['admin'])
  async getUser(@Session session: any) {
    return session.user;
  }
}
```

![GraphQL 集成示例](./screenshots/graphql-integration.png)

### 第 5 步：WebSocket 集成（可选）

如果使用 WebSocket，需要配置 WebSocket Gateway：

```typescript
import { WebSocketGateway, WebSocketServer } from '@nestjs/websockets';
import { Server } from 'socket.io';

@WebSocketGateway()
export class EventsGateway {
  @WebSocketServer()
  server: Server;

  // WebSocket 连接会自动进行认证检查
  handleConnection(client: any) {
    // client.handshake.headers 中包含认证信息
    console.log('Client connected:', client.id);
  }
}
```

![WebSocket 集成示例](./screenshots/websocket-integration.png)

### 第 6 步：钩子系统（可选）

使用钩子系统在认证流程中插入自定义逻辑：

```typescript
import { Injectable } from '@nestjs/common';
import { Hook, BeforeHook, AfterHook } from '@oksai/nestjs-better-auth';

@Injectable()
@Hook()
export class AuthHook {
  // 用户登录前执行
  @BeforeHook('/sign-in/email')
  async beforeSignIn(body: any) {
    console.log('User attempting to sign in:', body.email);
    // 可以抛出异常阻止登录
  }

  // 用户登录后执行
  @AfterHook('/sign-in/email')
  async afterSignIn(user: any, session: any) {
    console.log('User signed in:', user.email);
    // 可以记录登录日志、发送通知等
  }
}
```

在 AuthModule 中注册钩子：

```typescript
AuthModule.forRoot({
  auth,
  hooks: [AuthHook],
})
```

![钩子系统示例](./screenshots/hooks-system.png)

## 装饰器详解

### @AllowAnonymous()

允许路由无需认证即可访问。

```typescript
@Get('public')
@AllowAnonymous()
getPublicData() {
  return { message: 'Public data' };
}
```

### @OptionalAuth()

允许路由在无会话时也能访问，`@Session` 注入的参数为 `null`。

```typescript
@Get('optional')
@OptionalAuth()
getOptionalData(@Session session: any) {
  if (session) {
    return { user: session.user };
  }
  return { user: null };
}
```

### @Roles(roles)

检查用户角色（需要 Better Auth admin 插件）。

```typescript
@Get('admin')
@Roles(['admin'])
getAdminData() {
  return { message: 'Admin only' };
}
```

### @OrgRoles(roles)

检查组织角色（需要 Better Auth organization 插件）。

```typescript
@Get('org-admin')
@OrgRoles(['owner', 'admin'])
getOrgAdminData() {
  return { message: 'Org admin only' };
}
```

### @Session

参数装饰器，注入当前会话。

```typescript
@Get('profile')
getProfile(@Session session: any) {
  return {
    user: session.user,
    session: session.session,
  };
}
```

## 配置选项

### 完整配置示例

```typescript
AuthModule.forRoot({
  // 必需：Better Auth 实例
  auth: authInstance,

  // 可选：全局模块（默认 true）
  isGlobal: true,

  // 可选：禁用全局守卫（默认 false）
  disableGlobalAuthGuard: false,

  // 可选：禁用自动 CORS（默认 false）
  disableTrustedOriginsCors: false,

  // 可选：禁用自定义 Body 解析（默认 false）
  disableBodyParser: false,

  // 可选：启用原始 Body（用于 webhook，默认 false）
  enableRawBodyParser: false,

  // 可选：钩子提供者
  hooks: [AuthHook],

  // 可选：自定义中间件
  middleware: (req, res, next) => {
    console.log('Custom middleware');
    next();
  },
})
```

### 异步配置

```typescript
AuthModule.forRootAsync({
  useFactory: async (configService: ConfigService) => ({
    auth: createAuth(configService.get('AUTH_CONFIG')),
    isGlobal: true,
  }),
  inject: [ConfigService],
})
```

## 常见用例

### 用例 1：基础认证

所有路由默认需要认证，仅公开路由使用 `@AllowAnonymous()`。

```typescript
@Controller('api')
export class ApiController {
  @Get('public')
  @AllowAnonymous()
  getPublic() {
    return { message: 'Public' };
  }

  @Get('private')
  getPrivate(@Session session: any) {
    return { user: session.user };
  }
}
```

### 用例 2：基于角色的访问控制

使用 `@Roles()` 和 `@OrgRoles()` 实现细粒度权限控制。

```typescript
@Controller('admin')
export class AdminController {
  @Get('dashboard')
  @Roles(['admin'])
  getDashboard() {
    return { message: 'Admin dashboard' };
  }

  @Get('org-settings')
  @OrgRoles(['owner'])
  getOrgSettings() {
    return { message: 'Organization settings' };
  }
}
```

### 用例 3：可选认证

某些功能在登录和未登录时都可用，但行为不同。

```typescript
@Controller('content')
export class ContentController {
  @Get('feed')
  @OptionalAuth()
  getFeed(@Session session: any) {
    if (session) {
      // 返回个性化内容
      return getPersonalizedFeed(session.user.id);
    }
    // 返回通用内容
    return getGeneralFeed();
  }
}
```

### 用例 4：审计日志

使用钩子系统记录用户行为。

```typescript
@Injectable()
@Hook()
export class AuditLogHook {
  constructor(private readonly auditService: AuditService) {}

  @AfterHook('/sign-in/email')
  async afterSignIn(user: any, session: any) {
    await this.auditService.log({
      action: 'sign-in',
      userId: user.id,
      timestamp: new Date(),
    });
  }
}
```

### 用例 5：自定义认证逻辑

组合多个装饰器实现复杂认证逻辑。

```typescript
// 自定义装饰器
export function AdminOnly() {
  return function (target: any, key: string, descriptor: PropertyDescriptor) {
    Roles(['admin'])(target, key, descriptor);
  };
}

// 使用
@Controller('admin')
export class AdminController {
  @Get('users')
  @AdminOnly()
  getUsers() {
    return this.userService.findAll();
  }
}
```

## 常见问题

### Q1: 为什么所有路由都需要认证？

**A:** 这是安全默认设置。使用 `@AllowAnonymous()` 标记公开路由。

### Q2: 如何在 GraphQL 中使用？

**A:** 确保安装了 `@nestjs/graphql`，装饰器会自动处理 GraphQL 上下文。

### Q3: 组织角色检查失败怎么办？

**A:**
1. 确认 Better Auth organization 插件已启用
2. 确认用户已加入组织
3. 确认组织 ID 正确传递

### Q4: 如何禁用全局守卫？

**A:** 配置 `disableGlobalAuthGuard: true`，然后手动使用 `@UseGuards(AuthGuard)`。

### Q5: 如何调试认证问题？

**A:**
1. 启用 NestJS 日志（设置 `logger: ['debug']`）
2. 检查请求头中的 session token
3. 在守卫中添加 `console.log` 调试

### Q6: 支持 Fastify 吗？

**A:** 当前仅支持 Express 适配器，Fastify 支持计划在 Phase 2 实现。

## 技术架构

- **动态模块**：使用 ConfigurableModuleBuilder
- **全局守卫**：默认保护所有路由
- **装饰器**：元数据驱动的认证控制
- **懒加载**：可选依赖仅在需要时加载
- **多上下文**：支持 HTTP、GraphQL、WebSocket、RPC

## 相关文档

- [集成设计文档](../design.md)
- [实现进度](../implementation.md)
- [架构决策](../decisions.md)
- [开发工作流程](../../_templates/workflow.md)
- [项目完成报告](./PROJECT-COMPLETION-REPORT.md)

---

**文档版本：** 2.0.0  
**最后更新：** 2026年3月3日  
**维护者：** oksai.cc 团队
