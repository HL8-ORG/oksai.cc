# 前端开发工作流程：用户故事 → 设计 → 组件开发 → 测试

本文档描述了从前端需求到实现的完整开发工作流程。

---

## 一、工作流程概览

### 1.1 完整开发流程

```
┌──────────────┐    ┌──────────────┐    ┌──────────────┐    ┌──────────────┐
│  用户故事     │ →  │  UI/UX 设计  │ →  │  组件开发     │ →  │  测试验证    │
│  User Story  │    │  Design      │    │  CDD         │    │  Testing     │
└──────────────┘    └──────────────┘    └──────────────┘    └──────────────┘
      ↓                   ↓                   ↓                   ↓
   业务需求            Wireframe           组件实现             组件测试
   用户体验            交互设计            API 集成             E2E 测试
```

### 1.2 各阶段目标

| 阶段           | 目标           | 产出物             | 参与者         |
| :------------- | :------------- | :----------------- | :------------- |
| **用户故事**   | 明确用户需求   | 用户故事卡片       | 产品经理、用户 |
| **UI/UX 设计** | 定义视觉和交互 | Wireframe、设计稿  | 设计师、前端   |
| **组件开发**   | 实现功能组件   | 组件代码、API 集成 | 前端开发者     |
| **测试验证**   | 确保质量       | 测试代码、测试报告 | 前端开发者     |

---

## 二、阶段一：用户故事（User Story）

### 2.1 用户故事模板

```gherkin
作为 <角色>
我想要 <功能>
以便于 <价值>
```

### 2.2 用户故事示例

```gherkin
作为 管理员
我想要 查看和编辑用户列表
以便于 管理系统用户和权限
```

### 2.3 用户故事验收标准（INVEST 原则）

| 原则            | 说明   | 检查点               |
| :-------------- | :----- | :------------------- |
| **I**ndependent | 独立性 | 故事之间没有依赖关系 |
| **N**egotiable  | 可协商 | 细节可以讨论         |
| **V**aluable    | 有价值 | 对用户有明确价值     |
| **E**stimable   | 可估算 | 能够估算工作量       |
| **S**mall       | 足够小 | 一个迭代内能完成     |
| **T**estable    | 可测试 | 有明确的验收标准     |

---

## 三、阶段二：UI/UX 设计

### 3.1 从用户故事到设计

```
用户故事 → 用户流程图 → Wireframe → 交互设计 → 视觉设计
```

### 3.2 用户流程图

**示例：用户管理页面**

```
用户进入 → 查看用户列表 → 点击用户 → 查看详情 → 编辑信息 → 保存
   ↓          ↓              ↓          ↓          ↓        ↓
登录页     列表页         详情页     表单页     提交     成功/失败
```

### 3.3 Wireframe 设计

**页面布局**：

```
┌─────────────────────────────────────┐
│  Header                             │
│  ┌─────┐  用户管理  ┌──────────┐  │
│  │Logo│            │+ 新增用户 │  │
│  └─────┘           └──────────┘  │
├─────────────────────────────────────┤
│  Filter Bar                         │
│  ┌──────┐ ┌──────┐ ┌──────────┐  │
│  │搜索  │ │角色  │ │状态      │  │
│  └──────┘ └──────┘ └──────────┘  │
├─────────────────────────────────────┤
│  User List                          │
│  ┌────────────────────────────────┐│
│  │ 头像 │ 姓名 │ 邮箱 │ 角色 │ 操作││
│  ├────────────────────────────────┤│
│  │ 👤  │ 张三 │ ... │ 管理员│ 编辑││
│  │ 👤  │ 李四 │ ... │ 用户  │ 编辑││
│  └────────────────────────────────┘│
│  ┌────────────────────────────────┐│
│  │ 上一页  1 2 3 4 5  下一页     ││
│  └────────────────────────────────┘│
└─────────────────────────────────────┘
```

### 3.4 交互设计

| 交互元素 | 触发 | 反馈       | 说明             |
| :------- | :--- | :--------- | :--------------- |
| 新增按钮 | 点击 | 打开弹窗   | 显示用户创建表单 |
| 编辑按钮 | 点击 | 打开弹窗   | 显示用户编辑表单 |
| 删除按钮 | 点击 | 确认对话框 | 防止误删         |
| 列表项   | 点击 | 进入详情页 | 查看用户详细信息 |

### 3.5 响应式设计考虑

