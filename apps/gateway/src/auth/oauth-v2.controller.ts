/**
 * OAuth 2.0 控制器
 */

import { Body, Controller, Get, Headers, HttpCode, HttpStatus, Post, Query } from "@nestjs/common";
import { ApiHeader, ApiOperation, ApiQuery, ApiResponse, ApiTags } from "@nestjs/swagger";
import { AllowAnonymous } from "@oksai/nestjs-better-auth";
import type { RegisterOAuthClientDto } from "./oauth.dto";
import { OAuthService } from "./oauth.service";

/**
 * OAuth 2.0 控制器
 *
 * @description
 * 提供 OAuth 2.0 授权服务器 API 端点
 *
 * 端点列表：
 * - POST /oauth/register - 注册 OAuth 审户端
 * - GET /oauth/authorize - 授权端点
 * - POST /oauth/token - Token 端点
 * - POST /oauth/revoke - Token 撤销端点
 * - POST /oauth/introspect - Token 内省端点
 */
@ApiTags("OAuth 2.0")
@ApiHeader({
  name: "x-user-id",
  description: "用户 ID（用于认证）",
  required: false,
})
@Controller("oauth")
export class OAuthV2Controller {
  constructor(private readonly oauthService: OAuthService) {}

  /**
   * 注册 OAuth 客户端
   *
   * @description
   * 注册新的 OAuth 客户端应用
   *
   * @example
   * POST /api/oauth/register
   * Body: { name: "My App", redirectUris: ["http://localhost:3000/callback"], allowedScopes: ["read", "write"] }
   * Response: { id: "...", clientId: "...", clientSecret: "...", ... }
   */
  @Post("register")
  @HttpCode(HttpStatus.CREATED)
  @AllowAnonymous()
  @ApiOperation({ summary: "注册 OAuth 客户端", description: "注册新的 OAuth 客户端应用" })
  @ApiResponse({
    status: 201,
    description: "客户端注册成功",
    schema: {
      example: {
        id: "xxx",
        clientId: "xxx",
        clientSecret: "xxx",
        name: "My App",
        redirectUris: ["http://localhost:3000/callback"],
        allowedScopes: ["read", "write"],
      },
    },
  })
  @ApiResponse({ status: 400, description: "参数错误" })
  async registerClient(@Headers("x-user-id") userId: string, @Body() dto: RegisterOAuthClientDto) {
    return this.oauthService.registerClient({
      name: dto.name,
      redirectUris: dto.redirectUris,
      allowedScopes: dto.allowedScopes,
      clientType: dto.clientType,
      description: dto.description,
      homepageUrl: dto.homepageUrl,
      logoUrl: dto.logoUrl,
      createdBy: userId,
    });
  }

  /**
   * 授权端点
   *
   * @description
   * OAuth 2.0 授权端点，返回授权码
   *
   * @example
   * GET /api/oauth/authorize?client_id=xxx&redirect_uri=xxx&scope=read&state=xxx
   * Response: { code: "...", expiresAt: "..." }
   */
  @Get("authorize")
  @AllowAnonymous()
  @ApiOperation({ summary: "OAuth 授权端点", description: "OAuth 2.0 授权端点，返回授权码" })
  @ApiQuery({ name: "client_id", description: "客户端 ID", type: "string", required: true })
  @ApiQuery({ name: "redirect_uri", description: "回调 URI", type: "string", required: true })
  @ApiQuery({ name: "scope", description: "权限范围", type: "string", required: true })
  @ApiQuery({ name: "state", description: "状态参数（防止 CSRF）", type: "string", required: false })
  @ApiQuery({ name: "code_challenge", description: "PKCE Code Challenge", type: "string", required: false })
  @ApiQuery({
    name: "code_challenge_method",
    description: "PKCE 方法（S256/plain）",
    type: "string",
    required: false,
  })
  @ApiResponse({
    status: 200,
    description: "授权成功",
    schema: { example: { code: "xxx", expires_in: 600, expires_at: "2026-03-06T06:00:00Z" } },
  })
  @ApiResponse({ status: 400, description: "参数错误" })
  @ApiResponse({ status: 401, description: "未认证" })
  async authorize(
    @Query("client_id") clientId: string,
    @Query("redirect_uri") redirectUri: string,
    @Query("scope") scope: string,
    @Headers("x-user-id") userId: string,
    @Query("state") _state?: string,
    @Query("code_challenge") codeChallenge?: string,
    @Query("code_challenge_method") codeChallengeMethod?: string
  ) {
    const result = await this.oauthService.generateAuthorizationCode({
      clientId,
      userId,
      redirectUri,
      scope,
      codeChallenge,
      codeChallengeMethod,
    });

    return {
      code: result.code,
      expires_in: 600, // 10 分钟
      expires_at: result.expiresAt,
    };
  }

