/**
 * 租户识别中间件
 *
 * 从请求中提取租户 ID，验证租户有效性，并注入到租户上下文。
 *
 * 识别优先级：
 * 1. JWT Token 中的 tenantId（最安全，推荐）
 * 2. 请求头 X-Tenant-ID（需要额外验证）
 * 3. 子域名识别（tenant.app.com）
 * 4. 自定义域名识别（企业版功能）
 *
 * @example
 * ```typescript
 * // 在 app.module.ts 中注册
 * export class AppModule implements NestModule {
 *   configure(consumer: MiddlewareConsumer) {
 *     consumer
 *       .apply(TenantMiddleware)
 *       .forRoutes('*');
 *   }
 * }
 * ```
 */

import process from "node:process";
import { BadRequestException, ForbiddenException, Injectable, Logger, NestMiddleware } from "@nestjs/common";
import { TenantContext, TenantContextService } from "@oksai/context";
import type { NextFunction, Request, Response } from "express";

/**
 * 扩展 Express Request 类型
 */
declare global {
  namespace Express {
    interface Request {
      tenantId?: string;
      tenant?: TenantInfo;
    }
  }
}

/**
 * 租户信息
 */
export interface TenantInfo {
  id: string;
  name: string;
  status: string;
  plan: string;
}

/**
 * 租户识别中间件
 */
@Injectable()
export class TenantMiddleware implements NestMiddleware {
  private readonly logger = new Logger(TenantMiddleware.name);

  constructor(private readonly tenantContext?: TenantContextService) {
    if (!this.tenantContext) {
      this.logger.warn("TenantContextService 未注入，租户上下文功能将被禁用");
    }
  }

  async use(req: Request, _res: Response, next: NextFunction): Promise<void> {
    try {
      // 1. 提取租户 ID（按优先级）
      const tenantId = this.extractTenantId(req);

      if (!tenantId) {
        // 如果是公开接口，允许通过
        if (this.isPublicRoute(req.path)) {
          return next();
        }

        throw new BadRequestException("缺少租户标识");
      }

      // 2. 验证租户有效性（可缓存）
      const tenant = await this.validateTenant(tenantId);

      if (!tenant) {
        throw new ForbiddenException("无效的租户");
      }

      if (!tenant.status || tenant.status !== "ACTIVE") {
        throw new ForbiddenException(`租户已被停用。状态：${tenant.status}`);
      }

      // 3. 注入到请求对象
      req.tenantId = tenantId;
      req.tenant = tenant;

      // 4. 创建租户上下文
      const context = TenantContext.create({
        tenantId,
        userId: (req as any).user?.id,
        correlationId: this.generateCorrelationId(),
      });

      // 5. 在租户上下文中运行后续逻辑（如果服务可用）
      if (this.tenantContext) {
        this.tenantContext.run(context, () => {
          // 设置日志上下文
          this.logger.debug?.(`租户识别成功: ${tenantId}, 用户: ${context.userId || "未登录"}`);

          next();
        });
      } else {
        // 如果没有租户上下文服务，直接继续
        this.logger.debug?.(`租户识别成功（无上下文）: ${tenantId}`);
        next();
      }
    } catch (error) {
      this.logger.error(`租户识别失败: ${(error as Error).message}`);
      throw error;
    }
  }

  /**
   * 从多种来源提取租户 ID
   *
   * 优先级：JWT Token > Header > 域名
   */
  private extractTenantId(req: Request): string | null {
    return (
      // 1. 从 JWT Token 获取（最安全）
      this.extractFromJwt(req) ||
      // 2. 从请求头获取
      this.extractFromHeader(req) ||
      // 3. 从子域名获取
      this.extractFromSubdomain(req) ||
      // 4. 从查询参数获取（仅用于调试）
      this.extractFromQuery(req)
    );
  }

  /**
   * 从 JWT Token 提租户 ID
   *
   * 注意：在测试环境中，如果用户没有 tenantId，
   * 我们使用默认租户
   */
  private extractFromJwt(req: Request): string | null {
    const user = (req as any).user;

    // 测试环境：优先从 session 获取租户 ID
    const session = (req as any).session;
    if (session?.user?.tenantId) {
      return session.user.tenantId;
    }

    // 如果 session 中没有 tenantId，使用默认测试租户
    const testTenantId = "test-tenant";

    // 临时设置到 req 对象
    (req as any).tenant = {
      id: testTenantId,
      name: "测试租户",
      status: "ACTIVE",
      plan: "PRO",
    };

    return user?.tenantId || null;
  }

  /**
   * 从请求头提取租户 ID
   */
  private extractFromHeader(req: Request): string | null {
    const headerTenantId = req.headers["x-tenant-id"] as string;

    if (headerTenantId) {
      // 验证 Header 中的 tenantId 与 JWT 中的一致
      const jwtTenantId = this.extractFromJwt(req);
      if (jwtTenantId && jwtTenantId !== headerTenantId) {
        this.logger.warn(`租户 ID 不一致: JWT=${jwtTenantId}, Header=${headerTenantId}`);
        // 使用 JWT 中的 tenantId（更安全）
        return null;
      }

      return headerTenantId;
    }

    return null;
  }

  /**
   * 从子域名提取租户 ID
   *
   * 例如：tenant1.app.com -> tenant1
   */
  private extractFromSubdomain(req: Request): string | null {
    const hostname = req.hostname;

    // 检查是否是子域名（至少3个部分）
    const parts = hostname.split(".");
    if (parts.length >= 3) {
      const subdomain = parts[0];

      // 排除常见的子域名
      const excludedSubdomains = ["www", "api", "app", "admin", "staging"];
      if (!excludedSubdomains.includes(subdomain)) {
        return subdomain;
      }
    }

    return null;
  }

  /**
   * 从查询参数提取租户 ID（仅用于调试）
   */
  private extractFromQuery(req: Request): string | null {
    if (process.env.NODE_ENV === "development") {
      return (req.query.tenantId as string) || null;
    }
    return null;
  }

  /**
   * 验证租户有效性
   *
   * TODO: 实现租户缓存（Redis）
   */
  private async validateTenant(tenantId: string): Promise<TenantInfo | null> {
    // TODO: 从数据库或缓存获取租户信息
    // const tenant = await this.tenantService.getById(tenantId);
    // return tenant;

    // 临时：直接返回模拟数据
    return {
      id: tenantId,
      name: `租户 ${tenantId}`,
      status: "ACTIVE",
      plan: "PRO",
    };
  }

  /**
   * 检查是否为公开路由
   */
  private isPublicRoute(path: string): boolean {
    const publicRoutes = [
      "/api/health",
      "/api/auth/login",
      "/api/auth/register",
      "/api/auth/callback",
      "/api/tenant/create", // 租户创建接口
    ];

    return publicRoutes.some((route) => path.startsWith(route));
  }

  /**
   * 生成关联 ID
   */
  private generateCorrelationId(): string {
    return `${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;
  }
}
