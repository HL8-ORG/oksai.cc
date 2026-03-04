/**
 * Token 黑名单管理
 */

import { Injectable, Logger } from "@nestjs/common";
import { db, oauthAccessTokens, oauthRefreshTokens } from "@oksai/database";
import { and, eq, gt } from "drizzle-orm";

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  /**
   * 撤销所有用户 Token
   *
   * @param userId - 用户 ID
   * @param reason - 撤销原因
   */
  async revokeAllUserTokens(userId: string, reason: string = "user_request"): Promise<void> {
    this.logger.log(`撤销用户所有 Token: ${userId}, 原因: ${reason}`);

    // 撤销所有 Access Token
    await db
      .update(oauthAccessTokens)
      .set({
        revokedAt: new Date(),
      })
      .where(and(eq(oauthAccessTokens.userId, userId), eq(oauthAccessTokens.revokedAt, null as any)));

    // 撤销所有 Refresh Token
    await db
      .update(oauthRefreshTokens)
      .set({
        revokedAt: new Date(),
      })
      .where(and(eq(oauthRefreshTokens.userId, userId), eq(oauthRefreshTokens.revokedAt, null as any)));
  }

  /**
   * 撤销指定客户端的所有 Token
   *
   * @param clientId - 客户端 ID
   * @param reason - 撤销原因
   */
  async revokeAllClientTokens(clientId: string, reason: string = "client_revoked"): Promise<void> {
    this.logger.log(`撤销客户端所有 Token: ${clientId}, 原因: ${reason}`);

    await db
      .update(oauthAccessTokens)
      .set({
        revokedAt: new Date(),
      })
      .where(and(eq(oauthAccessTokens.clientId, clientId), eq(oauthAccessTokens.revokedAt, null as any)));

    await db
      .update(oauthRefreshTokens)
      .set({
        revokedAt: new Date(),
      })
      .where(and(eq(oauthRefreshTokens.clientId, clientId), eq(oauthRefreshTokens.revokedAt, null as any)));
  }

  /**
   * 检查 Token 是否在黑名单中
   *
   * @param tokenHash - Token hash
   * @param tokenType - Token 类型
   */
  async isTokenRevoked(tokenHash: string, tokenType: "access" | "refresh"): Promise<boolean> {
    const table = tokenType === "access" ? oauthAccessTokens : oauthRefreshTokens;
    const tokenField =
      tokenType === "access" ? oauthAccessTokens.accessToken : oauthRefreshTokens.refreshToken;

    const result = await db
      .select({ revokedAt: table.revokedAt })
      .from(table)
      .where(eq(tokenField as any, tokenHash))
      .limit(1);

    return result[0]?.revokedAt != null;
  }

  /**
   * 清理过期的 Token
   */
  async cleanupExpiredTokens(): Promise<{ accessTokens: number; refreshTokens: number }> {
    this.logger.log("开始清理过期 Token");

    const now = new Date();

    // 删除过期的 Access Token（保留 7 天用于审计）
    const expiredAccessTokens = await db
      .delete(oauthAccessTokens)
      .where(and(gt(oauthAccessTokens.expiresAt, now), eq(oauthAccessTokens.revokedAt, null as any)))
      .returning();

    // 删除过期的 Refresh Token（保留 7 天用于审计）
    const expiredRefreshTokens = await db
      .delete(oauthRefreshTokens)
      .where(and(gt(oauthRefreshTokens.expiresAt, now), eq(oauthRefreshTokens.revokedAt, null as any)))
      .returning();

    const result = {
      accessTokens: expiredAccessTokens.length,
      refreshTokens: expiredRefreshTokens.length,
    };

    this.logger.log(`清理完成: ${result.accessTokens} access tokens, ${result.refreshTokens} refresh tokens`);

    return result;
  }
}
