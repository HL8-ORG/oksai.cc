/**
 * OAuth 2.0 DTO
 */

import { IsArray, IsOptional, IsString, IsUrl, Length } from "class-validator";

/**
 * 注册 OAuth 客户端请求
 */
export class RegisterOAuthClientDto {
  /**
   * 客户端名称
   */
  @IsString()
  @Length(1, 100)
  name!: string;

  /**
   * 客户端类型
   */
  @IsOptional()
  @IsString()
  clientType?: "confidential" | "public";

  /**
   * 重定向 URI 列表
   */
  @IsArray()
  @IsUrl({}, { each: true })
  redirectUris!: string[];

  /**
   * 允许的权限范围
   */
  @IsArray()
  @IsString({ each: true })
  allowedScopes!: string[];

  /**
   * 客户端描述
   */
  @IsOptional()
  @IsString()
  @Length(0, 500)
  description?: string;

  /**
   * 主页 URL
   */
  @IsOptional()
  @IsUrl()
  homepageUrl?: string;

  /**
   * Logo URL
   */
  @IsOptional()
  @IsUrl()
  logoUrl?: string;
}

/**
 * 授权请求（Query 参数）
 */
export class AuthorizeDto {
  /**
   * 客户端 ID
   */
  @IsString()
  client_id!: string;

  /**
   * 重定向 URI
   */
  @IsUrl()
  redirect_uri!: string;

  /**
   * 响应类型（固定为 code）
   */
  @IsString()
  response_type!: string;

  /**
   * 权限范围
   */
  @IsString()
  scope!: string;

  /**
   * 状态参数（防 CSRF）
   */
  @IsOptional()
  @IsString()
  state?: string;

  /**
   * PKCE code challenge
   */
  @IsOptional()
  @IsString()
  code_challenge?: string;

  /**
   * PKCE code challenge 方法
   */
  @IsOptional()
  @IsString()
  code_challenge_method?: string;
}

/**
 * Token 请求
 */
export class TokenDto {
  /**
   * 授权类型
   */
  @IsString()
  grant_type!: string;

  /**
   * 授权码（授权码模式）
   */
  @IsOptional()
  @IsString()
  code?: string;

  /**
   * 重定向 URI（授权码模式）
   */
  @IsOptional()
  @IsUrl()
  redirect_uri?: string;

  /**
   * 客户端 ID
   */
  @IsString()
  client_id!: string;

  /**
   * 客户端密钥（机密客户端）
   */
  @IsOptional()
  @IsString()
  client_secret?: string;

  /**
   * Refresh Token（刷新令牌模式）
   */
  @IsOptional()
  @IsString()
  refresh_token?: string;

  /**
   * PKCE code verifier
   */
  @IsOptional()
  @IsString()
  code_verifier?: string;
}

/**
 * Token 撤销请求
 */
export class RevokeTokenDto {
  /**
   * Token
   */
  @IsString()
  token!: string;

  /**
   * Token 类型提示
   */
  @IsOptional()
  @IsString()
  token_type_hint?: "access_token" | "refresh_token";
}

/**
 * Token 内省请求
 */
export class IntrospectTokenDto {
  /**
   * Token
   */
  @IsString()
  token!: string;

  /**
   * Token 类型提示
   */
  @IsOptional()
  @IsString()
  token_type_hint?: "access_token" | "refresh_token";
}

/**
 * OAuth 客户端响应
 */
export interface OAuthClientResponse {
  success: boolean;
  message: string;
  client?: {
    id: string;
    name: string;
    clientId: string;
    clientSecret?: string;
    clientType: string;
    redirectUris: string[];
    allowedScopes: string[];
    description?: string;
    homepageUrl?: string;
    logoUrl?: string;
    isActive: boolean;
    createdAt: Date;
  };
}

/**
 * Token 响应
 */
export interface TokenResponse {
  access_token: string;
  token_type: string;
  expires_in: number;
  refresh_token?: string;
  scope: string;
}

/**
 * Token 内省响应
 */
export interface IntrospectResponse {
  active: boolean;
  scope?: string;
  client_id?: string;
  username?: string;
  token_type?: string;
  exp?: number;
  iat?: number;
  nbf?: number;
  sub?: string;
  aud?: string;
  iss?: string;
  jti?: string;
}
