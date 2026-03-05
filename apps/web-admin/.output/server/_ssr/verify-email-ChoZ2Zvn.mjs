import { i as __toESM } from "../_runtime.mjs";
import { s as require_react } from "../_chunks/_libs/@radix-ui/react-collection.mjs";
import { t as authClient } from "./auth-client--faTyJ3t.mjs";
import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { t as Button } from "./button-BVRpDERN.mjs";
import { u as useNavigate } from "../_chunks/_libs/@tanstack/react-router.mjs";
import { t as Route } from "./verify-email-DM25AiUN.mjs";
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var _jsxFileName = "/home/arligle/oks/oksai.cc/apps/web-admin/src/routes/verify-email.tsx?tsr-split=component";
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
	const [status, setStatus] = (0, import_react.useState)("loading");
	const [error, setError] = (0, import_react.useState)("");
	(0, import_react.useEffect)(() => {
		if (!token) {
			setStatus("error");
			setError("缺少验证 Token");
			return;
		}
		const verifyEmail = async () => {
			try {
				await authClient.verifyEmail({ query: { token } });
				setStatus("success");
				setTimeout(() => {
					navigate({ to: "/login" });
				}, 3e3);
			} catch (err) {
				setStatus("error");
				setError(err instanceof Error ? err.message : "验证失败");
			}
		};
		verifyEmail();
	}, [token, navigate]);
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "w-full max-w-md space-y-8",
			children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "text-center",
				children: [
					status === "loading" && /* @__PURE__ */ (void 0)(import_jsx_dev_runtime.Fragment, { children: [/* @__PURE__ */ (void 0)("h2", {
						className: "font-bold text-3xl",
						children: "验证中..."
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 51,
						columnNumber: 15
					}, this), /* @__PURE__ */ (void 0)("p", {
						className: "mt-2 text-muted-foreground",
						children: "正在验证您的邮箱地址"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 52,
						columnNumber: 15
					}, this)] }, void 0, true),
					status === "success" && /* @__PURE__ */ (void 0)(import_jsx_dev_runtime.Fragment, { children: [/* @__PURE__ */ (void 0)("h2", {
						className: "font-bold text-3xl text-green-600",
						children: "验证成功！"
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 56,
						columnNumber: 15
					}, this), /* @__PURE__ */ (void 0)("p", {
						className: "mt-2 text-muted-foreground",
						children: "您的邮箱已验证，即将跳转到登录页面..."
					}, void 0, false, {
						fileName: _jsxFileName,
						lineNumber: 57,
						columnNumber: 15
					}, this)] }, void 0, true),
					status === "error" && /* @__PURE__ */ (void 0)(import_jsx_dev_runtime.Fragment, { children: [
						/* @__PURE__ */ (void 0)("h2", {
							className: "font-bold text-3xl text-red-600",
							children: "验证失败"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 61,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ (void 0)("p", {
							className: "mt-2 text-red-500",
							children: error
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 62,
							columnNumber: 15
						}, this),
						/* @__PURE__ */ (void 0)(Button, {
							className: "mt-4",
							onClick: () => navigate({ to: "/login" }),
							children: "返回登录"
						}, void 0, false, {
							fileName: _jsxFileName,
							lineNumber: 63,
							columnNumber: 15
						}, this)
					] }, void 0, true)
				]
			}, void 0, true, {
				fileName: _jsxFileName,
				lineNumber: 49,
				columnNumber: 9
			}, this)
		}, void 0, false, {
			fileName: _jsxFileName,
			lineNumber: 48,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 47,
		columnNumber: 10
	}, this);
}
export { VerifyEmailPage as component };
