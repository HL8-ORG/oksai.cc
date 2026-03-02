---
title: Query Prefetching Strategies
impact: HIGH
impactDescription: instant navigation, better UX
tags: query, tanstack-query, prefetch, performance
---

## Query Prefetching Strategies

预取数据可以在用户实际需要之前加载，实现近乎即时的页面切换体验。

## 1. 使用 queryClient.prefetchQuery

### 1.1 悬停预取

**Incorrect (无预取):**

```tsx
import { Link } from '@tanstack/react-router';

function UserCard({ user }: { user: User }) {
  return (
    <Link to="/users/$userId" params={{ userId: user.id }}>
      {user.name}
    </Link>
  );
}
```

**Correct (悬停预取):**

```tsx
import { Link } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';
import { userKeys } from '@/lib/query-keys';

function UserCard({ user }: { user: User }) {
  const queryClient = useQueryClient();

  const prefetchUser = () => {
    // ✅ 悬停时预取用户详情
    queryClient.prefetchQuery({
      queryKey: userKeys.detail(user.id),
      queryFn: () => fetchUser(user.id),
    });
  };

  return (
    <Link
      to="/users/$userId"
      params={{ userId: user.id }}
      onMouseEnter={prefetchUser}
      onFocus={prefetchUser}
    >
      {user.name}
    </Link>
  );
}
```

### 1.2 列表项预取

```tsx
import { useQueryClient } from '@tanstack/react-query';

function UserList({ users }: { users: User[] }) {
  const queryClient = useQueryClient();

  useEffect(() => {
    // ✅ 预取前 5 个用户详情
    users.slice(0, 5).forEach((user) => {
      queryClient.prefetchQuery({
        queryKey: userKeys.detail(user.id),
        queryFn: () => fetchUser(user.id),
      });
    });
  }, [users, queryClient]);

  return (
    <div>
      {users.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}
```

## 2. 视口可见时预取

### 2.1 使用 Intersection Observer

```tsx
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useQueryClient } from '@tanstack/react-query';

function LazyUserCard({ userId }: { userId: string }) {
  const queryClient = useQueryClient();
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px', // 提前 200px 预取
  });

  useEffect(() => {
    if (inView) {
      // ✅ 元素进入视口时预取
      queryClient.prefetchQuery({
        queryKey: userKeys.detail(userId),
        queryFn: () => fetchUser(userId),
      });
    }
  }, [inView, userId, queryClient]);

  return (
    <div ref={ref}>
      <UserCard userId={userId} />
    </div>
  );
}
```

### 2.2 无限滚动预取

```tsx
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useQueryClient, useInfiniteQuery } from '@tanstack/react-query';

function InfiniteUserList() {
  const queryClient = useQueryClient();
  const { ref, inView } = useInView();

  const { data, fetchNextPage, hasNextPage } = useInfiniteQuery({
    queryKey: ['users', 'infinite'],
    queryFn: ({ pageParam = 0 }) => fetchUsers({ page: pageParam }),
    getNextPageParam: (lastPage) => lastPage.nextPage,
  });

  useEffect(() => {
    if (inView && hasNextPage) {
      // ✅ 当滚动到底部时预取下一页
      fetchNextPage();
    }
  }, [inView, hasNextPage, fetchNextPage]);

  return (
    <div>
      {data?.pages.flatMap((page) =>
        page.users.map((user) => <UserCard key={user.id} user={user} />),
      )}
      <div ref={ref}>{hasNextPage && <LoadingSpinner />}</div>
    </div>
  );
}
```

## 3. 路由级预取

### 3.1 结合 TanStack Router

```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/users')({
  loader: async ({ context }) => {
    const { queryClient } = context;

    // ✅ 在路由加载时预取用户详情
    const users = await queryClient.ensureQueryData({
      queryKey: userKeys.list(),
      queryFn: fetchUsers,
    });

    // 预取前 5 个用户详情
    users.slice(0, 5).forEach((user) => {
      queryClient.prefetchQuery({
        queryKey: userKeys.detail(user.id),
        queryFn: () => fetchUser(user.id),
      });
    });

    return users;
  },
  component: UsersPage,
});
```

### 3.2 使用 router.preloadRoute

```tsx
import { useRouter, Link } from '@tanstack/react-router';
import { useQueryClient } from '@tanstack/react-query';

function UserCard({ user }: { user: User }) {
  const router = useRouter();
  const queryClient = useQueryClient();

  const handleHover = async () => {
    // ✅ 同时预取路由和数据
    await Promise.all([
      router.preloadRoute({
        to: '/users/$userId',
        params: { userId: user.id },
      }),
      queryClient.prefetchQuery({
        queryKey: userKeys.detail(user.id),
        queryFn: () => fetchUser(user.id),
      }),
    ]);
  };

  return (
    <Link
      to="/users/$userId"
      params={{ userId: user.id }}
      onMouseEnter={handleHover}
      onFocus={handleHover}
    >
      {user.name}
    </Link>
  );
}
```

