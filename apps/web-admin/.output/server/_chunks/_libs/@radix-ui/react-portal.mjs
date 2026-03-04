import { i as __toESM } from "../../../_runtime.mjs";
import { i as require_jsx_runtime, s as require_react } from "./react-collection.mjs";
import { i as Primitive, o as require_react_dom } from "./react-dismissable-layer.mjs";
var import_react = /* @__PURE__ */ __toESM(require_react(), 1);
var useLayoutEffect2 = globalThis?.document ? import_react.useLayoutEffect : () => {};
var import_react_dom = /* @__PURE__ */ __toESM(require_react_dom(), 1);
var import_jsx_runtime = require_jsx_runtime();
var PORTAL_NAME = "Portal";
var Portal = import_react.forwardRef((props, forwardedRef) => {
	const { container: containerProp, ...portalProps } = props;
	const [mounted, setMounted] = import_react.useState(false);
	useLayoutEffect2(() => setMounted(true), []);
	const container = containerProp || mounted && globalThis?.document?.body;
	return container ? import_react_dom.createPortal(/* @__PURE__ */ (0, import_jsx_runtime.jsx)(Primitive.div, {
		...portalProps,
		ref: forwardedRef
	}), container) : null;
});
Portal.displayName = PORTAL_NAME;
export { useLayoutEffect2 as n, Portal as t };
