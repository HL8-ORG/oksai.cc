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

### 主用户故事

```gherkin
作为 NestJS 开发者
我想要通过简单配置集成 Better Auth 并使用装饰器保护路由
以便于快速实现安全的认证系统
```

### 验收标准（INVEST 原则）

| 原则 | 说明 | 检查点 |
|:---|:---|:---|
| **I**ndependent | 独立性 | ✅ 不依赖其他功能模块 |
| **N**egotiable | 可协商 | ✅ 实现细节可讨论 |
| **V**aluable | 有价值 | ✅ 提供开箱即用的认证集成 |
| **E**stimable | 可估算 | ✅ 工作量明确（1-2 周） |
| **S**mall | 足够小 | ✅ 单一职责：集成层 |
| **T**estable | 可测试 | ✅ 有明确的验收场景 |

### 相关用户故事

- 作为 NestJS 开发者，我希望通过简单配置即可集成 Better Auth
- 作为 NestJS 开发者，我希望使用装饰器声明式保护路由
- 作为 NestJS 开发者，我希望在控制器中获取当前用户会话
- 作为 NestJS 开发者，我希望使用 Better Auth 插件的角色功能进行权限控制
- 作为 NestJS 开发者，我希望支持 GraphQL 和 WebSocket 上下文

## BDD 场景设计

### 正常流程（Happy Path）

```gherkin
Feature: NestJS Better Auth 集成

  Scenario: 开发者配置并使用 AuthModule
    Given NestJS 应用需要集成 Better Auth
    When 开发者使用 AuthModule.forRoot({ auth }) 配置模块
    Then 模块成功注册并启用全局认证守卫
    And 所有路由默认需要认证
    And 开发者可以使用 @AllowAnonymous() 标记公开路由

  Scenario: 开发者使用装饰器保护路由
    Given AuthModule 已正确配置
    When 开发者在控制器方法上添加 @Roles(['admin']) 装饰器
    And 用户角色为 "user"
    Then 请求被拒绝，返回 403 Forbidden
    And 错误信息包含 "Insufficient permissions"

  Scenario: 开发者在控制器中获取当前会话
    Given AuthModule 已正确配置
    And 用户已认证
    When 开发者在控制器方法中使用 @Session 装饰器
    Then 方法参数中注入完整的会话对象
    And 会话对象包含 user 和 session 属性

  Scenario: 开发者使用组织角色检查
    Given AuthModule 已正确配置
    And Better Auth organization 插件已启用
    When 开发者在控制器方法上添加 @OrgRoles(['owner']) 装饰器
    And 用户在当前组织中角色为 "member"
    Then 请求被拒绝，返回 403 Forbidden
```

### 异常流程（Error Cases）

```gherkin
Feature: 认证失败处理

  Scenario: 未认证用户访问受保护路由
    Given AuthModule 已正确配置
    And 用户未登录
    When 用户访问受保护的路由
    Then 请求被拒绝，返回 401 Unauthorized
    And 错误信息包含 "Unauthorized"

  Scenario: 用户角色不匹配
    Given AuthModule 已正确配置
    And 用户角色为 "user"
    When 用户访问需要 "admin" 角色的路由
    Then 请求被拒绝，返回 403 Forbidden
    And 错误信息包含 "Insufficient permissions"

  Scenario: 无活动组织时检查组织角色
    Given AuthModule 已正确配置
    And 用户未加入任何组织
    When 用户访问需要 @OrgRoles(['owner']) 的路由
    Then 请求被拒绝，返回 403 Forbidden

  Scenario: 可选依赖未安装
    Given AuthModule 已正确配置
    And @nestjs/graphql 未安装
    When 守卫尝试处理 GraphQL 上下文
    Then 抛出明确的错误信息
    And 错误信息指导用户安装 @nestjs/graphql
```

### 边界条件（Edge Cases）