| 断点                | 布局变化     | 特殊处理           |
| :------------------ | :----------- | :----------------- |
| Mobile (< 640px)    | 单列，卡片式 | 简化字段，触摸优化 |
| Tablet (640-1024px) | 双列布局     | 侧边栏可折叠       |
| Desktop (> 1024px)  | 多列表格     | 全部功能可见       |

---

## 四、阶段三：组件开发（CDD）

### 4.1 组件驱动开发流程

```
设计系统 → 原子组件 → 分子组件 → 组织组件 → 页面组件
```

### 4.2 组件开发顺序

#### Step 1: 创建页面路由

```typescript
// src/routes/admin/users.tsx
import { createFileRoute } from '@tanstack/react-router';
import { UsersPage } from '@/pages/admin/users';

export const Route = createFileRoute('/admin/users')({
  component: UsersPage,
  beforeLoad: ({ context }) => {
    // 权限检查
    if (!context.user?.isAdmin) {
      throw redirect({ to: '/login' });
    }
  },
});
```

#### Step 2: 创建页面组件

```typescript
// src/pages/admin/users/UsersPage.tsx
export function UsersPage() {
  return (
    <div className="page-container">
      <PageHeader title="用户管理" />
      <UserFilterBar />
      <UserList />
      <Pagination />
    </div>
  );
}
```

#### Step 3: 创建业务组件

```typescript
// src/pages/admin/users/components/UserList.tsx
export function UserList() {
  const { data: users, isLoading } = useUsers();

  if (isLoading) return <UserListSkeleton />;
  if (!users?.length) return <EmptyState />;

  return (
    <div className="user-list">
      {users.map(user => (
        <UserListItem key={user.id} user={user} />
      ))}
    </div>
  );
}

// src/pages/admin/users/components/UserListItem.tsx
interface UserListItemProps {
  user: User;
}

export function UserListItem({ user }: UserListItemProps) {
  return (
    <div className="user-list-item">
      <Avatar src={user.avatar} alt={user.name} />
      <div className="user-info">
        <Text>{user.name}</Text>
        <Text type="secondary">{user.email}</Text>
      </div>
      <UserRoleBadge role={user.role} />
      <UserActions user={user} />
    </div>
  );
}
```

#### Step 4: 创建 API Hooks

参考 `design.md` "API 集成" 章节和 `examples/api-hooks.md` 完整示例。

关键步骤：

1. 定义 API 客户端函数
2. 创建查询 Hook（useQuery）
3. 创建变更 Hook（useMutation）
4. 处理缓存失效和错误

#### Step 5: 实现表单与验证

参考 `design.md` "表单处理" 章节和 `examples/form.md` 完整示例。

关键步骤：

1. 定义 Zod Schema
2. 使用 useForm + zodResolver
3. 处理表单提交
4. 显示验证错误

### 4.3 组件开发循环

```
1. 编写组件测试（Red） → 2. 实现组件（Green） → 3. 优化组件（Refactor）
```

#### 🔴 Red: 编写失败的测试

```typescript
// UserList.test.tsx
describe('UserList', () => {
  it('should render list of users', () => {
    render(<UserList users={mockUsers} />);
    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('李四')).toBeInTheDocument();
  });

  it('should show empty state when no users', () => {
    render(<UserList users={[]} />);
    expect(screen.getByText('暂无用户')).toBeInTheDocument();
  });
});
```

#### 🟢 Green: 实现组件

```typescript
// UserList.tsx
export function UserList({ users }: UserListProps) {
  if (users.length === 0) {
    return <EmptyState message="暂无用户" />;
  }

  return (
    <div className="user-list">
      {users.map(user => (
        <div key={user.id}>{user.name}</div>
      ))}
    </div>
  );
}
```

#### 🔵 Refactor: 优化组件

```typescript
// UserList.tsx - 优化版本
export function UserList({ users }: UserListProps) {
  if (users.length === 0) {
    return <EmptyState message="暂无用户" icon={<UsersIcon />} />;
  }

  return (
    <ul className="user-list" role="list">
      {users.map(user => (
        <UserListItem key={user.id} user={user} />
      ))}
    </ul>
  );
}
```

---

## 五、阶段四：测试验证

### 5.1 测试层次

```
组件测试（60%）→ E2E 测试（30%）→ 视觉测试（10%）
```

### 5.2 组件测试流程

**Step 1: 渲染测试**

```typescript
it('should render correctly', () => {
  render(<UserList users={mockUsers} />);
  expect(screen.getByRole('list')).toBeInTheDocument();
});
```

**Step 2: 交互测试**

