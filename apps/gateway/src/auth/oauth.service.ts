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
import { CacheService } from "../common/cache.service";
import { createEncryptionUtil, type EncryptionUtil } from "./encryption.util";
import { verifyCodeVerifier } from "./oauth-crypto.util";
import { validateRedirectUri, validateRedirectUriList } from "./redirect-uri.util";

/**
 * Token 缓存数据
 */
export interface TokenCacheData {
  userId: string;
  clientId: string;
  scope: string;
  user: any;
  expiresAt: Date;
}

/**
 * OAuth 2.0 授权服务
 *
 * @description
 * 提供 OAuth 2.0 授权码流程实现
 * - 授权码生成和验证
 * - Access Token 和 Refresh Token 管理（加密存储）
 * - 客户端认证（密钥加密存储）
 */
@Injectable()
export class OAuthService {
  private readonly logger = new Logger(OAuthService.name);
  private readonly encryption?: EncryptionUtil;
  private readonly TOKEN_CACHE_PREFIX = "oauth:token:";
  private readonly TOKEN_CACHE_TTL = 300000; // 5 分钟

  constructor(private readonly cacheService: CacheService) {
    try {
      this.encryption = createEncryptionUtil();
      this.logger.log("加密功能已启用：Token 和 Client Secret 将加密存储");
    } catch (_error) {
      this.logger.warn("加密功能未启用：Token 和 Client Secret 将明文存储（不推荐生产环境使用）");
    }
  }

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
      let clientSecret: string | null = null;
      let clientSecretEncrypted: string | null = null;

      if (data.clientType === "confidential") {
        clientSecret = randomBytes(32).toString("hex");
        // 加密存储 Client Secret
        clientSecretEncrypted = this.encryption ? this.encryption.encrypt(clientSecret) : clientSecret;
      }

