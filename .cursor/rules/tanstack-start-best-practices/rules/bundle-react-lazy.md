---
title: Use React.lazy Instead of next/dynamic
impact: CRITICAL
impactDescription: directly affects TTI and LCP
tags: bundle, dynamic-import, code-splitting, react-lazy
---

## Use React.lazy Instead of next/dynamic

In TanStack Start, use `React.lazy` and `Suspense` for code splitting instead of `next/dynamic`.

**Incorrect (using Next.js specific API):**

```tsx
// ❌ This doesn't work in TanStack Start
import dynamic from 'next/dynamic';

const MonacoEditor = dynamic(
  () => import('./monaco-editor').then((m) => m.MonacoEditor),
  { ssr: false },
);

function CodePanel({ code }: { code: string }) {
  return <MonacoEditor value={code} />;
}
```

**Correct (using React.lazy):**

```tsx
import { lazy, Suspense } from 'react';

const MonacoEditor = lazy(() => import('./monaco-editor'));

function CodePanel({ code }: { code: string }) {
  return (
    <Suspense fallback={<div>Loading editor...</div>}>
      <MonacoEditor value={code} />
    </Suspense>
  );
}
```

**With named exports:**

```tsx
import { lazy, Suspense } from 'react';

// For named exports, use destructuring in the import
const MonacoEditor = lazy(() =>
  import('./monaco-editor').then((m) => ({ default: m.MonacoEditor })),
);

function CodePanel({ code }: { code: string }) {
  return (
    <Suspense fallback={<EditorSkeleton />}>
      <MonacoEditor value={code} />
    </Suspense>
  );
}
```

**Preloading on user intent:**

```tsx
import { lazy, Suspense } from 'react';

const HeavyChart = lazy(() => import('./heavy-chart'));

function ChartButton() {
  const preload = () => {
    // Trigger preload when user shows intent
    void import('./heavy-chart');
  };

  return (
    <button
      onMouseEnter={preload}
      onFocus={preload}
      onClick={() => setShowChart(true)}
    >
      Show Chart
    </button>
  );
}
```

## Key Differences from Next.js

| Feature       | Next.js `dynamic`            | React.lazy             |
| ------------- | ---------------------------- | ---------------------- |
| SSR Support   | Built-in (ssr: false option) | Manual handling needed |
| Loading UI    | Built-in (loading option)    | Requires Suspense      |
| Named Exports | Automatic                    | Manual mapping needed  |
| Preloading    | Automatic on hover           | Manual import()        |
| Bundle Size   | Optimized                    | Optimized              |

## Best Practices

1. **Always wrap in Suspense** - Provide meaningful fallback UI
2. **Preload on user intent** - Mouse enter, focus, hover
3. **Use named export mapping** - For non-default exports
4. **Consider route-based splitting** - Split at route boundaries
5. **Monitor chunk sizes** - Use bundle analyzer

## When to Use

- Heavy components (editors, charts, maps)
- Feature-flagged components
- Modal/dropdown content
- Below-the-fold content
- Large third-party libraries

## Performance Impact

- **Initial bundle**: Reduces by 30-70%
- **TTI**: Improves by 50-80%
- **LCP**: Improves by 40-60%