## 4. 智能预取策略

### 4.1 基于用户行为

```tsx
import { useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';

function useSmartPrefetch() {
  const queryClient = useQueryClient();
  const [prefetchCount, setPrefetchCount] = useState(0);

  const prefetchIfLikely = (queryKey: any[], queryFn: () => Promise<any>) => {
    // ✅ 限制预取数量，避免过度预取
    const MAX_PREFETCH = 10;

    if (prefetchCount >= MAX_PREFETCH) {
      return;
    }

    const cached = queryClient.getQueryData(queryKey);
    if (!cached) {
      queryClient.prefetchQuery({ queryKey, queryFn });
      setPrefetchCount((c) => c + 1);
    }
  };

  return { prefetchIfLikely };
}
```

### 4.2 基于网络状况

```tsx
import { useEffect } from 'react';
import { useQueryClient } from '@tanstack/react-query';

function useAdaptivePrefetch() {
  const queryClient = useQueryClient();

  useEffect(() => {
    // ✅ 根据网络连接类型调整预取策略
    const connection = (navigator as any).connection;

    if (connection) {
      const { effectiveType, saveData } = connection;

      if (saveData) {
        // 用户启用了省流量模式，跳过预取
        return;
      }

      if (effectiveType === '4g') {
        // 4G 网络，积极预取
        prefetchAggressively(queryClient);
      } else if (effectiveType === '3g') {
        // 3G 网络，适度预取
        prefetchModerately(queryClient);
      }
      // 2G 或更慢，不预取
    }
  }, []);
}
```

## 5. 预取与缓存配合

### 5.1 设置合理的 staleTime

```tsx
function UserCard({ user }: { user: User }) {
  const queryClient = useQueryClient();

  const prefetchUser = () => {
    queryClient.prefetchQuery({
      queryKey: userKeys.detail(user.id),
      queryFn: () => fetchUser(user.id),
      staleTime: 1000 * 60 * 2, // ✅ 2 分钟内数据被认为新鲜
    });
  };

  return (
    <Link
      to="/users/$userId"
      params={{ userId: user.id }}
      onMouseEnter={prefetchUser}
    >
      {user.name}
    </Link>
  );
}
```

### 5.2 背景刷新

```tsx
import { useQuery, useQueryClient } from '@tanstack/react-query';

function UserDetail({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const { data, isFetching } = useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => fetchUser(userId),
    staleTime: 1000 * 60 * 2,
    refetchOnWindowFocus: true, // ✅ 窗口聚焦时刷新
  });

  return (
    <div>
      {isFetching && <RefreshingIndicator />}
      <UserProfile user={data} />
    </div>
  );
}
```

## 6. 性能监控

### 6.1 跟踪预取命中率

```tsx
import { useQueryClient } from '@tanstack/react-query';

const prefetchStats = {
  attempted: 0,
  hit: 0,
};

function usePrefetchWithStats() {
  const queryClient = useQueryClient();

  const prefetchWithStats = (queryKey: any[], queryFn: () => Promise<any>) => {
    prefetchStats.attempted++;

    queryClient
      .prefetchQuery({
        queryKey,
        queryFn,
      })
      .then(() => {
        // 监听实际使用
        const checkHit = () => {
          const data = queryClient.getQueryData(queryKey);
          if (data) {
            prefetchStats.hit++;
            console.log(
              `Prefetch hit rate: ${prefetchStats.hit}/${prefetchStats.attempted}`,
            );
          }
        };

        // 延迟检查
        setTimeout(checkHit, 5000);
      });
  };

  return { prefetchWithStats };
}
```

## 与 SWR 的对比

| 特性     | SWR                  | TanStack Query       |
| -------- | -------------------- | -------------------- |
| 预取方法 | `mutate` / `trigger` | `prefetchQuery`      |
| 路由集成 | 需手动               | 配合 Router loader   |
| 条件预取 | 手动判断             | `enabled` + 条件逻辑 |
| 网络适配 | 无内置               | 需自定义             |

## 性能影响

| 策略     | 导航时间  | 用户体验        |
| -------- | --------- | --------------- |
| 无预取   | 300-500ms | 明显加载延迟    |
| 悬停预取 | 50-100ms  | 近乎即时        |
| 视口预取 | 50-100ms  | 近乎即时        |
| 智能预取 | 50-100ms  | 即时 + 节省流量 |
