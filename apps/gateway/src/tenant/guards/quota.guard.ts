/**
 * 配额守卫
 *
 * @description
 * 自动检查租户配额的守卫，配合 @CheckQuota 装饰器使用
 *
 * @example
 * ```typescript
 * @UseGuards(QuotaGuard)
 * @Post()
 * @CheckQuota('organizations')
 * async createOrganization() {
 *   // 自动检查组织配额
 * }
 * ```
 */

import { CanActivate, ExecutionContext, ForbiddenException, Injectable, Logger } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { QUOTA_METADATA_KEY, type QuotaResource } from "../decorators/check-quota.decorator.js";
import { QuotaExceededException } from "../exceptions/quota-exceeded.exception.js";
import { TenantService } from "../tenant.service.js";

/**
 * 配额守卫
 *
 * 检查租户是否超过指定资源的配额限制
 */
@Injectable()
export class QuotaGuard implements CanActivate {
  private readonly logger = new Logger(QuotaGuard.name);

  constructor(
    private readonly reflector: Reflector,
    private readonly tenantService: TenantService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取 @CheckQuota 装饰器指定的资源类型
    const resource = this.reflector.getAllAndOverride<QuotaResource>(QUOTA_METADATA_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果没有 @CheckQuota 装饰器，放行
    if (!resource) {
      return true;
    }

    // 获取请求对象
    const request = context.switchToHttp().getRequest();

    // 获取租户 ID（从请求中获取，由 TenantMiddleware 注入）
    const tenantId = request.tenantInfo?.tenantId;

    if (!tenantId) {
      this.logger.error("无法获取租户 ID，请确保 TenantMiddleware 已正确配置");
      throw new ForbiddenException("无法获取租户信息");
    }

    // 检查配额
    try {
      const isWithinLimit = await this.tenantService.checkQuota(tenantId, resource);

      if (!isWithinLimit) {
        // 获取当前使用量和配额限制
        const tenant = await this.tenantService.getById(tenantId);
        const usage = await this.tenantService.getUsage(tenantId);

        const limits: Record<QuotaResource, number> = {
          organizations: tenant.maxOrganizations,
          members: tenant.maxMembers,
          storage: tenant.maxStorage,
        };

        const currentUsage: Record<QuotaResource, number> = {
          organizations: usage.organizations,
          members: usage.members,
          storage: usage.storage,
        };

        this.logger.warn(
          `租户 ${tenantId} 配额超限: ${resource} (${currentUsage[resource]}/${limits[resource]})`
        );

        throw new QuotaExceededException(resource, currentUsage[resource], limits[resource]);
      }

      this.logger.debug(`租户 ${tenantId} 配额检查通过: ${resource}`);
      return true;
    } catch (error) {
      if (error instanceof QuotaExceededException) {
        throw error;
      }

      this.logger.error(`配额检查失败: ${error}`);
      throw new ForbiddenException("配额检查失败");
    }
  }
}
