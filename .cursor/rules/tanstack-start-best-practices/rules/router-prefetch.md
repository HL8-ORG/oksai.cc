---
title: Route Prefetching Strategies
impact: HIGH
impactDescription: reduces perceived latency, instant navigation
tags: router, prefetch, performance, user-experience
---

## Route Prefetching Strategies

预取路由数据可以在用户实际导航之前加载所需数据，实现近乎即时的页面切换体验。

## 1. Link 组件预取（推荐）

TanStack Router 的 `Link` 组件内置了预取支持。

**Incorrect (无预取):**

```tsx
import { Link } from '@tanstack/react-router';

function UserList({ users }: { users: User[] }) {
  return (
    <div>
      {users.map((user) => (
        <Link key={user.id} to="/users/$userId" params={{ userId: user.id }}>
          {user.name}
        </Link>
      ))}
    </div>
  );
}
```

**Correct (使用 preload 属性):**

```tsx
import { Link } from '@tanstack/react-router';

function UserList({ users }: { users: User[] }) {
  return (
    <div>
      {users.map((user) => (
        <Link
          key={user.id}
          to="/users/$userId"
          params={{ userId: user.id }}
          preload="intent"
        >
          {user.name}
        </Link>
      ))}
    </div>
  );
}
```

## 2. 使用 router.preloadRoute 手动预取

**示例：预取列表中前几个项目**

```tsx
import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

function UserList() {
  const router = useRouter();
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  useEffect(() => {
    if (users) {
      users.slice(0, 5).forEach((user) => {
        router
          .preloadRoute({
            to: '/users/$userId',
            params: { userId: user.id },
          })
          .catch(() => {
            // 预取失败不影响用户体验
          });
      });
    }
  }, [users, router]);

  return <div>{users?.map(renderUser)}</div>;
}
```

## 3. 预取时机策略

### 3.1 鼠标悬停预取

```tsx
import { Link } from '@tanstack/react-router';

function UserCard({ user }: { user: User }) {
  return (
    <Link to="/users/$userId" params={{ userId: user.id }} preload="intent">
      <div>
        <h3>{user.name}</h3>
        <p>{user.email}</p>
      </div>
    </Link>
  );
}
```

### 3.2 视口可见时预取

```tsx
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useRouter } from '@tanstack/react-router';

function UserCardLazy({ user }: { user: User }) {
  const router = useRouter();
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px',
  });

  useEffect(() => {
    if (inView) {
      router.preloadRoute({
        to: '/users/$userId',
        params: { userId: user.id },
      });
    }
  }, [inView, user.id, router]);

  return (
    <div ref={ref}>
      <Link to="/users/$userId" params={{ userId: user.id }}>
        {user.name}
      </Link>
    </div>
  );
}
```

### 3.3 按钮点击前预取

```tsx
import { useRouter } from '@tanstack/react-router';

function ActionButton({ orderId }: { orderId: string }) {
  const router = useRouter();

  const handleFocus = () => {
    router.preloadRoute({
      to: '/orders/$orderId',
      params: { orderId },
    });
  };

  return (
    <button
      onClick={() =>
        router.navigate({ to: '/orders/$orderId', params: { orderId } })
      }
      onFocus={handleFocus}
      onMouseEnter={handleFocus}
    >
      View Order
    </button>
  );
}
```

## 4. 条件预取

### 4.1 基于用户权限预取

```tsx
import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useAuth } from '@/hooks/useAuth';

function AdminPanel() {
  const router = useRouter();
  const { isAdmin } = useAuth();

  useEffect(() => {
    if (isAdmin) {
      router.preloadRoute({ to: '/admin/dashboard' });
      router.preloadRoute({ to: '/admin/users' });
    }
  }, [isAdmin, router]);

  return <div>Admin Panel</div>;
}
```

### 4.2 基于功能开关预取

```tsx
import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useFeatureFlag } from '@/hooks/useFeatureFlag';

function Dashboard() {
  const router = useRouter();
  const analyticsEnabled = useFeatureFlag('analytics');

  useEffect(() => {
    if (analyticsEnabled) {
      router.preloadRoute({ to: '/analytics' });
    }
  }, [analyticsEnabled, router]);

  return <div>Dashboard</div>;
}
```

## 5. 预取最佳实践

### 5.1 限制预取数量

```tsx
import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';

function UserList({ users }: { users: User[] }) {
  const router = useRouter();

  useEffect(() => {
    // ✅ 只预取前 5 个，避免过度预取
    const PREFETCH_LIMIT = 5;
    users.slice(0, PREFETCH_LIMIT).forEach((user) => {
      router.preloadRoute({
        to: '/users/$userId',
        params: { userId: user.id },
      });
    });
  }, [users, router]);

  return <div>{users.map(renderUser)}</div>;
}
```

### 5.2 处理预取错误

```tsx
import { useRouter } from '@tanstack/react-router';

function PrefetchButton({ userId }: { userId: string }) {
  const router = useRouter();

  const handlePrefetch = async () => {
    try {
      await router.preloadRoute({
        to: '/users/$userId',
        params: { userId },
      });
    } catch (error) {
      console.warn('Prefetch failed:', error);
      // 预取失败不影响用户体验
    }
  };

  return (
    <button onFocus={handlePrefetch} onMouseEnter={handlePrefetch}>
      View User
    </button>
  );
}
```

## 性能影响

| 策略               | 适用场景      | 性能提升            |
| ------------------ | ------------- | ------------------- |
| `preload="intent"` | 大多数链接    | 50-90% 导航时间减少 |
| 手动预取           | 列表首屏      | 80% 感知延迟减少    |
| 视口预取           | 长列表/懒加载 | 70% 加载时间减少    |

## 与 Next.js 的对比

| 特性      | Next.js             | TanStack Router         |
| --------- | ------------------- | ----------------------- |
| Link 预取 | `prefetch={true}`   | `preload="intent"`      |
| 手动预取  | `router.prefetch()` | `router.preloadRoute()` |
| 预取时机  | 默认视口内预取      | 需要显式配置            |