  /**
   * Token 端点
   *
   * @description
   * 交换授权码或刷新令牌以获取 Access Token
   *
   * @example
   * POST /api/oauth/token
   * Body: { grant_type: "authorization_code", code: "xxx", client_id: "xxx", redirect_uri: "xxx" }
   * Response: { access_token: "...", token_type: "Bearer", expires_in: 3600, refresh_token: "..." }
   */
  @Post("token")
  @HttpCode(HttpStatus.OK)
  @AllowAnonymous()
  @ApiOperation({ summary: "OAuth Token 端点", description: "交换授权码或刷新令牌以获取 Access Token" })
  @ApiResponse({
    status: 200,
    description: "Token 交换成功",
    schema: {
      example: {
        access_token: "xxx",
        token_type: "Bearer",
        expires_in: 3600,
        refresh_token: "xxx",
        scope: "read write",
      },
    },
  })
  @ApiResponse({ status: 400, description: "参数错误或无效的 grant_type" })
  @ApiResponse({ status: 401, description: "客户端认证失败" })
  async token(
    @Body()
    body: {
      grant_type: string;
      code?: string;
      client_id: string;
      client_secret?: string;
      redirect_uri?: string;
      code_verifier?: string;
      refresh_token?: string;
    }
  ) {
    if (body.grant_type === "authorization_code") {
      if (!body.code || !body.redirect_uri) {
        return {
          error: "invalid_request",
          error_description: "Missing required parameters",
        };
      }

      return this.oauthService.exchangeAccessToken({
        code: body.code,
        clientId: body.client_id,
        clientSecret: body.client_secret,
        redirectUri: body.redirect_uri,
        codeVerifier: body.code_verifier,
      });
    }

    if (body.grant_type === "refresh_token") {
      if (!body.refresh_token) {
        return {
          error: "invalid_request",
          error_description: "Missing refresh_token",
        };
      }

      return this.oauthService.refreshAccessToken({
        refreshToken: body.refresh_token,
        clientId: body.client_id,
        clientSecret: body.client_secret,
      });
    }

    return {
      error: "unsupported_grant_type",
      error_description: "Unsupported grant_type",
    };
  }

  /**
   * Token 撤销端点
   *
   * @description
   * 撤销 Access Token 或 Refresh Token
   *
   * @example
   * POST /api/oauth/revoke
   * Body: { token: "xxx", token_type_hint: "access_token" }
   * Response: { success: true }
   */
  @Post("revoke")
  @HttpCode(HttpStatus.OK)
  @AllowAnonymous()
  @ApiOperation({ summary: "Token 撤销", description: "撤销 Access Token 或 Refresh Token" })
  @ApiResponse({
    status: 200,
    description: "撤销成功",
    schema: { example: { success: true, message: "Token 已撤销" } },
  })
  @ApiResponse({ status: 400, description: "参数错误" })
  async revoke(
    @Body()
    body: { token: string; token_type_hint?: string }
  ) {
    await this.oauthService.revokeToken(body.token, body.token_type_hint);

    return {
      success: true,
      message: "Token 已撤销",
    };
  }

  /**
   * Token 内省端点
   *
   * @description
   * 验证和获取 Token 信息
   *
   * @example
   * POST /api/oauth/introspect
   * Body: { token: "xxx" }
   * Response: { active: true, user_id: "...", scope: "..." }
   */
  @Post("introspect")
  @HttpCode(HttpStatus.OK)
  @AllowAnonymous()
  @ApiOperation({ summary: "Token 内省", description: "验证和获取 Token 信息" })
  @ApiResponse({
    status: 200,
    description: "内省成功",
    schema: {
      example: {
        active: true,
        user_id: "xxx",
        client_id: "xxx",
        scope: "read write",
      },
    },
  })
  @ApiResponse({ status: 200, description: "Token 无效", schema: { example: { active: false } } })
  async introspect(
    @Body()
    body: { token: string }
  ) {
    const tokenInfo = await this.oauthService.validateAccessToken(body.token);

    if (!tokenInfo) {
      return {
        active: false,
      };
    }

    return {
      active: true,
      user_id: tokenInfo.userId,
      client_id: tokenInfo.clientId,
      scope: tokenInfo.scope,
    };
  }
}
