/**
 * 租户资源装饰器
 *
 * 用于标记需要检查租户归属的资源
 *
 * @example
 * ```typescript
 * @Get(':id')
 * @TenantResource({ type: Project, idParam: 'id' })
 * async findOne(@Param('id') id: string) {
 *   // 自动检查项目的 tenantId
 * }
 * ```
 */

import type { Constructor, EntityClass } from "@mikro-orm/core";
import { applyDecorators, SetMetadata, UseGuards } from "@nestjs/common";
import { TenantResourceGuard } from "../tenant.guard.js";

/**
 * 租户资源配置元数据键
 */
export const TENANT_RESOURCE_KEY = "tenantResource";

/**
 * 租户资源配置选项
 */
export interface TenantResourceOptions {
  /**
   * 资源实体类
   */
  type: EntityClass<any> | Constructor<any>;

  /**
   * 资源 ID 参数名（默认: 'id'）
   */
  idParam?: string;

  /**
   * 是否从请求体提取 ID（默认: false）
   */
  fromBody?: boolean;

  /**
   * 是否从查询参数提取 ID（默认: false）
   */
  fromQuery?: boolean;
}

/**
 * 租户资源装饰器
 *
 * 自动检查资源的租户归属
 */
export function TenantResource(options: TenantResourceOptions) {
  return applyDecorators(SetMetadata(TENANT_RESOURCE_KEY, options), UseGuards(TenantResourceGuard));
}
