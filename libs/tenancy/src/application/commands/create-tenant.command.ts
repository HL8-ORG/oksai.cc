import type { ICommand } from "@oksai/cqrs";
import type { TenantPlanValue } from "../../domain/index.js";

export interface CreateTenantCommandProps {
  name: string;
  slug: string;
  plan: TenantPlanValue;
  ownerId: string;
  metadata?: Record<string, unknown>;
}

/**
 * 创建租户命令
 */
export class CreateTenantCommand implements ICommand {
  public readonly type = "CreateTenantCommand";
  public readonly name: string;
  public readonly slug: string;
  public readonly plan: TenantPlanValue;
  public readonly ownerId: string;
  public readonly metadata?: Record<string, unknown>;

  constructor(props: CreateTenantCommandProps) {
    this.name = props.name;
    this.slug = props.slug;
    this.plan = props.plan;
    this.ownerId = props.ownerId;
    this.metadata = props.metadata;
  }
}
