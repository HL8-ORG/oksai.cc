/**
 * 组织权限装饰器
 */

import { SetMetadata } from "@nestjs/common";
import type { OrganizationPermission } from "./organization-role.enum.js";

/**
 * 组织权限元数据 Key
 */
export const ORG_PERMISSION_KEY = "org_permission";

/**
 * 组织权限装饰器
 *
 * @description
 * 用于标记 API 端点所需的组织权限
 *
 * @example
 * ```typescript
 * @Post()
 * @RequireOrgPermission(OrganizationPermission.INVITE_MEMBER)
 * async inviteMember() {
 *   // ...
 * }
 * ```
 */
export const RequireOrgPermission = (permission: OrganizationPermission) =>
  SetMetadata(ORG_PERMISSION_KEY, permission);
