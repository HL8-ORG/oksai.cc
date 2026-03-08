/**
 * 租户权限守卫
 *
 * 检查用户是否有权访问当前租户的资源。
 * 防止跨租户访问。
 *
 * @example
 * ```typescript
 * @Controller('users')
 * @UseGuards(TenantGuard)
 * export class UserController {
 *   @Get()
 *   async findAll() {
 *     // 自动检查租户权限
 *   }
 * }
 * ```
 */

import { EntityManager } from "@mikro-orm/core";
import {
  applyDecorators,
  CanActivate,
  ExecutionContext,
  ForbiddenException,
  Injectable,
  Logger,
  SetMetadata,
} from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { TenantContextService } from "@oksai/context";
import type { TenantResourceOptions } from "./decorators/tenant-resource.decorator.js";

export const TENANT_RESOURCE_KEY = "tenantResource";

/**
 * 跳过租户守卫的元数据键
 */
export const SKIP_TENANT_GUARD_KEY = "skipTenantGuard";

/**
 * 跳过租户守卫装饰器
 *
 * 用于超级管理员接口或公开接口
 *
 * @example
 * ```typescript
 * @Controller('admin')
 * @SkipTenantGuard()
 * export class AdminController {
 *   @Get('tenants')
 *   async getAllTenants() {
 *     // 可以访问所有租户的数据
 *   }
 * }
 * ```
 */
export function SkipTenantGuard() {
  return applyDecorators(SetMetadata(SKIP_TENANT_GUARD_KEY, true));
}

/**
 * 租户权限守卫
 */
@Injectable()
export class TenantGuard implements CanActivate {
  protected readonly logger = new Logger(TenantGuard.name);

  constructor(
    protected readonly reflector: Reflector,
    protected readonly tenantContext: TenantContextService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 1. 检查是否跳过租户守卫
    const skipGuard = this.reflector.getAllAndOverride<boolean>(SKIP_TENANT_GUARD_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (skipGuard) {
      this.logger.debug?.("跳过租户守卫（使用 @SkipTenantGuard() 装饰器）");
      return true;
    }

    // 2. 获取租户上下文
    const tenantContext = this.tenantContext.getContext();

    if (!tenantContext) {
      this.logger.error("租户上下文不存在");
      throw new ForbiddenException("租户上下文不存在");
    }

    // 3. 获取请求对象
    const request = context.switchToHttp().getRequest();

    // 4. 检查用户是否属于租户
    const user = request.user;
    if (user && user.tenantId !== tenantContext.tenantId) {
      this.logger.error(
        `用户租户不匹配: user.tenantId=${user.tenantId}, context.tenantId=${tenantContext.tenantId}`
      );
      throw new ForbiddenException("您不属于该租户");
    }

    // 5. 检查资源是否属于租户（可选）
    const resourceTenantId = await this.extractResourceTenantId(context);
    if (resourceTenantId && resourceTenantId !== tenantContext.tenantId) {
      this.logger.error(
        `资源租户不匹配: resource.tenantId=${resourceTenantId}, context.tenantId=${tenantContext.tenantId}`
      );
      throw new ForbiddenException("无权访问其他租户的资源");
    }

    // 6. 验证通过
    this.logger.debug?.(
      `租户权限验证通过: tenantId=${tenantContext.tenantId}, userId=${tenantContext.userId}`
    );

    return true;
  }

  /**
   * 从路由参数或请求体中提取资源租户 ID
   *
   * 子类可以重写此方法以支持更复杂的资源提取逻辑（如数据库查询）
   */
  protected extractResourceTenantId(context: ExecutionContext): Promise<string | null> | string | null {
    const request = context.switchToHttp().getRequest();

    // 从路由参数提取
    const params = request.params;
    if (params?.tenantId) {
      return params.tenantId;
    }

    // 从请求体提取
    const body = request.body;
    if (body?.tenantId) {
      return body.tenantId;
    }

    // 从查询参数提取
    const query = request.query;
    if (query?.tenantId) {
      return query.tenantId as string;
    }

    return null;
  }
}

/**
 * 租户资源守卫
 *
 * 用于检查特定资源的租户归属
 *
 * @example
 * ```typescript
 * @Controller('projects')
 * @UseGuards(TenantResourceGuard)
 * export class ProjectController {
 *   @Get(':id')
 *   async findOne(@Param('id') id: string) {
 *     // 自动检查项目的 tenantId
 *   }
 * }
 * ```
 */
@Injectable()
export class TenantResourceGuard extends TenantGuard {
  constructor(
    reflector: Reflector,
    tenantContext: TenantContextService,
    private readonly em: EntityManager
  ) {
    super(reflector, tenantContext);
  }

  /**
   * 重写资源提取逻辑
   *
   * 从装饰器配置中获取资源类型，查询数据库获取资源的 tenantId
   */
  protected override async extractResourceTenantId(context: ExecutionContext): Promise<string | null> {
    // 1. 获取装饰器配置
    const config = this.reflector.getAllAndOverride<TenantResourceOptions>(TENANT_RESOURCE_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    if (!config) {
      // 没有配置装饰器，使用默认提取逻辑
      return super.extractResourceTenantId(context);
    }

    // 2. 提取资源 ID
    const resourceId = this.extractResourceId(context, config);
    if (!resourceId) {
      this.logger.debug?.(`无法提取资源 ID: ${config.idParam || "id"}`);
      return null;
    }

    // 3. 查询资源的 tenantId
    try {
      const entity = await this.em.findOne(config.type, {
        id: resourceId,
      } as any);

      if (!entity) {
        this.logger.warn?.(`资源不存在: type=${config.type.name}, id=${resourceId}`);
        return null;
      }

      const resourceTenantId = (entity as any).tenantId;
      this.logger.debug?.(
        `资源租户查询成功: type=${config.type.name}, id=${resourceId}, tenantId=${resourceTenantId}`
      );

      return resourceTenantId || null;
    } catch (error) {
      this.logger.error(`查询资源失败: ${error}`);
      return null;
    }
  }

  /**
   * 从请求中提取资源 ID
   */
  private extractResourceId(context: ExecutionContext, config: TenantResourceOptions): string | null {
    const request = context.switchToHttp().getRequest();
    const idParam = config.idParam || "id";

    // 从请求体提取
    if (config.fromBody) {
      return request.body?.[idParam] || null;
    }

    // 从查询参数提取
    if (config.fromQuery) {
      return (request.query?.[idParam] as string) || null;
    }

    // 默认从路由参数提取
    return request.params?.[idParam] || null;
  }
}
