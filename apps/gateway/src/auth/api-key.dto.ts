/**
 * API Key DTO（数据传输对象）
 */

import { IsOptional, IsString, MaxLength } from "class-validator";

/**
 * 创建 API Key DTO
 */
export class CreateApiKeyDto {
  /**
   * API Key 名称（可选）
   */
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "名称不能超过 100 个字符" })
  name?: string;

  /**
   * 过期时间（可选，ISO 8601 格式）
   */
  @IsOptional()
  @IsString()
  expiresAt?: string;
}

/**
 * API Key 响应
 */
export interface ApiKeyResponse {
  id: string;
  name: string | null;
  prefix: string;
  createdAt: Date;
  expiresAt: Date | null;
  lastUsedAt: Date | null;
  /** 仅创建时返回完整 key */
  key?: string;
}

/**
 * API Key 列表响应
 */
export interface ApiKeyListResponse {
  success: boolean;
  message: string;
  apiKeys: ApiKeyResponse[];
}
