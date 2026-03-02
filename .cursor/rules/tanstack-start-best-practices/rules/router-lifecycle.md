---
title: Router Lifecycle Hooks
impact: MEDIUM
impactDescription: enables non-blocking operations, better UX
tags: router, lifecycle, hooks, server-functions
---

## Router Lifecycle Hooks

TanStack Router 提供了生命周期钩子来处理导航过程中的各种操作，如非阻塞任务、分析和清理工作。

## 1. 路由加载器生命周期

### 1.1 loader 执行时机

```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/users/$userId')({
  loader: async ({ context, params, abortSignal }) => {
    const { queryClient } = context;

    // ✅ loader 在路由匹配时执行
    // ✅ abortSignal 用于取消请求
    return queryClient.ensureQueryData({
      queryKey: ['user', params.userId],
      queryFn: ({ signal }) => fetchUser(params.userId, { signal }),
    });
  },
  component: UserPage,
});
```

### 1.2 onEnter 钩子

```tsx
export const Route = createFileRoute('/dashboard')({
  onEnter: async ({ context, params }) => {
    // ✅ 路由进入时执行，用于日志记录
    const { analytics } = context;
    analytics.trackPageView('/dashboard');
  },
  loader: async ({ context }) => {
    // ...
  },
  component: DashboardPage,
});
```

## 2. 使用 Server Functions 处理非阻塞操作

### 2.1 异步日志记录

**Incorrect (阻塞响应):**

```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/api/submit')({
  loader: async ({ request }) => {
    const data = await request.json();

    // ❌ 日志阻塞响应
    await logToAnalytics(data);
    await writeToDatabase(data);

    return { success: true };
  },
});
```

**Correct (非阻塞):**

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { createServerFn } from '@tanstack/start';

const logAnalytics = createServerFn('POST', async (data: any) => {
  // 在服务器端执行日志记录
  await writeToAnalytics(data);
});

export const Route = createFileRoute('/api/submit')({
  loader: async ({ request }) => {
    const data = await request.json();

    // ✅ 核心操作完成后立即响应
    await writeToDatabase(data);

    // ✅ 非阻塞：不等待日志完成
    logAnalytics(data).catch(console.error);

    return { success: true };
  },
});
```

### 2.2 背景任务

```tsx
import { createServerFn } from '@tanstack/start';

const sendNotification = createServerFn(
  'POST',
  async (payload: NotificationPayload) => {
    await notificationService.send(payload);
  },
);

export const Route = createFileRoute('/orders/create')({
  loader: async ({ context, request }) => {
    const order = await createOrder(request);

    // ✅ 非阻塞发送通知
    sendNotification({
      type: 'order_created',
      orderId: order.id,
      userId: context.userId,
    }).catch(console.error);

    return order;
  },
});
```

## 3. 路由守卫和重定向

### 3.1 认证守卫

```tsx
import { createFileRoute, redirect } from '@tanstack/react-router';

export const Route = createFileRoute('/admin')({
  beforeLoad: async ({ context }) => {
    const { auth } = context;

    // ✅ 在 loader 执行前检查权限
    if (!auth.isAuthenticated) {
      throw redirect({
        to: '/login',
        search: { redirect: '/admin' },
      });
    }

    if (!auth.user.isAdmin) {
      throw redirect({ to: '/unauthorized' });
    }
  },
  loader: async ({ context }) => {
    // 只有通过认证才会执行
    return fetchAdminData();
  },
  component: AdminPage,
});
```

### 3.2 权限检查

```tsx
export const Route = createFileRoute('/projects/$projectId')({
  beforeLoad: async ({ context, params }) => {
    const { auth, queryClient } = context;

    // ✅ 预先加载项目数据检查权限
    const project = await queryClient.ensureQueryData({
      queryKey: ['project', params.projectId],
      queryFn: () => fetchProject(params.projectId),
    });

    if (project.ownerId !== auth.user.id) {
      throw redirect({ to: '/forbidden' });
    }

    return { project };
  },
  component: ProjectPage,
});
```

## 4. 路由离开钩子

### 4.1 提示未保存更改

```tsx
import { useEffect } from 'react';
import { useBlocker } from '@tanstack/react-router';

function EditForm() {
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  const { proceed, reset, status } = useBlocker({
    shouldBlockFn: () => hasUnsavedChanges,
    withResolver: true,
  });

  useEffect(() => {
    const handleBeforeUnload = (e: BeforeUnloadEvent) => {
      if (hasUnsavedChanges) {
        e.preventDefault();
        e.returnValue = '';
      }
    };

    window.addEventListener('beforeunload', handleBeforeUnload);
    return () => window.removeEventListener('beforeunload', handleBeforeUnload);
  }, [hasUnsavedChanges]);

  if (status === 'blocked') {
    return (
      <ConfirmDialog
        message="您有未保存的更改，确定要离开吗？"
        onConfirm={proceed}
        onCancel={reset}
      />
    );
  }

  return <form>{/* 表单内容 */}</form>;
}
```

## 5. 错误处理生命周期

### 5.1 错误边界

```tsx
import { createFileRoute, ErrorComponent } from '@tanstack/react-router';

export const Route = createFileRoute('/users/$userId')({
  loader: async ({ params }) => {
    const user = await fetchUser(params.userId);

    if (!user) {
      throw new Error('User not found');
    }

    return user;
  },
  errorComponent: ({ error }) => {
    // ✅ 自定义错误组件
    if (error.message === 'User not found') {
      return <UserNotFound />;
    }

    return <ErrorComponent error={error} />;
  },
  component: UserPage,
});
```

### 5.2 全局错误处理

```tsx
import { createRouter } from '@tanstack/react-router';

const router = createRouter({
  routeTree,
  defaultErrorComponent: ({ error }) => (
    <div>
      <h1>Something went wrong</h1>
      <p>{error.message}</p>
      <button onClick={() => window.location.reload()}>Retry</button>
    </div>
  ),
});
```

## 6. 性能监控

### 6.1 路由加载时间跟踪

```tsx
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard')({
  onEnter: () => {
    performance.mark('dashboard-enter-start');
  },
  loader: async ({ context }) => {
    const start = performance.now();

    const data = await context.queryClient.ensureQueryData({
      queryKey: ['dashboard'],
      queryFn: fetchDashboardData,
    });

    const duration = performance.now() - start;
    analytics.trackLoaderDuration('dashboard', duration);

    return data;
  },
  component: DashboardPage,
});
```

## 与 Next.js 的对比

| 特性       | Next.js       | TanStack Router             |
| ---------- | ------------- | --------------------------- |
| 中间件     | middleware.ts | `beforeLoad`                |
| 非阻塞操作 | `after()`     | Server Functions + Promise  |
| 路由守卫   | 中间件检查    | `beforeLoad` + `redirect()` |
| 离开确认   | 自定义        | `useBlocker`                |
