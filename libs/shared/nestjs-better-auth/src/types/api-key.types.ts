/**
 * Better Auth API Key 插件 API 类型定义
 */

import type { BetterAuthRequestOptions } from "./base.types.js";
import type {
  CreateApiKeyRequest,
  DeleteApiKeyRequest,
  GetApiKeyRequest,
  ListApiKeysQuery,
  UpdateApiKeyRequest,
  VerifyApiKeyRequest,
} from "./requests/api-key.requests";
import type { ApiKeyListResponse, ApiKeyResponse, ApiKeyVerifyResponse } from "./responses/api-key.responses.js";

/**
 * Better Auth API Key 插件 API 接口
 */
export interface ApiKeyAPI {
  /**
   * 创建 API Key
   */
  createApiKey: (
    options: BetterAuthRequestOptions & {
      body: CreateApiKeyRequest;
    }
  ) => Promise<ApiKeyResponse>;

  /**
   * 列出 API Keys
   */
  listApiKeys: (
    options?: BetterAuthRequestOptions & {
      query?: ListApiKeysQuery;
    }
  ) => Promise<ApiKeyListResponse>;

  /**
   * 获取单个 API Key
   */
  getApiKey: (
    options: BetterAuthRequestOptions & {
      query: GetApiKeyRequest;
    }
  ) => Promise<ApiKeyResponse>;

  /**
   * 更新 API Key
   */
  updateApiKey: (
    options: BetterAuthRequestOptions & {
      body: UpdateApiKeyRequest;
    }
  ) => Promise<ApiKeyResponse>;

  /**
   * 删除 API Key
   */
  deleteApiKey: (
    options: BetterAuthRequestOptions & {
      body: DeleteApiKeyRequest;
    }
  ) => Promise<void>;

  /**
   * 验证 API Key
   */
  verifyApiKey: (
    options: BetterAuthRequestOptions & {
      body: VerifyApiKeyRequest;
    }
  ) => Promise<ApiKeyVerifyResponse>;
}
