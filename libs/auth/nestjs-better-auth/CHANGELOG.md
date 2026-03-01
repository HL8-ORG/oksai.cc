# @oksai/nestjs-better-auth 变更日志

所有重要的变更都将记录在此文件中。

本项目遵循 [语义化版本](https://semver.org/lang/zh-CN/)。

## [1.0.0] - 2024-03-02

### 新增

#### 核心功能

- ✨ 动态模块 `AuthModule` 支持 `forRoot` 和 `forRootAsync` 配置
- ✨ 全局认证守卫 `AuthGuard` 自动保护所有路由
- ✨ `AuthService` 提供访问 Better Auth API 和实例
- ✨ 多上下文支持：HTTP, GraphQL, WebSocket, RPC

#### 装饰器

- ✨ `@AllowAnonymous()` - 允许匿名访问
- ✨ `@OptionalAuth()` - 可选认证
- ✨ `@Roles()` - 用户角色限制（Better Auth admin 插件）
- ✨ `@OrgRoles()` - 组织角色限制（Better Auth organization 插件）
- ✨ `@Session()` - 会话参数注入
- ✨ `@Hook()` - 钩子类标记
- ✨ `@BeforeHook()` - 认证路由前置钩子
- ✨ `@AfterHook()` - 认证路由后置钩子

#### 中间件

- ✨ `SkipBodyParsingMiddleware` - 自动跳过 Better Auth 路由的 body 解析
- ✨ `enableRawBodyParser` 选项支持 webhook 签名验证

#### 配置选项

- ✨ `isGlobal` - 全局模块配置
- ✨ `disableGlobalAuthGuard` - 禁用全局守卫
- ✨ `disableControllers` - 禁用控制器
- ✨ `disableTrustedOriginsCors` - 禁用自动 CORS 配置
- ✨ `disableBodyParser` - 禁用自定义 body 解析
- ✨ `middleware` - 自定义中间件支持

### 测试

#### 单元测试

- ✅ AuthService 测试（5 个测试，100% 覆盖）
- ✅ AuthGuard 测试（13 个测试，64.21% 覆盖）
- ✅ Decorators 测试（19 个测试，93.1% 覆盖）

#### 集成测试

- ✅ AuthModule 集成测试（9 个测试）
- ✅ forRoot 和 forRootAsync 配置测试
- ✅ 依赖注入测试
- ✅ 模块配置选项测试

**总体测试覆盖率: 59.16%**

### 文档

- 📝 完整的 README.md 用户指南
- 📝 5 个使用示例：
  - 基础使用
  - 角色和权限
  - 钩子系统
  - GraphQL 集成
  - WebSocket 集成

### 兼容性

#### 支持的运行时

- Node.js >= 18.0.0
- NestJS ^11.1.14
- Better Auth >= 1.5.0
- Express ^5.2.1

#### 可选依赖

- @nestjs/graphql（GraphQL 支持）
- @nestjs/websockets（WebSocket 支持）
- graphql（GraphQL 支持）

### 已知限制

1. **Fastify 适配器** - 当前仅支持 Express 适配器
2. **函数式 trustedOrigins** - 不支持，需使用数组形式
3. **组织角色缓存** - 每次请求都会查询组织角色

### 弃用

- ⚠️ `@Public()` - 使用 `@AllowAnonymous()` 代替
- ⚠️ `@Optional()` - 使用 `@OptionalAuth()` 代替

---

## 未来计划

### [1.1.0] - 计划中

#### 增强功能

- 🔧 Fastify 适配器支持
- 🔧 函数式 trustedOrigins 支持
- 🔧 组织角色查询缓存
- 🔧 装饰器组合（如 `@AdminOnly`）
- 🔧 会话事件（登录、登出、注册）的 NestJS 事件

#### 优化

- 🔧 WebSocket 连接级认证缓存
- 🔧 Rate Limiting 集成

#### 测试

- 📝 E2E 测试示例项目
- 📝 提升测试覆盖率到 80%+

---

## 贡献

欢迎贡献！请查看 [贡献指南](./CONTRIBUTING.md)。

## 许可证

本项目采用 MIT 许可证 - 详见 [LICENSE](./LICENSE) 文件。
