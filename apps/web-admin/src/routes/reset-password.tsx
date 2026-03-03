import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/reset-password")({
  component: ResetPasswordPage,
  validateSearch: (search: Record<string, unknown>) => ({
    token: search.token as string | undefined,
  }),
});

/**
 * 重置密码页面
 *
 * @description
 * 用户点击邮件中的重置链接后访问此页面
 * 设置新密码
 */
function ResetPasswordPage() {
  const navigate = useNavigate();
  const { token } = Route.useSearch();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [success, setSuccess] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    if (!token) {
      setError("缺少重置 Token");
    }
  }, [token]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!token) {
      setError("缺少重置 Token");
      return;
    }

    if (password !== confirmPassword) {
      setError("两次输入的密码不一致");
      return;
    }

    if (password.length < 8) {
      setError("密码至少需要 8 个字符");
      return;
    }

    setIsLoading(true);

    try {
      await authClient.resetPassword({
        newPassword: password,
        token,
      });
      setSuccess(true);
      // 3 秒后跳转到登录页
      setTimeout(() => {
        navigate({ to: "/login" });
      }, 3000);
    } catch (err) {
      setError(err instanceof Error ? err.message : "重置失败");
    } finally {
      setIsLoading(false);
    }
  };

  if (success) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="w-full max-w-md space-y-8">
          <div className="text-center">
            <h2 className="font-bold text-3xl text-green-600">密码重置成功！</h2>
            <p className="mt-2 text-muted-foreground">您的密码已重置，即将跳转到登录页面...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="font-bold text-3xl">重置密码</h2>
          <p className="mt-2 text-muted-foreground">请输入您的新密码</p>
        </div>

        <form onSubmit={handleSubmit} className="mt-8 space-y-6">
          <div className="space-y-4">
            <div>
              <Label htmlFor="password">新密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="至少 8 个字符"
                minLength={8}
              />
            </div>

            <div>
              <Label htmlFor="confirmPassword">确认新密码</Label>
              <Input
                id="confirmPassword"
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                required
                placeholder="再次输入新密码"
                minLength={8}
              />
            </div>
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-red-600 text-sm">{error}</div>}

          <Button type="submit" className="w-full" disabled={isLoading || !token}>
            {isLoading ? "重置中..." : "重置密码"}
          </Button>
        </form>
      </div>
    </div>
  );
}
