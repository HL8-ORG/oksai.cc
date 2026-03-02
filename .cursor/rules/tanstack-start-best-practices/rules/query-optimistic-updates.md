# 乐观更新

**影响：MEDIUM（即时 UI 反馈）**

使用 TanStack Query 的乐观更新模式，在服务器响应之前立即更新 UI，提供即时的用户体验反馈。

## 为什么重要

传统的 mutation 模式需要等待服务器响应后才更新 UI，导致用户感知延迟。乐观更新通过：

1. 立即更新 UI（假设成功）
2. 发送服务器请求
3. 成功时保持更新，失败时回滚

这种方式让应用感觉更快、更流畅，特别适合高频交互场景（点赞、收藏、快速编辑）。

## 错误示例：等待服务器响应

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function LikeButton({ postId }: { postId: string }) {
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    mutationFn: () => api.likePost(postId),
    onSuccess: () => {
      // 等待服务器响应后才更新 UI - 用户感知延迟
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },
  });

  return (
    <button
      onClick={() => likeMutation.mutate()}
      disabled={likeMutation.isPending}
    >
      {likeMutation.isPending ? '处理中...' : '点赞'}
    </button>
  );
}
```

## 正确示例：乐观更新

```tsx
import { useMutation, useQueryClient } from '@tanstack/react-query';

