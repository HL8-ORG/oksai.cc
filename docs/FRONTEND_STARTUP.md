# 前端应用启动指南

## ✅ 技术栈对齐完成

`apps/web-admin` 已成功对齐 `forks/tanstarter` 技术栈。

## 启动命令

```bash
# 方式 1: 从项目根目录启动
pnpm dev:web

# 方式 2: 进入 web-admin 目录启动
cd apps/web-admin
pnpm dev
```

## 首次启动步骤

1. **创建环境变量文件**

   ```bash
   cp apps/web-admin/.env.example apps/web-admin/.env
   ```

2. **启动开发服务器**

   ```bash
   pnpm dev:web
   ```

3. **访问应用**
   - 前端地址: http://localhost:3001
   - Gateway API: http://localhost:3000

## 端口分配

| 服务                       | 端口       | 说明                   |
| -------------------------- | ---------- | ---------------------- |
| Gateway (NestJS)           | 3000       | 后端 API + Better Auth |
| Web-Admin (TanStack Start) | 3001       | 前端应用               |
| PostgreSQL                 | 5432       | 数据库                 |
| Redis                      | 6379       | 缓存                   |
| RabbitMQ                   | 5672/15672 | 消息队列               |
| MinIO                      | 9000/9001  | 对象存储               |

## Better Auth 认证流程

```
┌─────────────┐
│  浏览器     │
│ (localhost:3001)  │
└──────┬──────┘
       │
       │ 1. 用户登录
       │
       ▼
┌─────────────────────┐
│  TanStack Start     │
│  (前端应用)         │
│  - React 19         │
│  - Better Auth 客户端   │
└──────┬──────────────┘
       │
       │ 2. 认证请求
       │
       ▼
┌─────────────────────┐
│  Gateway (NestJS)   │
│  (localhost:3000)   │
│  - Better Auth 服务端   │
│  - PostgreSQL       │
└─────────────────────┘
```

## 关键特性

### 1. SSR Query 集成

```typescript
// src/router.tsx
import { setupRouterSsrQueryIntegration } from '@tanstack/react-router-ssr-query';

setupRouterSsrQueryIntegration({
  router,
  queryClient,
  handleRedirects: true,
  wrapQueryClient: true,
});
```

### 2. 环境变量验证

```typescript
// src/env/client.ts
import { createEnv } from '@t3-oss/env-core';
import * as z from 'zod';

export const env = createEnv({
  clientPrefix: 'VITE_',
  client: {
    VITE_API_URL: z.url().default('http://localhost:3000'),
  },
  runtimeEnv: import.meta.env,
});
```

### 3. Better Auth 客户端

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: 'http://localhost:3000', // Gateway 地址
});
```

## 常见问题

### Q1: 首次启动报错 `routeTree.gen.ts` 不存在？

**A**: 这是正常的。首次运行 `pnpm dev` 时，TanStack Router 会自动生成此文件。

### Q2: 类型错误很多？

**A**: React 19 和 Vite 8 beta 可能有类型不兼容。首次启动生成路由树后，大部分类型错误会自动解决。

### Q3: Vite peer dependency 警告？

**A**: 可以忽略。Vite 8 beta 与部分插件有 peer dependency 警告，但不影响使用。

### Q4: 认证不工作？

**A**: 确保：

1. Gateway 已启动 (http://localhost:3000)
2. `.env` 文件配置了 `VITE_API_URL=http://localhost:3000`
3. Gateway 的 Better Auth 配置正确

## 开发工具

### React DevTools

安装浏览器扩展: [React Developer Tools](https://react.dev/learn/react-developer-tools)

### TanStack DevTools

应用启动后，右下角会显示 TanStack DevTools 按钮。

### Vite DevTools

```bash
# 安装 Vite DevTools 浏览器扩展
# Chrome: https://chrome.google.com/webstore/detail/vite-devtools/
```

## 下一步开发

1. **完善路由**

   - 添加更多页面
   - 实现路由守卫
   - 配置权限控制

2. **集成业务 API**

   - 连接 Gateway API
   - 实现数据 CRUD
   - 配置 TanStack Query

3. **优化样式**

   - 使用 Tailwind CSS v4
   - 实现暗色模式
   - 响应式设计

4. **测试**
   - 单元测试 (Vitest)
   - E2E 测试 (Playwright)
   - 组件测试

## 相关文档

- [技术栈对齐详情](./FRONTEND_ALIGNMENT.md)
- [项目 README](../apps/web-admin/README.md)
- [TanStack Start 文档](https://tanstack.com/start)
- [Better Auth 文档](https://better-auth.com)
