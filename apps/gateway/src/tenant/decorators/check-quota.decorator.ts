/**
 * 配额检查装饰器
 *
 * @description
 * 用于自动检查租户配额的装饰器
 *
 * @example
 * ```typescript
 * @Post()
 * @CheckQuota('organizations')
 * async createOrganization(@Body() dto: CreateOrganizationDto) {
 *   // 自动检查组织配额
 * }
 * ```
 */

import { SetMetadata } from "@nestjs/common";

/**
 * 配额资源类型
 */
export type QuotaResource = "organizations" | "members" | "storage";

/**
 * 配额元数据 Key
 */
export const QUOTA_METADATA_KEY = "quota";

/**
 * 配额检查装饰器
 *
 * @param resource - 要检查的资源类型
 *
 * @example
 * ```typescript
 * // 检查组织配额
 * @Post()
 * @CheckQuota('organizations')
 * async createOrganization() {}
 *
 * // 检查成员配额
 * @Post()
 * @CheckQuota('members')
 * async inviteMember() {}
 *
 * // 检查存储配额
 * @Post()
 * @CheckQuota('storage')
 * async uploadFile() {}
 * ```
 */
export const CheckQuota = (resource: QuotaResource) => SetMetadata(QUOTA_METADATA_KEY, resource);
