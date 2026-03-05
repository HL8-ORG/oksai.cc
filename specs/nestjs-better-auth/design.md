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

  Scenario: 开发者使用组合装饰器
    Given AuthModule 已正确配置
    And Better Auth organization 插件已启用
    When 开发者在控制器方法上添加 @OwnerOnly() 装饰器
    Then 等同于添加 @OrgRoles(['owner']) 装饰器
    And 只有组织所有者可以访问

  Scenario: 开发者在 Fastify 平台使用认证
    Given AuthModule 配置为 platform: 'fastify'
    When 应用启动
    Then 自动使用 Fastify 中间件
    And 认证功能正常工作
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

### 架构模式

本库采用 **NestJS 标准模式** 而非复杂的 DDD/CQRS，以保持简洁和与 NestJS 生态的一致性：

- **模块系统**：使用 ConfigurableModuleBuilder 构建动态模块
- **守卫模式**：全局 AuthGuard + 装饰器控制
- **中间件模式**：平台特定的中间件（Express/Fastify）
- **装饰器模式**：元数据驱动认证逻辑

### 核心组件

**Module**：
- **AuthModule**: NestJS 动态模块，注册守卫、中间件、钩子
- **ConfigurableModuleBuilder**: 支持同步/异步配置

**Guard**：
- **AuthGuard**: 全局认证守卫，支持多种执行上下文
  - HTTP/GraphQL/WebSocket/RPC 上下文自动识别
  - 可选依赖懒加载（graphql、@nestjs/websockets）

**Service**：
- **AuthService**: 提供 Better Auth API 和实例访问
- 支持泛型以扩展插件类型

**Middleware**：
- **SkipBodyParsingMiddleware**: Express 平台，跳过 Better Auth 路由的 body 解析
- **SkipBodyParsingMiddlewareFastify**: Fastify 平台对应的中间件

**类型定义**：
- **UserSession**: 用户会话类型
- **BaseAuthAPI**: 基础认证 API
- **OrganizationAuthAPI**: 组织插件 API（13个方法）
- **AdminAuthAPI**: 管理员插件 API（5个方法）
- **TwoFactorAuthAPI**: 双因素认证插件 API（3个方法）

### 业务规则

- 默认所有路由需要认证
- `@AllowAnonymous()` 允许匿名访问
- `@OptionalAuth()` 允许无会话访问
- `@Roles()` 检查用户角色（admin 插件）
- `@OrgRoles()` 检查组织角色（organization 插件）
- 未认证用户访问受保护路由返回 401
- 角色/权限不足返回 403

### 模块结构

```
libs/auth/nestjs-better-auth/src/
├── index.ts                   # 公共导出
├── auth-module.ts             # 主模块，注册中间件和钩子
├── auth-module-definition.ts  # 动态模块定义（ConfigurableModuleBuilder）
├── auth-service.ts            # 提供 Better Auth API 访问
├── auth-guard.ts              # 全局认证守卫
├── decorators.ts              # 装饰器集合（8个基础 + 5个组合）
├── better-auth-types.ts       # Better Auth 插件类型定义
├── middlewares.ts             # Express Body 解析中间件
├── middlewares-fastify.ts     # Fastify Body 解析中间件
├── utils.ts                   # 工具函数（多上下文请求提取）
└── symbols.ts                 # 元数据 Symbol 常量
```

### 模块配置选项