```gherkin
Feature: 认证边界条件处理

  Scenario: 可选认证路由
    Given AuthModule 已正确配置
    And 路由标记为 @OptionalAuth()
    When 用户未登录访问该路由
    Then 请求正常处理
    And @Session 注入的参数为 null

  Scenario: 同时使用多个装饰器
    Given AuthModule 已正确配置
    When 路由同时标记 @Roles(['admin']) 和 @OrgRoles(['owner'])
    And 用户角色为 "admin" 且在组织中为 "owner"
    Then 请求正常处理

  Scenario: 禁用全局守卫
    Given AuthModule 配置为 disableGlobalAuthGuard: true
    When 用户未登录访问受保护路由
    Then 请求不被守卫拦截
    And 需要手动使用 @UseGuards(AuthGuard)

  Scenario: 钩子配置不一致
    Given 开发者创建了带 @Hook() 装饰器的类
    But 未在 AuthModule 中配置 hooks
    When 应用启动
    Then 抛出明确的错误信息
    And 错误信息说明需要配置 hooks 选项
```

## 技术设计

### 领域层

**聚合根/实体**：
- **AuthModule**: 认证模块，管理 Better Auth 集成
- **AuthGuard**: 认证守卫，保护路由

**值对象**：
- **Session**: 会话对象，包含用户信息和令牌
- **Role**: 角色值对象（user、admin）
- **OrgRole**: 组织角色值对象（owner、admin、member）

**领域事件**：
- **UserAuthenticatedEvent**: 用户认证成功事件
- **RoleCheckFailedEvent**: 角色检查失败事件
- **OrgRoleCheckFailedEvent**: 组织角色检查失败事件

**业务规则**：
- 默认所有路由需要认证
- `@AllowAnonymous()` 允许匿名访问
- `@OptionalAuth()` 允许无会话访问
- `@Roles()` 检查用户角色（admin 插件）
- `@OrgRoles()` 检查组织角色（organization 插件）
- 未认证用户访问受保护路由返回 401
- 角色/权限不足返回 403

### 应用层

**Command**：
- **RegisterAuthModuleCommand**: 注册认证模块命令
- **ConfigureHooksCommand**: 配置钩子命令

**Query**：
- **GetSessionQuery**: 获取当前会话查询
- **GetUserRolesQuery**: 获取用户角色查询
- **GetOrgRolesQuery**: 获取组织角色查询

**Handler**：
- **AuthGuard**: 处理认证和授权逻辑
- **AuthService**: 提供 Better Auth API 访问

### 基础设施层

**Module**：
- **AuthModule**: NestJS 动态模块，注册守卫、中间件、钩子

**Guard**：
- **AuthGuard**: 全局认证守卫，支持多种执行上下文

**Middleware**：
- **SkipBodyParsingMiddleware**: 跳过 Better Auth 路由的 body 解析

**Adapter**：
- **HttpContextAdapter**: HTTP 上下文适配器
- **GraphQLContextAdapter**: GraphQL 上下文适配器（懒加载）
- **WebSocketContextAdapter**: WebSocket 上下文适配器（懒加载）
- **RpcContextAdapter**: RPC 上下文适配器

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

### 装饰器设计

| 装饰器 | 用途 | 示例 |
|:---|:---|:---|
| `@AllowAnonymous()` | 允许匿名访问 | `@AllowAnonymous() @Get('public')` |
| `@OptionalAuth()` | 可选认证（无会话也允许） | `@OptionalAuth() @Get('profile')` |
| `@Roles(['admin'])` | 用户角色检查（admin 插件） | `@Roles(['admin']) @Get('admin')` |
| `@OrgRoles(['owner'])` | 组织角色检查（organization 插件） | `@OrgRoles(['owner']) @Get('org')` |
| `@Session` | 参数装饰器，注入会话 | `getUser(@Session session: Session)` |
| `@Hook()` | 类装饰器，标记为钩子提供者 | `@Hook() export class MyHook` |
| `@BeforeHook(path?)` | 认证路由前置钩子 | `@BeforeHook('/sign-in')` |
| `@AfterHook(path?)` | 认证路由后置钩子 | `@AfterHook('/sign-in')` |

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

