# 前端认证迁移指南

> 从自定义认证 API 迁移到 Better Auth 客户端

## 📋 概述

本文档指导前端开发者从调用自定义认证 API 迁移到使用 Better Auth 客户端。

**迁移收益**：

- ✅ 简化代码，减少 ~60% 的认证相关代码
- ✅ 自动获得类型支持
- ✅ 自动处理会话管理
- ✅ 自动处理 Cookie 和 Token
- ✅ 获得 Better Auth 的所有更新和新功能

## 🚀 快速开始

### 1. 安装 Better Auth 客户端

```bash
pnpm add better-auth
```

### 2. 创建 Auth 客户端

```typescript
// src/lib/auth-client.ts
import { createAuthClient } from 'better-auth/react';

export const authClient = createAuthClient({
  baseURL: import.meta.env.VITE_API_URL || 'http://localhost:3000',
});

// 类型导出
export type Session = typeof authClient.$Infer.Session.session;
export type User = typeof authClient.$Infer.Session.user;
```

### 3. 环境变量配置

```env
# .env.local
VITE_API_URL=http://localhost:3000
```

## 📝 API 迁移对照表

### 认证功能

#### ❌ 旧方式（已废弃）

```typescript
// 注册
const response = await fetch('/api/auth/sign-up/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password, name }),
});

// 登录
const response = await fetch('/api/auth/sign-in/email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email, password }),
});

// 登出
await fetch('/api/auth/sign-out', { method: 'POST' });
```

#### ✅ 新方式（Better Auth）

```typescript
import { authClient } from '@/lib/auth-client';

// 注册
const result = await authClient.signUp.email({
  email,
  password,
  name,
});

if (result.error) {
  console.error(result.error);
} else {
  console.log('注册成功', result.data);
}

// 登录
const result = await authClient.signIn.email({
  email,
  password,
});

if (result.error) {
  console.error(result.error);
} else {
  console.log('登录成功', result.data);
}

// 登出
await authClient.signOut();
```

### 会话管理

#### ❌ 旧方式（已废弃）

```typescript
// 获取会话列表
const response = await fetch('/api/sessions');
const sessions = await response.json();

// 获取当前会话
const response = await fetch('/api/auth/session', {
  headers: {
    Authorization: `Bearer ${token}`,
  },
});
const session = await response.json();

// 撤销会话
await fetch(`/api/sessions/${sessionId}`, {
  method: 'DELETE',
});
```

#### ✅ 新方式（Better Auth）

```typescript
import { authClient } from '@/lib/auth-client';

// 获取当前会话（React Hook）
function MyComponent() {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) return <div>加载中...</div>;
  if (!session) return <div>未登录</div>;

  return <div>欢迎, {session.user.name}</div>;
}

// 获取会话（非 Hook）
const session = await authClient.getSession();

// 登出（撤销当前会话）
await authClient.signOut();
```

### 用户信息

#### ❌ 旧方式（已废弃）

```typescript
// 获取当前用户信息
const response = await fetch('/api/users/me');
const user = await response.json();

// 获取公开用户信息
const response = await fetch('/api/users/public');
const users = await response.json();
```

#### ✅ 新方式（Better Auth）

```typescript
import { authClient } from '@/lib/auth-client';

// 获取当前用户信息（从会话中获取）
const { data: session } = authClient.useSession();
const user = session?.user;

// 或者直接获取会话
const session = await authClient.getSession();
const user = session?.user;
```

### OAuth 登录

#### ❌ 旧方式（已废弃）

```typescript
// GitHub OAuth
window.location.href = '/api/auth/oauth/github';

// Google OAuth
window.location.href = '/api/auth/oauth/google';
```

#### ✅ 新方式（Better Auth）

```typescript
import { authClient } from '@/lib/auth-client';

// GitHub OAuth
await authClient.signIn.social({
  provider: 'github',
  callbackURL: '/dashboard',
});

// Google OAuth
await authClient.signIn.social({
  provider: 'google',
  callbackURL: '/dashboard',
});
```

