import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
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
 * 用户点击邮箱中的验证链接后访问此页面
 * 自动验证邮箱地址
 */
function VerifyEmailPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    if (!token) {
      setStatus("error");
      setError("缺少验证 Token");
      return;
    }

    const verifyEmail = async () => {
      try {
        await authClient.verifyEmail({
          query: {
            token,
          },
        });
        setStatus("success");
        // 3 秒后跳转到登录页
        setTimeout(() => {
          navigate({ to: "/login" });
        }, 3000);
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "验证失败");
      }
    };

    verifyEmail();
  }, [token, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          {status === "loading" && (
            <>
              <h2 className="font-bold text-3xl">验证中...</h2>
              <p className="mt-2 text-muted-foreground">正在验证您的邮箱地址</p>
            </>
          )}

          {status === "success" && (
            <>
              <h2 className="font-bold text-3xl text-green-600">验证成功！</h2>
              <p className="mt-2 text-muted-foreground">您的邮箱已验证，即将跳转到登录页面...</p>
            </>
          )}

          {status === "error" && (
            <>
              <h2 className="font-bold text-3xl text-red-600">验证失败</h2>
              <p className="mt-2 text-red-500">{error}</p>
              <Button className="mt-4" onClick={() => navigate({ to: "/login" })}>
                返回登录
              </Button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
