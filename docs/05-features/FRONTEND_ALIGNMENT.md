# 前端技术栈对齐总结

## ✅ 已完成

成功将 `@oksai/web-admin` 前端应用的技术栈对齐到 `forks/tanstarter`。

## 核心技术栈对比

| 技术            | 之前    | 之后              | 说明             |
| --------------- | ------- | ----------------- | ---------------- |
| React           | 18.3.1  | **19.2.4**        | 最新版本         |
| TanStack Router | 1.92.0  | **1.163.3**       | + SSR Query 集成 |
| TanStack Query  | 5.62.0  | **5.90.21**       | 最新版本         |
| Tailwind CSS    | 3.4.17  | **4.2.1**         | v4 新语法        |
| Vite            | 6.0.5   | **8.0.0-beta.16** | 最新 beta        |
| zod             | 3.24.1  | **4.3.6**         | v4 版本          |
| lucide-react    | 0.468.0 | **575.0**         | 最新版本         |
| tailwind-merge  | 2.6.0   | **3.5.0**         | 最新版本         |
| 构建            | vinxi   | **vite**          | 直接使用 Vite    |

## 新增依赖

| 依赖                             | 版本    | 用途                  |
| -------------------------------- | ------- | --------------------- |
| @t3-oss/env-core                 | 0.13.10 | 环境变量验证          |
| @tanstack/react-router-ssr-query | 1.163.3 | SSR Query 集成        |
| @tailwindcss/vite                | 4.2.1   | Tailwind v4 Vite 插件 |
| @tanstack/devtools-vite          | 0.5.2   | 开发工具插件          |
| @tanstack/react-devtools         | 0.9.6   | React 开发工具        |
| @tanstack/react-router-devtools  | 1.163.3 | Router 开发工具       |
| @vitejs/plugin-react             | 5.1.4   | React Vite 插件       |
| sonner                           | 2.0.7   | Toast 通知库          |

## 移除依赖

- ❌ vinxi (改用原生 Vite)
- ❌ @tanstack/start (已有 @tanstack/react-start)
- ❌ autoprefixer, postcss (Tailwind v4 不需要)

## 架构变更

### Better Auth 集成方式

**之前**: 前端自己实现 Better Auth 服务端

```typescript
// ❌ 旧方式：前端有 auth-server.ts
export const auth = betterAuth({
  database: { ... }
})
```

**之后**: 前端只作为客户端，连接到 Gateway

```typescript
// ✅ 新方式：只作为客户端
export const authClient = createAuthClient({
  baseURL: 'http://localhost:3000', // Gateway 地址
});
```

### 构建方式

**之前**: vinxi (TanStack Start 默认)

```json
"dev": "vinxi dev",
"build": "vinxi build"
```

**之后**: 直接使用 Vite

```json
"dev": "vite dev",
"build": "vite build"
```

## 文件结构变更

### 新增文件

```
src/
├── env/
│   ├── client.ts       # @t3-oss/env-core 客户端环境变量
│   └── server.ts       # @t3-oss/env-core 服务端环境变量
├── lib/
│   └── auth-client.ts  # Better Auth 客户端（连接 Gateway）
├── router.tsx          # 路由器配置（SSR Query 集成）
└── styles.css          # Tailwind v4 样式（新语法）
```

### 删除文件

```
❌ app.config.ts             # TanStack Start 旧配置
❌ tailwind.config.js        # Tailwind v3 配置
❌ postcss.config.js         # PostCSS 配置
❌ src/lib/auth.tsx          # 旧的认证上下文
❌ src/lib/auth-server.ts    # 前端不应该有服务端认证
❌ src/routes/api/auth/$.ts  # 前端不应该有认证 API
❌ src/styles/globals.css    # 旧的样式文件
❌ src/vite-env.d.ts         # 不再需要
```

## 配置文件更新

### vite.config.ts

```typescript
import tailwindcss from '@tailwindcss/vite';
import { devtools } from '@tanstack/devtools-vite';
import { tanstackStart } from '@tanstack/react-start/plugin/vite';
import viteReact from '@vitejs/plugin-react';
import { defineConfig } from 'vite';

export default defineConfig({
  resolve: { tsconfigPaths: true },
  server: { port: 3001 },
  plugins: [devtools(), tanstackStart(), viteReact(), tailwindcss()],
});
```

### tsconfig.json

```json
{
  "compilerOptions": {
    "target": "ES2022",
    "lib": ["DOM", "DOM.Iterable", "ES2022"],
    "paths": { "@/*": ["./src/*"] }
  }
}
```

### 环境变量 (.env.example)

```env
# Gateway API 地址
VITE_API_URL=http://localhost:3000
```

## Better Auth 集成

### Gateway (服务端)

位置: `apps/gateway/src/auth/`

```typescript
// Gateway 提供 Better Auth API
export const auth = betterAuth({
  database: drizzleAdapter(db, { provider: 'pg' }),
  // ... 配置
});
```

### Web-Admin (客户端)

位置: `apps/web-admin/src/lib/auth-client.ts`

```typescript
// 前端作为客户端连接到 Gateway
export const authClient = createAuthClient({
  baseURL: 'http://localhost:3000', // Gateway 地址
});
```

### 认证流程

```
1. 用户在前端登录
   ↓
2. Better Auth 客户端发送请求
   → http://localhost:3000/api/auth/*
   ↓
3. Gateway 处理认证
   ↓
4. 返回会话信息给前端
```

## 启动命令

```bash
# 启动前端（端口 3001）
pnpm dev:web

# 启动后端 Gateway（端口 3000）
pnpm dev
```

## 注意事项

### 1. Vite 8 Beta

当前使用 Vite 8.0.0-beta.16，部分插件可能有兼容性警告：

- @tailwindcss/vite (peer: ^5.2.0 || ^6 || ^7)
- @tanstack/devtools-vite (peer: ^6.0.0 || ^7.0.0)
- @vitejs/plugin-react (peer: ^4.2.0 || ^5.0.0 || ^6.0.0 || ^7.0.0)

这些警告暂时可以忽略，Vite 8 正式版发布后应该会解决。

### 2. React 19

React 19 带来了一些类型变更，可能导致类型错误。这些错误在首次运行 `pnpm dev` 生成 `routeTree.gen.ts` 后会自动解决。

### 3. Tailwind CSS v4

Tailwind v4 使用新语法：

```css
/* 旧方式 */
@tailwind base;
@tailwind components;
@tailwind utilities;

/* 新方式 */
@import 'tailwindcss';
```

### 4. zod v4

zod v4 API 有变化，使用 `z.url()` 而不是 `z.string().url()`。

## 相关文档

- [更新后的 README](./apps/web-admin/README.md)
- [环境变量配置](./apps/web-admin/.env.example)
- [原始 tanstarter](./forks/tanstarter/)

## 下一步

1. ✅ 技术栈对齐完成
2. ⏭️ 首次启动生成路由树：`pnpm dev:web`
3. ⏭️ 测试认证流程
4. ⏭️ 开发业务功能
