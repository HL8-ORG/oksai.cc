import { createFileRoute, Link } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/forgot-password")({
  component: ForgotPasswordPage,
});

/**
 * 忘记密码页面
 *
 * @description
 * 用户输入邮箱后发送密码重置邮件
 */
function ForgotPasswordPage() {
  const [email, setEmail] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      // Better Auth 使用 requestPasswordReset 方法
      await authClient.requestPasswordReset({
        email,
        redirectTo: "/reset-password",
      });
      setSuccess(true);
    } catch (err) {
      // 为了安全，即使失败也显示成功
      setSuccess(true);
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="font-bold text-3xl">邮件已发送</h2>
            <p className="mt-4 text-muted-foreground">
              如果该邮箱已注册，您将收到密码重置邮件。请查收邮箱并点击链接重置密码。
            </p>
          </div>

          <div className="text-center">
            <Link to="/login" className="text-primary hover:underline">
              返回登录
            </Link>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="font-bold text-3xl">忘记密码</h2>
          <p className="mt-2 text-muted-foreground">输入您的邮箱地址，我们将发送重置链接给您</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div>
            <Label htmlFor="email">邮箱地址</Label>
            <Input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="your@email.com"
            />
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-red-600 text-sm">{error}</div>}

          <Button type="submit" className="w-full" disabled={isLoading}>
            {isLoading ? "发送中..." : "发送重置邮件"}
          </Button>
        </form>

        <div className="text-center text-sm">
          <Link to="/login" className="text-primary hover:underline">
            返回登录
          </Link>
        </div>
      </div>
    </div>
  );
}
