import type { ICommand } from "@oksai/cqrs";

export interface UpdateTenantQuotaCommandProps {
  tenantId: string;
  maxOrganizations: number;
  maxMembers: number;
  maxStorage: number;
}

/**
 * 更新租户配额命令
 */
export class UpdateTenantQuotaCommand implements ICommand<string> {
  public readonly type = "UpdateTenantQuotaCommand";
  public readonly tenantId: string;
  public readonly maxOrganizations: number;
  public readonly maxMembers: number;
  public readonly maxStorage: number;

  constructor(props: UpdateTenantQuotaCommandProps) {
    this.tenantId = props.tenantId;
    this.maxOrganizations = props.maxOrganizations;
    this.maxMembers = props.maxMembers;
    this.maxStorage = props.maxStorage;
  }
}