### 邮箱验证

#### ❌ 旧方式（已废弃）

```typescript
const response = await fetch('/api/auth/verify-email', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token }),
});
```

#### ✅ 新方式（Better Auth）

```typescript
import { authClient } from '@/lib/auth-client';

// 邮箱验证（Better Auth 会自动处理）
// 用户点击邮件中的链接后，Better Auth 会自动验证
// 无需手动调用 API
```

### 密码重置

#### ❌ 旧方式（已废弃）

```typescript
// 发送重置邮件
await fetch('/api/auth/forgot-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ email }),
});

// 重置密码
await fetch('/api/auth/reset-password', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ token, newPassword }),
});
```

#### ✅ 新方式（Better Auth）

```typescript
import { authClient } from '@/lib/auth-client';

// 发送重置邮件
await authClient.forgetPassword({
  email,
  redirectTo: '/reset-password',
});

// 重置密码
await authClient.resetPassword({
  newPassword,
  token,
});
```

### 2FA 双因素认证

#### ❌ 旧方式（已废弃）

```typescript
// 启用 2FA
await fetch('/api/auth/2fa/enable', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ password }),
});

// 验证 2FA
await fetch('/api/auth/2fa/verify', {
  method: 'POST',
  headers: {
    'Content-Type': 'application/json',
    Authorization: `Bearer ${token}`,
  },
  body: JSON.stringify({ code }),
});
```

#### ✅ 新方式（Better Auth）

```typescript
import { authClient } from '@/lib/auth-client';

// 启用 2FA
const result = await authClient.twoFactor.enable({
  password,
  callbackURL: '/2fa-verify',
});

if (result.data) {
  // 显示 QR Code
  const qrCode = result.data.qrCode;
  const secret = result.data.secret;
}

// 验证 2FA
const result = await authClient.twoFactor.verifyTotp({
  code,
});

if (result.data) {
  // 验证成功，获取备份码
  const backupCodes = result.data.backupCodes;
}
```

## 🎣 React Hooks 使用示例

### 1. 会话管理 Hook

```typescript
import { authClient } from '@/lib/auth-client';

function App() {
  const { data: session, isPending, error } = authClient.useSession();

  if (isPending) return <div>加载中...</div>;
  if (error) return <div>错误: {error.message}</div>;
  if (!session) return <LoginPage />;

  return (
    <div>
      <h1>欢迎, {session.user.name}</h1>
      <p>邮箱: {session.user.email}</p>
      <button onClick={() => authClient.signOut()}>登出</button>
    </div>
  );
}
```

### 2. 登录表单

```typescript
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

function LoginForm() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await authClient.signIn.email({
      email,
      password,
    });

    if (result.error) {
      setError(result.error.message);
    } else {
      // 登录成功，重定向
      window.location.href = '/dashboard';
    }
  };

  return (
    <form onSubmit={handleLogin}>
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="邮箱"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="密码"
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">登录</button>
    </form>
  );
}
```

### 3. 注册表单

```typescript
import { useState } from 'react';
import { authClient } from '@/lib/auth-client';

function RegisterForm() {
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    const result = await authClient.signUp.email({
      email,
      password,
      name,
    });

    if (result.error) {
      setError(result.error.message);
    } else {
      // 注册成功
      alert('注册成功！请查收验证邮件');
    }
  };

  return (
    <form onSubmit={handleRegister}>
      <input
        type="text"
        value={name}
        onChange={(e) => setName(e.target.value)}
        placeholder="姓名"
        required
      />
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder="邮箱"
        required
      />
      <input
        type="password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        placeholder="密码"
        required
      />
      {error && <div className="error">{error}</div>}
      <button type="submit">注册</button>
    </form>
  );
}
```

### 4. OAuth 登录按钮