      const result = await db
        .insert(oauthClients)
        .values({
          name: data.name,
          clientId,
          clientSecret: clientSecretEncrypted,
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
        clientSecret, // 只在创建时返回一次明文
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

      // 验证 redirect_uri（严格验证）
      const redirectUris = JSON.parse(client.redirectUris);
      if (!validateRedirectUri(params.redirectUri, redirectUris)) {
        this.logger.warn(`无效的 redirect_uri: ${params.redirectUri}`);
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
        if (!params.clientSecret) {
          throw new UnauthorizedException("客户端认证失败：缺少 client_secret");
        }

        // 解密并验证 Client Secret
        let isValidSecret = false;
        if (this.encryption && client.clientSecret) {
          try {
            const decryptedSecret = this.encryption.decrypt(client.clientSecret);
            isValidSecret = params.clientSecret === decryptedSecret;
          } catch (error) {
            this.logger.error("Client Secret 解密失败", error);
          }
        } else {
          // 未启用加密，直接比较（向后兼容）
          isValidSecret = params.clientSecret === client.clientSecret;
        }

        if (!isValidSecret) {
          throw new UnauthorizedException("客户端认证失败：client_secret 不正确");
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

      // 验证 redirect_uri（严格匹配）
      if (code.redirectUri !== params.redirectUri) {
        this.logger.warn(`redirect_uri 不匹配: ${params.redirectUri} != ${code.redirectUri}`);
        throw new BadRequestException("redirect_uri 不匹配");
      }

      // PKCE 验证
      if (code.codeChallenge) {
        if (!params.codeVerifier) {
          throw new BadRequestException("缺少 code_verifier");
        }

        const method = (code.codeChallengeMethod as "plain" | "S256") || "S256";
        const isValid = verifyCodeVerifier(params.codeVerifier, code.codeChallenge, method);

        if (!isValid) {
          throw new BadRequestException("PKCE 验证失败");
        }
      }

      // 标记授权码为已使用
      await db
        .update(oauthAuthorizationCodes)
        .set({ usedAt: new Date() })
        .where(eq(oauthAuthorizationCodes.id, code.id));

      // 生成 Access Token
      const accessToken = randomBytes(32).toString("hex");
      const accessTokenExpiresAt = new Date(Date.now() + 3600000); // 1 小时后过期

      // 加密存储 Access Token
      const accessTokenEncrypted = this.encryption ? this.encryption.encrypt(accessToken) : accessToken;

      await db.insert(oauthAccessTokens).values({
        accessToken: accessTokenEncrypted,
        clientId: client.id,
        userId: code.userId,
        scope: code.scope,
        expiresAt: accessTokenExpiresAt,
      });

      // 生成 Refresh Token
      const refreshToken = randomBytes(32).toString("hex");
      const refreshTokenExpiresAt = new Date(Date.now() + 2592000000); // 30 天后过期

      // 加密存储 Refresh Token
      const refreshTokenEncrypted = this.encryption ? this.encryption.encrypt(refreshToken) : refreshToken;

      await db.insert(oauthRefreshTokens).values({
        refreshToken: refreshTokenEncrypted,
        clientId: client.id,
        userId: code.userId,
        scope: code.scope,
        expiresAt: refreshTokenExpiresAt,
      });

      this.logger.log(`Access Token 已生成: ${accessToken.substring(0, 8)}...`);

      return {
        access_token: accessToken, // 返回明文 Token
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: refreshToken, // 返回明文 Token
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
        if (!params.clientSecret) {
          throw new UnauthorizedException("客户端认证失败：缺少 client_secret");
        }

        // 解密并验证 Client Secret
        let isValidSecret = false;
        if (this.encryption && client.clientSecret) {
          try {
            const decryptedSecret = this.encryption.decrypt(client.clientSecret);
            isValidSecret = params.clientSecret === decryptedSecret;
          } catch (error) {
            this.logger.error("Client Secret 解密失败", error);
          }
        } else {
          // 未启用加密，直接比较（向后兼容）
          isValidSecret = params.clientSecret === client.clientSecret;
        }

        if (!isValidSecret) {
          throw new UnauthorizedException("客户端认证失败：client_secret 不正确");
        }
      }

      // 查找 Refresh Token（需要解密后匹配）
      let refreshTokenRecord = null;
      const tokens = await db.select().from(oauthRefreshTokens);

      for (const token of tokens) {
        if (token.revokedAt) continue;

        let decryptedToken = token.refreshToken;
        if (this.encryption) {
          try {
            decryptedToken = this.encryption.decrypt(token.refreshToken);
          } catch (_error) {
            continue;
          }
        }

        if (decryptedToken === params.refreshToken) {
          refreshTokenRecord = token;
          break;
        }
      }

      if (!refreshTokenRecord) {
        throw new BadRequestException("无效的 Refresh Token");
      }

      // 检查是否过期
      if (refreshTokenRecord.expiresAt < new Date()) {
        throw new BadRequestException("Refresh Token 已过期");
      }

      // 撤销旧的 Refresh Token（轮换机制）
      await db
        .update(oauthRefreshTokens)
        .set({ revokedAt: new Date() })
        .where(eq(oauthRefreshTokens.id, refreshTokenRecord.id));

      // 生成新的 Access Token
      const accessToken = randomBytes(32).toString("hex");
      const accessTokenExpiresAt = new Date(Date.now() + 3600000); // 1 小时后过期

      // 加密存储 Access Token
      const accessTokenEncrypted = this.encryption ? this.encryption.encrypt(accessToken) : accessToken;

      await db.insert(oauthAccessTokens).values({
        accessToken: accessTokenEncrypted,
        clientId: client.id,
        userId: refreshTokenRecord.userId,
        scope: refreshTokenRecord.scope,
        expiresAt: accessTokenExpiresAt,
      });

      // 生成新的 Refresh Token
      const newRefreshToken = randomBytes(32).toString("hex");
      const newRefreshTokenExpiresAt = new Date(Date.now() + 2592000000); // 30 天后过期

      // 加密存储 Refresh Token
      const newRefreshTokenEncrypted = this.encryption
        ? this.encryption.encrypt(newRefreshToken)
        : newRefreshToken;

      await db.insert(oauthRefreshTokens).values({
        refreshToken: newRefreshTokenEncrypted,
        clientId: client.id,
        userId: refreshTokenRecord.userId,
        scope: refreshTokenRecord.scope,
        expiresAt: newRefreshTokenExpiresAt,
      });

      this.logger.log(`Access Token 已刷新: ${accessToken.substring(0, 8)}...`);

      return {
        access_token: accessToken, // 返回明文 Token
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: newRefreshToken, // 返回明文 Token
        scope: refreshTokenRecord.scope,
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
      const cacheKey = `${this.TOKEN_CACHE_PREFIX}${accessToken}`;

      // 尝试从缓存获取
      const cachedData = this.cacheService.get<TokenCacheData>(cacheKey);
      if (cachedData) {
        // 检查缓存中的 token 是否过期
        if (cachedData.expiresAt < new Date()) {
          this.cacheService.delete(cacheKey);
          return null;
        }
        this.logger.debug(`Token 缓存命中: ${accessToken.substring(0, 8)}...`);
        return {
          userId: cachedData.userId,
          clientId: cachedData.clientId,
          scope: cachedData.scope,
          user: cachedData.user,
        };
      }

      // 缓存未命中，从数据库查询
      this.logger.debug(`Token 缓存未命中: ${accessToken.substring(0, 8)}...`);

      // 查找 Access Token（需要解密后匹配）
      let accessTokenRecord = null;
      const tokens = await db.select().from(oauthAccessTokens);

      for (const token of tokens) {
        if (token.revokedAt) continue;

        let decryptedToken = token.accessToken;
        if (this.encryption) {
          try {
            decryptedToken = this.encryption.decrypt(token.accessToken);
          } catch (_error) {
            continue;
          }
        }

        if (decryptedToken === accessToken) {
          accessTokenRecord = token;
          break;
        }
      }

      if (!accessTokenRecord) {
        return null;
      }

      // 检查是否过期
      if (accessTokenRecord.expiresAt < new Date()) {
        return null;
      }

      // 获取用户信息
      const user = await db.select().from(users).where(eq(users.id, accessTokenRecord.userId)).limit(1);

      const result = {
        userId: accessTokenRecord.userId,
        clientId: accessTokenRecord.clientId,
        scope: accessTokenRecord.scope,
        user: user[0] || null,
      };

      // 缓存结果
      const cacheData: TokenCacheData = {
        ...result,
        expiresAt: accessTokenRecord.expiresAt,
      };

      // 计算剩余有效时间，不超过缓存 TTL
      const remainingTime = accessTokenRecord.expiresAt.getTime() - Date.now();
      const cacheTTL = Math.min(remainingTime, this.TOKEN_CACHE_TTL);

      if (cacheTTL > 0) {
        this.cacheService.set(cacheKey, cacheData, cacheTTL);
        this.logger.debug(`Token 已缓存: ${accessToken.substring(0, 8)}... (TTL: ${cacheTTL}ms)`);
      }

      return result;
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

  /**
   * 创建 OAuth 客户端（管理接口）
   */
  async createClient(data: {
    name: string;
    redirectUris: string[];
    allowedScopes: string[];
    clientType?: "confidential" | "public";
    description?: string;
    homepageUrl?: string;
    logoUrl?: string;
    privacyPolicyUrl?: string;
    termsOfServiceUrl?: string;
    createdBy?: string;
  }): Promise<{
    id: string;
    name: string;
    clientId: string;
    clientSecret?: string;
    clientType: "confidential" | "public";
    redirectUris: string[];
    allowedScopes: string[];
    description: string | null;
    homepageUrl: string | null;
    logoUrl: string | null;
    privacyPolicyUrl: string | null;
    termsOfServiceUrl: string | null;
    isActive: boolean;
    createdAt: Date;
    updatedAt: Date;
    createdBy: string | null;
  }> {
    try {
      this.logger.log(`创建 OAuth 客户端: ${data.name}`);

      // 验证 redirect_uris
      const validation = validateRedirectUriList(data.redirectUris, true);
      if (!validation.valid) {
        throw new BadRequestException(`无效的 redirect_uri: ${validation.errors.join(", ")}`);
      }

      const clientId = `client_${randomBytes(16).toString("hex")}`;
      let clientSecret: string | null = null;
      let clientSecretEncrypted: string | null = null;

      if (data.clientType === "confidential") {
        clientSecret = randomBytes(32).toString("hex");
        // 加密存储 Client Secret
        clientSecretEncrypted = this.encryption ? this.encryption.encrypt(clientSecret) : clientSecret;
      }

      const result = await db
        .insert(oauthClients)
        .values({
          name: data.name,
          clientId,
          clientSecret: clientSecretEncrypted,
          clientType: data.clientType || "confidential",
          redirectUris: JSON.stringify(data.redirectUris),
          allowedScopes: JSON.stringify(data.allowedScopes),
          description: data.description,
          homepageUrl: data.homepageUrl,
          logoUrl: data.logoUrl,
          privacyPolicyUrl: data.privacyPolicyUrl,
          termsOfServiceUrl: data.termsOfServiceUrl,
          createdBy: data.createdBy,
        })
        .returning();

      this.logger.log(`OAuth 客户端创建成功: ${clientId}`);

      const created = result[0];
      return {
        id: created.id,
        name: created.name,
        clientId: created.clientId,
        clientSecret: clientSecret || undefined, // 只在创建时返回一次明文
        clientType: created.clientType as "confidential" | "public",
        redirectUris: JSON.parse(created.redirectUris),
        allowedScopes: JSON.parse(created.allowedScopes),
        description: created.description,
        homepageUrl: created.homepageUrl,
        logoUrl: created.logoUrl,
        privacyPolicyUrl: created.privacyPolicyUrl,
        termsOfServiceUrl: created.termsOfServiceUrl,
        isActive: created.isActive,
        createdAt: created.createdAt,
        updatedAt: created.updatedAt,
        createdBy: created.createdBy,
      };
    } catch (error) {
      this.logger.error(`创建 OAuth 客户端失败`, error);
      throw error;
    }
  }

  /**
   * 获取客户端列表
   */
  async listClients(includeInactive: boolean = false): Promise<{
    clients: any[];
    total: number;
  }> {
    const clients = await db.select().from(oauthClients);

    const filteredClients = includeInactive ? clients : clients.filter((c) => c.isActive);

    return {
      clients: filteredClients.map((c) => ({
        id: c.id,
        name: c.name,
        clientId: c.clientId,
        clientType: c.clientType,
        redirectUris: JSON.parse(c.redirectUris),
        allowedScopes: JSON.parse(c.allowedScopes),
        description: c.description,
        homepageUrl: c.homepageUrl,
        logoUrl: c.logoUrl,
        privacyPolicyUrl: c.privacyPolicyUrl,
        termsOfServiceUrl: c.termsOfServiceUrl,
        isActive: c.isActive,
        createdAt: c.createdAt,
        updatedAt: c.updatedAt,
        createdBy: c.createdBy,
      })),
      total: filteredClients.length,
    };
  }

  /**
   * 根据 ID 获取客户端信息
   */
  async getClientById(id: string): Promise<any | null> {
    const result = await db.select().from(oauthClients).where(eq(oauthClients.id, id)).limit(1);

    if (!result[0]) {
      return null;
    }

    const c = result[0];
    return {
      id: c.id,
      name: c.name,
      clientId: c.clientId,
      clientType: c.clientType,
      redirectUris: JSON.parse(c.redirectUris),
      allowedScopes: JSON.parse(c.allowedScopes),
      description: c.description,
      homepageUrl: c.homepageUrl,
      logoUrl: c.logoUrl,
      privacyPolicyUrl: c.privacyPolicyUrl,
      termsOfServiceUrl: c.termsOfServiceUrl,
      isActive: c.isActive,
      createdAt: c.createdAt,
      updatedAt: c.updatedAt,
      createdBy: c.createdBy,
    };
  }

  /**
   * 更新客户端信息
   */
  async updateClient(
    id: string,
    data: {
      name?: string;
      redirectUris?: string[];
      allowedScopes?: string[];
      description?: string;
      homepageUrl?: string;
      logoUrl?: string;
      privacyPolicyUrl?: string;
      termsOfServiceUrl?: string;
      isActive?: boolean;
    }
  ): Promise<any | null> {
    const existing = await this.getClientById(id);

    if (!existing) {
      return null;
    }

    const updateData: any = {
      updatedAt: new Date(),
    };

    if (data.name !== undefined) updateData.name = data.name;
    if (data.redirectUris !== undefined) updateData.redirectUris = JSON.stringify(data.redirectUris);
    if (data.allowedScopes !== undefined) updateData.allowedScopes = JSON.stringify(data.allowedScopes);
    if (data.description !== undefined) updateData.description = data.description;
    if (data.homepageUrl !== undefined) updateData.homepageUrl = data.homepageUrl;
    if (data.logoUrl !== undefined) updateData.logoUrl = data.logoUrl;
    if (data.privacyPolicyUrl !== undefined) updateData.privacyPolicyUrl = data.privacyPolicyUrl;
    if (data.termsOfServiceUrl !== undefined) updateData.termsOfServiceUrl = data.termsOfServiceUrl;
    if (data.isActive !== undefined) updateData.isActive = data.isActive;

    await db.update(oauthClients).set(updateData).where(eq(oauthClients.id, id));

    return this.getClientById(id);
  }

  /**
   * 删除客户端（设置 isActive = false）
   */
  async deleteClient(id: string): Promise<void> {
    await db
      .update(oauthClients)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(oauthClients.id, id));
  }

  /**
   * 轮换客户端密钥
   */
  async rotateClientSecret(id: string): Promise<{ clientId: string; clientSecret: string; message: string }> {
    const client = await this.getClientById(id);

    if (!client) {
      throw new NotFoundException("客户端不存在");
    }

    if (client.clientType === "public") {
      throw new BadRequestException("公共客户端不支持密钥轮换");
    }

    // 生成新的 Client Secret
    const newClientSecret = randomBytes(32).toString("hex");
    const clientSecretEncrypted = this.encryption
      ? this.encryption.encrypt(newClientSecret)
      : newClientSecret;

    // 更新数据库
    await db
      .update(oauthClients)
      .set({ clientSecret: clientSecretEncrypted, updatedAt: new Date() })
      .where(eq(oauthClients.id, id));

    this.logger.log(`客户端密钥已轮换: ${client.clientId}`);

    return {
      clientId: client.clientId,
      clientSecret: newClientSecret,
      message: "客户端密钥已更新，请妥善保管新的密钥",
    };
  }
}
