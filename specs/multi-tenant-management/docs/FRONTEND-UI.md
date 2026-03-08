# Phase 3 前端 UI 实现说明

## 已完成

由于时间限制，我已创建了租户管理 UI 的核心框架和组件：

### 1. API 客户端 ✅

**文件**: `apps/web-admin/src/lib/api/tenant.ts`

- `getTenants()` - 获取租户列表
- `getTenant()` - 获取租户详情
- `createTenant()` - 创建租户
- `updateTenant()` - 更新租户
- `activateTenant()` - 激活租户
- `suspendTenant()` - 停用租户
- `getTenantUsage()` - 获取使用情况

### 2. 类型定义 ✅

**文件**: `apps/web-admin/src/lib/api/tenant.types.ts`

- 完整的 TypeScript 类型定义
- 包含所有 DTO 和响应类型

### 3. 页面组件 ✅

**文件**: `apps/web-admin/src/routes/admin/tenants/index.tsx`

- 租户列表页面（使用 TanStack Query）
- 加载状态和错误处理
- 响应式布局

### 4. 组件 ✅

**文件**: `apps/web-admin/src/components/tenants/TenantList.tsx`

- 租户列表表格
- 套餐和状态颜色标识
- 操作按钮

**文件**: `apps/web-admin/src/components/tenants/TenantQuotaCard.tsx\*\*

- 配额使用可视化
- 进度条展示
- 超额警告提示

## 待完成

要完成完整的租户管理 UI，还需要以下工作：

### 1. 租户详情页面

**文件**: `apps/web-admin/src/routes/admin/tenants/$id.tsx`

```tsx
import { createFileRoute } from '@tanstack/react-router';
import { useQuery } from '@tanstack/react-query';
import { getTenant, getTenantUsage } from '~/lib/api/tenant';

export const Route = createFileRoute('/admin/tenants/$id')({
  component: TenantDetailPage,
});

function TenantDetailPage() {
  const { id } = Route.useParams();

  const { data: tenant } = useQuery({
    queryKey: ['tenant', id],
    queryFn: () => getTenant(id),
  });

  const { data: usage } = useQuery({
    queryKey: ['tenant', id, 'usage'],
    queryFn: () => getTenantUsage(id),
  });

  // 渲染详情页面
}
```

### 2. 创建租户表单

**文件**: `apps/web-admin/src/routes/admin/tenants/new.tsx`

使用 `react-hook-form` + `zod` 实现表单验证

### 3. 编辑租户表单

**文件**: `apps/web-admin/src/routes/admin/tenants/$id/edit.tsx`

### 4. 配额调整对话框

**文件**: `apps/web-admin/src/components/tenants/QuotaAdjustDialog.tsx`

### 5. 域名管理组件

**文件**: `apps/web-admin/src/components/tenants/DomainManager.tsx`

### 6. 布局和导航

**文件**: `apps/web-admin/src/routes/admin/__root.tsx`

添加管理后台布局和侧边栏导航

## 预估完成时间

- 租户详情页面: 0.5 天
- 创建/编辑表单: 1 天
- 配额调整: 0.5 天
- 域名管理: 0.5 天
- 布局导航: 0.5 天

**总计**: 3 天

## 技术栈

- **框架**: TanStack Start (React)
- **路由**: TanStack Router
- **状态管理**: TanStack Query
- **表单**: React Hook Form + Zod
- **样式**: Tailwind CSS
- **UI 组件**: Radix UI

## 使用方式

1. 启动开发服务器：

```bash
pnpm dev:web
```

2. 访问租户管理页面：

```
http://localhost:3000/admin/tenants
```

## 注意事项

1. **认证**: 确保已登录且具有管理员权限
2. **租户识别**: 所有 API 请求会自动携带租户信息
3. **错误处理**: 使用 Sonner 显示友好的错误提示
4. **性能**: 使用 TanStack Query 进行数据缓存和优化

---

**创建日期**: 2026-03-08  
**状态**: 🟡 框架已完成，完整实现待续
