/**
 * API Key 插件请求类型定义
 */

export interface CreateApiKeyRequest {
  userId: string;
  name: string;
  expiresIn?: number;
  expiresInDays?: number;
  permissions?: string[];
  metadata?: Record<string, any>;
  enabled?: boolean;
  rateLimitEnabled?: boolean;
  rateLimitTimeWindow?: number;
  rateLimitMax?: number;
  remaining?: number;
  refillAmount?: number;
  refillInterval?: number;
}

export interface UpdateApiKeyRequest {
  keyId: string;
  name?: string;
  permissions?: string[];
  metadata?: Record<string, any>;
  enabled?: boolean;
  remaining?: number;
  refillAmount?: number;
  refillInterval?: number;
  expiresIn?: number;
  rateLimitEnabled?: boolean;
  rateLimitTimeWindow?: number;
  rateLimitMax?: number;
}

export interface DeleteApiKeyRequest {
  keyId: string;
}

export interface GetApiKeyRequest {
  id: string;
}

export interface VerifyApiKeyRequest {
  key: string;
}

export interface ListApiKeysQuery {
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}
