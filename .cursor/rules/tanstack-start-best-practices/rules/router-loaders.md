---
title: Use TanStack Router Loaders for Data Fetching
impact: CRITICAL
impactDescription: eliminates waterfalls, enables parallel fetching
tags: router, loaders, data-fetching, parallel
---

## Use TanStack Router Loaders for Data Fetching

In TanStack Start, use TanStack Router Loaders instead of React Server Components for server-side data fetching.

**Incorrect (client-side fetching with waterfalls):**

```tsx
// routes/users.tsx
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

export const Route = createFileRoute('/users/')({
  component: UsersPage,
});

function UsersPage() {
  // ❌ Fetches on client, blocks rendering
  const { data: users } = useQuery({
    queryKey: ['users'],
    queryFn: () => fetch('/api/users').then((r) => r.json()),
  });

  return <div>{users?.map(renderUser)}</div>;
}
```

**Correct (using loaders for parallel fetching):**

```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/users/')({
  loader: async ({ context }) => {
    const { queryClient } = context;

    // ✅ Fetches on server, loads in parallel with route
    return queryClient.ensureQueryData({
      queryKey: ['users'],
      queryFn: () => fetch('/api/users').then((r) => r.json()),
    });
  },
  component: UsersPage,
});

function UsersPage() {
  const users = Route.useLoaderData();
  return <div>{users.map(renderUser)}</div>;
}
```

## Parallel Data Fetching

### Multiple Resources in Single Loader

```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard/')({
  loader: async ({ context }) => {
    const { queryClient } = context;

    // ✅ All fetches run in parallel
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
  const { users, posts, comments } = Route.useLoaderData();
  // All data available immediately
}
```

### Nested Routes with Parallel Loading

```tsx
// routes/dashboard.tsx
export const Route = createFileRoute('/dashboard')({
  loader: async ({ context }) => {
    const { queryClient } = context;
    return queryClient.ensureQueryData({
      queryKey: ['dashboard-data'],
      queryFn: fetchDashboardData,
    });
  },
  component: DashboardLayout,
});

// routes/dashboard.analytics.tsx
export const Route = createFileRoute('/dashboard/analytics')({
  loader: async ({ context }) => {
    const { queryClient } = context;
    // ✅ Runs in parallel with parent loader
    return queryClient.ensureQueryData({
      queryKey: ['analytics'],
      queryFn: fetchAnalytics,
    });
  },
  component: AnalyticsPage,
});
```

## Prefetching Strategies

### 1. Prefetch on Link Hover (推荐方式)

```tsx
import { Link } from '@tanstack/react-router';

function UserCard({ userId }: { userId: string }) {
  return (
    // ✅ Link 组件内置 preload 支持，hover/focus 时自动预取
    <Link to="/users/$userId" params={{ userId }} preload="intent">
      View User
    </Link>
  );
}
```

### 2. 使用 useRouter 手动预取

```tsx
import { useEffect } from 'react';
import { useRouter } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';

function UserList() {
  const router = useRouter();
  const users = useQuery({ queryKey: ['users'], queryFn: fetchUsers });

  useEffect(() => {
    // ✅ 使用 router.preloadRoute 预取路由数据
    users.data?.slice(0, 5).forEach((user) => {
      router.preloadRoute({
        to: '/users/$userId',
        params: { userId: user.id },
      });
    });
  }, [users.data, router]);

  return <div>{users.data?.map(renderUser)}</div>;
}
```

### 3. Prefetch on Visibility

```tsx
import { useEffect } from 'react';
import { useInView } from 'react-intersection-observer';
import { useRouter } from '@tanstack/react-router';

function LazySection({ userId }: { userId: string }) {
  const router = useRouter();
  const { ref, inView } = useInView({
    triggerOnce: true,
    rootMargin: '200px',
  });

  useEffect(() => {
    if (inView) {
      // ✅ 当元素进入视口时预取
      router.preloadRoute({
        to: '/users/$userId',
        params: { userId },
      });
    }
  }, [inView, userId, router]);

  return <div ref={ref}>User content</div>;
}
```

## Loader Context

### Sharing QueryClient

```tsx
// main.tsx
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { RouterProvider, createRouter } from '@tanstack/react-router';

const queryClient = new QueryClient();

const router = createRouter({
  routeTree,
  context: {
    queryClient, // ✅ Available in all loaders
  },
});

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <RouterProvider router={router} />
    </QueryClientProvider>
  );
}
```

### Custom Context

```tsx
// routes/users.$userId.tsx
export const Route = createFileRoute('/users/$userId')({
  loader: async ({ context, params }) => {
    const { queryClient, auth } = context;

    // ✅ Access auth in loader
    if (!auth.isAuthenticated) {
      throw redirect({ to: '/login' });
    }

    return queryClient.ensureQueryData({
      queryKey: ['user', params.userId],
      queryFn: () => fetchUser(params.userId, auth.token),
    });
  },
});
```

## Error Handling

```tsx
import { ErrorComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/users/$userId')({
  loader: async ({ params }) => {
    const user = await fetchUser(params.userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },
  errorComponent: ErrorComponent,
  component: UserPage,
});
```

## Loading States

```tsx
export const Route = createFileRoute('/users/')({
  loader: async ({ context }) => {
    const { queryClient } = context;
    return queryClient.ensureQueryData({
      queryKey: ['users'],
      queryFn: fetchUsers,
    });
  },
  pendingComponent: () => <div>Loading users...</div>,
  component: UsersPage,
});
```

## Dependent Loading

```tsx
// routes/users.$userId.posts.tsx
export const Route = createFileRoute('/users/$userId/posts')({
  loader: async ({ context, params }) => {
    const { queryClient } = context;

    // ✅ Dependent on user data
    const user = await queryClient.ensureQueryData({
      queryKey: ['user', params.userId],
      queryFn: () => fetchUser(params.userId),
    });

    // ✅ Only fetch posts after user is loaded
    const posts = await queryClient.ensureQueryData({
      queryKey: ['posts', user.id],
      queryFn: () => fetchPosts(user.id),
    });

    return { user, posts };
  },
  component: UserPostsPage,
});
```

## Best Practices

1. **Use ensureQueryData** - Prevents duplicate requests
2. **Leverage context** - Share QueryClient and auth
3. **Prefetch aggressively** - On hover, focus, visibility
4. **Handle errors** - Provide error components
5. **Show loading states** - Use pendingComponent
6. **Parallel fetch** - Use Promise.all() in loaders

## Performance Impact

- **Initial load**: 50-80% faster than client-side fetching
- **Waterfall elimination**: 100% (all parallel)
- **Cache hits**: Instant navigation
- **Prefetching**: Near-instant perceived navigation

## Comparison with Next.js

| Feature           | Next.js RSC | TanStack Loaders    |
| ----------------- | ----------- | ------------------- |
| Server rendering  | ✅          | ✅                  |
| Parallel fetching | ✅          | ✅                  |
| Client cache      | ❌          | ✅ (TanStack Query) |
| Prefetching       | Manual      | Built-in            |
| Error boundaries  | Manual      | Built-in            |
| Loading states    | Manual      | Built-in            |
