import { createFileRoute, redirect, useNavigate, useSearch } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/2fa-verify")({
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    // 如果没有会话，跳转到登录页
    if (!data?.session) {
      throw redirect({ to: "/login" });
    }
    // 如果 2FA 已验证，跳转到 dashboard
    if (data.session.session.twoFactorVerified) {
      throw redirect({ to: "/dashboard" });
    }
    return { session: data };
  },
  component: TwoFactorVerifyPage,
});

function TwoFactorVerifyPage() {
  const navigate = useNavigate();
  const search = useSearch({ from: "/2fa-verify" });
  const [code, setCode] = useState("");
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [useBackupCode, setUseBackupCode] = useState(false);

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      if (useBackupCode) {
        const result = await authClient.twoFactor.verifyBackupCode({
          code,
          trustDevice: false,
        });
        if (result.error) {
          throw new Error(result.error.message || "备用码验证失败");
        }
        if (result.data) {
          navigate({ to: (search.redirect as string) || "/dashboard" });
        }
      } else {
        const result = await authClient.twoFactor.verifyTotp({
          code,
          trustDevice: false,
        });
        if (result.error) {
          throw new Error(result.error.message || "验证码错误");
        }
        if (result.data) {
          navigate({ to: (search.redirect as string) || "/dashboard" });
        }
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证失败");
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="font-bold text-3xl text-gray-900">双因素认证</h2>
          <p className="mt-2 text-gray-600 text-sm">请输入验证码以继续</p>
        </div>

        <div className="rounded-md bg-blue-50 p-4">
          <p className="text-sm text-blue-700">
            {useBackupCode
              ? "请输入备用码。每个备用码只能使用一次。"
              : "请打开验证器 App 并输入显示的 6 位验证码。"}
          </p>
        </div>

        <form onSubmit={handleVerify} className="space-y-6">
          <div>
            <Label htmlFor="code">{useBackupCode ? "备用码" : "验证码"}</Label>
            <Input
              id="code"
              type="text"
              value={code}
              onChange={(e) => setCode(useBackupCode ? e.target.value : e.target.value.replace(/\D/g, ""))}
              required
              placeholder={useBackupCode ? "输入备用码" : "000000"}
              maxLength={useBackupCode ? 20 : 6}
              className={!useBackupCode ? "text-center text-2xl tracking-widest" : ""}
              autoFocus
            />
          </div>

          {error && <div className="rounded-md bg-red-50 p-3 text-red-600 text-sm">{error}</div>}

          <Button
            type="submit"
            className="w-full"
            disabled={isLoading || (useBackupCode ? !code : code.length !== 6)}>
            {isLoading ? "验证中..." : "验证"}
          </Button>

          {!useBackupCode && (
            <button
              type="button"
              onClick={() => {
                setUseBackupCode(true);
                setCode("");
                setError("");
              }}
              className="w-full text-center text-blue-600 text-sm hover:underline">
              使用备用码
            </button>
          )}

          {useBackupCode && (
            <button
              type="button"
              onClick={() => {
                setUseBackupCode(false);
                setCode("");
                setError("");
              }}
              className="w-full text-center text-blue-600 text-sm hover:underline">
              使用验证器 App
            </button>
          )}
        </form>
      </div>
    </div>
  );
}
