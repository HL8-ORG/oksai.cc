# Better Auth 集成指南

> 基于 [Better Auth NestJS 官方文档](https://better-auth.com/docs/integrations/nestjs)

## ✅ 实现状态

当前实现已完全遵循官方最佳实践：

- ✅ 禁用 NestJS 内置 body parser
- ✅ 使用 `@oksai/nestjs-better-auth` 模块（基于 `@oksai/nestjs-better-auth` 复刻）
- ✅ 全局 AuthGuard 保护所有路由
- ✅ 支持装饰器控制访问权限
- ✅ 自动 CORS 配置

## 🚀 快速开始

### 1. 启动基础设施

```bash
# 启动 PostgreSQL 和 Redis
docker-compose -f docker/docker-compose.yml up -d postgres redis

# 运行数据库迁移
pnpm db:push
```

### 2. 启动服务

```bash
pnpm dev
```

服务将在 `http://localhost:3000` 启动。

### 3. 测试认证

```bash
# 方式 1：使用测试脚本
tsx apps/gateway/test-auth.ts

# 方式 2：手动测试

# 健康检查（公开）
curl http://localhost:3000/api/health

# 用户注册
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456!","name":"Test User"}'

# 用户登录
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456!"}'

# 获取当前用户（需要认证）
curl http://localhost:3000/api/users/me \
  -H "Cookie: <session-cookie>"
```

## 📚 API 端点

### 认证端点（Better Auth 自动提供）

| 方法 | 路径                        | 描述                        |
| ---- | --------------------------- | --------------------------- |
| POST | `/api/auth/sign-up/email`   | 邮箱注册                    |
| POST | `/api/auth/sign-in/email`   | 邮箱登录                    |
| POST | `/api/auth/sign-in/social`  | OAuth 登录（GitHub/Google） |
| POST | `/api/auth/sign-out`        | 登出                        |
| GET  | `/api/auth/session`         | 获取当前会话                |
| GET  | `/api/auth/callback/github` | GitHub OAuth 回调           |
| GET  | `/api/auth/callback/google` | Google OAuth 回调           |

### 应用端点

| 方法 | 路径                  | 认证 | 描述         |
| ---- | --------------------- | ---- | ------------ |
| GET  | `/api/health`         | ❌   | 健康检查     |
| GET  | `/api`                | ✅   | API 根路由   |
| GET  | `/api/users/me`       | ✅   | 获取当前用户 |
| GET  | `/api/users/public`   | ❌   | 公开路由示例 |
| GET  | `/api/users/optional` | ⚠️   | 可选认证示例 |

## 🎯 装饰器使用

### @AllowAnonymous() - 允许匿名访问

```typescript
@Get('public')
@AllowAnonymous()
async getPublic() {
  return { message: 'Public route' };
}
```

### @OptionalAuth() - 可选认证

```typescript
@Get('optional')
@OptionalAuth()
async getOptional(@Session() session: UserSession) {
  return { authenticated: !!session };
}
```

### @Session() - 获取会话信息

```typescript
@Get('me')
async getProfile(@Session() session: UserSession) {
  return { user: session.user };
}
```

### @Roles() - 角色控制

```typescript
@Get('admin')
@Roles(['admin'])
async getAdminData() {
  return { data: 'Admin only' };
}
```

### @OrgRoles() - 组织角色控制

```typescript
@Get('org-admin')
@OrgRoles(['owner', 'admin'])
async getOrgAdminData() {
  return { data: 'Organization admins only' };
}
```

## 🔧 配置选项

### AuthModule.forRoot() 配置

```typescript
AuthModule.forRoot({
  auth, // Better Auth 实例（必需）
  isGlobal: true, // 全局模块（默认 true）
  disableGlobalAuthGuard: false, // 禁用全局守卫（默认 false）
  disableTrustedOriginsCors: false, // 禁用自动 CORS（默认 false）
  disableBodyParser: false, // 禁用 Body 解析中间件（默认 false）
  enableRawBodyParser: false, // 启用原始 Body 解析（默认 false）
});
```

### 环境变量

```env
# 数据库
DATABASE_URL=postgresql://oksai:oksai_dev_password@localhost:5432/oksai

# Better Auth
BETTER_AUTH_SECRET=your-secret-key-minimum-32-characters-long
BETTER_AUTH_URL=http://localhost:3000

# CORS
CORS_ORIGIN=http://localhost:5173
```

## 📖 架构说明

### 1. Body Parser 处理

- **NestJS**: `bodyParser: false` - 禁用内置解析器
- **Better Auth**: 自动处理原始请求体
- **应用**: 通过 `SkipBodyParsingMiddleware` 跳过认证路由

### 2. CORS 配置

- **位置**: 由 `AuthModule` 自动配置
- **来源**: 读取 `auth.trustedOrigins`
- **注意**: 不要在 `main.ts` 手动配置 CORS，否则会冲突

### 3. 全局守卫

- **默认**: 所有路由都需要认证
- **例外**: 使用 `@AllowAnonymous()` 或 `@OptionalAuth()`
- **行为**: 自动附加 `session` 和 `user` 到 `request` 对象

### 4. 错误处理

AuthGuard 根据上下文类型返回不同的错误：

| 上下文    | 未认证错误       | 权限不足错误  |
| --------- | ---------------- | ------------- |
| HTTP      | 401 Unauthorized | 403 Forbidden |
| GraphQL   | GraphQLError     | GraphQLError  |
| WebSocket | WsException      | WsException   |
| RPC       | Error            | Error         |

## 🔒 安全最佳实践

1. **密钥管理**:
   - 使用强密钥（至少 32 字符）
   - 生产环境从环境变量读取
   - 定期轮换密钥

2. **CORS 配置**:
   - 只允许可信域名
   - 生产环境使用 HTTPS
   - 不要使用 `*` 通配符

3. **会话管理**:
   - 设置合理的过期时间
   - 启用 cookie 缓存
   - 实现会话撤销机制

4. **密码策略**:
   - 强制最小密码长度
   - 建议启用邮箱验证
   - 考虑添加密码重置流程

## 🧪 测试

### OAuth 登录测试

```bash
# 测试 OAuth 配置
tsx apps/gateway/test-oauth.ts

# 访问登录页面
open http://localhost:3000/login.html
```

### API 测试

```bash
# 运行自动化测试
tsx apps/gateway/test-auth.ts

# 手动测试
bash /tmp/test-health.sh
```

### 测试覆盖范围

- ✅ 公开端点访问
- ✅ 受保护端点拦截
- ✅ 用户注册流程
- ✅ 用户登录流程
- ✅ OAuth 登录（GitHub/Google）
- ✅ @AllowAnonymous 装饰器
- ✅ @OptionalAuth 装饰器
- ✅ 会话管理

## 📚 相关文档

- [Better Auth 官方文档](https://better-auth.com/docs)
- [NestJS 集成指南](https://better-auth.com/docs/integrations/nestjs)
- [GitHub OAuth 设置](./GITHUB_OAUTH_SETUP.md)
- [Google OAuth 设置](./GOOGLE_OAUTH_SETUP.md)
- [@oksai/nestjs-better-auth](https://github.com/thallesp/nestjs-better-auth)
- [项目架构文档](./ARCHITECTURE.md)
