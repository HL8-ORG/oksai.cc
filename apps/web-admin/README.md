# @oksai/web-admin

Oksai 管理后台 - 基于 TanStack Start + radix-ui 的企业级管理平台前端应用

## 技术栈（对齐 tanstarter）

| 技术             | 版本          | 说明                      |
| ---------------- | ------------- | ------------------------- |
| TanStack Start   | 1.164.1       | 全栈 React 框架           |
| TanStack Router  | 1.163.3       | 路由管理 + SSR Query 集成 |
| TanStack Query   | 5.90.21       | 状态管理                  |
| React            | 19.2.4        | UI 框架                   |
| radix-ui         | Latest        | 无样式组件库              |
| Tailwind CSS     | 4.2.1         | 原子化 CSS 框架           |
| Better Auth      | 1.5.0         | 认证系统（连接 Gateway）  |
| @t3-oss/env-core | 0.13.10       | 环境变量验证              |
| TypeScript       | 5.9.3         | 类型安全                  |
| Vite             | 8.0.0-beta.15 | 构建工具                  |

## 架构集成

```
┌─────────────────────┐
│   Browser           │
│  (React App)        │
└──────────┬──────────┘
           │
           │ HTTP
           │
┌──────────▼──────────┐
│  TanStack Start     │
│  (Frontend SSR)     │
│  - Port 3001        │
│  - Better Auth      │──────┐
└──────────┬──────────┘      │
           │                 │ API Calls
           │                 │
           └─────────────────┤
                             │
                    ┌────────▼──────────┐
                    │  Gateway (NestJS) │
                    │  - Port 3000      │
                    │  - Better Auth    │
                    │  - Business Logic │
                    └──────────┬────────┘
                               │
                               │
                    ┌──────────▼──────────┐
                    │  PostgreSQL         │
                    │  - Port 5432        │
                    │  - Drizzle ORM      │
                    └─────────────────────┘
```

**关键点**: 前端不直接连接数据库，而是通过 Better Auth 客户端连接到 Gateway 的认证 API。

## 快速开始

```bash
# 安装依赖
pnpm install

# 启动开发服务器
pnpm dev

# 构建生产版本
pnpm build

# 预览生产版本
pnpm preview
```

## 项目结构

```
apps/web-admin/
├── src/
│   ├── components/ui/      # radix-ui 组件
│   ├── env/
│   │   ├── client.ts       # 客户端环境变量
│   │   └── server.ts       # 服务端环境变量
│   ├── lib/
│   │   ├── auth-client.ts  # Better Auth 客户端（连接 Gateway）
│   │   └── utils.ts        # 工具函数
│   ├── routes/
│   │   ├── __root.tsx      # 根路由
│   │   ├── index.tsx       # 首页
│   │   ├── login.tsx       # 登录页
│   │   └── dashboard.tsx   # 仪表盘
│   ├── App.tsx             # 应用入口
│   ├── router.tsx          # 路由器配置
│   ├── entry-client.tsx    # 客户端入口
│   ├── entry-server.tsx    # 服务端入口
│   └── styles.css          # 全局样式（Tailwind v4）
├── .env.example            # 环境变量示例
├── vite.config.ts          # Vite 配置
├── tsconfig.json           # TypeScript 配置
└── project.json            # Nx 项目配置
```

## 环境变量

创建 `.env` 文件并配置：

```env
# Gateway API 地址
VITE_API_URL=http://localhost:3000
```

## Better Auth 集成

前端通过 Better Auth 客户端连接到 Gateway 的认证 API：

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: 'http://localhost:3000', // Gateway 地址
});

// 使用示例
const { data } = await authClient.useSession();
```

### 认证流程

1. 用户在前端登录
2. Better Auth 客户端发送请求到 `http://localhost:3000/api/auth/*`
3. Gateway 的 Better Auth 处理认证
4. 返回会话信息给前端

## 开发说明

### 添加新路由

在 `src/routes/` 目录下创建新的 `.tsx` 文件：

```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/your-path')({
  component: YourComponent,
});

function YourComponent() {
  return <div>Your Page</div>;
}
```

### 使用认证

```tsx
import { authClient } from '@/lib/auth-client';

function MyComponent() {
  const { data: session } = authClient.useSession();

  if (!session) {
    return <div>请先登录</div>;
  }

  return <div>欢迎, {session.user.name}</div>;
}
```

### 保护路由

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/protected')({
  beforeLoad: async () => {
    // 检查认证状态
    const session = await checkAuth();
    if (!session) {
      throw redirect({ to: '/login' });
    }
  },
  component: ProtectedPage,
});
```

## 核心特性

- ✅ React 19 + TypeScript
- ✅ TanStack Router + Query SSR 集成
- ✅ Better Auth 客户端（连接 Gateway）
- ✅ radix-ui 无样式组件
- ✅ Tailwind CSS v4
- ✅ @t3-oss/env-core 环境变量验证
- ✅ Vite 8 构建
- ✅ 受保护的路由
- ✅ 响应式设计

## 相关文档

- [TanStack Start 文档](https://tanstack.com/start)
- [TanStack Router 文档](https://tanstack.com/router)
- [Better Auth 文档](https://better-auth.com)
- [radix-ui 文档](https://radix-ui.com)
- [Tailwind CSS v4 文档](https://tailwindcss.com)
- [@t3-oss/env-core 文档](https://env.t3.gg)
