/**
 * API Key 插件响应类型定义
 */

export interface ApiKeyResponse {
  id: string;
  name: string;
  key?: string; // 仅创建时返回
  prefix: string | null;
  permissions: string[] | null;
  isActive: boolean;
  enabled: boolean;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  updatedAt: Date;
  metadata: Record<string, any> | null;
  remaining: number | null;
  rateLimitEnabled: boolean;
  rateLimitTimeWindow: number | null;
  rateLimitMax: number | null;
}

export interface ApiKeyListResponse {
  apiKeys: ApiKeyResponse[];
  total: number;
  success: boolean;
  message: string;
}

export interface ApiKeyVerifyResponse {
  valid: boolean;
  key?: ApiKeyResponse;
}

export interface ApiKeyInfo {
  id: string;
  name: string;
  prefix: string;
  permissions: string[] | null;
  enabled: boolean;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  createdAt: Date;
  metadata: Record<string, any> | null;
  remaining: number | null;
  rateLimitEnabled: boolean;
  rateLimitTimeWindow: number | null;
  rateLimitMax: number | null;
}