```typescript
interface AuthModuleOptions {
  auth: Auth; // Better Auth 实例
  platform?: 'express' | 'fastify'; // 平台类型（自动检测）
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

#### 基础装饰器（8个）

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

#### 组合装饰器（5个便捷方法）

| 装饰器 | 等价于 | 用途 |
|:---|:---|:---|
| `@AdminOnly()` | `@Roles(['admin'])` | 系统管理员专用 |
| `@SuperAdminOnly()` | `@Roles(['superadmin'])` | 超级管理员专用 |
| `@OwnerOnly()` | `@OrgRoles(['owner'])` | 组织所有者专用 |
| `@OrgAdminOnly()` | `@OrgRoles(['owner', 'admin'])` | 组织管理员及以上 |
| `@MemberOnly()` | `@OrgRoles(['owner', 'admin', 'member'])` | 组织成员及以上 |

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

**平台自动检测**：通过 `HttpAdapterHost` 检测 Express/Fastify 平台

### 中间件设计

#### Express 平台
- **SkipBodyParsingMiddleware**：跳过 Better Auth 路由的 body 解析
- 可选启用 `req.rawBody` 用于 webhook 签名验证

#### Fastify 平台
- **SkipBodyParsingMiddlewareFastify**：Fastify 版本的 body 解析中间件
- 自动检测平台类型并应用对应中间件

## 边界情况

需要处理的重要边界情况：

- **函数式 trustedOrigins**：不支持，需使用数组形式或禁用 CORS
- **无活动组织时检查 @OrgRoles()**：返回 403 Forbidden
- **可选依赖未安装**：懒加载，使用时抛出明确错误信息
- **钩子配置不一致**：检测到 @Hook 但未配置 hooks 时抛出错误
- **可选认证路由**：`@OptionalAuth()` 允许无会话访问，`@Session` 注入 null
- **同时使用多个装饰器**：`@Roles()` 和 `@OrgRoles()` 同时检查
- **禁用全局守卫**：需要手动使用 `@UseGuards(AuthGuard)`
- **平台自动检测失败**：默认使用 Express，可通过 `platform` 选项强制指定

## 范围外

该功能明确不包含的内容：

- Better Auth 实例的创建和配置
- 数据库适配器配置
- 前端客户端集成
- 自定义认证策略实现
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
- 当前：**67.53%**（143 个测试通过，1 个跳过）
  - 单元测试：116 个
  - E2E 测试：21 个
  - WebSocket/GraphQL 测试：6 个
- 目标：80%+

**各文件覆盖率**：
| 文件 | 覆盖率 | 状态 |
|------|--------|------|
| middlewares.ts | 100% | ✅ |
| middlewares-fastify.ts | 100% | ✅ |
| auth-module-definition.ts | 100% | ✅ |
| auth-service.ts | 100% | ✅ |
| symbols.ts | 100% | ✅ |
| utils.ts | 90.9% | ✅ |
| decorators.ts | 92.3% | ✅ |
| auth-guard.ts | 73.56% | 🚧 |
| auth-module.ts | 35.21% | ⚠️ |

## 实现计划

### Phase 1: 核心功能（已完成 ✅）

- [x] 动态模块定义（ConfigurableModuleBuilder）
- [x] 全局认证守卫
- [x] 装饰器系统（8 个基础装饰器）
- [x] 中间件（SkipBodyParsingMiddleware）
- [x] 多执行上下文支持（HTTP、GraphQL、WebSocket、RPC）
- [x] 单元测试（86 个测试，100% 通过）
- [x] 集成测试（完整模块测试）
- [x] 使用示例（5 个示例文件）
- [x] 完整文档（README、CHANGELOG、Spec）

**完成时间：** 2024-03-02

### Phase 2: 增强功能（已完成 ✅）

**完成时间：** 2026-03-03

- [x] 提升测试覆盖率到 67%+（当前 67.53%）
- [x] 添加 E2E 测试（21 个测试）
- [x] Fastify 适配器支持
  - [x] SkipBodyParsingMiddlewareFastify
  - [x] 平台自动检测
- [x] 装饰器组合（5个便捷装饰器）
  - [x] @AdminOnly, @SuperAdminOnly
  - [x] @OwnerOnly, @OrgAdminOnly, @MemberOnly
- [x] 测试框架迁移（Jest → Vitest）
- [x] 使用示例更新（7 个示例文件）

**Phase 3: Better Auth 插件类型支持（已完成 ✅）**

**完成时间：** 2026-03-03

- [x] Better Auth 插件类型定义（better-auth-types.ts）
  - [x] OrganizationAuthAPI（13 个方法）
  - [x] AdminAuthAPI（5 个方法）
  - [x] TwoFactorAuthAPI（3 个方法）
- [x] 类型守卫函数
  - [x] hasOrganizationPlugin()
  - [x] hasAdminPlugin()
  - [x] hasTwoFactorPlugin()
- [x] 构建优化（外部化可选依赖）
- [x] 类型导出和使用示例

**Phase 4: 支持 Better Auth 插件迁移（计划中 🚀）**

> **参考**: [docs/auth-optimization-plan.md](../../docs/auth-optimization-plan.md)

**目标**: 为 Phase 5 的 Better Auth 插件迁移提供类型和工具支持

**待完成任务：**
- [ ] 扩展插件类型定义
  - [ ] ApiKeyAuthAPI - API Key 插件类型（~10 个方法）
  - [ ] OAuthProviderAuthAPI - OAuth Provider 插件类型（~15 个方法）
- [ ] 添加类型守卫函数
  - [ ] hasApiKeyPlugin()
  - [ ] hasOAuthProviderPlugin()
- [ ] 更新 AuthService 泛型支持
  - [ ] 支持泛型以扩展插件类型
  - [ ] 提供插件类型推断
- [ ] 创建插件集成示例
  - [ ] API Key 插件使用示例
  - [ ] Admin 插件使用示例
  - [ ] OAuth Provider 插件使用示例
- [ ] 添加装饰器支持
  - [ ] @RequireApiKeyPermission() - API Key 权限检查
  - [ ] @RequireAdminRole() - Admin 角色检查（增强现有 @Roles）

**预计工作量：** 1-2 周

**Phase 5: 高级特性（可选）**

- [ ] 提升测试覆盖率到 80%+
  - [ ] auth-module.ts E2E 测试
  - [ ] GraphQL/WebSocket 错误处理测试
- [ ] Rate Limiting 集成
- [ ] 更多 Better Auth 插件支持（anonymous、passkey、magic-link）
- [ ] 会话事件系统
- [ ] 性能监控集成

## 参考资料

- [开发工作流程](../_templates/workflow.md)
- [Better Auth 官方文档](https://www.better-auth.com)
- [NestJS 认证文档](https://docs.nestjs.com/security/authentication)
- [NestJS 动态模块](https://docs.nestjs.com/modules/dynamic-modules)
- [NestJS 守卫](https://docs.nestjs.com/guards)
- [NestJS 装饰器](https://docs.nestjs.com/custom-decorators)
