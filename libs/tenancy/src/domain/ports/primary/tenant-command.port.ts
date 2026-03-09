/**
 * 租户命令端口（驱动端口/入站端口）
 *
 * 定义租户相关的写操作契约
 * 由应用层实现
 */

import type { Result } from "@oksai/domain-core";
import type { Tenant } from "../../model/tenant.aggregate.js";

/**
 * 创建租户命令
 */
export interface CreateTenantCommand {
  name: string;
  slug: string;
  plan: "FREE" | "STARTER" | "PRO" | "ENTERPRISE";
  ownerId: string;
  metadata?: Record<string, unknown>;
}

/**
 * 激活租户命令
 */
export interface ActivateTenantCommand {
  tenantId: string;
}

/**
 * 停用租户命令
 */
export interface SuspendTenantCommand {
  tenantId: string;
  reason: string;
}

/**
 * 更新配额命令
 */
export interface UpdateTenantQuotaCommand {
  tenantId: string;
  maxOrganizations: number;
  maxMembers: number;
  maxStorage: number;
}

/**
 * 租户命令端口（驱动端口）
 *
 * 定义租户的写操作接口
 */
export interface ITenantCommandPort {
  /**
   * 创建租户
   */
  createTenant(command: CreateTenantCommand): Promise<Result<Tenant>>;

  /**
   * 激活租户
   */
  activateTenant(command: ActivateTenantCommand): Promise<Result<void>>;

  /**
   * 停用租户
   */
  suspendTenant(command: SuspendTenantCommand): Promise<Result<void>>;

  /**
   * 更新配额
   */
  updateTenantQuota(command: UpdateTenantQuotaCommand): Promise<Result<void>>;
}
