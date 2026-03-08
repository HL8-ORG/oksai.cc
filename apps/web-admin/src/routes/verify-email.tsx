import { createFileRoute, Link, useNavigate, useSearch } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/verify-email")({
  component: VerifyEmailPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: search.token as string | undefined,
  }),
});

/**
 * 邮箱验证页面
 *
 * @description
 * 处理邮箱验证流程：
 * - 从 URL 获取验证 token
 * - 自动验证邮箱
 * - 显示验证结果
 * - 支持重新发送验证邮件
 */
function VerifyEmailPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/verify-email" });
  const token = search.token;

  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [errorMessage, setErrorMessage] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setErrorMessage("缺少验证 token");
      return;
    }

    verifyEmail(token);
  }, [token]);

  /**
   * 验证邮箱
   */
  const verifyEmail = async (token: string) => {
    try {
      // Better Auth 邮箱验证 API
      await authClient.verifyEmail({
        query: {
          token,
        },
      });

      setStatus("success");
      toast.success("邮箱验证成功！");

      // 3 秒后跳转到登录页
      setTimeout(() => {
        navigate({ to: "/login" });
      }, 3000);
    } catch (error) {
      setStatus("error");
      const message = error instanceof Error ? error.message : "验证失败";
      setErrorMessage(message);
      toast.error(message);
    }
  };

  /**
   * 重新发送验证邮件
   */
  const resendVerification = async () => {
    try {
      // 这里需要用户输入邮箱，或者从其他地方获取
      toast.info("请返回登录页重新发送验证邮件");
    } catch (error) {
      toast.error("发送失败，请稍后重试");
    }
  };

  /**
   * 加载中状态
   */
  if (status === "loading") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center">
            <svg className="h-12 w-12 animate-spin text-blue-600" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path
                className="opacity-75"
                fill="currentColor"
                d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
              />
            </svg>
          </div>
          <h2 className="font-bold text-2xl text-gray-900">验证邮箱中...</h2>
          <p className="mt-2 text-gray-600">请稍候</p>
        </div>
      </div>
    );
  }

  /**
   * 验证成功状态
   */
  if (status === "success") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="font-bold text-3xl text-gray-900">验证成功！</h2>
            <p className="mt-2 text-gray-600">您的邮箱已成功验证</p>
            <p className="mt-4 text-gray-500 text-sm">3 秒后自动跳转到登录页...</p>
          </div>

          <Button onClick={() => navigate({ to: "/login" })} className="w-full">
            立即登录
          </Button>
        </div>
      </div>
    );
  }

  /**
   * 验证失败状态
   */
  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </div>
          <h2 className="font-bold text-3xl text-gray-900">验证失败</h2>
          <p className="mt-2 text-gray-600">{errorMessage}</p>
        </div>

        <div className="space-y-3">
          <Button onClick={() => navigate({ to: "/login" })} className="w-full">
            返回登录页
          </Button>
          <Button onClick={resendVerification} variant="outline" className="w-full">
            重新发送验证邮件
          </Button>
        </div>

        <div className="text-center text-gray-500 text-sm">
          遇到问题？{" "}
          <Link to="/login" className="font-medium text-blue-600 hover:text-blue-500">
            联系支持
          </Link>
        </div>
      </div>
    </div>
  );
}
