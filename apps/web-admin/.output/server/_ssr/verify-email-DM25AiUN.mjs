import { a as lazyRouteComponent, o as createFileRoute } from "../_chunks/_libs/@tanstack/react-router.mjs";
var $$splitComponentImporter = () => import("./verify-email-ChoZ2Zvn.mjs");
var Route = createFileRoute("/verify-email")({
	component: lazyRouteComponent($$splitComponentImporter, "component"),
	validateSearch: (search) => ({ token: search.token })
});
export { Route as t };
