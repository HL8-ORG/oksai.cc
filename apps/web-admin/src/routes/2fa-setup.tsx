import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/2fa-setup")({
  component: TwoFactorSetupPage,
});

/**
 * 双因素认证设置页面
 *
 * @description
 * 用户启用 2FA 的流程：
 * 1. 生成 TOTP 密钥和 QR Code
 * 2. 用户扫描 QR Code 并验证
 * 3. 显示备用码
 */
function TwoFactorSetupPage() {
  const navigate = useNavigate();
  const [step, setStep] = useState<"setup" | "verify" | "backup">("setup");
  const [qrCode, setQrCode] = useState<string>("");
  const [secret, setSecret] = useState<string>("");
  const [code, setCode] = useState("");
  const [backupCodes, setBackupCodes] = useState<string[]>([]);
  const [error, setError] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // 开始 2FA 设置流程
    startTwoFactorSetup();
  }, []);

  const startTwoFactorSetup = async () => {
    try {
      setIsLoading(true);
      // Better Auth 2FA API
      const result = await authClient.twoFactor.enable();
      if (result) {
        setQrCode(result.qrCode || "");
        setSecret(result.secret || "");
        setStep("verify");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "启动 2FA 设置失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleVerify = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsLoading(true);

    try {
      const result = await authClient.twoFactor.verify({
        code,
      });
      if (result.backupCodes) {
        setBackupCodes(result.backupCodes);
        setStep("backup");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "验证失败");
    } finally {
      setIsLoading(false);
    }
  };

  const handleFinish = () => {
    navigate({ to: "/dashboard" });
  };

  return (
    <div className="flex min-h-screen items-center justify-center">
      <div className="w-full max-w-md space-y-8">
        <div className="text-center">
          <h2 className="font-bold text-3xl">双因素认证设置</h2>
          <p className="mt-2 text-muted-foreground">增强您的账户安全性</p>
        </div>

        {step === "setup" && (
          <div className="text-center">
            <p className="text-muted-foreground">正在生成 2FA 密钥...</p>
            {error && <div className="mt-4 rounded-md bg-red-50 p-3 text-red-600 text-sm">{error}</div>}
          </div>
        )}

        {step === "verify" && (
          <form onSubmit={handleVerify} className="space-y-6">
            <div className="text-center">
              <p className="mb-4 text-sm">1. 使用验证器 App 扫描二维码</p>
              {qrCode && (
                <div className="mx-auto mb-4 w-48 h-48 bg-gray-100 flex items-center justify-center">
                  <img src={qrCode} alt="2FA QR Code" className="w-full h-full" />
                </div>
              )}
              <p className="mb-2 text-xs text-muted-foreground">或手动输入密钥：</p>
              <code className="block mb-4 p-2 bg-gray-100 rounded text-xs break-all">{secret}</code>
            </div>

            <div>
              <Label htmlFor="code">2. 输入 6 位验证码</Label>
              <Input
                id="code"
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
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
              <h3 className="mb-3 font-medium">备用码</h3>
              <div className="grid grid-cols-2 gap-2">
                {backupCodes.map((code, index) => (
                  <code key={index} className="p-2 bg-white rounded text-sm text-center">
                    {code}
                  </code>
                ))}
              </div>
            </div>

            <Button onClick={handleFinish} className="w-full">
              完成
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
