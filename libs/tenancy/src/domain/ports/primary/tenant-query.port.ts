/**
 * 租户查询端口（驱动端口/入站端口）
 *
 * 定义租户相关的读操作契约
 * 由应用层实现
 */

/**
 * 租户 DTO（读模型）
 */
export interface TenantDto {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  ownerId: string;
  quota: {
    maxOrganizations: number;
    maxMembers: number;
    maxStorage: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 配额检查结果
 */
export interface QuotaCheckResult {
  resource: "organizations" | "members" | "storage";
  limit: number;
  current: number;
  available: number;
  exceeded: boolean;
}

/**
 * 租户查询端口（驱动端口）
 *
 * 定义租户的读操作接口
 */
export interface ITenantQueryPort {
  /**
   * 根据 ID 查询租户
   */
  getTenantById(id: string): Promise<TenantDto | null>;

  /**
   * 根据 slug 查询租户
   */
  getTenantBySlug(slug: string): Promise<TenantDto | null>;

  /**
   * 查询用户的所有租户
   */
  listTenantsByOwner(ownerId: string): Promise<TenantDto[]>;

  /**
   * 检查租户配额
   */
  checkTenantQuota(
    tenantId: string,
    resource: "organizations" | "members" | "storage",
    currentUsage: number
  ): Promise<QuotaCheckResult>;
}