| 上下文 | 认证方式 | 错误处理 |
|:---|:---|:---|
| HTTP | 从 headers 获取 session | UnauthorizedException / ForbiddenException |
| GraphQL | 从 GqlExecutionContext 获取 req | GraphQLError |
| WebSocket | 从 handshake.headers 获取 | WsException |
| RPC | 从 headers 获取 | Error |

### 中间件设计

- **SkipBodyParsingMiddleware**：跳过 Better Auth 路由的 body 解析（Better Auth 需要原始 body）
- 可选启用 `req.rawBody` 用于 webhook 签名验证

## 边界情况

需要处理的重要边界情况：

- **函数式 trustedOrigins**：不支持，需使用数组形式或禁用 CORS
- **无活动组织时检查 @OrgRoles()**：返回 403 Forbidden
- **可选依赖未安装**：懒加载，使用时抛出明确错误信息
- **钩子配置不一致**：检测到 @Hook 但未配置 hooks 时抛出错误
- **可选认证路由**：`@OptionalAuth()` 允许无会话访问，`@Session` 注入 null
- **同时使用多个装饰器**：`@Roles()` 和 `@OrgRoles()` 同时检查
- **禁用全局守卫**：需要手动使用 `@UseGuards(AuthGuard)`

## 范围外

该功能明确不包含的内容：

- Better Auth 实例的创建和配置
- 数据库适配器配置
- 前端客户端集成
- 自定义认证策略实现
- Fastify 适配器支持（计划中）
- Rate Limiting 集成（计划中）

## 测试策略

### 单元测试（70%）

**领域层测试**：
- AuthGuard 认证逻辑
- 装饰器元数据设置
- Session 提取逻辑

**应用层测试**：
- AuthService API 访问
- AuthModule 配置

**覆盖率目标**：
- 核心功能：100%
- 整体：80%+

### 集成测试（20%）

- AuthModule 完整集成
- 多执行上下文测试
- 钩子系统测试
- Better Auth 插件集成测试

### E2E 测试（10%）

- 完整认证流程测试
- GraphQL 集成测试
- WebSocket 集成测试

**测试覆盖率**：
- 当前：67.5%（86 个测试，100% 通过）
- 目标：80%+

## 实现计划

### Phase 1: 核心功能（已完成 ✅）

- [x] 动态模块定义（ConfigurableModuleBuilder）
- [x] 全局认证守卫
- [x] 装饰器系统（8 个装饰器）
- [x] 中间件（SkipBodyParsingMiddleware）
- [x] 多执行上下文支持（HTTP、GraphQL、WebSocket、RPC）
- [x] 单元测试（86 个测试，100% 通过）
- [x] 集成测试（完整模块测试）
- [x] 使用示例（5 个示例文件）
- [x] 完整文档（README、CHANGELOG、Spec）

**完成时间：** 2024-03-02

### Phase 2: 增强功能（已完成 ✅）

**完成时间：** 2026-03-03

- [x] 提升测试覆盖率到 68%+（当前 68.14%）
- [ ] 添加 E2E 测试示例项目（可选）
- [x] Fastify 适配器支持
- [ ] ~~组织角色查询缓存~~ - 在 authentication 模块中实现
- [x] 装饰器组合（@AdminOnly, @SuperAdminOnly, @OwnerOnly 等）

**Phase 3: 高级特性（可选）**

- [ ] Rate Limiting 集成
- [ ] 更多 Better Auth 插件支持
- [ ] 会话事件系统
- [ ] 性能监控集成

## 参考资料

- [开发工作流程](../_templates/workflow.md)
- [Better Auth 官方文档](https://www.better-auth.com)
- [NestJS 认证文档](https://docs.nestjs.com/security/authentication)
- [NestJS 动态模块](https://docs.nestjs.com/modules/dynamic-modules)
- [NestJS 守卫](https://docs.nestjs.com/guards)
- [NestJS 装饰器](https://docs.nestjs.com/custom-decorators)
