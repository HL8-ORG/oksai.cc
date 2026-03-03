import { a as lazyRouteComponent, o as createFileRoute } from "../_chunks/_libs/@tanstack/react-router.mjs";
var $$splitComponentImporter = () => import("./reset-password-DBZeFdzJ.mjs");
var Route = createFileRoute("/reset-password")({
	component: lazyRouteComponent($$splitComponentImporter, "component"),
	validateSearch: (search) => ({ token: search.token })
});
export { Route as t };
