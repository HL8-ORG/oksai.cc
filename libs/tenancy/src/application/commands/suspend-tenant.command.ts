import type { ICommand } from "@oksai/cqrs";

export interface SuspendTenantCommandProps {
  tenantId: string;
  reason: string;
}

/**
 * 停用租户命令
 */
export class SuspendTenantCommand implements ICommand {
  public readonly type = "SuspendTenantCommand";
  public readonly tenantId: string;
  public readonly reason: string;

  constructor(props: SuspendTenantCommandProps) {
    this.tenantId = props.tenantId;
    this.reason = props.reason;
  }
}
