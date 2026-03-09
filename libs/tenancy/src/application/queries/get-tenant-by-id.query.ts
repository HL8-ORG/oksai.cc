import type { IQuery } from "@oksai/cqrs";

export interface GetTenantByIdQueryProps {
  tenantId: string;
}

/**
 * 根据 ID 查询租户
 */
export class GetTenantByIdQuery implements IQuery<"GetTenantById"> {
  public readonly type = "GetTenantById" as const;
  public readonly tenantId: string;

  constructor(props: GetTenantByIdQueryProps) {
    this.tenantId = props.tenantId;
  }
}
