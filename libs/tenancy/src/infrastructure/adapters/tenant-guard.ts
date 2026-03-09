import { CanActivate, ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import type { OksaiLoggerService } from "@oksai/logger";
import { TenantContextService } from "./tenant-context.service.js";

/**
 * 租户守卫
 *
 * 验证请求中的租户标识并设置租户上下文。
 *
 * 支持三种方式识别租户（优先级从高到低）：
 * 1. X-Tenant-Id 请求头
 * 2. 子域名（例如：tenant.example.com）
 * 3. tenant-id Cookie
 */
@Injectable()
export class TenantGuard implements CanActivate {
  constructor(
    private readonly tenantContext: TenantContextService,
    private readonly logger: OksaiLoggerService
  ) {}

  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest();

    const tenantId = this.extractTenantId(request);

    if (!tenantId) {
      this.logger.warn("缺少租户标识");
      throw new UnauthorizedException("缺少租户标识");
    }

    // TODO: 从数据库加载租户信息
    this.tenantContext.setTenantContext({
      tenantId,
      slug: "unknown",
      name: "Unknown Tenant",
      plan: "FREE",
      status: "ACTIVE",
    });

    return true;
  }

  /**
   * 从请求中提取租户标识
   *
   * 优先级：
   * 1. X-Tenant-Id 请求头
   * 2. 子域名（忽略 www 和 api）
   * 3. tenant-id Cookie
   */
  private extractTenantId(request: any): string | undefined {
    // 1. 从请求头获取
    const headerTenantId = request.headers["x-tenant-id"];
    if (headerTenantId) {
      return headerTenantId;
    }

    // 2. 从子域名获取
    const host = request.headers.host;
    if (host) {
      const subdomain = host.split(".")[0];
      // 忽略 www 和 api 子域名
      if (subdomain && subdomain !== "www" && subdomain !== "api") {
        return subdomain;
      }
    }

    // 3. 从 Cookie 获取
    const cookieTenantId = request.cookies?.["tenant-id"];
    if (cookieTenantId) {
      return cookieTenantId;
    }

    return undefined;
  }
}
