/**
 * 租户管理页面 - 列表页
 */

import { useQuery } from "@tanstack/react-query";
import { createFileRoute } from "@tanstack/react-router";
import { TenantList } from "~/components/tenants/TenantList";
import { getTenants } from "~/lib/api/tenant";

export const Route = createFileRoute("/admin/tenants/")({
  component: TenantsPage,
});

function TenantsPage() {
  const { data, isLoading, error } = useQuery({
    queryKey: ["tenants"],
    queryFn: () => getTenants({ page: 1, limit: 20 }),
  });

  if (isLoading) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent mx-auto" />
          <p className="mt-2 text-muted-foreground">加载中...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <p className="text-destructive">加载失败</p>
          <p className="mt-2 text-sm text-muted-foreground">{(error as Error).message}</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto py-8">
      <div className="mb-8">
        <h1 className="font-bold text-3xl">租户管理</h1>
        <p className="mt-2 text-muted-foreground">管理所有租户、配额和域名</p>
      </div>

      {data && <TenantList tenants={data.data} total={data.total} />}
    </div>
  );
}
