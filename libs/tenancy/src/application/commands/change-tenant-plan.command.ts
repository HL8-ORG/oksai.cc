import type { ICommand } from "@oksai/cqrs";

export interface ChangeTenantPlanCommandProps {
  tenantId: string;
  newPlan: "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
}

/**
 * 变更租户套餐命令
 */
export class ChangeTenantPlanCommand implements ICommand {
  public readonly type = "ChangeTenantPlanCommand";
  public readonly tenantId: string;
  public readonly newPlan: "FREE" | "STARTER" | "PRO" | "ENTERPRISE";

  constructor(props: ChangeTenantPlanCommandProps) {
    this.tenantId = props.tenantId;
    this.newPlan = props.newPlan;
  }
}
