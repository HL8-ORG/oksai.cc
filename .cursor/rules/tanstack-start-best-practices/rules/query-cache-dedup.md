---
title: Query Cache Deduplication
impact: HIGH
impactDescription: automatic request deduplication, reduces network load
tags: query, tanstack-query, caching, deduplication
---

## Query Cache Deduplication

TanStack Query 自动对相同的查询进行去重，避免重复的 API 请求。这在多个组件需要相同数据时特别有用。

## 1. 自动去重机制

### 1.1 相同 queryKey 自动去重

**Incorrect (手动去重):**

```tsx
import { useQuery } from '@tanstack/react-query';

function UserAvatar({ userId }: { userId: string }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  return <img src={user?.avatar} />;
}

function UserName({ userId }: { userId: string }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  return <span>{user?.name}</span>;
}

function UserProfile({ userId }: { userId: string }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  return (
    <div>
      <UserAvatar userId={userId} />
      <UserName userId={userId} />
      <p>{user?.email}</p>
    </div>
  );
}

// ❌ 手动在父组件获取并传递
function Parent({ userId }: { userId: string }) {
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  return (
    <div>
      <UserAvatar user={user} />
      <UserName user={user} />
    </div>
  );
}
```

**Correct (自动去重):**

```tsx
import { useQuery } from '@tanstack/react-query';

function UserAvatar({ userId }: { userId: string }) {
  // ✅ 自动去重，相同 queryKey 只发送一次请求
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  return <img src={user?.avatar} />;
}

function UserName({ userId }: { userId: string }) {
  // ✅ 复用缓存，不发送新请求
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  return <span>{user?.name}</span>;
}

function UserProfile({ userId }: { userId: string }) {
  // ✅ 复用缓存
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  return (
    <div>
      <UserAvatar userId={userId} />
      <UserName userId={userId} />
      <p>{user?.email}</p>
    </div>
  );
}
```

## 2. 结构化 Query Keys

### 2.1 Query Key Factory

```tsx
// ✅ 使用工厂函数确保一致性
export const userKeys = {
  all: ['users'] as const,
  lists: () => [...userKeys.all, 'list'] as const,
  list: (filters: UserFilters) => [...userKeys.lists(), filters] as const,
  details: () => [...userKeys.all, 'detail'] as const,
  detail: (id: string) => [...userKeys.details(), id] as const,
  posts: (id: string) => [...userKeys.detail(id), 'posts'] as const,
};

// 使用示例
useQuery({ queryKey: userKeys.list({ status: 'active' }) });
useQuery({ queryKey: userKeys.detail('123') });
useQuery({ queryKey: userKeys.posts('123') });
```

### 2.2 复杂查询去重

```tsx
function UserList({ status, page }: Props) {
  // ✅ 复杂查询条件也能自动去重
  const { data } = useQuery({
    queryKey: userKeys.list({ status, page, sortBy: 'createdAt' }),
    queryFn: () => fetchUsers({ status, page, sortBy: 'createdAt' }),
  });

  return <div>{data?.users.map(renderUser)}</div>;
}

function UserListCount({ status }: { status: string }) {
  // ✅ 相同参数复用缓存
  const { data } = useQuery({
    queryKey: userKeys.list({ status, page: 1, sortBy: 'createdAt' }),
    queryFn: () => fetchUsers({ status, page: 1, sortBy: 'createdAt' }),
  });

  return <span>Total: {data?.total}</span>;
}
```

## 3. 跨组件共享数据

### 3.1 使用 QueryClient 读取缓存

```tsx
import { useQueryClient } from '@tanstack/react-query';

function UserSummary({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  // ✅ 从缓存读取，不触发新请求
  const user = queryClient.getQueryData(userKeys.detail(userId));

  if (!user) {
    return <Skeleton />;
  }

  return <div>{user.name}</div>;
}
```

### 3.2 预取数据

