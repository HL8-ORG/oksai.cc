# NestJS Better Auth 集成设计

## 概述

将 Better Auth 认证框架无缝集成到 NestJS 应用中，提供动态模块、全局认证守卫、装饰器和钩子系统，支持 HTTP、GraphQL、WebSocket 等多种执行上下文。

## 问题陈述

Better Auth 是一个现代化的 TypeScript 认证框架，但原生设计为 Express/Fastify 中间件。NestJS 项目需要：

1. 以 NestJS 模块方式集成 Better Auth
2. 利用 NestJS 守卫和装饰器进行路由保护
3. 支持 Better Auth 插件（admin、organization 等）的角色/权限控制
4. 在多种执行上下文（HTTP、GraphQL、WebSocket）中统一认证逻辑

## 用户故事

- 作为 NestJS 开发者，我希望通过简单配置即可集成 Better Auth
- 作为 NestJS 开发者，我希望使用装饰器声明式保护路由
- 作为 NestJS 开发者，我希望在控制器中获取当前用户会话
- 作为 NestJS 开发者，我希望使用 Better Auth 插件的角色功能进行权限控制

## 技术设计

### 模块结构

```
libs/auth/nestjs-better-auth/src/
├── index.ts                 # 公共导出
├── auth-module.ts           # 主模块，注册中间件和钩子
├── auth-module-definition.ts # 动态模块定义（ConfigurableModuleBuilder）
├── auth-service.ts          # 提供 Better Auth API 访问
├── auth-guard.ts            # 全局认证守卫
├── decorators.ts            # 装饰器集合
├── middlewares.ts           # Body 解析中间件
├── utils.ts                 # 工具函数
└── symbols.ts               # 元数据 Symbol 常量
```

### 模块配置选项

```typescript
interface AuthModuleOptions {
  auth: Auth; // Better Auth 实例
  disableTrustedOriginsCors?: boolean; // 禁用自动 CORS 配置
  disableBodyParser?: boolean; // 禁用自定义 Body 解析
  enableRawBodyParser?: boolean; // 启用原始 Body（用于 webhook）
  middleware?: ExpressMiddleware; // 自定义中间件
  isGlobal?: boolean; // 全局模块
  disableGlobalAuthGuard?: boolean; // 禁用全局守卫
  disableControllers?: boolean; // 禁用控制器（仅提供守卫/服务）
}
```

### 装饰器

| 装饰器                 | 用途                              |
| ---------------------- | --------------------------------- |
| `@AllowAnonymous()`    | 允许匿名访问                      |
| `@OptionalAuth()`      | 可选认证（无会话也允许）          |
| `@Roles(['admin'])`    | 用户角色检查（admin 插件）        |
| `@OrgRoles(['owner'])` | 组织角色检查（organization 插件） |
| `@Session`             | 参数装饰器，注入会话              |
| `@Hook()`              | 类装饰器，标记为钩子提供者        |
| `@BeforeHook(path?)`   | 认证路由前置钩子                  |
| `@AfterHook(path?)`    | 认证路由后置钩子                  |

### 认证守卫逻辑

```
1. 从请求中获取会话
2. 将 session 和 user 附加到 request 对象
3. 检查 @AllowAnonymous() → 是则放行
4. 检查 @OptionalAuth() → 无会话也放行
5. 无会话 → 抛出 UNAUTHORIZED
6. 检查 @Roles() → 无匹配角色则抛出 FORBIDDEN
7. 检查 @OrgRoles() → 无匹配组织角色则抛出 FORBIDDEN
8. 放行
```

### 执行上下文支持

| 上下文    | 认证方式                        | 错误处理                                   |
| --------- | ------------------------------- | ------------------------------------------ |
| HTTP      | 从 headers 获取 session         | UnauthorizedException / ForbiddenException |
| GraphQL   | 从 GqlExecutionContext 获取 req | GraphQLError                               |
| WebSocket | 从 handshake.headers 获取       | WsException                                |
| RPC       | 从 headers 获取                 | Error                                      |

### 中间件

- **SkipBodyParsingMiddleware**：跳过 Better Auth 路由的 body 解析（Better Auth 需要原始 body）
- 可选启用 `req.rawBody` 用于 webhook 签名验证

## 边界情况

1. **函数式 trustedOrigins**：不支持，需使用数组形式或禁用 CORS
2. **无活动组织时检查 @OrgRoles()**：返回 403 Forbidden
3. **可选依赖未安装**：懒加载，使用时抛出明确错误信息
4. **钩子配置不一致**：检测到 @Hook 但未配置 hooks 时抛出错误

## 范围外

- Better Auth 实例的创建和配置
- 数据库适配器配置
- 前端客户端集成
- 自定义认证策略实现
