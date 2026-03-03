/**
 * OAuth 2.0 授权服务
 */

import { randomBytes } from "node:crypto";
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import {
  db,
  oauthAccessTokens,
  oauthAuthorizationCodes,
  oauthClients,
  oauthRefreshTokens,
  users,
} from "@oksai/database";
import { eq } from "drizzle-orm";

/**
 * OAuth 2.0 授权服务
 *
 * @description
 * 提供 OAuth 2.0 授权码流程实现
 * - 授权码生成和验证
 * - Access Token 和 Refresh Token 管理
 * - 客户端认证
 */
@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);

  /**
   * 注册 OAuth 客户端
   *
   * @param data - 客户端数据
   */
  async registerClient(data: {
    name: string;
    redirectUris: string[];
    allowedScopes: string[];
    clientType?: "confidential" | "public";
    description?: string;
    homepageUrl?: string;
    logoUrl?: string;
    createdBy?: string;
  }) {
    try {
      this.logger.log(`注册 OAuth 客户端: ${data.name}`);

      const clientId = `client_${randomBytes(16).toString("hex")}`;
      const clientSecret = data.clientType === "confidential" ? randomBytes(32).toString("hex") : null;

      const result = await db
        .insert(oauthClients)
        .values({
          name: data.name,
          clientId,
          clientSecret,
          clientType: data.clientType || "confidential",
          redirectUris: JSON.stringify(data.redirectUris),
          allowedScopes: JSON.stringify(data.allowedScopes),
          description: data.description,
          homepageUrl: data.homepageUrl,
          logoUrl: data.logoUrl,
          createdBy: data.createdBy,
        })
        .returning();

      this.logger.log(`OAuth 客户端注册成功: ${clientId}`);

      return {
        id: result[0].id,
        name: result[0].name,
        clientId: result[0].clientId,
        clientSecret, // 只在创建时返回一次
        clientType: result[0].clientType,
        redirectUris: JSON.parse(result[0].redirectUris),
        allowedScopes: JSON.parse(result[0].allowedScopes),
      };
    } catch (error) {
      this.logger.error(`注册 OAuth 客户端失败`, error);
      throw error;
    }
  }

  /**
   * 生成授权码
   *
   * @param clientId - 客户端 ID
   * @param userId - 用户 ID
   * @param redirectUri - 重定向 URI
   * @param scope - 权限范围
   * @param codeChallenge - PKCE code challenge
   * @param codeChallengeMethod - PKCE code challenge 方法
   */
  async generateAuthorizationCode(params: {
    clientId: string;
    userId: string;
    redirectUri: string;
    scope: string;
    codeChallenge?: string;
    codeChallengeMethod?: string;
  }) {
    try {
      this.logger.log(`生成授权码: ${params.clientId}`);

      // 验证客户端
      const client = await this.getClient(params.clientId);
      if (!client) {
        throw new NotFoundException("客户端不存在");
      }

      // 验证 redirect_uri
      const redirectUris = JSON.parse(client.redirectUris);
      if (!redirectUris.includes(params.redirectUri)) {
        throw new BadRequestException("无效的 redirect_uri");
      }

      // 验证 scope
      const allowedScopes = JSON.parse(client.allowedScopes);
      const requestedScopes = params.scope.split(" ");
      const invalidScopes = requestedScopes.filter((s) => !allowedScopes.includes(s));

      if (invalidScopes.length > 0) {
        throw new BadRequestException(`不支持的 scope: ${invalidScopes.join(", ")}`);
      }

      // 生成授权码
      const code = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 600000); // 10 分钟后过期

      await db.insert(oauthAuthorizationCodes).values({
        code,
        clientId: client.id,
        userId: params.userId,
        redirectUri: params.redirectUri,
        scope: params.scope,
        codeChallenge: params.codeChallenge,
        codeChallengeMethod: params.codeChallengeMethod,
        expiresAt,
      });

      this.logger.log(`授权码已生成: ${code.substring(0, 8)}...`);

      return { code, expiresAt };
    } catch (error) {
      this.logger.error(`生成授权码失败`, error);
      throw error;
    }
  }

  /**
   * 交换 Access Token
   *
   * @param code - 授权码
   * @param clientId - 客户端 ID
   * @param clientSecret - 客户端密钥
   * @param redirectUri - 重定向 URI
   * @param codeVerifier - PKCE code verifier
   */
  async exchangeAccessToken(params: {
    code: string;
    clientId: string;
    clientSecret?: string;
    redirectUri: string;
    codeVerifier?: string;
  }) {
    try {
      this.logger.log(`交换 Access Token: ${params.code.substring(0, 8)}...`);

      // 验证客户端
      const client = await this.getClientByClientId(params.clientId);
      if (!client) {
        throw new UnauthorizedException("客户端认证失败");
      }

      // 验证客户端密钥（机密客户端）
      if (client.clientType === "confidential") {
        if (!params.clientSecret || params.clientSecret !== client.clientSecret) {
          throw new UnauthorizedException("客户端认证失败");
        }
      }

      // 查找授权码
      const authCode = await db
        .select()
        .from(oauthAuthorizationCodes)
        .where(eq(oauthAuthorizationCodes.code, params.code))
        .limit(1);

      if (!authCode[0]) {
        throw new BadRequestException("无效的授权码");
      }

      const code = authCode[0];

      // 检查授权码是否已使用
      if (code.usedAt) {
        throw new BadRequestException("授权码已使用");
      }

      // 检查授权码是否过期
      if (code.expiresAt < new Date()) {
        throw new BadRequestException("授权码已过期");
      }

      // 验证 client_id
      if (code.clientId !== client.id) {
        throw new BadRequestException("授权码与客户端不匹配");
      }

      // 验证 redirect_uri
      if (code.redirectUri !== params.redirectUri) {
        throw new BadRequestException("redirect_uri 不匹配");
      }

      // 标记授权码为已使用
      await db
        .update(oauthAuthorizationCodes)
        .set({ usedAt: new Date() })
        .where(eq(oauthAuthorizationCodes.id, code.id));

      // 生成 Access Token
      const accessToken = randomBytes(32).toString("hex");
      const accessTokenExpiresAt = new Date(Date.now() + 3600000); // 1 小时后过期

      await db.insert(oauthAccessTokens).values({
        accessToken,
        clientId: client.id,
        userId: code.userId,
        scope: code.scope,
        expiresAt: accessTokenExpiresAt,
      });

      // 生成 Refresh Token
      const refreshToken = randomBytes(32).toString("hex");
      const refreshTokenExpiresAt = new Date(Date.now() + 2592000000); // 30 天后过期

      await db.insert(oauthRefreshTokens).values({
        refreshToken,
        clientId: client.id,
        userId: code.userId,
        scope: code.scope,
        expiresAt: refreshTokenExpiresAt,
      });

      this.logger.log(`Access Token 已生成: ${accessToken.substring(0, 8)}...`);

      return {
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: refreshToken,
        scope: code.scope,
      };
    } catch (error) {
      this.logger.error(`交换 Access Token 失败`, error);
      throw error;
    }
  }

  /**
   * 刷新 Access Token
   *
   * @param refreshToken - Refresh Token
   * @param clientId - 客户端 ID
   * @param clientSecret - 客户端密钥
   */
  async refreshAccessToken(params: { refreshToken: string; clientId: string; clientSecret?: string }) {
    try {
      this.logger.log(`刷新 Access Token: ${params.refreshToken.substring(0, 8)}...`);

      // 验证客户端
      const client = await this.getClientByClientId(params.clientId);
      if (!client) {
        throw new UnauthorizedException("客户端认证失败");
      }

      // 验证客户端密钥（机密客户端）
      if (client.clientType === "confidential") {
        if (!params.clientSecret || params.clientSecret !== client.clientSecret) {
          throw new UnauthorizedException("客户端认证失败");
        }
      }

      // 查找 Refresh Token
      const token = await db
        .select()
        .from(oauthRefreshTokens)
        .where(eq(oauthRefreshTokens.refreshToken, params.refreshToken))
        .limit(1);

      if (!token[0]) {
        throw new BadRequestException("无效的 Refresh Token");
      }

      const refreshToken = token[0];

      // 检查是否已撤销
      if (refreshToken.revokedAt) {
        throw new BadRequestException("Refresh Token 已撤销");
      }

      // 检查是否过期
      if (refreshToken.expiresAt < new Date()) {
        throw new BadRequestException("Refresh Token 已过期");
      }

      // 撤销旧的 Refresh Token（轮换机制）
      await db
        .update(oauthRefreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(oauthRefreshTokens.id, refreshToken.id));

      // 生成新的 Access Token
      const accessToken = randomBytes(32).toString("hex");
      const accessTokenExpiresAt = new Date(Date.now() + 3600000); // 1 小时后过期

      await db.insert(oauthAccessTokens).values({
        accessToken,
        clientId: client.id,
        userId: refreshToken.userId,
        scope: refreshToken.scope,
        expiresAt: accessTokenExpiresAt,
      });

      // 生成新的 Refresh Token
      const newRefreshToken = randomBytes(32).toString("hex");
      const newRefreshTokenExpiresAt = new Date(Date.now() + 2592000000); // 30 天后过期

      await db.insert(oauthRefreshTokens).values({
        refreshToken: newRefreshToken,
        clientId: client.id,
        userId: refreshToken.userId,
        scope: refreshToken.scope,
        expiresAt: newRefreshTokenExpiresAt,
      });

      this.logger.log(`Access Token 已刷新: ${accessToken.substring(0, 8)}...`);

      return {
        access_token: accessToken,
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: newRefreshToken,
        scope: refreshToken.scope,
      };
    } catch (error) {
      this.logger.error(`刷新 Access Token 失败`, error);
      throw error;
    }
  }

  /**
   * 验证 Access Token
   *
   * @param accessToken - Access Token
   */
  async validateAccessToken(accessToken: string) {
    try {
      const token = await db
        .select()
        .from(oauthAccessTokens)
        .where(eq(oauthAccessTokens.accessToken, accessToken))
        .limit(1);

      if (!token[0]) {
        return null;
      }

      const accessTokenRecord = token[0];

      // 检查是否已撤销
      if (accessTokenRecord.revokedAt) {
        return null;
      }

      // 检查是否过期
      if (accessTokenRecord.expiresAt < new Date()) {
        return null;
      }

      // 获取用户信息
      const user = await db.select().from(users).where(eq(users.id, accessTokenRecord.userId)).limit(1);

      return {
        userId: accessTokenRecord.userId,
        clientId: accessTokenRecord.clientId,
        scope: accessTokenRecord.scope,
        user: user[0] || null,
      };
    } catch (error) {
      this.logger.error(`验证 Access Token 失败`, error);
      return null;
    }
  }

  /**
   * 撤销 Token
   *
   * @param token - Token
   * @param tokenTypeHint - Token 类型提示（access_token 或 refresh_token）
   */
  async revokeToken(token: string, tokenTypeHint?: string) {
    try {
      this.logger.log(`撤销 Token: ${token.substring(0, 8)}...`);

      if (tokenTypeHint === "refresh_token" || !tokenTypeHint) {
        // 尝试撤销 Refresh Token
        await db
          .update(oauthRefreshTokens)
          .set({ revokedAt: new Date() })
          .where(eq(oauthRefreshTokens.refreshToken, token));
      }

      if (tokenTypeHint === "access_token" || !tokenTypeHint) {
        // 尝试撤销 Access Token
        await db
          .update(oauthAccessTokens)
          .set({ revokedAt: new Date() })
          .where(eq(oauthAccessTokens.accessToken, token));
      }

      this.logger.log(`Token 已撤销`);
    } catch (error) {
      this.logger.error(`撤销 Token 失败`, error);
      throw error;
    }
  }

  /**
   * 获取客户端信息
   */
  private async getClient(clientId: string) {
    const result = await db.select().from(oauthClients).where(eq(oauthClients.id, clientId)).limit(1);
    return result[0] || null;
  }

  /**
   * 根据 client_id 获取客户端信息
   */
  private async getClientByClientId(clientId: string) {
    const result = await db.select().from(oauthClients).where(eq(oauthClients.clientId, clientId)).limit(1);
    return result[0] || null;
  }
}
