/**
 * API Key 认证守卫
 *
 * @description
 * 从请求头中提取并验证 API Key
 */

import { createHash } from "node:crypto";
import { type CanActivate, type ExecutionContext, Injectable, UnauthorizedException } from "@nestjs/common";
import { apiKeys, db } from "@oksai/database";
import { eq } from "drizzle-orm";
import type { Request } from "express";

/**
 * API Key 验证结果
 */
export interface ApiKeyPayload {
  userId: string;
  apiKeyId: string;
  tenantId?: string | null;
}

/**
 * API Key 认证守卫
 *
 * @description
 * 从请求头 X-API-Key 中提取 API Key，验证其有效性并将用户信息附加到请求对象。
 *
 * API Key 格式：oks_<random_string>
 * 存储方式：SHA256 hash
 *
 * @example
 * // 在 Controller 中使用
 * @UseGuards(ApiKeyGuard)
 * @Get('protected')
 * getProtectedData(@Request() req) {
 *   // req.apiKey 包含 API Key 信息
 *   return { userId: req.apiKey.userId };
 * }
 */
@Injectable()
export class ApiKeyGuard implements CanActivate {
  async canActivate(context: ExecutionContext): Promise<boolean> {
    const request = context.switchToHttp().getRequest<Request>();
    const apiKey = request.headers["x-api-key"] as string;

    if (!apiKey) {
      throw new UnauthorizedException("缺少 API Key");
    }

    const payload = await this.validateApiKey(apiKey);

    if (!payload) {
      throw new UnauthorizedException("无效的 API Key");
    }

    // 将 API Key 信息附加到请求对象
    request.apiKey = payload;
    return true;
  }

  /**
   * 验证 API Key
   *
   * @description
   * 1. 检查 API Key 格式（必须以 oks_ 开头）
   * 2. 计算 SHA256 hash
   * 3. 查询数据库验证
   * 4. 检查是否过期或撤销
   * 5. 更新最后使用时间
   *
   * @param apiKey - 原始 API Key
   * @returns API Key Payload 或 null
   */
  private async validateApiKey(apiKey: string): Promise<ApiKeyPayload | null> {
    try {
      // 1. 检查格式
      if (!apiKey || !apiKey.startsWith("oks_")) {
        return null;
      }

      // 2. 计算 hash
      const hashedKey = createHash("sha256").update(apiKey).digest("hex");

      // 3. 查询数据库
      const result = await db
        .select()
        .from(apiKeys)
        .where(eq((apiKeys as any).hashedKey, hashedKey))
        .limit(1);

      const keyRecord = result[0];
      if (!keyRecord) {
        return null;
      }

      // 4. 检查是否过期
      if (keyRecord.expiresAt && new Date() > keyRecord.expiresAt) {
        return null;
      }

      // 5. 检查是否撤销
      if ((keyRecord as any).revokedAt) {
        return null;
      }

      // 6. 更新最后使用时间（异步执行，不阻塞请求）
      db.update(apiKeys)
        .set({ lastUsedAt: new Date() } as any)
        .where(eq(apiKeys.id, keyRecord.id))
        .execute()
        .catch(() => {
          // 忽略更新失败
        });

      return {
        userId: (keyRecord as any).userId,
        apiKeyId: keyRecord.id,
        tenantId: (keyRecord as any).tenantId,
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
