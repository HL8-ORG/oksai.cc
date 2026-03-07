# 🔍 问题诊断：Better Auth 登录异常

## 问题现象

**用户反馈**: 没有注册用户，但可以使用邮箱和密码登录

## 问题原因

### 1. **前端请求路径问题**

**根本原因**: Better Auth 请求没有正确代理到后端

**证据**:

```bash
# 直接访问 gateway
curl http://localhost:3000/api/auth/session
# 返回：HTML 404 页面（web-admin 前端）

# 通过 web-admin 访问
curl http://localhost:3001/api/auth/sign-in/email
# 返回：应该返回 JSON，但可能返回 404 或 HTML
```

### 2. **Vite 代理配置缺失**

**当前状态**: `vite.config.app.ts` 没有配置 API 代理

**影响**:

- 前端请求 `/api/auth/*` 时，Vite 没有转发到 gateway (localhost:3000)
- 请求被前端路由拦截，返回 404 页面

### 3. **Better Auth 中间件可能未挂载**

需要检查：

- `apps/gateway/src/auth/auth.module.ts` 中的 Better Auth 模块配置
- Better Auth 中间件是否正确挂载到 `/api/auth/*` 路径

## 解决方案

### 方案 1: 添加 Vite 代理配置（推荐）

**文件**: `apps/web-admin/vite.config.app.ts`

```typescript
export default defineConfig({
  server: {
    proxy: {
      '/api': {
        target: 'http://localhost:3000',
        changeOrigin: true,
      },
    },
  },
  // ... 其他配置
});
```

### 方案 2: 修改 auth-client baseURL

**文件**: `apps/web-admin/src/env/client.ts`

```typescript
export const env = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_API_URL: z.url().default('http://localhost:3000/api'), // 添加 /api
  },
  runtimeEnv: import.meta.env,
});
```

**但是**: 这需要确保 gateway 已启动且 Better Auth 正常工作

### 方案 3: 检查 Gateway Better Auth 配置

**需要检查**:

1. Better Auth 中间件是否正确挂载
2. 数据库连接是否正常
3. 是否有默认测试用户

## 诊断步骤

### 1. 测试 Gateway 直接访问

```bash
# 测试 gateway 健康检查
curl http://localhost:3000/api/health

# 测试 Better Auth session
curl http://localhost:3000/api/auth/session
```

### 2. 检查数据库连接

```bash
# 检查数据库是否有用户
docker exec -it oksai-postgres psql -U postgres -d oksai_db -c "SELECT id, email FROM \"user\";"
```

### 3. 检查 Better Auth 配置

```bash
# 查看 gateway 日志
cd apps/gateway
pnpm dev

# 在另一个终端测试
curl -X POST http://localhost:3000/api/auth/sign-up/email \
  -H "Content-Type: application/json" \
  -d '{"email":"test@example.com","password":"Test1234","name":"Test User"}'
```

## 下一步行动

1. ✅ **立即**: 添加 Vite 代理配置
2. 📊 **验证**: 测试注册和登录流程
3. 📝 **文档**: 更新 README，说明需要同时启动 gateway 和 web-admin

---

**优先级**: 🔴 高 - 影响核心功能

**预计修复时间**: 10 分钟
