# Better Auth 集成验证清单

## ✅ 实现验证

### 1. 代码实现 ✅

- [x] 禁用 NestJS 内置 body parser (`main.ts`)
- [x] 导入 `@oksai/nestjs-better-auth` 模块
- [x] 配置 Better Auth 实例 (`auth.config.ts`)
- [x] 全局 AuthGuard 自动注册
- [x] CORS 由 Better Auth 模块自动处理
- [x] 移除 `main.ts` 中的手动 CORS 配置

### 2. 装饰器支持 ✅

- [x] `@AllowAnonymous()` - 允许匿名访问
- [x] `@OptionalAuth()` - 可选认证
- [x] `@Session()` - 获取会话信息
- [x] `@Roles()` - 系统角色控制
- [x] `@OrgRoles()` - 组织角色控制

### 3. 端点配置 ✅

| 端点                           | 认证要求    | 状态           |
| ------------------------------ | ----------- | -------------- |
| `GET /api/health`              | ❌ 公开     | ✅             |
| `GET /api`                     | ✅ 需要认证 | ✅             |
| `GET /api/users/me`            | ✅ 需要认证 | ✅             |
| `GET /api/users/public`        | ❌ 公开     | ✅             |
| `GET /api/users/optional`      | ⚠️ 可选     | ✅             |
| `POST /api/auth/sign-up/email` | ❌ 公开     | ✅ Better Auth |
| `POST /api/auth/sign-in/email` | ❌ 公开     | ✅ Better Auth |
| `GET /api/auth/session`        | ✅ 需要认证 | ✅ Better Auth |

### 4. 文档完整性 ✅

- [x] 集成指南 (`docs/BETTER_AUTH_INTEGRATION.md`)
- [x] 配置示例 (`apps/gateway/src/auth/auth.config.example.ts`)
- [x] 测试脚本 (`apps/gateway/test-auth.ts`)
- [x] 环境变量示例 (`.env.example`)
- [x] README 更新

## 🧪 测试步骤

### 步骤 1: 启动基础设施

```bash
# 启动数据库
docker-compose -f docker/docker-compose.yml up -d postgres redis

# 检查容器状态
docker ps
```

### 步骤 2: 初始化数据库

```bash
# 推送数据库 schema
pnpm db:push

# 查看数据库表
psql -U oksai -d oksai -c "\dt"
```

### 步骤 3: 启动应用

```bash
# 启动开发服务器
pnpm dev
```

预期输出：

```
🚀 Gateway running on http://localhost:3000
📚 API Docs: http://localhost:3000/api
🔐 Auth endpoint: http://localhost:3000/api/auth
```

### 步骤 4: 运行测试

```bash
# 方式 1: 使用 TypeScript 测试脚本
tsx apps/gateway/test-auth.ts

# 方式 2: 使用 Bash 测试脚本
bash /tmp/test-health.sh

# 方式 3: 手动测试
curl http://localhost:3000/api/health
curl http://localhost:3000/api/users/public
```

## ✅ 预期测试结果

### 1. 公开端点（无需认证）

```bash
# 健康检查
curl http://localhost:3000/api/health
# 预期: {"status":"ok","timestamp":"2024-..."}

# 公开路由
curl http://localhost:3000/api/users/public
# 预期: {"message":"Public route"}
```

### 2. 可选认证端点

```bash
# 未认证访问
curl http://localhost:3000/api/users/optional
# 预期: {"authenticated":false}
```

### 3. 受保护端点（需要认证）

```bash
# 未认证访问
curl http://localhost:3000/api/users/me
# 预期: 401 Unauthorized {"statusCode":401,"message":"Unauthorized"}

# API 根路由
curl http://localhost:3000/api
# 预期: 401 Unauthorized
```

### 4. 认证流程

```bash
# 1. 用户注册
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456!","name":"Test User"}'
# 预期: 成功注册，返回用户信息

# 2. 用户登录
curl -X POST http://localhost:3000/api/auth/sign-in/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test123456!"}' \
  -c cookies.txt
# 预期: 成功登录，设置 session cookie

# 3. 访问受保护端点
curl http://localhost:3000/api/users/me \
  -b cookies.txt
# 预期: {"user":{"id":"...","email":"test@example.com",...}}
```

## 🔍 故障排查

### 问题 1: 数据库连接失败

```bash
# 检查容器状态
docker ps | grep oksai

# 检查数据库日志
docker logs oksai-postgres

# 重启数据库
docker-compose -f docker/docker-compose.yml restart postgres
```

### 问题 2: CORS 错误

确保：

- ✅ `main.ts` 中没有手动配置 CORS
- ✅ `.env` 中的 `CORS_ORIGIN` 设置正确
- ✅ Better Auth 的 `trustedOrigins` 配置正确

### 问题 3: 401 Unauthorized

检查：

- ✅ 是否使用了 `@AllowAnonymous()` 装饰器
- ✅ 请求是否包含有效的 session cookie
- ✅ Better Auth 配置是否正确

### 问题 4: Body Parser 冲突

确保：

- ✅ `main.ts` 中 `bodyParser: false`
- ✅ 使用了 `@oksai/nestjs-better-auth` 模块

## 📊 性能指标

| 指标         | 目标值  | 说明           |
| ------------ | ------- | -------------- |
| 启动时间     | < 5s    | 开发模式启动   |
| 健康检查响应 | < 100ms | 简单 GET 请求  |
| 认证检查     | < 50ms  | AuthGuard 验证 |
| 用户注册     | < 500ms | 包含数据库写入 |
| 用户登录     | < 300ms | 包含会话创建   |

## 🎯 下一步计划

### Phase 1: 完善基础认证 ✅

- [x] Better Auth 基础集成
- [x] 邮箱/密码登录
- [x] 会话管理
- [x] 路由保护

### Phase 2: OAuth 集成 (下一步)

- [ ] GitHub OAuth
- [ ] Google OAuth
- [ ] OAuth 回调处理
- [ ] 多账号关联

### Phase 3: 高级功能 (未来)

- [ ] 邮箱验证
- [ ] 密码重置
- [ ] 双因素认证 (2FA)
- [ ] 组织管理
- [ ] 角色权限系统

### Phase 4: 前端集成

- [ ] React 认证上下文
- [ ] 登录/注册表单
- [ ] 受保护路由
- [ ] 会话持久化

## 📚 参考资源

- [Better Auth 官方文档](https://better-auth.com/docs)
- [NestJS 集成指南](https://better-auth.com/docs/integrations/nestjs)
- [Better Auth GitHub](https://github.com/better-auth/better-auth)
- [nestjs-better-auth](https://github.com/thallesp/nestjs-better-auth)