```typescript
import { authClient } from '@/lib/auth-client';

function OAuthButtons() {
  const handleGitHubLogin = async () => {
    await authClient.signIn.social({
      provider: 'github',
      callbackURL: '/dashboard',
    });
  };

  const handleGoogleLogin = async () => {
    await authClient.signIn.social({
      provider: 'google',
      callbackURL: '/dashboard',
    });
  };

  return (
    <div>
      <button onClick={handleGitHubLogin}>
        使用 GitHub 登录
      </button>
      <button onClick={handleGoogleLogin}>
        使用 Google 登录
      </button>
    </div>
  );
}
```

## 🔧 高级用法

### 自定义 Hook

```typescript
// hooks/useAuth.ts
import { authClient } from '@/lib/auth-client';

export function useAuth() {
  const { data: session, isPending, refetch } = authClient.useSession();

  const login = async (email: string, password: string) => {
    const result = await authClient.signIn.email({ email, password });
    if (!result.error) {
      await refetch();
    }
    return result;
  };

  const logout = async () => {
    await authClient.signOut();
    await refetch();
  };

  const register = async (email: string, password: string, name: string) => {
    const result = await authClient.signUp.email({ email, password, name });
    return result;
  };

  return {
    user: session?.user,
    session,
    isPending,
    isAuthenticated: !!session,
    login,
    logout,
    register,
  };
}
```

### 路由守卫

```typescript
// components/AuthGuard.tsx
import { Navigate } from '@tanstack/react-router';
import { authClient } from '@/lib/auth-client';

interface AuthGuardProps {
  children: React.ReactNode;
}

export function AuthGuard({ children }: AuthGuardProps) {
  const { data: session, isPending } = authClient.useSession();

  if (isPending) {
    return <div>加载中...</div>;
  }

  if (!session) {
    return <Navigate to="/login" />;
  }

  return <>{children}</>;
}
```

### 权限检查

```typescript
// hooks/usePermission.ts
import { authClient } from '@/lib/auth-client';

export function usePermission(requiredRole: string) {
  const { data: session } = authClient.useSession();

  if (!session) return false;

  const userRole = session.user.role;

  // 简单的角色检查
  if (userRole === 'admin') return true;
  if (userRole === requiredRole) return true;

  return false;
}

// 使用示例
function AdminPanel() {
  const hasPermission = usePermission('admin');

  if (!hasPermission) {
    return <div>无权访问</div>;
  }

  return <div>管理员面板</div>;
}
```

## 🚨 常见问题

### Q1: Cookie 无法设置？

**A**: 确保：

1. 后端配置了正确的 CORS
2. 前端使用相同的域名
3. `baseURL` 配置正确

```typescript
// 检查配置
export const authClient = createAuthClient({
  baseURL: 'http://localhost:3000', // 确保与后端一致
});
```

### Q2: 会话丢失？

**A**: Better Auth 会自动处理会话持久化，如果遇到问题：

```typescript
// 手动刷新会话
const { refetch } = authClient.useSession();
await refetch();
```

### Q3: 类型错误？

**A**: 确保导入了正确的类型：

```typescript
import type { Session, User } from '@/lib/auth-client';

// 或者使用 Better Auth 的类型
import type { Session, User } from 'better-auth/types';
```

## 📚 参考资源

- [Better Auth 官方文档](https://better-auth.com/docs)
- [Better Auth React 集成](https://better-auth.com/docs/integrations/react)
- [Better Auth API 参考](https://better-auth.com/docs/reference/api)

## ✅ 迁移清单

完成迁移后，请确认：

- [ ] 已安装 `better-auth` 包
- [ ] 已创建 `auth-client.ts` 配置文件
- [ ] 已替换所有认证相关的 API 调用
- [ ] 已测试注册、登录、登出流程
- [ ] 已测试 OAuth 登录（如果使用）
- [ ] 已测试会话管理
- [ ] 已移除对废弃 API 的调用
- [ ] 已更新环境变量配置

## 🎉 完成！

恭喜！你已成功迁移到 Better Auth 客户端。享受更简洁、更强大的认证体验吧！
