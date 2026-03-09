import type { IQuery } from "@oksai/cqrs";

export interface GetTenantBySlugQueryProps {
  slug: string;
}

/**
 * 根据 slug 查询租户
 */
export class GetTenantBySlugQuery implements IQuery<"GetTenantBySlug"> {
  public readonly type = "GetTenantBySlug" as const;
  public readonly slug: string;

  constructor(props: GetTenantBySlugQueryProps) {
    this.slug = props.slug;
  }
}
