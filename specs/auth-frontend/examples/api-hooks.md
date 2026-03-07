# API Hooks 示例（TanStack Query）

完整的 TanStack Query API Hooks 使用示例，包括数据查询、变更、缓存管理和错误处理。

---

## 📚 完整示例

```typescript
/**
 * TanStack Query API Hooks 完整示例
 *
 * 展示如何创建和使用 API Hooks，包括：
 * - 数据查询（useQuery）
 * - 数据变更（useMutation）
 * - 缓存失效和重新验证
 * - 乐观更新
 * - 错误处理
 */

import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { apiClient } from '@/lib/api-client';
import { toast } from '@/components/ui/toast';

// ==================== 类型定义 ====================

interface User {
  id: string;
  name: string;
  email: string;
  role: 'admin' | 'user';
  createdAt: Date;
}

interface CreateUserData {
  name: string;
  email: string;
  role: 'admin' | 'user';
}

interface UpdateUserData extends Partial<CreateUserData> {
  id: string;
}

interface UserFilters {
  role?: 'admin' | 'user';
  search?: string;
  page?: number;
  pageSize?: number;
}

// ==================== API 客户端函数 ====================

const userApi = {
  getUsers: (filters?: UserFilters) =>
    apiClient.get<{ users: User[]; total: number }>('/api/users', {
      params: filters,
    }),

  getUser: (id: string) => apiClient.get<User>(`/api/users/${id}`),

  createUser: (data: CreateUserData) =>
    apiClient.post<User>('/api/users', data),

  updateUser: (data: UpdateUserData) =>
    apiClient.patch<User>(`/api/users/${data.id}`, data),

  deleteUser: (id: string) => apiClient.delete(`/api/users/${id}`),
};

// ==================== 查询 Hooks ====================

/**
 * 获取用户列表 Hook
 *
 * 关键模式：
 * - 支持筛选和分页
 * - 自动缓存（5 分钟）
 * - 后台自动刷新
 */
export function useUsers(filters?: UserFilters) {
  return useQuery({
    queryKey: ['users', filters],
    queryFn: () => userApi.getUsers(filters),
    staleTime: 5 * 60 * 1000, // 5 分钟内不重新获取
    refetchOnWindowFocus: true, // 窗口聚焦时刷新
  });
}

/**
 * 获取单个用户 Hook
 *
 * 关键模式：
 * - 条件查询（enabled）
 * - 独立缓存键
 */
export function useUser(id: string) {
  return useQuery({
    queryKey: ['user', id],
    queryFn: () => userApi.getUser(id),
    enabled: !!id, // 仅在有 id 时查询
    staleTime: 10 * 60 * 1000, // 10 分钟内不重新获取
  });
}

/**
 * 预加载用户详情
 *
 * 关键模式：
 * - 鼠标悬停时预加载
 * - 提升用户体验
 */
export function usePrefetchUser() {
  const queryClient = useQueryClient();

  return (id: string) => {
    queryClient.prefetchQuery({
      queryKey: ['user', id],
      queryFn: () => userApi.getUser(id),
    });
  };
}

// ==================== 变更 Hooks ====================

/**
 * 创建用户 Hook
 *
 * 关键模式：
 * - 创建成功后失效用户列表缓存
 * - 显示成功提示
 * - 自动错误处理
 */
export function useCreateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.createUser,

    onSuccess: (newUser) => {
      // 失效用户列表缓存
      queryClient.invalidateQueries({ queryKey: ['users'] });

      // 显示成功提示
      toast.success(`用户 ${newUser.name} 创建成功`);
    },

    onError: (error: Error) => {
      // 显示错误提示
      toast.error(`创建失败：${error.message}`);
    },
  });
}

/**
 * 更新用户 Hook
 *
 * 关键模式：
 * - 更新成功后失效相关缓存
 * - 显示成功提示
 */
export function useUpdateUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.updateUser,

    onSuccess: (updatedUser) => {
      // 失效用户列表缓存
      queryClient.invalidateQueries({ queryKey: ['users'] });

      // 更新单个用户缓存
      queryClient.setQueryData(['user', updatedUser.id], updatedUser);

      // 显示成功提示
      toast.success(`用户 ${updatedUser.name} 更新成功`);
    },

    onError: (error: Error) => {
      toast.error(`更新失败：${error.message}`);
    },
  });
}

/**
 * 删除用户 Hook
 *
 * 关键模式：
 * - 删除成功后从缓存中移除
 * - 显示成功提示
 */
export function useDeleteUser() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: userApi.deleteUser,

    onSuccess: (_, deletedId) => {
      // 失效用户列表缓存
      queryClient.invalidateQueries({ queryKey: ['users'] });

      // 移除单个用户缓存
      queryClient.removeQueries({ queryKey: ['user', deletedId] });

      // 显示成功提示
      toast.success('用户删除成功');
    },

    onError: (error: Error) => {
      toast.error(`删除失败：${error.message}`);
    },
  });
}

// ==================== 乐观更新示例 ====================

/**
 * 乐观更新用户名称 Hook
 *
 * 关键模式：
 * - 立即更新 UI（乐观）
 * - 失败时回滚
 * - 适用于快速操作
 */
export function useUpdateUserNameOptimistic() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, name }: { id: string; name: string }) =>
      userApi.updateUser({ id, name }),

    // 乐观更新：在请求发送前立即更新缓存
    onMutate: async ({ id, name }) => {
      // 取消进行中的查询，避免覆盖乐观更新
      await queryClient.cancelQueries({ queryKey: ['user', id] });

      // 保存旧数据以便回滚
      const previousUser = queryClient.getQueryData<User>(['user', id]);

      // 乐观更新缓存
      if (previousUser) {
        queryClient.setQueryData<User>(['user', id], {
          ...previousUser,
          name,
        });
      }

      // 返回上下文，用于回滚
      return { previousUser };
    },

    // 错误时回滚
    onError: (error, { id }, context) => {
      if (context?.previousUser) {
        queryClient.setQueryData(['user', id], context.previousUser);
      }
      toast.error(`更新失败：${error.message}`);
    },

    // 无论成功或失败，都重新获取最新数据
    onSettled: (_, __, { id }) => {
      queryClient.invalidateQueries({ queryKey: ['user', id] });
    },
  });
}
```