```tsx
import { useQueryClient } from '@tanstack/react-query';
import { useRouter } from '@tanstack/react-router';

function UserCard({ user }: { user: User }) {
  const queryClient = useQueryClient();
  const router = useRouter();

  const handleHover = () => {
    // ✅ 预取用户详情，点击时立即显示
    queryClient.prefetchQuery({
      queryKey: userKeys.detail(user.id),
      queryFn: () => fetchUser(user.id),
    });
  };

  return (
    <Link
      to="/users/$userId"
      params={{ userId: user.id }}
      onMouseEnter={handleHover}
    >
      {user.name}
    </Link>
  );
}
```

## 4. 初始数据传递

### 4.1 从列表传递到详情

```tsx
function UserList() {
  const { data: users } = useQuery({
    queryKey: userKeys.list({}),
    queryFn: fetchUsers,
  });

  return (
    <div>
      {users?.map((user) => (
        <UserCard key={user.id} user={user} />
      ))}
    </div>
  );
}

function UserCard({ user }: { user: User }) {
  const { data } = useQuery({
    queryKey: userKeys.detail(user.id),
    queryFn: () => fetchUser(user.id),
    initialData: user, // ✅ 使用列表数据作为初始值
  });

  return <div>{data.name}</div>;
}
```

### 4.2 使用 placeholderData

```tsx
function UserDetail({ userId }: { userId: string }) {
  const queryClient = useQueryClient();

  const { data } = useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => fetchUser(userId),
    placeholderData: () => {
      // ✅ 尝试从列表缓存中查找
      const listData = queryClient.getQueryData(userKeys.list({}));
      return listData?.users.find((u) => u.id === userId);
    },
  });

  return <div>{data?.name}</div>;
}
```

## 5. 去重配置

### 5.1 全局配置

```tsx
import { QueryClient } from '@tanstack/react-query';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 5, // 5 分钟
      gcTime: 1000 * 60 * 10, // 10 分钟
    },
  },
});
```

### 5.2 查询级配置

```tsx
function UserData({ userId }: { userId: string }) {
  const { data } = useQuery({
    queryKey: userKeys.detail(userId),
    queryFn: () => fetchUser(userId),
    staleTime: 1000 * 60 * 2, // 2 分钟内认为数据新鲜
    gcTime: 1000 * 60 * 5, // 5 分钟后清理缓存
  });

  return <div>{data?.name}</div>;
}
```

## 6. 缓存失效策略

### 6.1 精准失效

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: updateUser,
    onSuccess: (updatedUser) => {
      // ✅ 只失效特定用户的缓存
      queryClient.invalidateQueries({
        queryKey: userKeys.detail(updatedUser.id),
      });

      // ✅ 失效所有用户列表
      queryClient.invalidateQueries({
        queryKey: userKeys.lists(),
      });
    },
  });
}
```

### 6.2 批量更新缓存

```tsx
function useBatchUpdateUsers() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: batchUpdateUsers,
    onSuccess: (updatedUsers) => {
      // ✅ 批量更新缓存
      updatedUsers.forEach((user) => {
        queryClient.setQueryData(userKeys.detail(user.id), user);
      });

      // 失效列表
      queryClient.invalidateQueries({
        queryKey: userKeys.lists(),
      });
    },
  });
}
```

## 与 SWR 的对比

| 特性     | SWR            | TanStack Query                    |
| -------- | -------------- | --------------------------------- |
| 去重机制 | 自动           | 自动                              |
| 缓存键   | 字符串         | 数组（结构化）                    |
| 初始数据 | `fallbackData` | `initialData` / `placeholderData` |
| 预取     | `swr.prefetch` | `queryClient.prefetchQuery`       |
| 缓存失效 | `mutate`       | `invalidateQueries`               |

## 性能影响

| 场景             | 请求次数（无去重） | 请求次数（有去重）       |
| ---------------- | ------------------ | ------------------------ |
| 3 个组件相同数据 | 3 次               | 1 次                     |
| 列表 + 详情      | 2 次               | 1 次（使用 initialData） |
| 预取后导航       | 2 次               | 1 次                     |