function LikeButton({ postId }: { postId: string }) {
  const queryClient = useQueryClient();

  const likeMutation = useMutation({
    // 1. 立即执行乐观更新
    onMutate: async () => {
      // 取消任何进行中的查询，避免覆盖乐观更新
      await queryClient.cancelQueries({ queryKey: ['post', postId] });

      // 保存当前值以便回滚
      const previousPost = queryClient.getQueryData(['post', postId]);

      // 乐观更新：立即修改缓存
      queryClient.setQueryData(['post', postId], (old: Post) => ({
        ...old,
        likes: old.likes + 1,
        isLiked: true,
      }));

      // 返回上下文给 onError 和 onSettled
      return { previousPost };
    },

    // 2. 失败时回滚
    onError: (err, newPost, context) => {
      queryClient.setQueryData(['post', postId], context.previousPost);
      toast.error('点赞失败，请重试');
    },

    // 3. 成功或失败后重新获取最新数据
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['post', postId] });
    },

    mutationFn: () => api.likePost(postId),
  });

  // UI 立即响应
  const post = queryClient.getQueryData(['post', postId]);

  return (
    <button
      onClick={() => likeMutation.mutate()}
      disabled={likeMutation.isPending}
    >
      {post?.isLiked ? '已点赞' : '点赞'} ({post?.likes})
    </button>
  );
}
```

## 高级模式：列表项删除

```tsx
function TodoList() {
  const queryClient = useQueryClient();

  const deleteMutation = useMutation({
    onMutate: async (todoId: string) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      const previousTodos = queryClient.getQueryData(['todos']);

      // 立即从列表中移除
      queryClient.setQueryData(['todos'], (old: Todo[]) =>
        old.filter((todo) => todo.id !== todoId),
      );

      return { previousTodos };
    },

    onError: (err, todoId, context) => {
      // 恢复删除的项
      queryClient.setQueryData(['todos'], context.previousTodos);
      toast.error('删除失败');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
    },

    mutationFn: (todoId: string) => api.deleteTodo(todoId),
  });

  const { data: todos } = useQuery({
    queryKey: ['todos'],
    queryFn: () => api.getTodos(),
  });

  return (
    <ul>
      {todos?.map((todo) => (
        <li key={todo.id}>
          {todo.text}
          <button onClick={() => deleteMutation.mutate(todo.id)}>删除</button>
        </li>
      ))}
    </ul>
  );
}
```

## 高级模式：编辑项更新

```tsx
function EditTodo({ todo }: { todo: Todo }) {
  const queryClient = useQueryClient();
  const [text, setText] = useState(todo.text);

  const updateMutation = useMutation({
    onMutate: async (newTodo: Partial<Todo>) => {
      await queryClient.cancelQueries({ queryKey: ['todos'] });

      const previousTodos = queryClient.getQueryData(['todos']);

      // 立即更新列表中的项
      queryClient.setQueryData(['todos'], (old: Todo[]) =>
        old.map((item) =>
          item.id === todo.id ? { ...item, ...newTodo } : item,
        ),
      );

      // 同时更新单个项的缓存
      queryClient.setQueryData(['todo', todo.id], (old: Todo) =>
        old ? { ...old, ...newTodo } : old,
      );

      return { previousTodos };
    },

    onError: (err, newTodo, context) => {
      queryClient.setQueryData(['todos'], context.previousTodos);
      toast.error('更新失败');
    },

    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: ['todos'] });
      queryClient.invalidateQueries({ queryKey: ['todo', todo.id] });
    },

    mutationFn: (newTodo: Partial<Todo>) => api.updateTodo(todo.id, newTodo),
  });

  const handleSave = () => {
    updateMutation.mutate({ text });
  };

  return (
    <div>
      <input value={text} onChange={(e) => setText(e.target.value)} />
      <button onClick={handleSave} disabled={updateMutation.isPending}>
        {updateMutation.isPending ? '保存中...' : '保存'}
      </button>
    </div>
  );
}
```

## 最佳实践

### 1. 总是取消进行中的查询

```tsx
onMutate: async () => {
  // 防止进行中的查询覆盖乐观更新
  await queryClient.cancelQueries({ queryKey: ['todos'] });
  // ...
};
```

### 2. 保存回滚状态

```tsx
onMutate: async () => {
  const previousTodos = queryClient.getQueryData(['todos']);
  // ...
  return { previousTodos }; // 返回给 onError 使用
};
```

### 3. 提供错误反馈

```tsx
onError: (err, variables, context) => {
  queryClient.setQueryData(['todos'], context.previousTodos);
  // 用户友好的错误提示
  toast.error('操作失败，已恢复');
};
```

### 4. 最终重新验证

```tsx
onSettled: () => {
  // 确保与服务器同步
  queryClient.invalidateQueries({ queryKey: ['todos'] });
};
```

### 5. 考虑乐观更新的边界情况

```tsx
function TransferButton({ fromId, toId, amount }: Props) {
  const queryClient = useQueryClient();

  const transferMutation = useMutation({
    onMutate: async () => {
      await Promise.all([
        queryClient.cancelQueries({ queryKey: ['account', fromId] }),
        queryClient.cancelQueries({ queryKey: ['account', toId] }),
      ]);

      const fromAccount = queryClient.getQueryData(['account', fromId]);
      const toAccount = queryClient.getQueryData(['account', toId]);

      // 验证余额是否足够
      if (fromAccount.balance < amount) {
        throw new Error('余额不足'); // 阻止乐观更新
      }

      // 更新两个账户
      queryClient.setQueryData(['account', fromId], (old) => ({
        ...old,
        balance: old.balance - amount,
      }));

      queryClient.setQueryData(['account', toId], (old) => ({
        ...old,
        balance: old.balance + amount,
      }));

      return { fromAccount, toAccount };
    },

    onError: (err, variables, context) => {
      // 恢复两个账户
      queryClient.setQueryData(['account', fromId], context.fromAccount);
      queryClient.setQueryData(['account', toId], context.toAccount);
    },

    mutationFn: () => api.transfer(fromId, toId, amount),
  });

  // ...
}
```

## 何时使用乐观更新

### ✅ 适合

- 高频交互操作（点赞、收藏、投票）
- 低风险操作（可以轻松撤销）
- 快速响应操作（服务器响应 < 500ms）
- 本地优先的应用（离线支持）

### ❌ 不适合

- 高风险操作（支付、删除重要数据）
- 需要服务器验证的操作（唯一性检查）
- 长时间操作（文件上传、大数据处理）
- 需要精确同步的关键业务逻辑

## 参考

- [TanStack Query Optimistic Updates](https://tanstack.com/query/latest/docs/framework/react/guides/optimistic-updates)
- [TanStack Query Mutations](https://tanstack.com/query/latest/docs/framework/react/guides/mutations)
