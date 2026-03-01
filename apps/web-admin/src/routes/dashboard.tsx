import { createFileRoute, redirect } from "@tanstack/react-router";
import { Button } from "@/components/ui/button";
import { authClient } from "@/lib/auth-client";

export const Route = createFileRoute("/dashboard")({
  beforeLoad: async () => {
    const session = await authClient.getSession();
    if (!session) {
      throw redirect({ to: "/login" });
    }
    return { session };
  },
  component: Dashboard,
});

function Dashboard() {
  const { data: session } = authClient.useSession();
  const navigate = Route.useNavigate();

  const handleSignOut = async () => {
    await authClient.signOut();
    navigate({ to: "/login" });
  };

  return (
    <div className="min-h-screen bg-gray-50">
      <header className="bg-white shadow">
        <div className="mx-auto max-w-7xl px-4 py-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between">
            <h1 className="font-bold text-2xl text-gray-900">仪表盘</h1>
            <div className="flex items-center gap-4">
              <span className="text-muted-foreground text-sm">
                欢迎, {session?.user?.name || session?.user?.email}
              </span>
              <Button variant="outline" onClick={handleSignOut}>
                登出
              </Button>
            </div>
          </div>
        </div>
      </header>

      <main className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="font-semibold text-lg">租户管理</h3>
            <p className="mt-2 text-muted-foreground text-sm">管理多租户配置和权限</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="font-semibold text-lg">用户管理</h3>
            <p className="mt-2 text-muted-foreground text-sm">管理用户账户和角色</p>
          </div>

          <div className="rounded-lg bg-white p-6 shadow">
            <h3 className="font-semibold text-lg">系统监控</h3>
            <p className="mt-2 text-muted-foreground text-sm">查看系统运行状态和指标</p>
          </div>
        </div>
      </main>
    </div>
  );
}
