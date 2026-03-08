import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { OAuthButtons } from "@/components/auth/oauth-buttons";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignIn } from "@/hooks/useAuth";

const loginSchema = z.object({
  email: z.string().email("邮箱格式不正确").min(1, "邮箱不能为空"),
  password: z.string().min(8, "密码至少 8 位"),
  rememberMe: z.boolean().optional(),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Route = createFileRoute("/login")({
  component: LoginPage,
});

function LoginPage() {
  const navigate = useNavigate();
  const signInMutation = useSignIn();

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm<LoginFormData>({
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
      rememberMe: false,
    },
  });

  const onSubmit = async (data: LoginFormData) => {
    signInMutation.mutate(
      { email: data.email, password: data.password },
      {
        onSuccess: () => {
          navigate({ to: "/dashboard" });
        },
      }
    );
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="font-bold text-3xl text-gray-900">登录 Oksai</h2>
          <p className="mt-2 text-gray-600 text-sm">企业级多租户 SaaS 管理平台</p>
        </div>

        {/* OAuth 登录 */}
        <OAuthButtons onSuccess={() => navigate({ to: "/dashboard" })} />

        {/* 分隔线 */}
        <div className="relative">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-gray-300" />
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="bg-gray-50 px-2 text-gray-500">或使用邮箱登录</span>
          </div>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="email">邮箱地址</Label>
              <Input
                {...register("email")}
                id="email"
                type="email"
                placeholder="your@email.com"
                autoComplete="email"
                aria-invalid={!!errors.email}
                aria-describedby={errors.email ? "email-error" : undefined}
              />
              {errors.email && (
                <p id="email-error" className="mt-1 text-red-600 text-sm" role="alert">
                  {errors.email.message}
                </p>
              )}
            </div>

            <div>
              <Label htmlFor="password">密码</Label>
              <Input
                {...register("password")}
                id="password"
                type="password"
                placeholder="••••••••"
                autoComplete="current-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              {errors.password && (
                <p id="password-error" className="mt-1 text-red-600 text-sm" role="alert">
                  {errors.password.message}
                </p>
              )}
            </div>

            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <input
                  {...register("rememberMe")}
                  id="remember-me"
                  type="checkbox"
                  className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500"
                />
                <label htmlFor="remember-me" className="ml-2 block text-gray-900 text-sm">
                  记住我
                </label>
              </div>
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || signInMutation.isPending}>
            {isSubmitting || signInMutation.isPending ? "登录中..." : "登录"}
          </Button>
        </form>

        <div className="flex items-center justify-between text-sm">
          <Link to="/forgot-password" className="font-medium text-blue-600 hover:text-blue-500">
            忘记密码？
          </Link>
          <span className="text-gray-600">
            还没有账户？{" "}
            <Link to="/register" className="font-medium text-blue-600 hover:text-blue-500">
              立即注册
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
