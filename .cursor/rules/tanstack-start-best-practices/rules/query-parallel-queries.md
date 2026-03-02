---
title: Parallel Queries with TanStack Query
impact: HIGH
impactDescription: eliminates waterfalls, 2-10× faster loading
tags: query, tanstack-query, parallel, data-fetching
---

## Parallel Queries with TanStack Query

并行执行多个独立的查询，避免瀑布式加载，显著提升数据加载速度。

## 1. 使用 useQueries 并行查询

### 1.1 基本用法

**Incorrect (顺序查询):**

```tsx
import { useQuery } from '@tanstack/react-query';

function Dashboard() {
  // ❌ 顺序执行，形成瀑布流
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  const { data: posts } = useQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  });

  const { data: comments } = useQuery({
    queryKey: ['comments'],
    queryFn: fetchComments,
  });

  return (
    <div>
      <UsersList data={users} />
      <PostsList data={posts} />
      <CommentsList data={comments} />
    </div>
  );
}
```

**Correct (并行查询):**

```tsx
import { useQueries } from '@tanstack/react-query';

function Dashboard() {
  // ✅ 并行执行，同时获取所有数据
  const queries = useQueries({
    queries: [
      { queryKey: ['users'], queryFn: fetchUsers },
      { queryKey: ['posts'], queryFn: fetchPosts },
      { queryKey: ['comments'], queryFn: fetchComments },
    ],
  });

  const [usersQuery, postsQuery, commentsQuery] = queries;

  return (
    <div>
      <UsersList data={usersQuery.data} />
      <PostsList data={postsQuery.data} />
      <CommentsList data={commentsQuery.data} />
    </div>
  );
}
```

### 1.2 动态并行查询

```tsx
import { useQueries } from '@tanstack/react-query';

function UserStats({ userIds }: { userIds: string[] }) {
  // ✅ 根据用户 ID 数组动态创建并行查询
  const userQueries = useQueries({
    queries: userIds.map((id) => ({
      queryKey: ['user', id],
      queryFn: () => fetchUser(id),
    })),
  });

  return (
    <div>
      {userQueries.map((query, index) => (
        <div key={userIds[index]}>
          {query.isLoading && <Skeleton />}
          {query.data && <UserCard user={query.data} />}
        </div>
      ))}
    </div>
  );
}
```

## 2. 使用 Promise.all 与 ensureQueryData

### 2.1 在 Loader 中并行加载

```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard')({
  loader: async ({ context }) => {
    const { queryClient } = context;

    // ✅ 并行预加载所有数据到 Query Cache
    const [users, posts, comments] = await Promise.all([
      queryClient.ensureQueryData({
        queryKey: ['users'],
        queryFn: fetchUsers,
      }),
      queryClient.ensureQueryData({
        queryKey: ['posts'],
        queryFn: fetchPosts,
      }),
      queryClient.ensureQueryData({
        queryKey: ['comments'],
        queryFn: fetchComments,
      }),
    ]);

    return { users, posts, comments };
  },
  component: DashboardPage,
});

function DashboardPage() {
  // ✅ 数据已在 loader 中加载，立即可用
  const { users, posts, comments } = Route.useLoaderData();

  return (
    <div>
      <UsersList data={users} />
      <PostsList data={posts} />
      <CommentsList data={comments} />
    </div>
  );
}
```

### 2.2 依赖性并行查询

```tsx
import { useQuery } from '@tanstack/react-query';

function UserPosts({ userId }: { userId: string }) {
  // ✅ 第一阶段：获取用户
  const { data: user } = useQuery({
    queryKey: ['user', userId],
    queryFn: () => fetchUser(userId),
  });

  // ✅ 第二阶段：用户数据就绪后并行获取
  const postQueries = useQueries({
    queries: user?.postIds
      ? user.postIds.map((postId) => ({
          queryKey: ['post', postId],
          queryFn: () => fetchPost(postId),
        }))
      : [],
  });

  return (
    <div>
      <h1>{user?.name}</h1>
      {postQueries.map((query) => (
        <PostCard key={query.data?.id} post={query.data} />
      ))}
    </div>
  );
}
```

## 3. 使用 Suspense 进行并行加载

### 3.1 并行 Suspense 组件

