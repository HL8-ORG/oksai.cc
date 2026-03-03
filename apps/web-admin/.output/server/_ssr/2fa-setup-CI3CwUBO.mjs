import { i as __toESM } from "../_runtime.mjs";
import { s as require_react } from "../_chunks/_libs/@radix-ui/react-collection.mjs";
import { t as authClient } from "./auth-client--faTyJ3t.mjs";
import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { t as Button } from "./button-BVRpDERN.mjs";
import { n as Label, t as Input } from "./label-DitaIUWu.mjs";
import { l as useNavigate } from "../_chunks/_libs/@tanstack/react-router.mjs";
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var _jsxFileName = "/home/arligle/oks/oksai.cc/apps/web-admin/src/routes/2fa-setup.tsx?tsr-split=component";
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
	const [step, setStep] = (0, import_react.useState)("setup");
	const [qrCode, setQrCode] = (0, import_react.useState)("");
	const [secret, setSecret] = (0, import_react.useState)("");
	const [code, setCode] = (0, import_react.useState)("");
	const [backupCodes, setBackupCodes] = (0, import_react.useState)([]);
	const [error, setError] = (0, import_react.useState)("");
	const [isLoading, setIsLoading] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		startTwoFactorSetup();
	}, []);
	const startTwoFactorSetup = async () => {
		try {
			setIsLoading(true);
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
	const handleVerify = async (e) => {
		e.preventDefault();
		setError("");
		setIsLoading(true);
		try {
			const result = await authClient.twoFactor.verify({ code });
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
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "w-full max-w-md space-y-8",
			children: [
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
					className: "text-center",
					children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", {
						className: "font-bold text-3xl",
						children: "双因素认证设置"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 71,
						columnNumber: 11
					}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
						className: "mt-2 text-muted-foreground",
						children: "增强您的账户安全性"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 72,
						columnNumber: 11
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 70,
					columnNumber: 9
				}, this),
				step === "setup" && /* @__PURE__ */ (void 0)("div", {
					className: "text-center",
					children: [/* @__PURE__ */ (void 0)("p", {
						className: "text-muted-foreground",
						children: "正在生成 2FA 密钥..."
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 76,
						columnNumber: 13
					}, this), error && /* @__PURE__ */ (void 0)("div", {
						className: "mt-4 rounded-md bg-red-50 p-3 text-red-600 text-sm",
						children: error
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 77,
						columnNumber: 23
					}, this)]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 75,
					columnNumber: 30
				}, this),
				step === "verify" && /* @__PURE__ */ (void 0)("form", {
					onSubmit: handleVerify,
					className: "space-y-6",
					children: [
						/* @__PURE__ */ (void 0)("div", {
							className: "text-center",
							children: [
								/* @__PURE__ */ (void 0)("p", {
									className: "mb-4 text-sm",
									children: "1. 使用验证器 App 扫描二维码"
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 82,
									columnNumber: 15
								}, this),
								qrCode && /* @__PURE__ */ (void 0)("div", {
									className: "mx-auto mb-4 w-48 h-48 bg-gray-100 flex items-center justify-center",
									children: /* @__PURE__ */ (void 0)("img", {
										src: qrCode,
										alt: "2FA QR Code",
										className: "w-full h-full"
									}, void 0, false, {
										fileName: _jsxFileName,
										lineNumber: 84,
										columnNumber: 19
									}, this)
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 83,
									columnNumber: 26
								}, this),
								/* @__PURE__ */ (void 0)("p", {
									className: "mb-2 text-xs text-muted-foreground",
									children: "或手动输入密钥："
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 86,
									columnNumber: 15
								}, this),
								/* @__PURE__ */ (void 0)("code", {
									className: "block mb-4 p-2 bg-gray-100 rounded text-xs break-all",
									children: secret
								}, void 0, false, {
									fileName: _jsxFileName,
									lineNumber: 87,
									columnNumber: 15
								}, this)
							]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 81,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ (void 0)("div", { children: [/* @__PURE__ */ (void 0)(Label, {
							htmlFor: "code",
							children: "2. 输入 6 位验证码"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 91,
							columnNumber: 15
						}, this), /* @__PURE__ */ (void 0)(Input, {
							id: "code",
							type: "text",
							value: code,
							onChange: (e) => setCode(e.target.value),
							required: true,
							placeholder: "000000",
							maxLength: 6,
							className: "text-center text-2xl tracking-widest"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 92,
							columnNumber: 15
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 90,
							columnNumber: 13
						}, this),
						error && /* @__PURE__ */ (void 0)("div", {
							className: "rounded-md bg-red-50 p-3 text-red-600 text-sm",
							children: error
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 95,
							columnNumber: 23
						}, this),
						/* @__PURE__ */ (void 0)(Button, {
							type: "submit",
							className: "w-full",
							disabled: isLoading || code.length !== 6,
							children: isLoading ? "验证中..." : "验证并启用"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 97,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 80,
					columnNumber: 31
				}, this),
				step === "backup" && /* @__PURE__ */ (void 0)("div", {
					className: "space-y-6",
					children: [
						/* @__PURE__ */ (void 0)("div", {
							className: "rounded-md bg-yellow-50 p-4",
							children: [/* @__PURE__ */ (void 0)("h3", {
								className: "font-medium text-yellow-800",
								children: "重要提示"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 104,
								columnNumber: 15
							}, this), /* @__PURE__ */ (void 0)("p", {
								className: "mt-2 text-sm text-yellow-700",
								children: "请保存以下备用码。如果您的验证器 App 丢失，可以使用这些码登录。每个备用码只能使用一次。"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 105,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 103,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ (void 0)("div", {
							className: "rounded-md bg-gray-50 p-4",
							children: [/* @__PURE__ */ (void 0)("h3", {
								className: "mb-3 font-medium",
								children: "备用码"
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 111,
								columnNumber: 15
							}, this), /* @__PURE__ */ (void 0)("div", {
								className: "grid grid-cols-2 gap-2",
								children: backupCodes.map((code, index) => /* @__PURE__ */ (void 0)("code", {
									className: "p-2 bg-white rounded text-sm text-center",
									children: code
								}, index, false, {
									fileName: _jsxFileName,
									lineNumber: 113,
									columnNumber: 51
								}, this))
							}, void 0, false, {
								fileName: _jsxFileName,
								lineNumber: 112,
								columnNumber: 15
							}, this)]
						}, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 110,
							columnNumber: 13
						}, this),
						/* @__PURE__ */ (void 0)(Button, {
							onClick: handleFinish,
							className: "w-full",
							children: "完成"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 119,
							columnNumber: 13
						}, this)
					]
				}, void 0, true, {
					fileName: _jsxFileName,
					lineNumber: 102,
					columnNumber: 31
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 69,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 68,
		columnNumber: 10
	}, this);
}
export { TwoFactorSetupPage as component };
