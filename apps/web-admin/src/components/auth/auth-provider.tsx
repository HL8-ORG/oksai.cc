/**
 * 认证状态提供者
 *
 * @description
 * 管理全局认证状态，提供：
 * - 自动获取和缓存会话
 * - 会话过期处理
 * - 认证状态访问
 *
 * @example
 * ```tsx
 * // 在 App.tsx 中使用
 * <AuthProvider>
 *   <RouterProvider router={router} />
 * </AuthProvider>
 * ```
 */
import { createContext, type ReactNode, useContext, useEffect } from "react";
import { useAuthSession } from "@/hooks/useAuth";
import type { Session, User } from "@/lib/auth-client";

/**
 * 认证上下文类型
 */
interface AuthContextValue {
  /** 当前用户会话 */
  session: Session | null | undefined;
  /** 当前用户 */
  user: User | null | undefined;
  /** 是否正在加载会话 */
  isLoading: boolean;
  /** 是否已登录 */
  isAuthenticated: boolean;
  /** 会话获取错误 */
  error: Error | null;
}

const AuthContext = createContext<AuthContextValue | null>(null);

/**
 * 认证上下文 Hook
 *
 * @description
 * 在组件中访问认证状态
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { user, isAuthenticated, isLoading } = useAuth();
 *
 *   if (isLoading) return <div>加载中...</div>;
 *   if (!isAuthenticated) return <div>请先登录</div>;
 *
 *   return <div>欢迎, {user?.name}</div>;
 * }
 * ```
 */
export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}

interface AuthProviderProps {
  children: ReactNode;
}

/**
 * 认证状态提供者组件
 */
export function AuthProvider({ children }: AuthProviderProps) {
  const { data, isPending, error } = useAuthSession();

  const session = data?.session;
  const user = data?.user;
  const isLoading = isPending;
  const isAuthenticated = !!session && !!user;

  const value: AuthContextValue = {
    session,
    user,
    isLoading,
    isAuthenticated,
    error: error || null,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

/**
 * 认证守卫组件
 *
 * @description
 * 保护需要登录的路由，未登录自动跳转到登录页
 *
 * @example
 * ```tsx
 * // 在路由文件中使用
 * export const Route = createFileRoute('/dashboard')({
 *   component: () => (
 *     <AuthGuard>
 *       <DashboardPage />
 *     </AuthGuard>
 *   ),
 * });
 * ```
 */
interface AuthGuardProps {
  children: ReactNode;
  /** 未登录时跳转的路径 */
  redirectTo?: string;
}

export function AuthGuard({ children, redirectTo = "/login" }: AuthGuardProps) {
  const { isAuthenticated, isLoading } = useAuth();

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      // 保存当前路径，登录后返回
      const currentPath = window.location.pathname;
      const searchParams = currentPath !== "/" ? `?redirect=${encodeURIComponent(currentPath)}` : "";
      window.location.href = `${redirectTo}${searchParams}`;
    }
  }, [isAuthenticated, isLoading, redirectTo]);

  // 加载中
  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="mb-4">
            <svg
              className="mx-auto h-12 w-12 animate-spin text-blue-600"
              xmlns="http://www.w3.org/2000/svg"
              fill="none"
              viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <p className="text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  // 未登录
  if (!isAuthenticated) {
    return null;
  }

  // 已登录，显示子组件
  return <>{children}</>;
}