---

## 📖 使用示例

### 基础列表页面

```typescript
function UserListPage() {
  const [filters, setFilters] = useState<UserFilters>({ page: 1 });

  // ✅ 使用查询 Hook
  const { data, isLoading, error } = useUsers(filters);

  // ✅ 使用变更 Hook
  const deleteUser = useDeleteUser();

  // 加载状态
  if (isLoading) return <LoadingSpinner />;

  // 错误状态
  if (error) return <ErrorMessage error={error} />;

  // 空状态
  if (!data?.users?.length) return <EmptyState />;

  return (
    <div>
      {/* 用户列表 */}
      <ul>
        {data.users.map(user => (
          <li key={user.id}>
            {user.name}
            <button
              onClick={() => deleteUser.mutate(user.id)}
              disabled={deleteUser.isPending}
            >
              删除
            </button>
          </li>
        ))}
      </ul>

      {/* 分页 */}
      <Pagination
        current={filters.page}
        total={data.total}
        onChange={(page) => setFilters({ ...filters, page })}
      />
    </div>
  );
}
```

### 详情页面（带预加载）

```typescript
function UserDetailPage({ userId }: { userId: string }) {
  const { data: user, isLoading } = useUser(userId);
  const prefetchUser = usePrefetchUser();

  if (isLoading) return <LoadingSpinner />;
  if (!user) return <EmptyState />;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

// 在列表项中使用预加载
function UserListItem({ user }: { user: User }) {
  const prefetchUser = usePrefetchUser();

  return (
    <Link
      to={`/users/${user.id}`}
      onMouseEnter={() => prefetchUser(user.id)} // ✅ 悬停时预加载
    >
      {user.name}
    </Link>
  );
}
```

---

## 🎯 最佳实践

### ✅ 推荐做法

```typescript
// 1. 精确的缓存键
queryClient.invalidateQueries({ queryKey: ['users'] }); // ✅ 仅失效用户列表

// 2. 统一错误处理
const mutation = useMutation({
  mutationFn: apiClient.createUser,
  onError: (error: Error) => {
    toast.error(error.message); // ✅ 统一提示
  },
});

// 3. 条件查询
const { data } = useQuery({
  queryKey: ['user', userId],
  queryFn: () => apiClient.getUser(userId),
  enabled: !!userId, // ✅ 仅在有 userId 时查询
});

// 4. 乐观更新
const mutation = useMutation({
  mutationFn: updateUser,
  onMutate: async (newData) => {
    await queryClient.cancelQueries({ queryKey: ['user', newData.id] });
    const previous = queryClient.getQueryData(['user', newData.id]);
    queryClient.setQueryData(['user', newData.id], newData);
    return { previous };
  },
  onError: (error, variables, context) => {
    queryClient.setQueryData(['user', variables.id], context.previous); // ✅ 回滚
  },
});
```

### ❌ 避免做法

```typescript
// 1. 过度失效缓存
queryClient.invalidateQueries(); // ❌ 失效所有缓存

// 2. 忽略错误处理
const mutation = useMutation({
  mutationFn: apiClient.createUser,
  // ❌ 没有 onError
});

// 3. 在 Hook 内部调用 mutation
function useBadHook() {
  const mutation = useMutation({ ... });
  mutation.mutate({ ... }); // ❌ 不应该在 Hook 内部调用
  return mutation;
}
```

---

## 🔗 参考资源

- [TanStack Query 官方文档](https://tanstack.com/query/latest)
- [examples/README.md](./README.md) - 示例库索引
- [CONTEXT-MAP.md](../CONTEXT-MAP.md) - 上下文地图
