# NestJS Better Auth 集成决策

## ADR-001：使用 ConfigurableModuleBuilder 构建动态模块

### 背景

NestJS 模块需要支持同步和异步配置两种方式，且需要提供合理的默认值。

### 备选方案

1. 手动实现 DynamicModule — 灵活但样板代码多
2. ConfigurableModuleBuilder — NestJS 官方推荐，减少样板代码

### 决策

使用 ConfigurableModuleBuilder，提供：

- `forRoot()` 同步配置
- `forRootAsync()` 异步配置
- 默认 `isGlobal: true`
- 额外选项如 `disableGlobalAuthGuard`

### 影响

- 代码更简洁
- 遵循 NestJS 最佳实践
- 用户配置更直观

## ADR-002：全局 AuthGuard 作为默认认证方式

### 背景

需要在所有路由上默认启用认证，同时支持公开路由。

### 备选方案

1. 每个控制器手动添加 @UseGuards(AuthGuard) — 繁琐易遗漏
2. 全局守卫 + @Public() 装饰器标记公开路由 — 更安全

### 决策

全局注册 AuthGuard，通过 `@AllowAnonymous()` 标记公开路由。
提供 `disableGlobalAuthGuard: true` 选项允许禁用。

### 影响

- 默认安全（默认需要认证）
- 减少样板代码
- 显式声明公开路由更清晰

## ADR-003：懒加载可选依赖

### 背景

@nestjs/graphql 和 @nestjs/websockets 是可选依赖，但守卫需要支持这些上下文。

### 备选方案

1. 强制依赖 — 增加用户安装负担
2. peerDependencies + optional — 仍需用户安装
3. 运行时懒加载 — 无需用户安装

### 决策

使用 `require()` 懒加载，仅在需要时加载。
若未安装，抛出明确的错误信息指导用户安装。

### 影响

- 减少必需依赖
- 仅在使用 GraphQL/WebSocket 时才需要安装对应包
- 错误信息清晰

## ADR-004：分离用户角色和组织角色检查

### 背景

Better Auth 的 admin 插件和 organization 插件都有角色概念。

### 备选方案

1. 统一 @Roles() 检查所有角色 — 混淆系统级和组织级角色
2. 分离 @Roles() 和 @OrgRoles() — 职责清晰

### 决策

- `@Roles()` — 检查 `user.role`（系统级，admin 插件）
- `@OrgRoles()` — 检查组织成员角色（organization 插件）

### 影响

- 职责分离，语义清晰
- 支持同时使用两种角色系统
