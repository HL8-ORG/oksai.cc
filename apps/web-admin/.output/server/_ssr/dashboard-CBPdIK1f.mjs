import { t as authClient } from "./auth-client--faTyJ3t.mjs";
import { f as redirect, o as lazyRouteComponent, s as createFileRoute } from "../_chunks/_libs/@tanstack/react-router.mjs";
var $$splitComponentImporter = () => import("./dashboard-DOujTBJW.mjs");
var Route = createFileRoute("/dashboard")({
	beforeLoad: async () => {
		const session = await authClient.getSession();
		if (!session) throw redirect({ to: "/login" });
		return { session };
	},
	component: lazyRouteComponent($$splitComponentImporter, "component")
});
export { Route as t };
