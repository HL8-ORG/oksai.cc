import { createFileRoute, redirect, useNavigate } from "@tanstack/react-router";
import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/2fa-setup")({
  beforeLoad: async () => {
    const { data } = await authClient.getSession();
    if (!data?.session) {
      throw redirect({ to: "/login" });
    }
    return { session: data };
  },
  component: TwoFactorSetupPage,
});

function TwoFactorSetupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"password" | "verify" | "backup">("password");
  const [password, setPassword] = useState("");
  const [totpUri, setTotpUri] = useState("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await authClient.twoFactor.enable({
        password,
      });
      if (result.error) {
        throw new Error(result.error.message || "Failed to enable 2FA");
      }
      if (result.data) {
        setTotpUri(result.data.totpURI);
        setBackupCodes(result.data.backupCodes || []);
        setStep("verify");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "启用 2FA 失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await authClient.twoFactor.verifyTotp({
        code,
      });
      if (result.error) {
        throw new Error(result.error.message || "验证失败");
      }
      if (result.data) {
        setStep("backup");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownloadBackupCodes = () => {
    const text = `OksAI 双因素认证备用码\n\n${backupCodes.join("\n")}\n\n请妥善保存这些备用码。每个备用码只能使用一次。`;
    const blob = new Blob([text], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "oksai-backup-codes.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  const handleFinish = () => {
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-gray-50 px-4 py-12 sm:px-6 lg:px-8">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="font-bold text-3xl text-gray-900">双因素认证设置</h2>
          <p className="mt-2 text-gray-600 text-sm">增强您的账户安全性</p>
        </div>

        {step === "password" && (
          <form onSubmit={handlePasswordSubmit} className="space-y-6">
            <div className="rounded-md bg-blue-50 p-4">
              <h3 className="font-medium text-blue-800">安全验证</h3>
              <p className="mt-2 text-sm text-blue-700">
                为了启用双因素认证，请先输入您的密码进行验证。这确保只有您本人可以更改此设置。
              </p>
            </div>

            <div>
              <Label htmlFor="password">密码</Label>
              <Input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="输入您的密码"
                autoComplete="current-password"
              />
            </div>

            {error && <div className="rounded-md bg-red-50 p-3 text-red-600 text-sm">{error}</div>}

            <Button type="submit" className="w-full" disabled={isLoading || !password}>
              {isLoading ? "验证中..." : "继续"}
            </Button>
          </form>
        )}

        {step === "verify" && (
          <div className="space-y-6">
            <div className="text-center">
              <p className="mb-4 text-sm text-gray-700">1. 使用验证器 App 扫描二维码</p>
              {totpUri && (
                <div className="mx-auto mb-4 flex h-48 w-48 items-center justify-center rounded-lg bg-white p-4 shadow">
                  <img
                    src={`https://api.qrserver.com/v1/create-qr-code/?size=180x180&data=${encodeURIComponent(totpUri)}`}
                    alt="2FA QR Code"
                    className="h-full w-full"
                  />
                </div>
              )}
              <p className="mb-2 text-xs text-gray-500">或手动输入密钥：</p>
              <code className="block rounded bg-gray-100 p-2 font-mono text-xs">
                {totpUri.split("secret=")[1]?.split("&")[0] || ""}
              </code>
            </div>

            <form onSubmit={handleVerify} className="space-y-4">
              <div>
                <Label htmlFor="code">2. 输入 6 位验证码</Label>
                <Input
                  id="code"
                  type="text"
                  value={code}
                  onChange={(e) => setCode(e.target.value.replace(/\D/g, ""))}
                  required
                  placeholder="000000"
                  maxLength={6}
                  className="text-center text-2xl tracking-widest"
                />
              </div>

              {error && <div className="rounded-md bg-red-50 p-3 text-red-600 text-sm">{error}</div>}

              <Button type="submit" className="w-full" disabled={isLoading || code.length !== 6}>
                {isLoading ? "验证中..." : "验证并启用"}
              </Button>
            </form>
          </div>
        )}

        {step === "backup" && (
          <div className="space-y-6">
            <div className="rounded-md bg-yellow-50 p-4">
              <h3 className="font-medium text-yellow-800">重要提示</h3>
              <p className="mt-2 text-sm text-yellow-700">
                请保存以下备用码。如果您的验证器 App 丢失，可以使用这些码登录。每个备用码只能使用一次。
              </p>
            </div>

            <div className="rounded-md bg-gray-50 p-4">
              <h3 className="mb-3 font-medium text-gray-900">备用码</h3>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((backupCode, index) => (
                  <code key={index} className="rounded bg-white p-2 font-mono text-sm text-center">
                    {backupCode}
                  </code>
                ))}
              </div>
            </div>

            <div className="flex gap-2">
              <Button onClick={handleDownloadBackupCodes} variant="outline" className="flex-1">
                下载备用码
              </Button>
              <Button onClick={handleFinish} className="flex-1">
                完成
              </Button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
