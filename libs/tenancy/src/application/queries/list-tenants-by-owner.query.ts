import type { IQuery } from "@oksai/cqrs";

export interface ListTenantsByOwnerQueryProps {
  ownerId: string;
}

/**
 * 查询用户的所有租户
 */
export class ListTenantsByOwnerQuery implements IQuery<"ListTenantsByOwner"> {
  public readonly type = "ListTenantsByOwner" as const;
  public readonly ownerId: string;

  constructor(props: ListTenantsByOwnerQueryProps) {
    this.ownerId = props.ownerId;
  }
}
