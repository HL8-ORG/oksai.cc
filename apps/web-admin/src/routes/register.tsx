import { zodResolver } from "@hookform/resolvers/zod";
import { createFileRoute, Link, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { useSignUp } from "@/hooks/useAuth";

/**
 * 注册表单验证 Schema
 */
const registerSchema = z
  .object({
    name: z.string().min(2, "姓名至少 2 个字符"),
    email: z.string().email("邮箱格式不正确").min(1, "邮箱不能为空"),
    password: z
      .string()
      .min(8, "密码至少 8 位")
      .regex(/[A-Z]/, "密码至少包含一个大写字母")
      .regex(/[a-z]/, "密码至少包含一个小写字母")
      .regex(/[0-9]/, "密码至少包含一个数字"),
    confirmPassword: z.string().min(1, "请确认密码"),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: "两次密码输入不一致",
    path: ["confirmPassword"],
  });

type RegisterFormData = z.infer<typeof registerSchema>;

export const Route = createFileRoute("/register")({
  component: RegisterPage,
});

function RegisterPage() {
  const navigate = useNavigate();
  const signUpMutation = useSignUp();
  const [isSuccess, setIsSuccess] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
    getValues,
  } = useForm<RegisterFormData>({
    resolver: zodResolver(registerSchema),
    defaultValues: {
      name: "",
      email: "",
      password: "",
      confirmPassword: "",
    },
  });

  /**
   * 处理注册表单提交
   */
  const onSubmit = async (data: RegisterFormData) => {
    signUpMutation.mutate(
      {
        email: data.email,
        password: data.password,
        name: data.name,
      },
      {
        onSuccess: () => {
          setIsSuccess(true);
        },
      }
    );
  };

  /**
   * 注册成功提示
   */
  if (isSuccess) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-bold text-3xl text-gray-900">注册成功！</h2>
            <p className="mt-2 text-gray-600">
              我们已向 <span className="font-medium">{getValues("email")}</span> 发送验证邮件
            </p>
            <p className="mt-4 text-gray-500 text-sm">请查收邮件并点击验证链接以激活您的账户</p>
          </div>

          <div className="space-y-3">
            <Button onClick={() => navigate({ to: "/login" })} className="w-full">
              前往登录
            </Button>
            <p className="text-center text-gray-500 text-sm">
              没收到邮件？{" "}
              <button
                onClick={() => {
                  setIsSuccess(false);
                }}
                className="font-medium text-blue-600 hover:text-blue-500">
                重新注册
              </button>
            </p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="font-bold text-3xl text-gray-900">注册 Oksai</h2>
          <p className="mt-2 text-gray-600 text-sm">企业级多租户 SaaS 管理平台</p>
        </div>

        <form onSubmit={handleSubmit(onSubmit)} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="name">姓名</Label>
              <Input
                {...register("name")}
                id="name"
                type="text"
                placeholder="张三"
                autoComplete="name"
                aria-invalid={!!errors.name}
                aria-describedby={errors.name ? "name-error" : undefined}
              />
              {errors.name && (
                <p id="name-error" className="mt-1 text-red-600 text-sm" role="alert">
                  {errors.name.message}
                </p>
              )}
            </div>

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
                autoComplete="new-password"
                aria-invalid={!!errors.password}
                aria-describedby={errors.password ? "password-error" : undefined}
              />
              {errors.password && (
                <p id="password-error" className="mt-1 text-red-600 text-sm" role="alert">
                  {errors.password.message}
                </p>
              )}
              <p className="mt-1 text-gray-500 text-xs">至少 8 位，包含大小写字母和数字</p>
            </div>

            <div>
              <Label htmlFor="confirmPassword">确认密码</Label>
              <Input
                {...register("confirmPassword")}
                id="confirmPassword"
                type="password"
                placeholder="••••••••"
                autoComplete="new-password"
                aria-invalid={!!errors.confirmPassword}
                aria-describedby={errors.confirmPassword ? "confirmPassword-error" : undefined}
              />
              {errors.confirmPassword && (
                <p id="confirmPassword-error" className="mt-1 text-red-600 text-sm" role="alert">
                  {errors.confirmPassword.message}
                </p>
              )}
            </div>
          </div>

          <Button type="submit" className="w-full" disabled={isSubmitting || signUpMutation.isPending}>
            {isSubmitting || signUpMutation.isPending ? "注册中..." : "注册"}
          </Button>
        </form>

        <div className="text-center text-sm">
          <span className="text-gray-600">
            已有账户？{" "}
            <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
              立即登录
            </Link>
          </span>
        </div>
      </div>
    </div>
  );
}
