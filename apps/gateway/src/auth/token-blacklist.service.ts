/**
 * Token 黑名单管理
 */

import { EntityManager } from "@mikro-orm/core";
import { Injectable, Logger } from "@nestjs/common";
import { OAuthAccessToken, OAuthRefreshToken } from "@oksai/iam-identity";

@Injectable()
export class TokenBlacklistService {
  private readonly logger = new Logger(TokenBlacklistService.name);

  constructor(private readonly em: EntityManager) {}

  /**
   * 撤销所有用户 Token
   *
   * @param userId - 用户 ID
   * @param reason - 撤销原因
   */
  async revokeAllUserTokens(userId: string, reason: string = "user_request"): Promise<void> {
    this.logger.log(`撤销用户所有 Token: ${userId}, 原因: ${reason}`);

    // 撤销所有 Access Token
    const accessTokens = await this.em.find(OAuthAccessToken, {
      userId,
      revokedAt: null,
    });

    for (const token of accessTokens) {
      token.revoke();
    }

    // 撤销所有 Refresh Token
    const refreshTokens = await this.em.find(OAuthRefreshToken, {
      userId,
      revokedAt: null,
    });

    for (const token of refreshTokens) {
      token.revoke();
    }

    await this.em.flush();
  }

  /**
   * 撤销指定客户端的所有 Token
   *
   * @param clientId - 客户端 ID
   * @param reason - 撤销原因
   */
  async revokeAllClientTokens(clientId: string, reason: string = "client_revoked"): Promise<void> {
    this.logger.log(`撤销客户端所有 Token: ${clientId}, 原因: ${reason}`);

    // 撤销所有 Access Token
    const accessTokens = await this.em.find(OAuthAccessToken, {
      clientId,
      revokedAt: null,
    });

    for (const token of accessTokens) {
      token.revoke();
    }

    // 撤销所有 Refresh Token
    const refreshTokens = await this.em.find(OAuthRefreshToken, {
      clientId,
      revokedAt: null,
    });

    for (const token of refreshTokens) {
      token.revoke();
    }

    await this.em.flush();
  }

  /**
   * 检查 Token 是否在黑名单中
   *
   * @param tokenHash - Token hash
   * @param tokenType - Token 类型
   */
  async isTokenRevoked(tokenHash: string, tokenType: "access" | "refresh"): Promise<boolean> {
    const entityClass = tokenType === "access" ? OAuthAccessToken : OAuthRefreshToken;
    const tokenField = tokenType === "access" ? "accessToken" : "refreshToken";

    const token = await this.em.findOne(entityClass, {
      [tokenField]: tokenHash,
    });

    return token?.revokedAt != null;
  }

  /**
   * 清理过期的 Token
   */
  async cleanupExpiredTokens(): Promise<{
    accessTokens: number;
    refreshTokens: number;
  }> {
    this.logger.log("开始清理过期 Token");

    const now = new Date();

    // 删除过期的 Access Token
    const expiredAccessTokens = await this.em.find(OAuthAccessToken, {
      expiresAt: { $gt: now },
      revokedAt: null,
    });

    for (const token of expiredAccessTokens) {
      this.em.remove(token);
    }

    // 删除过期的 Refresh Token
    const expiredRefreshTokens = await this.em.find(OAuthRefreshToken, {
      expiresAt: { $gt: now },
      revokedAt: null,
    });

    for (const token of expiredRefreshTokens) {
      this.em.remove(token);
    }

    await this.em.flush();

    const result = {
      accessTokens: expiredAccessTokens.length,
      refreshTokens: expiredRefreshTokens.length,
    };

    this.logger.log(`清理完成: ${result.accessTokens} access tokens, ${result.refreshTokens} refresh tokens`);

    return result;
  }
}
