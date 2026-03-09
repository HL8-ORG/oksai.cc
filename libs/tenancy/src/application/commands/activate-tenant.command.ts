import type { ICommand } from "@oksai/cqrs";

export interface ActivateTenantCommandProps {
  tenantId: string;
}

/**
 * 激活租户命令
 */
export class ActivateTenantCommand implements ICommand {
  public readonly type = "ActivateTenantCommand";
  public readonly tenantId: string;

  constructor(props: ActivateTenantCommandProps) {
    this.tenantId = props.tenantId;
  }
}
