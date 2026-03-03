import { i as __toESM } from "../_runtime.mjs";
import { s as require_react } from "../_chunks/_libs/@radix-ui/react-collection.mjs";
import { t as cva } from "../_libs/clsx+class-variance-authority.mjs";
import { n as cn } from "./auth-client--faTyJ3t.mjs";
import { t as require_jsx_dev_runtime } from "../_libs/react.mjs";
import { a as lazyRouteComponent, i as Outlet, o as createFileRoute, r as createRouter, s as createRootRoute } from "../_chunks/_libs/@tanstack/react-router.mjs";
import { t as Route$6 } from "./dashboard-CBPdIK1f.mjs";
import { t as Route$7 } from "./reset-password-BUhSqR7P.mjs";
import { t as Route$8 } from "./verify-email-DM25AiUN.mjs";
import { t as QueryClient } from "../_chunks/_libs/@tanstack/query-core.mjs";
import { t as QueryClientProvider } from "../_chunks/_libs/@tanstack/react-query.mjs";
import { t as setupRouterSsrQueryIntegration } from "../_chunks/_libs/@tanstack/react-router-ssr-query.mjs";
import { t as ReactQueryDevtools2 } from "../_chunks/_libs/@tanstack/react-query-devtools.mjs";
import { a as Root2, i as Provider, n as Close, o as Title, r as Description, s as Viewport, t as Action } from "../_chunks/_libs/@radix-ui/react-toast.mjs";
import { t as X } from "../_libs/lucide-react.mjs";
var import_react = /* @__PURE__ */ __toESM(require_react());
var import_jsx_dev_runtime = require_jsx_dev_runtime();
var _jsxFileName$4 = "/home/arligle/oks/oksai.cc/apps/web-admin/src/components/ui/toast.tsx";
var ToastProvider = Provider;
var ToastViewport = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Viewport, {
	ref,
	className: cn("fixed top-0 z-[100] flex max-h-screen w-full flex-col-reverse p-4 sm:top-auto sm:right-0 sm:bottom-0 sm:flex-col md:max-w-[420px]", className),
	...props
}, void 0, false, {
	fileName: _jsxFileName$4,
	lineNumber: 13,
	columnNumber: 3
}, void 0));
ToastViewport.displayName = Viewport.displayName;
var toastVariants = cva("group data-[state=closed]:fade-out-80 data-[state=closed]:slide-out-to-right-full data-[state=open]:slide-in-from-top-full data-[state=open]:sm:slide-in-from-bottom-full pointer-events-auto relative flex w-full items-center justify-between space-x-4 overflow-hidden rounded-md border p-6 pr-8 shadow-lg transition-all data-[swipe=cancel]:translate-x-0 data-[swipe=end]:translate-x-[var(--radix-toast-swipe-end-x)] data-[swipe=move]:translate-x-[var(--radix-toast-swipe-move-x)] data-[state=closed]:animate-out data-[state=open]:animate-in data-[swipe=end]:animate-out data-[swipe=move]:transition-none", {
	variants: { variant: {
		default: "border bg-background text-foreground",
		destructive: "destructive group border-destructive bg-destructive text-destructive-foreground"
	} },
	defaultVariants: { variant: "default" }
});
var Toast = import_react.forwardRef(({ className, variant, ...props }, ref) => {
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Root2, {
		ref,
		className: cn(toastVariants({ variant }), className),
		...props
	}, void 0, false, {
		fileName: _jsxFileName$4,
		lineNumber: 43,
		columnNumber: 10
	}, void 0);
});
Toast.displayName = Root2.displayName;
var ToastAction = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Action, {
	ref,
	className: cn("inline-flex h-8 shrink-0 items-center justify-center rounded-md border bg-transparent px-3 font-medium text-sm ring-offset-background transition-colors hover:bg-secondary focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2 disabled:pointer-events-none disabled:opacity-50 group-[.destructive]:border-muted/40 group-[.destructive]:focus:ring-destructive group-[.destructive]:hover:border-destructive/30 group-[.destructive]:hover:bg-destructive group-[.destructive]:hover:text-destructive-foreground", className),
	...props
}, void 0, false, {
	fileName: _jsxFileName$4,
	lineNumber: 51,
	columnNumber: 3
}, void 0));
ToastAction.displayName = Action.displayName;
var ToastClose = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Close, {
	ref,
	className: cn("absolute top-2 right-2 rounded-md p-1 text-foreground/50 opacity-0 transition-opacity hover:text-foreground focus:opacity-100 focus:outline-none focus:ring-2 group-hover:opacity-100 group-[.destructive]:text-red-300 group-[.destructive]:focus:ring-red-400 group-[.destructive]:focus:ring-offset-red-600 group-[.destructive]:hover:text-red-50", className),
	"toast-close": "",
	...props,
	children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(X, { className: "h-4 w-4" }, void 0, false, {
		fileName: _jsxFileName$4,
		lineNumber: 74,
		columnNumber: 5
	}, void 0)
}, void 0, false, {
	fileName: _jsxFileName$4,
	lineNumber: 66,
	columnNumber: 3
}, void 0));
ToastClose.displayName = Close.displayName;
var ToastTitle = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Title, {
	ref,
	className: cn("font-semibold text-sm", className),
	...props
}, void 0, false, {
	fileName: _jsxFileName$4,
	lineNumber: 83,
	columnNumber: 3
}, void 0));
ToastTitle.displayName = Title.displayName;
var ToastDescription = import_react.forwardRef(({ className, ...props }, ref) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Description, {
	ref,
	className: cn("text-sm opacity-90", className),
	...props
}, void 0, false, {
	fileName: _jsxFileName$4,
	lineNumber: 91,
	columnNumber: 3
}, void 0));
ToastDescription.displayName = Description.displayName;
var TOAST_LIMIT = 1;
var TOAST_REMOVE_DELAY = 1e6;
var count = 0;
function genId() {
	count = (count + 1) % Number.MAX_SAFE_INTEGER;
	return count.toString();
}
var toastTimeouts = /* @__PURE__ */ new Map();
var addToRemoveQueue = (toastId) => {
	if (toastTimeouts.has(toastId)) return;
	const timeout = setTimeout(() => {
		toastTimeouts.delete(toastId);
		dispatch({
			type: "REMOVE_TOAST",
			toastId
		});
	}, TOAST_REMOVE_DELAY);
	toastTimeouts.set(toastId, timeout);
};
var reducer = (state, action) => {
	switch (action.type) {
		case "ADD_TOAST": return {
			...state,
			toasts: [action.toast, ...state.toasts].slice(0, TOAST_LIMIT)
		};
		case "UPDATE_TOAST": return {
			...state,
			toasts: state.toasts.map((t) => t.id === action.toast.id ? {
				...t,
				...action.toast
			} : t)
		};
		case "DISMISS_TOAST": {
			const { toastId } = action;
			if (toastId) addToRemoveQueue(toastId);
			else state.toasts.forEach((toast) => {
				addToRemoveQueue(toast.id);
			});
			return {
				...state,
				toasts: state.toasts.map((t) => t.id === toastId || toastId === void 0 ? {
					...t,
					open: false
				} : t)
			};
		}
		case "REMOVE_TOAST":
			if (action.toastId === void 0) return {
				...state,
				toasts: []
			};
			return {
				...state,
				toasts: state.toasts.filter((t) => t.id !== action.toastId)
			};
	}
};
var listeners = [];
var memoryState = { toasts: [] };
function dispatch(action) {
	memoryState = reducer(memoryState, action);
	listeners.forEach((listener) => {
		listener(memoryState);
	});
}
function toast({ ...props }) {
	const id = genId();
	const update = (props) => dispatch({
		type: "UPDATE_TOAST",
		toast: {
			...props,
			id
		}
	});
	const dismiss = () => dispatch({
		type: "DISMISS_TOAST",
		toastId: id
	});
	dispatch({
		type: "ADD_TOAST",
		toast: {
			...props,
			id,
			open: true,
			onOpenChange: (open) => {
				if (!open) dismiss();
			}
		}
	});
	return {
		id,
		dismiss,
		update
	};
}
function useToast() {
	const [state, setState] = import_react.useState(memoryState);
	import_react.useEffect(() => {
		listeners.push(setState);
		return () => {
			const index = listeners.indexOf(setState);
			if (index > -1) listeners.splice(index, 1);
		};
	}, []);
	return {
		...state,
		toast,
		dismiss: (toastId) => dispatch({
			type: "DISMISS_TOAST",
			toastId
		})
	};
}
var _jsxFileName$3 = "/home/arligle/oks/oksai.cc/apps/web-admin/src/components/ui/toaster.tsx";
function Toaster() {
	const { toasts } = useToast();
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ToastProvider, { children: [toasts.map(({ id, title, description, action, ...props }) => /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Toast, {
		...props,
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
				className: "grid gap-1",
				children: [title && /* @__PURE__ */ (void 0)(ToastTitle, { children: title }, void 0, false, {
					fileName: _jsxFileName$3,
					lineNumber: 19,
					columnNumber: 23
				}, this), description && /* @__PURE__ */ (void 0)(ToastDescription, { children: description }, void 0, false, {
					fileName: _jsxFileName$3,
					lineNumber: 20,
					columnNumber: 29
				}, this)]
			}, void 0, true, {
				fileName: _jsxFileName$3,
				lineNumber: 18,
				columnNumber: 11
			}, this),
			action,
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ToastClose, {}, void 0, false, {
				fileName: _jsxFileName$3,
				lineNumber: 23,
				columnNumber: 11
			}, this)
		]
	}, id, true, {
		fileName: _jsxFileName$3,
		lineNumber: 17,
		columnNumber: 9
	}, this)), /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ToastViewport, {}, void 0, false, {
		fileName: _jsxFileName$3,
		lineNumber: 26,
		columnNumber: 7
	}, this)] }, void 0, true, {
		fileName: _jsxFileName$3,
		lineNumber: 15,
		columnNumber: 5
	}, this);
}
var _jsxFileName$2 = "/home/arligle/oks/oksai.cc/apps/web-admin/src/routes/__root.tsx";
var Route$5 = createRootRoute({ component: RootComponent });
function RootComponent() {
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(QueryClientProvider, {
		client: new QueryClient(),
		children: [
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Outlet, {}, void 0, false, {
				fileName: _jsxFileName$2,
				lineNumber: 13,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(Toaster, {}, void 0, false, {
				fileName: _jsxFileName$2,
				lineNumber: 14,
				columnNumber: 7
			}, this),
			/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)(ReactQueryDevtools2, {}, void 0, false, {
				fileName: _jsxFileName$2,
				lineNumber: 15,
				columnNumber: 7
			}, this)
		]
	}, void 0, true, {
		fileName: _jsxFileName$2,
		lineNumber: 12,
		columnNumber: 5
	}, this);
}
var $$splitComponentImporter$4 = () => import("./register-B_0Cw9p6.mjs");
var Route$4 = createFileRoute("/register")({ component: lazyRouteComponent($$splitComponentImporter$4, "component") });
/**
* 注册页面
*
* @description
* 用户注册功能，支持：
* - 邮箱密码注册
* - 注册后自动发送验证邮件
*/
var $$splitComponentImporter$3 = () => import("./login-CgTh9NPc.mjs");
var Route$3 = createFileRoute("/login")({ component: lazyRouteComponent($$splitComponentImporter$3, "component") });
var $$splitComponentImporter$2 = () => import("./forgot-password-DEtghkZ7.mjs");
var Route$2 = createFileRoute("/forgot-password")({ component: lazyRouteComponent($$splitComponentImporter$2, "component") });
/**
* 忘记密码页面
*
* @description
* 用户输入邮箱后发送密码重置邮件
*/
var $$splitComponentImporter$1 = () => import("./2fa-setup-CI3CwUBO.mjs");
var Route$1 = createFileRoute("/2fa-setup")({ component: lazyRouteComponent($$splitComponentImporter$1, "component") });
/**
* 双因素认证设置页面
*
* @description
* 用户启用 2FA 的流程：
* 1. 生成 TOTP 密钥和 QR Code
* 2. 用户扫描 QR Code 并验证
* 3. 显示备用码
*/
var $$splitComponentImporter = () => import("./routes-CrTp2hQu.mjs");
var Route = createFileRoute("/")({ component: lazyRouteComponent($$splitComponentImporter, "component") });
var VerifyEmailRoute = Route$8.update({
	id: "/verify-email",
	path: "/verify-email",
	getParentRoute: () => Route$5
});
var ResetPasswordRoute = Route$7.update({
	id: "/reset-password",
	path: "/reset-password",
	getParentRoute: () => Route$5
});
var RegisterRoute = Route$4.update({
	id: "/register",
	path: "/register",
	getParentRoute: () => Route$5
});
var LoginRoute = Route$3.update({
	id: "/login",
	path: "/login",
	getParentRoute: () => Route$5
});
var ForgotPasswordRoute = Route$2.update({
	id: "/forgot-password",
	path: "/forgot-password",
	getParentRoute: () => Route$5
});
var DashboardRoute = Route$6.update({
	id: "/dashboard",
	path: "/dashboard",
	getParentRoute: () => Route$5
});
var R2faSetupRoute = Route$1.update({
	id: "/2fa-setup",
	path: "/2fa-setup",
	getParentRoute: () => Route$5
});
var rootRouteChildren = {
	IndexRoute: Route.update({
		id: "/",
		path: "/",
		getParentRoute: () => Route$5
	}),
	R2faSetupRoute,
	DashboardRoute,
	ForgotPasswordRoute,
	LoginRoute,
	RegisterRoute,
	ResetPasswordRoute,
	VerifyEmailRoute
};
var routeTree = Route$5._addFileChildren(rootRouteChildren)._addFileTypes();
var _jsxFileName$1 = "/home/arligle/oks/oksai.cc/apps/web-admin/src/components/default-catch-boundary.tsx";
function DefaultCatchBoundary({ error }) {
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
					className: "font-bold text-4xl text-red-600",
					children: "出错了"
				}, void 0, false, {
					fileName: _jsxFileName$1,
					lineNumber: 7,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
					className: "mt-4 text-gray-600",
					children: error.message || "发生了一个错误"
				}, void 0, false, {
					fileName: _jsxFileName$1,
					lineNumber: 8,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("button", {
					onClick: () => window.location.reload(),
					className: "mt-6 rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary/90",
					children: "刷新页面"
				}, void 0, false, {
					fileName: _jsxFileName$1,
					lineNumber: 9,
					columnNumber: 9
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName$1,
			lineNumber: 6,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName$1,
		lineNumber: 5,
		columnNumber: 5
	}, this);
}
var _jsxFileName = "/home/arligle/oks/oksai.cc/apps/web-admin/src/components/default-not-found.tsx";
function DefaultNotFound() {
	return /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
		className: "flex min-h-screen items-center justify-center",
		children: /* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("div", {
			className: "text-center",
			children: [
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("h1", {
					className: "font-bold text-6xl text-gray-900",
					children: "404"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 5,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("p", {
					className: "mt-4 text-gray-600 text-xl",
					children: "页面未找到"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 6,
					columnNumber: 9
				}, this),
				/* @__PURE__ */ (0, import_jsx_dev_runtime.jsxDEV)("a", {
					href: "/",
					className: "mt-6 inline-block rounded-lg bg-primary px-6 py-3 text-white hover:bg-primary/90",
					children: "返回首页"
				}, void 0, false, {
					fileName: _jsxFileName,
					lineNumber: 7,
					columnNumber: 9
				}, this)
			]
		}, void 0, true, {
			fileName: _jsxFileName,
			lineNumber: 4,
			columnNumber: 7
		}, this)
	}, void 0, false, {
		fileName: _jsxFileName,
		lineNumber: 3,
		columnNumber: 5
	}, this);
}
function getRouter() {
	const queryClient = new QueryClient({ defaultOptions: { queries: {
		refetchOnWindowFocus: false,
		staleTime: 1e3 * 60 * 2
	} } });
	const router = createRouter({
		routeTree,
		context: {
			queryClient,
			user: null
		},
		defaultPreload: "intent",
		defaultPreloadStaleTime: 0,
		scrollRestoration: true,
		defaultStructuralSharing: true,
		defaultErrorComponent: DefaultCatchBoundary,
		defaultNotFoundComponent: DefaultNotFound
	});
	setupRouterSsrQueryIntegration({
		router,
		queryClient,
		handleRedirects: true,
		wrapQueryClient: true
	});
	return router;
}
export { getRouter };
