import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/auth/callback/$provider")({
  component: OAuthCallbackPage,
});

function OAuthCallbackPage() {
  const navigate = useNavigate();
  const { provider } = Route.useParams();
  const [status, setStatus] = useState<"loading" | "success" | "error">("loading");
  const [error, setError] = useState("");

  useEffect(() => {
    const handleCallback = async () => {
      try {
        // Better Auth 会自动处理 OAuth 回调
        // 我们只需要等待一下，然后检查会话
        await new Promise((resolve) => setTimeout(resolve, 1000));

        const { data, error } = await authClient.getSession();

        if (error) {
          throw new Error(error.message || "获取会话失败");
        }

        if (data?.session) {
          setStatus("success");
          // 2秒后跳转到 dashboard
          setTimeout(() => {
            navigate({ to: "/dashboard" });
          }, 2000);
        } else {
          throw new Error("登录失败，请重试");
        }
      } catch (err) {
        setStatus("error");
        setError(err instanceof Error ? err.message : "OAuth 登录失败");
      }
    };

    handleCallback();
  }, [provider, navigate]);

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          {status === "loading" && (
            <>
              <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-blue-600 border-t-transparent"></div>
              <h2 className="font-bold text-2xl text-gray-900">正在登录...</h2>
              <p className="mt-2 text-gray-600 text-sm">请稍候，正在处理您的 {provider} 登录</p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                </svg>
              </div>
              <h2 className="font-bold text-2xl text-gray-900">登录成功！</h2>
              <p className="mt-2 text-gray-600 text-sm">正在跳转到仪表盘...</p>
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth={2}
                    d="M6 18L18 6M6 6l12 12"
                  />
                </svg>
              </div>
              <h2 className="font-bold text-2xl text-gray-900">登录失败</h2>
              <p className="mt-2 text-gray-600 text-sm">{error}</p>
              <button
                onClick={() => navigate({ to: "/login" })}
                className="mt-4 rounded-md bg-blue-600 px-4 py-2 font-medium text-white text-sm hover:bg-blue-700">
                返回登录页
              </button>
            </>
          )}
        </div>
      </div>
    </div>
  );
}
