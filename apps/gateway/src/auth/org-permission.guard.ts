/**
 * 组织权限守卫
 */

import {
  type CanActivate,
  type ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import type { Reflector } from "@nestjs/core";
import { ORG_PERMISSION_KEY } from "./org-permission.decorator";
import { OrganizationService } from "./organization.service";
import type { OrganizationPermission } from "./organization-role.enum";
import { hasPermission, type OrganizationRole } from "./organization-role.enum";

/**
 * 组织权限守卫
 *
 * @description
 * 检查用户在指定组织中是否拥有所需权限
 *
 * 工作流程：
 * 1. 从路由参数中提取 organizationId
 * 2. 从请求中提取用户 ID
 * 3. 查询用户在组织中的角色
 * 4. 检查角色是否拥有所需权限
 *
 * @example
 * ```typescript
 * @UseGuards(OrgPermissionGuard)
 * @RequireOrgPermission(OrganizationPermission.INVITE_MEMBER)
 * @Post()
 * async inviteMember() {
 *   // ...
 * }
 * ```
 */
@Injectable()
export class OrgPermissionGuard implements CanActivate {
  private readonly logger = new Logger(OrgPermissionGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly organizationService: OrganizationService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取所需权限
    const requiredPermission = this.reflector.getAllAndOverride<OrganizationPermission>(ORG_PERMISSION_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果没有设置权限要求，允许访问
    if (!requiredPermission) {
      return true;
    }

    const request = context.switchToHttp().getRequest();

    // TODO: 从认证信息中提取用户 ID
    const userId = request.headers["x-user-id"] || "temp-user-id";
    const organizationId = request.params.id || request.params.organizationId;

    if (!organizationId) {
      throw new NotFoundException("组织 ID 未提供");
    }

    if (!userId) {
      throw new ForbiddenException("未认证用户");
    }

    try {
      // 获取用户在组织中的信息（包含角色）
      const org = await this.organizationService.getOrganization(organizationId, userId);

      if (!org || !org.role) {
        throw new ForbiddenException("您不是该组织的成员");
      }

      // 检查权限
      const userRole = org.role as OrganizationRole;
      const hasRequiredPermission = hasPermission(userRole, requiredPermission);

      if (!hasRequiredPermission) {
        this.logger.warn(
          `权限不足: 用户 ${userId} 在组织 ${organizationId} 中没有权限 ${requiredPermission}`
        );
        throw new ForbiddenException(`您没有权限执行此操作（需要：${requiredPermission}）`);
      }

      // 将组织信息附加到请求对象
      request.organization = org;

      return true;
    } catch (error) {
      if (error instanceof ForbiddenException || error instanceof NotFoundException) {
        throw error;
      }

      this.logger.error(`检查组织权限失败: ${organizationId}`, error);
      throw new ForbiddenException("权限检查失败");
    }
  }
}
