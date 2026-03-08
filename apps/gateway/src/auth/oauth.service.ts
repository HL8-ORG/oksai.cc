/**
 * OAuth 2.0 授权服务
 */

import { randomBytes } from "node:crypto";
import { EntityManager } from "@mikro-orm/core";
import {
  BadRequestException,
  Injectable,
  Logger,
  NotFoundException,
  UnauthorizedException,
} from "@nestjs/common";
import { CacheInvalidate, TwoLayerCacheService } from "@oksai/cache";
import {
  OAuthAccessToken,
  OAuthAuthorizationCode,
  OAuthClient,
  OAuthRefreshToken,
  User,
} from "@oksai/iam-infrastructure";
import { createEncryptionUtil, type EncryptionUtil } from "./encryption.util.js";
import { verifyCodeVerifier } from "./oauth-crypto.util.js";
import { validateRedirectUri, validateRedirectUriList } from "./redirect-uri.util.js";

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

  constructor(
    private readonly em: EntityManager,
    cacheSvc: TwoLayerCacheService
  ) {
    // 装饰器需要 this.cacheService
    (this as any).cacheService = cacheSvc;

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

      const client = this.em.create(OAuthClient, {
        name: data.name,
        clientId,
        clientSecret: clientSecretEncrypted,
        clientType: data.clientType || "confidential",
        redirectUris: data.redirectUris,
        allowedScopes: data.allowedScopes,
        description: data.description,
        homepageUrl: data.homepageUrl,
        logoUrl: data.logoUrl,
        createdBy: data.createdBy,
      } as any);

      await this.em.flush();

      this.logger.log(`OAuth 客户端注册成功: ${clientId}`);

      return {
        id: client.id,
        name: client.name,
        clientId: client.clientId,
        clientSecret, // 只在创建时返回一次明文
        clientType: client.clientType,
        redirectUris: client.redirectUris,
        allowedScopes: client.allowedScopes,
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
      if (!validateRedirectUri(params.redirectUri, client.redirectUris)) {
        this.logger.warn(`无效的 redirect_uri: ${params.redirectUri}`);
        throw new BadRequestException("无效的 redirect_uri");
      }

      // 验证 scope
      const requestedScopes = params.scope.split(" ");
      const invalidScopes = requestedScopes.filter((s) => !client.allowedScopes.includes(s));

      if (invalidScopes.length > 0) {
        throw new BadRequestException(`不支持的 scope: ${invalidScopes.join(", ")}`);
      }

      // 生成授权码
      const code = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 600000); // 10 分钟后过期

      this.em.create(OAuthAuthorizationCode, {
        code,
        clientId: client.id,
        userId: params.userId,
        redirectUri: params.redirectUri,
        scope: params.scope,
        codeChallenge: params.codeChallenge,
        codeChallengeMethod: params.codeChallengeMethod,
        expiresAt,
      } as any);

      await this.em.flush();

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
      const authCode = await this.em.findOne(OAuthAuthorizationCode, { code: params.code });

      if (!authCode) {
        throw new BadRequestException("无效的授权码");
      }

      // 检查授权码是否已使用
      if (authCode.isUsed()) {
        throw new BadRequestException("授权码已使用");
      }

      // 检查授权码是否过期
      if (authCode.isExpired()) {
        throw new BadRequestException("授权码已过期");
      }

      // 验证 client_id
      if (authCode.clientId !== client.id) {
        throw new BadRequestException("授权码与客户端不匹配");
      }

      // 验证 redirect_uri（严格匹配）
      if (authCode.redirectUri !== params.redirectUri) {
        this.logger.warn(`redirect_uri 不匹配: ${params.redirectUri} != ${authCode.redirectUri}`);
        throw new BadRequestException("redirect_uri 不匹配");
      }

      // PKCE 验证
      if (authCode.codeChallenge) {
        if (!params.codeVerifier) {
          throw new BadRequestException("缺少 code_verifier");
        }

        const method = (authCode.codeChallengeMethod as "plain" | "S256") || "S256";
        const isValid = verifyCodeVerifier(params.codeVerifier, authCode.codeChallenge, method);

        if (!isValid) {
          throw new BadRequestException("PKCE 验证失败");
        }
      }

      // 标记授权码为已使用
      authCode.markAsUsed();

      // 生成 Access Token
      const accessToken = randomBytes(32).toString("hex");
      const accessTokenExpiresAt = new Date(Date.now() + 3600000); // 1 小时后过期

      // 加密存储 Access Token
      const accessTokenEncrypted = this.encryption ? this.encryption.encrypt(accessToken) : accessToken;

      this.em.create(OAuthAccessToken, {
        accessToken: accessTokenEncrypted,
        clientId: client.id,
        userId: authCode.userId,
        scope: authCode.scope,
        expiresAt: accessTokenExpiresAt,
      } as any);

      // 生成 Refresh Token
      const refreshToken = randomBytes(32).toString("hex");
      const refreshTokenExpiresAt = new Date(Date.now() + 2592000000); // 30 天后过期

      // 加密存储 Refresh Token
      const refreshTokenEncrypted = this.encryption ? this.encryption.encrypt(refreshToken) : refreshToken;

      this.em.create(OAuthRefreshToken, {
        refreshToken: refreshTokenEncrypted,
        clientId: client.id,
        userId: authCode.userId,
        scope: authCode.scope,
        expiresAt: refreshTokenExpiresAt,
      } as any);

      await this.em.flush();

      this.logger.log(`Access Token 已生成: ${accessToken.substring(0, 8)}...`);

      return {
        access_token: accessToken, // 返回明文 Token
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: refreshToken, // 返回明文 Token
        scope: authCode.scope,
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
      const tokens = await this.em.find(OAuthRefreshToken, {});
      let refreshTokenRecord = null;

      for (const token of tokens) {
        if (token.isRevoked()) continue;

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
      if (refreshTokenRecord.isExpired()) {
        throw new BadRequestException("Refresh Token 已过期");
      }

      // 撤销旧的 Refresh Token（轮换机制）
      refreshTokenRecord.revoke();

      // 生成新的 Access Token
      const accessToken = randomBytes(32).toString("hex");
      const accessTokenExpiresAt = new Date(Date.now() + 3600000); // 1 小时后过期

      // 加密存储 Access Token
      const accessTokenEncrypted = this.encryption ? this.encryption.encrypt(accessToken) : accessToken;

      this.em.create(OAuthAccessToken, {
        accessToken: accessTokenEncrypted,
        clientId: client.id,
        userId: refreshTokenRecord.userId,
        scope: refreshTokenRecord.scope,
        expiresAt: accessTokenExpiresAt,
      } as any);

      // 生成新的 Refresh Token
      const newRefreshToken = randomBytes(32).toString("hex");
      const newRefreshTokenExpiresAt = new Date(Date.now() + 2592000000); // 30 天后过期

      // 加密存储 Refresh Token
      const newRefreshTokenEncrypted = this.encryption
        ? this.encryption.encrypt(newRefreshToken)
        : newRefreshToken;

      this.em.create(OAuthRefreshToken, {
        refreshToken: newRefreshTokenEncrypted,
        clientId: client.id,
        userId: refreshTokenRecord.userId,
        scope: refreshTokenRecord.scope,
        expiresAt: newRefreshTokenExpiresAt,
      } as any);

      await this.em.flush();

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
      const cacheService = (this as any).cacheService as TwoLayerCacheService;

      // 尝试从缓存获取
      const cachedData = await cacheService.get<TokenCacheData>(cacheKey);
      if (cachedData) {
        // 检查缓存中的 token 是否过期
        if (cachedData.expiresAt < new Date()) {
          await cacheService.delete(cacheKey);
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
      const tokens = await this.em.find(OAuthAccessToken, {});
      let accessTokenRecord = null;

      for (const token of tokens) {
        if (token.isRevoked()) continue;

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
      if (accessTokenRecord.isExpired()) {
        return null;
      }

      // 获取用户信息
      const user = await this.em.findOne(User, { id: accessTokenRecord.userId });

      const result = {
        userId: accessTokenRecord.userId,
        clientId: accessTokenRecord.clientId,
        scope: accessTokenRecord.scope,
        user: user || null,
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
        await cacheService.set(cacheKey, cacheData, cacheTTL);
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
  @CacheInvalidate({
    cacheKey: (token: string) => `oauth:token:${token}`,
  })
  async revokeToken(token: string, tokenTypeHint?: string) {
    try {
      this.logger.log(`撤销 Token: ${token.substring(0, 8)}...`);

      if (tokenTypeHint === "refresh_token" || !tokenTypeHint) {
        // 尝试撤销 Refresh Token
        const refreshToken = await this.em.findOne(OAuthRefreshToken, { refreshToken: token });
        if (refreshToken) {
          refreshToken.revoke();
        }
      }

      if (tokenTypeHint === "access_token" || !tokenTypeHint) {
        // 尝试撤销 Access Token
        const accessToken = await this.em.findOne(OAuthAccessToken, { accessToken: token });
        if (accessToken) {
          accessToken.revoke();
        }
      }

      await this.em.flush();

      this.logger.log(`Token 已撤销`);
    } catch (error) {
      this.logger.error(`撤销 Token 失败`, error);
      throw error;
    }
  }

  /**
   * 获取客户端信息
   */
  private async getClient(id: string) {
    return this.em.findOne(OAuthClient, { id });
  }

  /**
   * 根据 client_id 获取客户端信息
   */
  private async getClientByClientId(clientId: string) {
    return this.em.findOne(OAuthClient, { clientId });
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

      const client = this.em.create(OAuthClient, {
        name: data.name,
        clientId,
        clientSecret: clientSecretEncrypted,
        clientType: data.clientType || "confidential",
        redirectUris: data.redirectUris,
        allowedScopes: data.allowedScopes,
        description: data.description,
        homepageUrl: data.homepageUrl,
        logoUrl: data.logoUrl,
        privacyPolicyUrl: data.privacyPolicyUrl,
        termsOfServiceUrl: data.termsOfServiceUrl,
        createdBy: data.createdBy,
      } as any);

      await this.em.flush();

      this.logger.log(`OAuth 客户端创建成功: ${clientId}`);

      return {
        id: client.id,
        name: client.name,
        clientId: client.clientId,
        clientSecret: clientSecret || undefined, // 只在创建时返回一次明文
        clientType: client.clientType,
        redirectUris: client.redirectUris,
        allowedScopes: client.allowedScopes,
        description: client.description ?? null,
        homepageUrl: client.homepageUrl ?? null,
        logoUrl: client.logoUrl ?? null,
        privacyPolicyUrl: client.privacyPolicyUrl ?? null,
        termsOfServiceUrl: client.termsOfServiceUrl ?? null,
        isActive: client.isActive,
        createdAt: client.createdAt,
        updatedAt: client.updatedAt,
        createdBy: client.createdBy ?? null,
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
    const clients = await this.em.find(OAuthClient, {});

    const filteredClients = includeInactive ? clients : clients.filter((c) => c.isActive);

    return {
      clients: filteredClients.map((c) => ({
        id: c.id,
        name: c.name,
        clientId: c.clientId,
        clientType: c.clientType,
        redirectUris: c.redirectUris,
        allowedScopes: c.allowedScopes,
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
    const c = await this.em.findOne(OAuthClient, { id });

    if (!c) {
      return null;
    }

    return {
      id: c.id,
      name: c.name,
      clientId: c.clientId,
      clientType: c.clientType,
      redirectUris: c.redirectUris,
      allowedScopes: c.allowedScopes,
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

    const client = await this.em.findOne(OAuthClient, { id });
    if (!client) {
      return null;
    }

    if (data.name !== undefined) client.name = data.name;
    if (data.redirectUris !== undefined) client.redirectUris = data.redirectUris;
    if (data.allowedScopes !== undefined) client.allowedScopes = data.allowedScopes;
    if (data.description !== undefined) client.description = data.description;
    if (data.homepageUrl !== undefined) client.homepageUrl = data.homepageUrl;
    if (data.logoUrl !== undefined) client.logoUrl = data.logoUrl;
    if (data.privacyPolicyUrl !== undefined) client.privacyPolicyUrl = data.privacyPolicyUrl;
    if (data.termsOfServiceUrl !== undefined) client.termsOfServiceUrl = data.termsOfServiceUrl;
    if (data.isActive !== undefined) {
      if (data.isActive) {
        client.activate();
      } else {
        client.deactivate();
      }
    }

    await this.em.flush();

    return this.getClientById(id);
  }

  /**
   * 删除客户端（设置 isActive = false）
   */
  async deleteClient(id: string): Promise<void> {
    const client = await this.em.findOne(OAuthClient, { id });
    if (client) {
      client.deactivate();
      await this.em.flush();
    }
  }

  /**
   * 轮换客户端密钥
   */
  async rotateClientSecret(id: string): Promise<{ clientId: string; clientSecret: string; message: string }> {
    const client = await this.em.findOne(OAuthClient, { id });

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

    // 更新实体
    client.rotateSecret(clientSecretEncrypted);

    await this.em.flush();

    this.logger.log(`客户端密钥已轮换: ${client.clientId}`);

    return {
      clientId: client.clientId,
      clientSecret: newClientSecret,
      message: "客户端密钥已更新，请妥善保管新的密钥",
    };
  }
}
