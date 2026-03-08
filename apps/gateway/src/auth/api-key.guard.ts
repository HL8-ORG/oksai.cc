/**
 * API Key 认证守卫（Better Auth 版本）
 */

import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { BetterAuthApiClient } from "@oksai/nestjs-better-auth";
import type { Request } from "express";
import { auth } from "./auth.js";

/**
 * API Key 验证结果
 */
export interface ApiKeyPayload {
  id: string;
  userId: string;
  organizationId?: string | null;
  name?: string | null;
  prefix?: string;
  enabled: boolean;
  expiresAt?: Date | null;
  permissions?: Record<string, string[]> | null;
  metadata?: Record<string, unknown>;
  remaining?: number | null;
  rateLimitEnabled?: boolean;
}

/**
 * API Key 认证守卫
 *
 * @example
 * @UseGuards(ApiKeyGuard)
 * @Get('protected')
 * getProtectedData(@Request() req) {
 *   return { userId: req.apiKey.userId };
 * }
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  private readonly apiClient: BetterAuthApiClient;

  constructor() {
    this.apiClient = new BetterAuthApiClient(auth.api);
  }
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = this.extractApiKey(request);

    if (!apiKey) {
      throw new UnauthorizedException("缺少 API Key");
    }

    const payload = await this.validateApiKey(apiKey);

    if (!payload) {
      throw new UnauthorizedException("无效的 API Key");
    }

    request.apiKey = payload;
    return true;
  }

  private extractApiKey(request: Request): string | null {
    // 方式 1: X-API-Key 请求头
    const apiKeyHeader = request.headers["x-api-key"] as string;
    if (apiKeyHeader) {
      return apiKeyHeader;
    }

    // 方式 2: Authorization: Bearer <api-key>
    const authorization = request.headers.authorization;
    if (authorization?.startsWith("Bearer ")) {
      return authorization.substring(7);
    }

    return null;
  }

  private async validateApiKey(apiKey: string): Promise<ApiKeyPayload | null> {
    try {
      // 使用 Better Auth API 验证
      const result = await this.apiClient.verifyApiKey(apiKey);

      if (!result.valid || !result.key) {
        return null;
      }

      const keyData = result.key;

      return {
        id: keyData.id,
        userId: keyData.referenceId,
        organizationId: null,
        name: keyData.name || null,
        prefix: keyData.prefix || keyData.start || undefined,
        enabled: keyData.enabled,
        expiresAt: keyData.expiresAt ? new Date(keyData.expiresAt) : null,
        permissions: keyData.permissions || null,
        metadata: keyData.metadata,
        remaining: keyData.remaining,
        rateLimitEnabled: keyData.rateLimitEnabled,
      };
    } catch (error) {
      console.error("[ApiKeyGuard] Validation error:", error);
      return null;
    }
  }
}

/**
 * 扩展 Express Request 类型
 */
declare global {
  namespace Express {
    interface Request {
      apiKey?: ApiKeyPayload;
    }
  }
}
