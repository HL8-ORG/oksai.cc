---
name: tanstack-start-best-practices
description: TanStack Start 性能优化指南，基于 Vercel React Best Practices 并针对 TanStack Start 进行定制化调整。用于编写、审查或重构 TanStack Start 代码时确保最优性能模式。触发于涉及 React 组件、TanStack Router、TanStack Query、数据获取、包优化或性能改进的任务。
license: MIT
metadata:
  author: oksai
  version: '1.0.0'
  based_on: vercel-react-best-practices
---

# TanStack Start Best Practices

TanStack Start 应用的综合性能优化指南，基于 Vercel React Best Practices 并针对 TanStack Start 框架特性进行了定制化调整。包含 32+ 通用规则和 10 TanStack Start 特定规则，按影响优先级排序，指导自动化重构和代码生成。

## 适用场景

在以下情况参考这些指南：

- 编写新的 React 组件或 TanStack Start 页面
- 实现数据获取（客户端或服务端）
- 审查代码性能问题
- 重构现有 TanStack Start 代码
- 优化包大小或加载时间

## 规则类别与优先级

| 优先级 | 类别                 | 影响       | 前缀         | 适用性           |
| ------ | -------------------- | ---------- | ------------ | ---------------- |
| 1      | 消除瀑布流           | CRITICAL   | `async-`     | ✅ 100% 适用     |
| 2      | 包大小优化           | CRITICAL   | `bundle-`    | ⚠️ 需调整        |
| 3      | TanStack Query 优化  | HIGH       | `query-`     | 🆕 TanStack 特定 |
| 4      | TanStack Router 优化 | HIGH       | `router-`    | 🆕 TanStack 特定 |
| 5      | 重渲染优化           | MEDIUM     | `rerender-`  | ✅ 100% 适用     |
| 6      | 渲染性能             | MEDIUM     | `rendering-` | ✅ 100% 适用     |
| 7      | JavaScript 性能      | LOW-MEDIUM | `js-`        | ✅ 100% 适用     |
| 8      | 高级模式             | LOW        | `advanced-`  | ✅ 100% 适用     |

## 与 Next.js 版本的差异

### 🔄 替换方案

| Next.js 特性            | TanStack Start 替代       | 规则文件               |
| ----------------------- | ------------------------- | ---------------------- |
| `next/dynamic`          | `React.lazy` + `Suspense` | `bundle-react-lazy.md` |
| `useSWR`                | TanStack Query            | `query-*.md`           |
| React Server Components | TanStack Loaders          | `router-loaders.md`    |
| `React.cache()`         | TanStack Query Cache      | `query-cache-dedup.md` |
| `after()`               | Router Lifecycle          | `router-lifecycle.md`  |

### ✅ 完全适用

以下规则无需调整，直接应用：

- 所有 `rerender-*` 规则（重渲染优化）
- 所有 `js-*` 规则（JavaScript 性能）
- 所有 `rendering-*` 规则（渲染性能）
- 所有 `async-*` 规则（异步优化）

## 快速参考

### 1. 消除瀑布流（CRITICAL）

- `async-defer-await` - 推迟到实际使用的分支
- `async-parallel` - 使用 Promise.all() 并行
- `async-dependencies` - 使用 better-all 处理部分依赖
- `async-suspense-boundaries` - 使用 Suspense 流式传输内容

### 2. 包大小优化（CRITICAL）

- `bundle-barrel-imports` - 直接导入，避免桶文件
- `bundle-react-lazy` - 🆕 使用 React.lazy 懒加载
- `bundle-defer-third-party` - 延迟非关键库
- `bundle-conditional` - 按需加载模块
- 注：预加载由 TanStack Router 处理，见 `router-prefetch`

### 3. TanStack Query 优化（HIGH）

- `query-tanstack-query` - 🆕 TanStack Query 基础
- `query-cache-dedup` - 🆕 使用 Query Cache 去重
- `query-parallel-queries` - 🆕 并行查询
- `query-prefetch` - 🆕 预取策略
- `query-optimistic-updates` - 🆕 乐观更新

### 4. TanStack Router 优化（HIGH）

- `router-loaders` - 🆕 使用 Loaders 数据加载
- `router-prefetch` - 🆕 路由预取
- `router-lifecycle` - 🆕 路由生命周期
- `router-code-splitting` - 🆕 路由代码分割

### 5. 重渲染优化（MEDIUM）

- `rerender-defer-reads` - 延迟到使用点读取状态
- `rerender-memo` - 提取到记忆化组件
- `rerender-dependencies` - 使用原始依赖
- `rerender-derived-state` - 订阅派生状态
- `rerender-functional-setstate` - 使用函数式 setState
- `rerender-lazy-state-init` - 延迟状态初始化
- `rerender-transitions` - 使用 transition 进行非紧急更新

### 6. 渲染性能（MEDIUM）

- `rendering-animate-svg-wrapper` - 动画 SVG 包装器
- `rendering-content-visibility` - 长列表使用 content-visibility
- `rendering-hoist-jsx` - 提升静态 JSX
- `rendering-svg-precision` - 优化 SVG 精度
- `rendering-activity` - 使用 Activity 组件

### 7. JavaScript 性能（LOW-MEDIUM）

- `js-batch-dom-css` - 批量 DOM CSS 更改
- `js-index-maps` - 构建索引 Map
- `js-cache-property-access` - 缓存属性访问
- `js-cache-function-results` - 缓存函数结果
- `js-combine-iterations` - 合并数组迭代

### 8. 高级模式（LOW）

- `advanced-event-handler-refs` - 存储事件处理器
- `advanced-use-latest` - 使用 useLatest

## 使用方式

阅读单独的规则文件获取详细解释和代码示例：

```
rules/async-parallel.md
rules/query-cache-dedup.md
rules/bundle-react-lazy.md
```

每个规则文件包含：

- 简要说明为什么重要
- 错误代码示例及解释
- 正确代码示例及解释
- 额外上下文和参考

## 完整文档

完整指南请参阅：`AGENTS.md`
