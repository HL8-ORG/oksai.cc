---
title: Route-Based Code Splitting
impact: CRITICAL
impactDescription: reduces initial bundle size, faster TTI
tags: router, code-splitting, lazy-loading, performance
---

## Route-Based Code Splitting

TanStack Router 支持自动和手动的路由级代码分割，可以显著减少初始包大小。

## 1. 自动代码分割

TanStack Router 使用文件系统路由时，每个路由文件会自动进行代码分割。

### 文件结构

```
routes/
├── index.tsx              # 单独 chunk
├── users.index.tsx        # 单独 chunk
├── users.$userId.tsx      # 单独 chunk
└── dashboard.tsx          # 单独 chunk
```

**无需额外配置，自动按路由分割。**

## 2. 手动懒加载组件

### 2.1 懒加载重型组件

**Incorrect (同步导入):**

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { MonacoEditor } from '@/components/MonacoEditor';

export const Route = createFileRoute('/editor')({
  component: EditorPage,
});

function EditorPage() {
  return (
    <div>
      <MonacoEditor />
    </div>
  );
}
```

**Correct (懒加载):**

```tsx
import { lazy, Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';

const MonacoEditor = lazy(() => import('@/components/MonacoEditor'));

export const Route = createFileRoute('/editor')({
  component: EditorPage,
});

function EditorPage() {
  return (
    <div>
      <Suspense fallback={<EditorSkeleton />}>
        <MonacoEditor />
      </Suspense>
    </div>
  );
}
```

### 2.2 条件加载组件

```tsx
import { lazy, Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';

const AdvancedEditor = lazy(() => import('@/components/AdvancedEditor'));
const BasicEditor = lazy(() => import('@/components/BasicEditor'));

export const Route = createFileRoute('/editor')({
  component: EditorPage,
});

function EditorPage() {
  const { mode } = Route.useSearch();

  const Editor = mode === 'advanced' ? AdvancedEditor : BasicEditor;

  return (
    <Suspense fallback={<EditorSkeleton />}>
      <Editor />
    </Suspense>
  );
}
```

## 3. 预加载组件

### 3.1 悬停预加载

```tsx
import { useState } from 'react';
import { createFileRoute } from '@tanstack/react-router';

export const Route = createFileRoute('/dashboard')({
  component: DashboardPage,
});

function DashboardPage() {
  const [Editor, setEditor] = useState<React.LazyExoticComponent<any> | null>(
    null,
  );

  const preloadEditor = () => {
    setEditor(lazy(() => import('@/components/Editor')));
  };

  return (
    <div>
      <button
        onMouseEnter={preloadEditor}
        onFocus={preloadEditor}
        onClick={() => setShowEditor(true)}
      >
        Open Editor
      </button>

      {showEditor && Editor && (
        <Suspense fallback={<EditorSkeleton />}>
          <Editor />
        </Suspense>
      )}
    </div>
  );
}
```

### 3.2 使用 router.preloadRoute 预加载路由

```tsx
import { useEffect } from 'react';
import { useRouter, Link } from '@tanstack/react-router';

function Navigation() {
  const router = useRouter();

  useEffect(() => {
    // ✅ 预加载常用路由
    router.preloadRoute({ to: '/dashboard' });
    router.preloadRoute({ to: '/settings' });
  }, [router]);

  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/settings">Settings</Link>
    </nav>
  );
}
```

## 4. 分割大型第三方库

### 4.1 条件加载图表库

```tsx
import { lazy, Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';

const Chart = lazy(() =>
  import('react-chartjs-2').then((m) => ({ default: m.Line })),
);

export const Route = createFileRoute('/analytics')({
  component: AnalyticsPage,
});

function AnalyticsPage() {
  const [showChart, setShowChart] = useState(false);

  return (
    <div>
      <button onClick={() => setShowChart(true)}>Show Analytics</button>

      {showChart && (
        <Suspense fallback={<ChartSkeleton />}>
          <Chart data={chartData} />
        </Suspense>
      )}
    </div>
  );
}
```

### 4.2 动态加载编辑器

```tsx
import { lazy, Suspense } from 'react';
import { createFileRoute } from '@tanstack/react-router';

const MarkdownEditor = lazy(() =>
  import('@uiw/react-md-editor').then((m) => ({ default: m.default })),
);

export const Route = createFileRoute('/docs/edit')({
  component: DocsEditPage,
});

function DocsEditPage() {
  const [content, setContent] = useState('');

  return (
    <Suspense fallback={<EditorSkeleton />}>
      <MarkdownEditor value={content} onChange={setContent} />
    </Suspense>
  );
}
```

## 5. 包分析

### 5.1 配置 Bundle Analyzer

```ts
// vite.config.ts
import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { visualizer } from 'rollup-plugin-visualizer';

export default defineConfig({
  plugins: [
    react(),
    visualizer({
      open: true,
      gzipSize: true,
      brotliSize: true,
    }),
  ],
});
```

### 5.2 检查包大小

```bash
# 构建并分析
pnpm build

# 检查特定路由的 chunk 大小
ls -lh dist/routes/
```

## 6. 最佳实践

### 6.1 代码分割边界

```tsx
// ✅ 好的分割点
const HeavyChart = lazy(() => import('./HeavyChart')); // 图表组件
const RichEditor = lazy(() => import('./RichEditor')); // 富文本编辑器
const DataTable = lazy(() => import('./DataTable')); // 数据表格

// ❌ 过度分割
const Button = lazy(() => import('./Button')); // 太小，不值得
const Icon = lazy(() => import('./Icon')); // 太小，不值得
```

### 6.2 Loading 状态设计

```tsx
function LoadingState() {
  return (
    <div className="animate-pulse space-y-4">
      <div className="h-8 bg-gray-200 rounded w-1/4" />
      <div className="h-64 bg-gray-200 rounded" />
      <div className="h-4 bg-gray-200 rounded w-3/4" />
    </div>
  );
}

function EditorPage() {
  return (
    <Suspense fallback={<LoadingState />}>
      <MonacoEditor />
    </Suspense>
  );
}
```

## 与 Next.js 的对比

| 特性        | Next.js             | TanStack Router           |
| ----------- | ------------------- | ------------------------- |
| 路由分割    | 自动                | 自动（文件系统路由）      |
| 组件懒加载  | `next/dynamic`      | `React.lazy` + `Suspense` |
| 预加载      | `router.prefetch()` | `router.preloadRoute()`   |
| Bundle 分析 | 内置                | Vite 插件                 |

## 性能影响

| 优化项         | 初始包大小  | TTI 改善        |
| -------------- | ----------- | --------------- |
| 路由级分割     | 50-70% 减少 | 40-60%          |
| 懒加载重型组件 | 30-50% 减少 | 30-50%          |
| 预加载优化     | 无变化      | 50-80% 感知提升 |
