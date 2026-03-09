/**
 * 租户 DTO（数据传输对象）
 *
 * 用于应用层和表现层之间的数据传输
 */

/**
 * 租户基础 DTO
 */
export interface TenantBaseDto {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  ownerId: string;
}

/**
 * 租户详情 DTO
 */
export interface TenantDto extends TenantBaseDto {
  quota: {
    maxOrganizations: number;
    maxMembers: number;
    maxStorage: number;
  };
  settings: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 租户列表项 DTO
 */
export interface TenantListItemDto extends TenantBaseDto {
  quotaUsage: {
    organizations: number;
    members: number;
    storage: number;
  };
}

/**
 * 租户配额 DTO
 */
export interface TenantQuotaDto {
  maxOrganizations: number;
  maxMembers: number;
  maxStorage: number;
}
