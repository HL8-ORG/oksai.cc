# {功能名称} 决策

## 通用决策

以下是适用于所有前端功能的通用决策，无需重复记录：

### UFR-001：优先使用共享组件库

**背景**
项目中已有成熟的共享组件库提供通用 UI 组件，避免重复实现。

**决策**
当需要使用 UI 组件时，优先使用 `@{org}/ui-components` 目录下的共享组件：

| 组件类型 | 共享组件                      | 使用场景     |
| -------- | ----------------------------- | ------------ |
| 按钮     | `Button`                      | 所有按钮交互 |
| 输入框   | `Input`, `TextArea`, `Select` | 所有表单输入 |
| 表格     | `Table`, `DataTable`          | 数据列表展示 |
| 弹窗     | `Modal`, `Drawer`             | 弹出层交互   |
| 通知     | `Toast`, `Notification`       | 消息提示     |

**理由**

- ✅ 保持视觉一致性
- ✅ 减少重复代码
- ✅ 统一交互体验
- ✅ 便于维护和升级

**示例**

```typescript
// ✅ 推荐：使用共享组件
import { Button, Input, Table } from '@{org}/ui-components';

// ❌ 避免：自己实现
import { CustomButton } from './CustomButton'; // 重复造轮子
```

### UFR-002：使用 TanStack 生态

**背景**
前端项目使用 TanStack 系列库进行状态管理和路由，保持技术栈统一。

**决策**
在实现前端功能时，统一使用以下 TanStack 库：

| 功能     | 库                                          | 用途               |
| -------- | ------------------------------------------- | ------------------ |
| 路由     | `@tanstack/react-router`                    | 路由管理、代码分割 |
| 数据获取 | `@tanstack/react-query`                     | 服务器状态管理     |
| 表单     | `@tanstack/react-form` 或 `react-hook-form` | 表单状态管理       |
| 表格     | `@tanstack/react-table`                     | 复杂表格场景       |

**理由**

- ✅ 类型安全
- ✅ 性能优秀
- ✅ 社区活跃
- ✅ 文档完善

### UFR-003：样式方案

**背景**
项目使用 Tailwind CSS 作为样式方案，保持样式代码的一致性。

**决策**

- 优先使用 Tailwind CSS utility classes
- 复杂样式使用 `@apply` 或创建组件变体
- 使用 `clsx` 或 `cn` 工具函数组合类名
- 避免内联样式（除非动态计算）

**示例**

```typescript
// ✅ 推荐：使用 Tailwind classes
<Button className="px-4 py-2 bg-blue-500 hover:bg-blue-600">
  提交
</Button>

// ❌ 避免：内联样式
<Button style={{ padding: '8px 16px', backgroundColor: 'blue' }}>
  提交
</Button>
```

### UFR-004：文档管理规范

**背景**
前端文档需要与后端文档分离，重点记录用户体验和交互设计。

**决策**
当需要创建前端文档时，优先在当前项目的 `docs` 目录下创建。

**文档组织规范**

| 文档类型     | 存放位置                   | 说明               |
| ------------ | -------------------------- | ------------------ |
| 功能设计文档 | `specs/{feature}/docs/`    | 带截图的功能文档   |
| 组件文档     | `src/components/README.md` | 组件使用说明       |
| 用户手册     | `docs/user-guide/`         | 面向用户的使用文档 |
| API 文档     | 自动生成                   | Swagger/Scalar     |

---

## 功能特定决策

以下是该功能特有的架构决策记录（ADR）：

## ADR-001：{决策标题}

### 背景

{什么情况需要做这个决策？}

### 备选方案

1. {方案 A} — {优缺点}
2. {方案 B} — {优缺点}

### 决策

{最终决定了什么，为什么}

### 影响

- {该决策带来的影响}

---

## ADR-002：组件库选择

### 背景

需要选择合适的组件库来构建 {功能名称} 的 UI。

### 备选方案

1. **Shadcn/ui** — 基于 Radix UI，可定制性强
2. **Ant Design** — 功能完整，开箱即用
3. **自定义组件** — 完全自主可控

### 决策

使用 **Shadcn/ui** 作为主要组件库。

### 影响

- ✅ 组件源码可控，便于定制
- ✅ 无障碍性支持好
- ✅ 与 Tailwind CSS 配合良好
- ⚠️ 需要自己维护组件

---

## ADR-003：状态管理方案

### 背景

{功能名称} 需要管理复杂的状态（客户端状态 + 服务器状态）。

### 备选方案

1. **TanStack Query + Zustand** — 服务器状态与客户端状态分离
2. **Redux Toolkit** — 统一状态管理
3. **React Context + useReducer** — 轻量级方案

### 决策

使用 **TanStack Query + Zustand** 组合方案：

- **TanStack Query**：管理服务器状态（API 数据）
- **Zustand**：管理客户端状态（UI 状态、用户偏好）

### 影响

- ✅ 关注点分离，职责清晰
- ✅ TanStack Query 自动缓存和重新验证
- ✅ Zustand 轻量且易用
- ⚠️ 需要区分两种状态的使用场景
