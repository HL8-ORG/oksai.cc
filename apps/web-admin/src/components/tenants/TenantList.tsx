/**
 * 租户列表组件
 */

import type { Tenant } from "~/lib/api/tenant.types";
import { TenantQuotaCard } from "./TenantQuotaCard";

interface TenantListProps {
  tenants: Tenant[];
  total: number;
}

export function TenantList({ tenants, total }: TenantListProps) {
  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">共 {total} 个租户</p>
        <button className="rounded-lg bg-primary px-4 py-2 font-medium text-primary-foreground text-sm hover:bg-primary/90">
          创建租户
        </button>
      </div>

      <div className="rounded-lg border bg-card">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="border-b bg-muted/50">
              <tr>
                <th className="px-4 py-3 text-left font-medium text-sm">租户名称</th>
                <th className="px-4 py-3 text-left font-medium text-sm">Slug</th>
                <th className="px-4 py-3 text-left font-medium text-sm">套餐</th>
                <th className="px-4 py-3 text-left font-medium text-sm">状态</th>
                <th className="px-4 py-3 text-left font-medium text-sm">配额使用</th>
                <th className="px-4 py-3 text-left font-medium text-sm">创建时间</th>
                <th className="px-4 py-3 text-left font-medium text-sm">操作</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {tenants.map((tenant) => (
                <tr key={tenant.id} className="hover:bg-muted/50">
                  <td className="px-4 py-3">
                    <div>
                      <p className="font-medium">{tenant.name}</p>
                      <p className="text-muted-foreground text-xs">{tenant.id}</p>
                    </div>
                  </td>
                  <td className="px-4 py-3">
                    <code className="rounded bg-muted px-2 py-1 text-xs">{tenant.slug}</code>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getPlanColor(
                        tenant.plan
                      )}`}>
                      {tenant.plan}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${getStatusColor(
                        tenant.status
                      )}`}>
                      {getStatusText(tenant.status)}
                    </span>
                  </td>
                  <td className="px-4 py-3">
                    {tenant.usage && <TenantQuotaCard quota={tenant.quota} usage={tenant.usage} compact />}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground text-sm">
                    {new Date(tenant.createdAt).toLocaleDateString("zh-CN")}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex gap-2">
                      <button className="text-primary text-sm hover:underline">查看</button>
                      <button className="text-primary text-sm hover:underline">编辑</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

function getPlanColor(plan: string) {
  switch (plan) {
    case "FREE":
      return "bg-gray-100 text-gray-800";
    case "STARTER":
      return "bg-blue-100 text-blue-800";
    case "PRO":
      return "bg-purple-100 text-purple-800";
    case "ENTERPRISE":
      return "bg-yellow-100 text-yellow-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusColor(status: string) {
  switch (status) {
    case "pending":
      return "bg-yellow-100 text-yellow-800";
    case "active":
      return "bg-green-100 text-green-800";
    case "suspended":
      return "bg-red-100 text-red-800";
    case "deleted":
      return "bg-gray-100 text-gray-800";
    default:
      return "bg-gray-100 text-gray-800";
  }
}

function getStatusText(status: string) {
  switch (status) {
    case "pending":
      return "待审核";
    case "active":
      return "已激活";
    case "suspended":
      return "已停用";
    case "deleted":
      return "已删除";
    default:
      return status;
  }
}
