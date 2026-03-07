# 组件测试示例（Testing Library + Vitest）

完整的 React 组件测试示例，包括渲染测试、交互测试、 Hook 测试和 可访问性测试。

---

## 📚 完整示例

```typescript
/**
 * React 组件测试完整示例
 *
 * 展示：
 * - 组件渲染测试
 * - 用户交互测试
 * - Hook 集成测试
 * - 可访问性测试
 * - Mock 最佳实践
 */

import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi, from 'vitest';
import { axe } from 'jest-axe';

// ==================== 被测组件 ====================

interface UserCardProps {
  user: {
    id: string;
    name: string;
    email: string;
  };
  onDelete?: (id: string) => void;
  onEdit?: (user: User) => void;
}

/**
 * 用户卡片组件
 *
 * 关键特性：
 * - 显示用户信息
 * - 提供编辑和删除操作
 * - 可访问性支持
 */
export function UserCard({ user, onDelete, onEdit }: UserCardProps) {
  const [isDeleting, setIsDeleting] = useState(false);

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await onDelete?.(user.id);
    } catch {
      setIsDeleting(false);
    }
  };

  return (
    <article aria-label={`用户卡片：${user.name}`}>
      <h3>{user.name}</h3>
      <p>{user.email}</p>

      <div>
        <button
          onClick={() => onEdit?.(user)}
          aria-label={`编辑 ${user.name}`}
        >
          编辑
        </button>

        <button
          onClick={handleDelete}
          disabled={isDeleting}
          aria-label={`删除 ${user.name}`}
        >
          {isDeleting ? '删除中...' : '删除'}
        </button>
      </div>
    </article>
  );
}

// ==================== 测试套件 ====================

describe('UserCard', () => {
  const mockUser = {
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
  };

  const defaultProps: UserCardProps = {
    user: mockUser,
  };

  beforeEach(() => {
    vi.clearAllMocks();
  });

  // ==================== 渲染测试 ====================

  describe('Rendering', () => {
    it('should render user information', () => {
      render(<UserCard {...defaultProps} />);

      expect(screen.getByText('张三')).toBeInTheDocument();
      expect(screen.getByText('zhangsan@example.com')).toBeInTheDocument();
    });

    it('should render action buttons', () => {
      render(<UserCard {...defaultProps} />);

      expect(screen.getByRole('button', { name: /编辑/ })).toBeInTheDocument();
      expect(screen.getByRole('button', { name: /删除/ })).toBeInTheDocument();
    });

    it('should have accessible label', () => {
      render(<UserCard {...defaultProps} />);

      expect(screen.getByLabelText(/用户卡片/)).toBeInTheDocument();
    });
  });

  // ==================== 交互测试 ====================

  describe('User Interactions', () => {
    it('should call onEdit when edit button clicked', async () => {
      const user = userEvent.setup();
      const onEdit = vi.fn();

      render(<UserCard {...defaultProps} onEdit={onEdit} />);

      await user.click(screen.getByRole('button', { name: /编辑/ }));

      expect(onEdit).toHaveBeenCalledWith(mockUser);
    });

    it('should call onDelete when delete button clicked', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn().mockResolvedValue(undefined);

      render(<UserCard {...defaultProps} onDelete={onDelete} />);

      await user.click(screen.getByRole('button', { name: /删除/ }));

      expect(onDelete).toHaveBeenCalledWith('1');
    });

    it('should show deleting state while deleting', async () => {
      const user = userEvent.setup();
      const onDelete = vi.fn().mockImplementation(() =>
        new Promise(resolve => setTimeout(resolve, 100))
      );

      render(<UserCard {...defaultProps} onDelete={onDelete} />);

      const deleteButton = screen.getByRole('button', { name: /删除/ });
      await user.click(deleteButton);

      // 检查删除中状态
      expect(deleteButton).toBeDisabled();
      expect(screen.getByText('删除中...')).toBeInTheDocument();
    });
  });

  // ==================== 可访问性测试 ====================

  describe('Accessibility', () => {
    it('should have no accessibility violations', async () => {
      const { container } = render(<UserCard {...defaultProps} />);

      const results = await axe(container);
      expect(results).toHaveNoViolations();
    });
  });

  // ==================== 状态测试 ====================

  describe('State', () => {
    it('should disable delete button while deleting', async () => {
        const user = userEvent.setup();
        const onDelete = vi.fn().mockImplementation(() =>
          new Promise(resolve => setTimeout(resolve, 100))
        );

        render(<UserCard {...defaultProps} onDelete={onDelete} />);

        const deleteButton = screen.getByRole('button', { name: /删除/ });
        await user.click(deleteButton);

        expect(deleteButton).toBeDisabled();
      });

      it('should re-enable delete button after deletion fails', async () => {
        const user = userEvent.setup();
        const onDelete = vi.fn().mockRejectedValue(new Error('删除失败'));

        render(<UserCard {...defaultProps} onDelete={onDelete} />);

        const deleteButton = screen.getByRole('button', { name: /删除/ });
        await user.click(deleteButton);

        await waitFor(() => {
          expect(deleteButton).not.toBeDisabled();
        });
      });
  });
});

// ==================== Hook 集成测试 ====================

/**
 * 测试使用 Hook 的组件
 */
function UserProfile({ userId }: { userId: string }) {
  const { data: user, isLoading, error } = useUser(userId);

  if (isLoading) return <div>加载中...</div>;
  if (error) return <div>错误：{error.message}</div>;
  if (!user) return <div>用户不存在</div>;

  return (
    <div>
      <h1>{user.name}</h1>
      <p>{user.email}</p>
    </div>
  );
}

describe('UserProfile', () => {
  const mockUser = {
    id: '1',
    name: '张三',
    email: 'zhangsan@example.com',
  };

  beforeEach(() => {
    vi.mock('@/hooks/useUser', () => ({
      useUser: vi.fn(),
    }));
  });

  it('should show loading state', () => {
    const { useUser } = require('@/hooks/useUser');
    (useUser as any).mockReturnValue({
      data: undefined,
      isLoading: true,
      error: null,
    });

    render(<UserProfile userId="1" />);

    expect(screen.getByText('加载中...')).toBeInTheDocument();
  });

  it('should show user profile when loaded', () => {
    const { useUser } = require('@/hooks/useUser');
    (useUser as any).mockReturnValue({
      data: mockUser,
      isLoading: false,
      error: null,
    });

    render(<UserProfile userId="1" />);

    expect(screen.getByText('张三')).toBeInTheDocument();
    expect(screen.getByText('zhangsan@example.com')).toBeInTheDocument();
  });

  it('should show error state', () => {
    const { useUser } = require('@/hooks/useUser');
    (useUser as any).mockReturnValue({
      data: undefined,
      isLoading: false,
      error: new Error('加载失败'),
    });

    render(<UserProfile userId="1" />);

    expect(screen.getByText('错误：加载失败')).toBeInTheDocument();
  });
});

// ==================== Mock 最佳实践 ====================

/**
 * ✅ 推荐：Mock 外部依赖
 */
vi.mock('@/lib/api-client', () => ({
  apiClient: {
    getUser: vi.fn(),
  },
}));

/**
 * ❌ 避免：Mock 实现细节
 */
// 不要 Mock 组件内部实现
vi.mock('@/components/UserCard', () => ({
  UserCard: () => <div>Mocked UserCard</div>,  // ❌ 过度 Mock
}));

// ==================== 测试模式总结 ====================

/**
 * 测试文件命名约定：
 * - 组件：`{Component}.test.tsx`
 * - Hook：`{Hook}.test.ts`
 * - 工具：`{util}.test.ts`
 */

/**
 * 测试结构：
 * 1. describe 块：按功能/场景分组
 * 2. it 块：单个测试用例
 * 3. beforeEach：共享设置
 */

/**
 * 测试覆盖率目标：
 * - 组件测试：>80%
 * - 关键流程：100%
 * - 总体：>70%
 */
```

---

## 📖 最佳实践

### ✅ 推荐做法

1. **测试用户行为**：测试用户如何使用组件，2. **使用 accessible queries**：`getByRole`、 `getByLabelText`
2. **Mock 外部依赖**：API、路由、第三方库
3. **测试所有状态**：加载、错误、空、正常
4. **可访问性测试**：使用 jest-axe

### ❌ 避免做法

1. **测试实现细节**：测试组件内部方法
2. **使用 testid**：优先使用 accessible queries
3. **过度 Mock**：Mock 不必要的内容
4. **忽略异步**：不等待异步操作完成

---

## 🔗 参考资源

- [Testing Library 官方文档](https://testing-library.com/docs/react-testing-library/intro/)
- [Vitest 官方文档](https://vitest.dev/)
- [jest-axe 文档](https://github.com/nickcolley/jest-axe)
- [examples/README.md](./README.md) - 示例库索引
