/**
 * 租户管理类型定义
 */

/**
 * 租户配额
 */
export interface TenantQuota {
  maxOrganizations: number;
  maxMembers: number;
  maxStorage: number;
}

/**
 * 租户使用情况
 */
export interface TenantUsage {
  organizations: number;
  members: number;
  storage: number;
}

/**
 * 租户实体
 */
export interface Tenant {
  id: string;
  name: string;
  slug: string;
  plan: "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
  status: "pending" | "active" | "suspended" | "deleted";
  ownerId: string;
  quota: TenantQuota;
  usage?: TenantUsage;
  createdAt: string;
  updatedAt: string;
}

/**
 * 租户响应
 */
export interface TenantResponse {
  success: boolean;
  message: string;
  tenant: Tenant;
}

/**
 * 租户列表响应
 */
export interface TenantListResponse {
  success: boolean;
  message: string;
  data: Tenant[];
  total: number;
  page: number;
  limit: number;
}

/**
 * 创建租户 DTO
 */
export interface CreateTenantDto {
  name: string;
  slug: string;
  plan: "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
  ownerId: string;
  maxOrganizations?: number;
  maxMembers?: number;
  maxStorage?: number;
}

/**
 * 更新租户 DTO
 */
export interface UpdateTenantDto {
  name?: string;
  maxOrganizations?: number;
  maxMembers?: number;
  maxStorage?: number;
}

/**
 * 租户使用详情响应
 */
export interface TenantUsageDetailResponse {
  success: boolean;
  message: string;
  usage: {
    organizations: {
      total: number;
      active: number;
    };
    members: {
      total: number;
      active: number;
    };
    storage: {
      used: number;
      limit: number;
      percentage: number;
    };
    webhooks: {
      total: number;
      active: number;
    };
    sessions: {
      total: number;
      active: number;
    };
  };
}
