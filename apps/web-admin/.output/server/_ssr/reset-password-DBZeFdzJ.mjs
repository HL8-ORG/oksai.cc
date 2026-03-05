import { i as __toESM } from "../_runtime.mjs";
import { s as require_react } from "../_chunks/_libs/@radix-ui/react-collection.mjs";
import { t as authClient } from "./auth-client--faTyJ3t.mjs";
import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { t as Button } from "./button-BVRpDERN.mjs";
import { n as Label, t as Input } from "./label-DitaIUWu.mjs";
import { u as useNavigate } from "../_chunks/_libs/@tanstack/react-router.mjs";
import { t as Route } from "./reset-password-BUhSqR7P.mjs";
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var _jsxFileName = "/home/arligle/oks/oksai.cc/apps/web-admin/src/routes/reset-password.tsx?tsr-split=component";
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
	const [password, setPassword] = (0, import_react.useState)("");
	const [confirmPassword, setConfirmPassword] = (0, import_react.useState)("");
	const [error, setError] = (0, import_react.useState)("");
	const [success, setSuccess] = (0, import_react.useState)(false);
	const [isLoading, setIsLoading] = (0, import_react.useState)(false);
	(0, import_react.useEffect)(() => {
		if (!token) setError("缺少重置 Token");
	}, [token]);
	const handleSubmit = async (e) => {
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
				token
			});
			setSuccess(true);
			setTimeout(() => {
				navigate({ to: "/login" });
			}, 3e3);
		} catch (err) {
			setError(err instanceof Error ? err.message : "重置失败");
		} finally {
			setIsLoading(false);
		}
	};
	if (success) return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "w-full max-w-md space-y-8",
			children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "text-center",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", {
					className: "font-bold text-3xl text-green-600",
					children: "密码重置成功！"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 68,
					columnNumber: 13
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
					className: "mt-2 text-muted-foreground",
					children: "您的密码已重置，即将跳转到登录页面..."
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 69,
					columnNumber: 13
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 67,
				columnNumber: 11
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 66,
			columnNumber: 9
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 65,
		columnNumber: 12
	}, this);
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "w-full max-w-md space-y-8",
			children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "text-center",
				children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h2", {
					className: "font-bold text-3xl",
					children: "重置密码"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 77,
					columnNumber: 11
				}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
					className: "mt-2 text-muted-foreground",
					children: "请输入您的新密码"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 78,
					columnNumber: 11
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 76,
				columnNumber: 9
			}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("form", {
				onSubmit: handleSubmit,
				className: "mt-8 space-y-6",
				children: [
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
						className: "space-y-4",
						children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Label, {
							htmlFor: "password",
							children: "新密码"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 84,
							columnNumber: 15
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Input, {
							id: "password",
							type: "password",
							value: password,
							onChange: (e) => setPassword(e.target.value),
							required: true,
							placeholder: "至少 8 个字符",
							minLength: 8
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 85,
							columnNumber: 15
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 83,
							columnNumber: 13
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", { children: [/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Label, {
							htmlFor: "confirmPassword",
							children: "确认新密码"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 89,
							columnNumber: 15
						}, this), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Input, {
							id: "confirmPassword",
							type: "password",
							value: confirmPassword,
							onChange: (e) => setConfirmPassword(e.target.value),
							required: true,
							placeholder: "再次输入新密码",
							minLength: 8
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 90,
							columnNumber: 15
						}, this)] }, void 0, true, {
							fileName: _jsxFileName,
							lineNumber: 88,
							columnNumber: 13
						}, this)]
					}, void 0, true, {
						fileName: _jsxFileName,
						lineNumber: 82,
						columnNumber: 11
					}, this),
					error && /* @__PURE__ */ (void 0)("div", {
						className: "rounded-md bg-red-50 p-3 text-red-600 text-sm",
						children: error
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 94,
						columnNumber: 21
					}, this),
					/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Button, {
						type: "submit",
						className: "w-full",
						disabled: isLoading || !token,
						children: isLoading ? "重置中..." : "重置密码"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 96,
						columnNumber: 11
					}, this)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 81,
				columnNumber: 9
			}, this)]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 75,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 74,
		columnNumber: 10
	}, this);
}
export { ResetPasswordPage as component };
