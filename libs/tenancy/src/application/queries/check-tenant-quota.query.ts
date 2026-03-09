import type { IQuery } from "@oksai/cqrs";

export interface CheckTenantQuotaQueryProps {
  tenantId: string;
  resource: "organizations" | "members" | "storage";
  currentUsage: number;
}

/**
 * 检查租户配额查询
 */
export class CheckTenantQuotaQuery implements IQuery<"CheckTenantQuota"> {
  public readonly type = "CheckTenantQuota" as const;
  public readonly tenantId: string;
  public readonly resource: "organizations" | "members" | "storage";
  public readonly currentUsage: number;

  constructor(props: CheckTenantQuotaQueryProps) {
    this.tenantId = props.tenantId;
    this.resource = props.resource;
    this.currentUsage = props.currentUsage;
  }
}
