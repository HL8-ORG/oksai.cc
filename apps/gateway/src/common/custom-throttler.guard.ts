/**
 * 自定义速率限制守卫
 *
 * @description
 * 根据装饰器配置动态应用速率限制
 */

import { type ExecutionContext, HttpException, HttpStatus, Inject, Injectable } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { RATE_LIMIT_KEY, type RateLimitConfig } from "./rate-limit.decorator.js";

interface Request {
  headers: Record<string, string | string[] | undefined>;
  ip?: string;
  connection?: {
    remoteAddress?: string;
  };
  user?: {
    id?: string;
  };
}

/**
 * 简单的内存速率限制存储
 */
@Injectable()
export class CustomThrottlerGuard {
  constructor(@Inject(Reflector) private readonly reflector: Reflector) {}

  // 存储速率限制计数器
  private readonly storage = new Map<string, { count: number; resetAt: number }>();

  /**
   * 检查速率限制
   */
  async canActivate(context: ExecutionContext): Promise<boolean> {
    // 获取装饰器配置
    const rateLimitConfig = this.reflector.getAllAndOverride<RateLimitConfig>(RATE_LIMIT_KEY, [
      context.getHandler(),
      context.getClass(),
    ]);

    // 如果没有配置，默认通过
    if (!rateLimitConfig) {
      return true;
    }

    // 获取请求
    const request = context.switchToHttp().getRequest();

    // 生成限流键（IP + User ID）
    const ip = this.getIp(request);
    const userId = request.user?.id || "anonymous";
    const key = `${ip}:${userId}:${context.getClass().name}:${context.getHandler().name}`;

    // 检查速率限制
    const now = Date.now();
    const record = this.storage.get(key);

    if (!record) {
      // 首次请求
      this.storage.set(key, {
        count: 1,
        resetAt: now + rateLimitConfig.ttl,
      });
      return true;
    }

    // 检查是否需要重置
    if (now > record.resetAt) {
      // 重置计数器
      this.storage.set(key, {
        count: 1,
        resetAt: now + rateLimitConfig.ttl,
      });
      return true;
    }

    // 检查是否超过限制
    if (record.count >= rateLimitConfig.limit) {
      throw new HttpException(
        {
          statusCode: HttpStatus.TOO_MANY_REQUESTS,
          error: "Too Many Requests",
          message: rateLimitConfig.message || "请求次数过多，请稍后再试",
        },
        HttpStatus.TOO_MANY_REQUESTS
      );
    }

    // 增加计数
    record.count++;
    return true;
  }

  /**
   * 获取客户端 IP
   */
  private getIp(request: Request): string {
    const xForwardedFor = request.headers["x-forwarded-for"];
    if (xForwardedFor) {
      if (Array.isArray(xForwardedFor)) {
        return xForwardedFor[0];
      }
      return xForwardedFor.split(",")[0].trim();
    }

    const xRealIp = request.headers["x-real-ip"];
    if (xRealIp) {
      if (Array.isArray(xRealIp)) {
        return xRealIp[0];
      }
      return xRealIp;
    }

    return request.ip || request.connection?.remoteAddress || "unknown";
  }
}