```typescript
it('should call onDelete when delete button clicked', async () => {
  const onDelete = vi.fn();
  const user = userEvent.setup();

  render(<UserListItem user={mockUser} onDelete={onDelete} />);

  await user.click(screen.getByRole('button', { name: /delete/i }));
  expect(onDelete).toHaveBeenCalledWith(mockUser.id);
});
```

**Step 3: 状态测试**

```typescript
it('should show loading state', () => {
  render(<UserList loading />);
  expect(screen.getByRole('status')).toBeInTheDocument();
});
```

### 5.3 E2E 测试流程

**关键用户流程测试**：

```typescript
// e2e/user-management.spec.ts
test('should create new user', async ({ page }) => {
  await login(page, adminUser);
  await page.goto('/admin/users');

  // 点击新增按钮
  await page.click('button:has-text("新增用户")');

  // 填写表单
  await page.fill('[name="name"]', '新用户');
  await page.fill('[name="email"]', 'newuser@example.com');
  await page.selectOption('[name="role"]', 'user');

  // 提交表单
  await page.click('button[type="submit"]');

  // 验证成功
  await expect(page.locator('.success-message')).toBeVisible();
  await expect(page.locator('.user-list')).toContainText('新用户');
});
```

---

## 六、完整工作流程示例

### 示例：实现"用户管理"功能

#### Step 1: 定义用户故事

```gherkin
作为 管理员
我想要 查看和管理用户列表
以便于 维护系统用户和权限
```

#### Step 2: 设计用户流程

```
登录 → 进入管理后台 → 查看用户列表 → 点击用户 → 编辑信息 → 保存
```

#### Step 3: 设计 Wireframe

{绘制用户管理页面的 Wireframe}

#### Step 4: 开发组件

1. **路由**：`/admin/users`
2. **页面组件**：`UsersPage`
3. **业务组件**：`UserList`, `UserForm`, `UserFilter`
4. **通用组件**：`Button`, `Input`, `Table`
5. **API Hooks**：`useUsers`, `useCreateUser`, `useUpdateUser`

#### Step 5: 编写测试

1. **组件测试**：`UserList.test.tsx`, `UserForm.test.tsx`
2. **E2E 测试**：`user-management.spec.ts`
3. **视觉测试**：`user-management.visual.spec.ts`

#### Step 6: 验证与优化

- ✅ 所有测试通过
- ✅ 覆盖率达标
- ✅ 响应式适配完成
- ✅ 可访问性检查通过
- ✅ 性能优化完成

---

## 七、开发检查清单

### 7.1 用户故事检查清单

- [ ] 使用标准模板（作为...我想要...以便于...）
- [ ] 符合 INVEST 原则
- [ ] 有明确的验收标准
- [ ] 已与产品经理确认需求

### 7.2 设计检查清单

- [ ] 用户流程图已绘制
- [ ] Wireframe 已设计
- [ ] 交互细节已定义
- [ ] 响应式方案已考虑

### 7.3 组件开发检查清单

- [ ] 路由配置正确
- [ ] 组件职责清晰
- [ ] Props 类型完整
- [ ] 状态管理合理
- [ ] API 集成正确
- [ ] 错误处理完善
- [ ] 加载状态处理

### 7.4 测试检查清单

- [ ] 组件测试覆盖核心逻辑
- [ ] E2E 测试覆盖关键流程
- [ ] 测试覆盖率达标（>70%）
- [ ] 可访问性测试通过
- [ ] 响应式测试通过

### 7.5 质量检查清单

- [ ] TypeScript 无错误
- [ ] ESLint 无警告
- [ ] 代码格式化正确
- [ ] 无 console.log
- [ ] 性能指标达标

---

## 八、常用命令

```bash
# 开发服务器
pnpm dev:web

# 运行组件测试
pnpm vitest run

# 监听模式
pnpm vitest watch

# 运行覆盖率
pnpm vitest run --coverage

# 运行 E2E 测试
pnpm playwright test

# 更新快照
pnpm playwright test --update-snapshots

# 代码检查
pnpm lint

# 类型检查
pnpm typecheck

# 构建生产版本
pnpm build
```

---

## 九、参考资源

- [组件测试指南](./testing.md)
- [设计系统文档](../../docs/design-system/README.md)
- [TanStack Router 文档](https://tanstack.com/router/latest)
- [TanStack Query 文档](https://tanstack.com/query/latest)
- [Testing Library 文档](https://testing-library.com/docs/react-testing-library/intro/)
- [Playwright 文档](https://playwright.dev/)