```tsx
import { Suspense } from 'react';
import { useSuspenseQuery } from '@tanstack/react-query';

function UsersSection() {
  const { data } = useSuspenseQuery({
    queryKey: ['users'],
    queryFn: fetchUsers,
  });

  return <div>{data.map(renderUser)}</div>;
}

function PostsSection() {
  const { data } = useSuspenseQuery({
    queryKey: ['posts'],
    queryFn: fetchPosts,
  });

  return <div>{data.map(renderPost)}</div>;
}

function Dashboard() {
  return (
    <div>
      {/* ✅ 两个 Suspense 并行加载 */}
      <Suspense fallback={<UsersSkeleton />}>
        <UsersSection />
      </Suspense>

      <Suspense fallback={<PostsSkeleton />}>
        <PostsSection />
      </Suspense>
    </div>
  );
}
```

### 3.2 单一 Suspense 边界

```tsx
import { useSuspenseQueries } from '@tanstack/react-query';

function DashboardContent() {
  // ✅ 并行获取所有数据
  const [usersQuery, postsQuery] = useSuspenseQueries({
    queries: [
      { queryKey: ['users'], queryFn: fetchUsers },
      { queryKey: ['posts'], queryFn: fetchPosts },
    ],
  });

  return (
    <div>
      <UsersList data={usersQuery.data} />
      <PostsList data={postsQuery.data} />
    </div>
  );
}

function Dashboard() {
  return (
    <Suspense fallback={<DashboardSkeleton />}>
      <DashboardContent />
    </Suspense>
  );
}
```

## 4. 条件并行查询

### 4.1 enabled 条件

```tsx
import { useQueries } from '@tanstack/react-query';

function ConditionalDashboard({ showUsers, showPosts }: Props) {
  const queries = useQueries({
    queries: [
      {
        queryKey: ['users'],
        queryFn: fetchUsers,
        enabled: showUsers, // ✅ 条件执行
      },
      {
        queryKey: ['posts'],
        queryFn: fetchPosts,
        enabled: showPosts, // ✅ 条件执行
      },
    ],
  });

  const [usersQuery, postsQuery] = queries;

  return (
    <div>
      {showUsers && <UsersList data={usersQuery.data} />}
      {showPosts && <PostsList data={postsQuery.data} />}
    </div>
  );
}
```

## 5. 性能对比

### 5.1 顺序 vs 并行

| 查询数量 | 顺序加载（ms） | 并行加载（ms） | 改善 |
| -------- | -------------- | -------------- | ---- |
| 2 个查询 | 600            | 300            | 50%  |
| 3 个查询 | 900            | 300            | 67%  |
| 5 个查询 | 1500           | 300            | 80%  |

### 5.2 实际示例

```tsx
// ❌ 顺序加载：总时间 = 查询1 + 查询2 + 查询3
async function sequentialLoad() {
  const users = await fetchUsers(); // 300ms
  const posts = await fetchPosts(); // 300ms
  const comments = await fetchComments(); // 300ms
  // 总计：900ms
}

// ✅ 并行加载：总时间 = max(查询1, 查询2, 查询3)
async function parallelLoad() {
  const [users, posts, comments] = await Promise.all([
    fetchUsers(), // 300ms
    fetchPosts(), // 300ms
    fetchComments(), // 300ms
  ]);
  // 总计：300ms
}
```

## 6. 错误处理

### 6.1 部分失败处理

```tsx
import { useQueries } from '@tanstack/react-query';

function Dashboard() {
  const queries = useQueries({
    queries: [
      {
        queryKey: ['users'],
        queryFn: fetchUsers,
        retry: 1,
      },
      {
        queryKey: ['posts'],
        queryFn: fetchPosts,
        retry: 1,
      },
    ],
  });

  const [usersQuery, postsQuery] = queries;

  return (
    <div>
      {/* ✅ 一个查询失败不影响其他查询 */}
      {usersQuery.isError ? (
        <ErrorMessage error={usersQuery.error} />
      ) : (
        <UsersList data={usersQuery.data} />
      )}

      {postsQuery.isError ? (
        <ErrorMessage error={postsQuery.error} />
      ) : (
        <PostsList data={postsQuery.data} />
      )}
    </div>
  );
}
```

## 与 SWR 的对比

| 特性          | SWR          | TanStack Query       |
| ------------- | ------------ | -------------------- |
| 并行查询      | `useSWR` x N | `useQueries`         |
| Suspense 支持 | 需配置       | `useSuspenseQueries` |
| 条件查询      | 条件 key     | `enabled` 选项       |
| 动态查询      | 需手动实现   | 内置支持             |
