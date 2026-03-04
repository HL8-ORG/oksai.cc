/**
 * OAuth Client 管理 DTO
 */

/**
 * 创建 OAuth 客户端请求
 */
export interface CreateOAuthClientDto {
  name: string;
  redirectUris: string[];
  allowedScopes: string[];
  clientType?: "confidential" | "public";
  description?: string;
  homepageUrl?: string;
  logoUrl?: string;
  privacyPolicyUrl?: string;
  termsOfServiceUrl?: string;
}

/**
 * 更新 OAuth 客户端请求
 */
export interface UpdateOAuthClientDto {
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

/**
 * OAuth 客户端响应
 */
export interface OAuthClientResponse {
  id: string;
  name: string;
  clientId: string;
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
}

/**
 * OAuth 客户端创建响应（包含 client_secret）
 */
export interface OAuthClientCreatedResponse extends OAuthClientResponse {
  clientSecret?: string; // 仅在创建时返回一次
}

/**
 * OAuth 客户端列表响应
 */
export interface OAuthClientListResponse {
  clients: OAuthClientResponse[];
  total: number;
}

/**
 * 轮换 Client Secret 响应
 */
export interface RotateClientSecretResponse {
  clientId: string;
  clientSecret: string; // 仅返回一次
  message: string;
}
