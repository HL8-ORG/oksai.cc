/**
 * 认证相关 Hooks
 *
 * @description
 * 封装 Better Auth 客户端，提供统一的认证 API
 * - 集成 TanStack Query 进行数据管理
 * - 统一的错误处理
 * - 自动缓存失效
 */
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { authClient } from "@/lib/auth-client";

/**
 * 会话查询 Key
 */
const SESSION_KEY = ["session"] as const;

/**
 * 使用当前用户会话
 *
 * @description
 * 自动获取和缓存当前用户会话信息
 * - 自动处理加载状态
 * - 自动处理错误
 * - 自动缓存
 *
 * @example
 * ```tsx
 * function MyComponent() {
 *   const { data: session, isPending, error } = useAuthSession();
 *
 *   if (isPending) return <div>加载中...</div>;
 *   if (error) return <div>错误: {error.message}</div>;
 *   if (!session) return <div>未登录</div>;
 *
 *   return <div>欢迎, {session.user.name}</div>;
 * }
 * ```
 */
export function useAuthSession() {
  return authClient.useSession();
}

/**
 * 邮箱密码登录
 *
 * @description
 * 使用邮箱和密码进行登录
 * - 登录成功后自动更新会话缓存
 * - 显示成功/失败提示
 *
 * @example
 * ```tsx
 * function LoginForm() {
 *   const signIn = useSignIn();
 *
 *   const handleSubmit = (email: string, password: string) => {
 *     signIn.mutate({ email, password });
 *   };
 *
 *   return (
 *     <button
 *       onClick={() => handleSubmit("test@example.com", "password")}
 *       disabled={signIn.isPending}
 *     >
 *       {signIn.isPending ? "登录中..." : "登录"}
 *     </button>
 *   );
 * }
 * ```
 */
export function useSignIn() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (credentials: { email: string; password: string }) => {
      const result = await authClient.signIn.email(credentials);
      if (result.error) {
        throw new Error(result.error.message || "登录失败");
      }
      return result;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: SESSION_KEY });
      toast.success("登录成功");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "登录失败，请重试";
      toast.error(message);
    },
  });
}

/**
 * 邮箱密码注册
 *
 * @description
 * 使用邮箱和密码进行注册
 * - 注册成功后提示用户验证邮箱
 * - 显示成功/失败提示
 *
 * @example
 * ```tsx
 * function RegisterForm() {
 *   const signUp = useSignUp();
 *
 *   const handleSubmit = (data: RegisterData) => {
 *     signUp.mutate(data);
 *   };
 *
 *   return (
 *     <button
 *       onClick={() => handleSubmit({
 *         email: "test@example.com",
 *         password: "password",
 *         name: "Test User"
 *       })}
 *       disabled={signUp.isPending}
 *     >
 *       {signUp.isPending ? "注册中..." : "注册"}
 *     </button>
 *   );
 * }
 * ```
 */
export function useSignUp() {
  return useMutation({
    mutationFn: async (data: { email: string; password: string; name: string }) => {
      const result = await authClient.signUp.email(data);
      if (result.error) {
        throw new Error(result.error.message || "注册失败");
      }
      return result;
    },
    onSuccess: () => {
      toast.success("注册成功，请查收验证邮件");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "注册失败，请重试";
      toast.error(message);
    },
  });
}

/**
 * 登出
 *
 * @description
 * 退出登录并清除会话
 * - 清除本地会话缓存
 * - 显示成功提示
 *
 * @example
 * ```tsx
 * function LogoutButton() {
 *   const signOut = useSignOut();
 *
 *   return (
 *     <button
 *       onClick={() => signOut.mutate()}
 *       disabled={signOut.isPending}
 *     >
 *       {signOut.isPending ? "登出中..." : "登出"}
 *     </button>
 *   );
 * }
 * ```
 */
export function useSignOut() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      await authClient.signOut();
    },
    onSuccess: () => {
      // 清除会话缓存
      queryClient.removeQueries({ queryKey: SESSION_KEY });
      toast.success("已退出登录");
    },
    onError: (error) => {
      const message = error instanceof Error ? error.message : "登出失败，请重试";
      toast.error(message);
    },
  });
}
