/**
 * API Key DTO（数据传输对象）
 *
 * @description
 * 支持 Better Auth API Key 插件的所有特性
 */

import { IsBoolean, IsNumber, IsObject, IsOptional, IsString, MaxLength } from "class-validator";

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
   * 过期时间（秒）
   *
   * @example
   * - 3600: 1 小时
   * - 86400: 1 天
   * - 604800: 1 周
   * - 2592000: 30 天
   * - 31536000: 1 年
   */
  @IsOptional()
  @IsNumber()
  expiresIn?: number;

  /**
   * 权限配置
   *
   * @example
   * {
   *   "user": ["read", "write"],
   *   "organization": ["read"]
   * }
   */
  @IsOptional()
  @IsObject()
  permissions?: Record<string, string[]>;

  /**
   * 元数据（任意 JSON 对象）
   *
   * @example
   * {
   *   "project": "demo",
   *   "environment": "production"
   * }
   */
  @IsOptional()
  @IsObject()
  metadata?: any;

  /**
   * 速率限制启用
   */
  @IsOptional()
  @IsBoolean()
  rateLimitEnabled?: boolean;

  /**
   * 速率限制时间窗口（毫秒）
   */
  @IsOptional()
  @IsNumber()
  rateLimitTimeWindow?: number;

  /**
   * 速率限制最大请求数
   */
  @IsOptional()
  @IsNumber()
  rateLimitMax?: number;

  /**
   * 剩余次数
   */
  @IsOptional()
  @IsNumber()
  remaining?: number;

  /**
   * Refill 数量
   */
  @IsOptional()
  @IsNumber()
  refillAmount?: number;

  /**
   * Refill 间隔（毫秒）
   */
  @IsOptional()
  @IsNumber()
  refillInterval?: number;
}

/**
 * 更新 API Key DTO
 */
export class UpdateApiKeyDto {
  /**
   * API Key 名称
   */
  @IsOptional()
  @IsString()
  @MaxLength(100, { message: "名称不能超过 100 个字符" })
  name?: string;

  /**
   * 是否启用
   */
  @IsOptional()
  @IsBoolean()
  enabled?: boolean;

  /**
   * 权限配置
   */
  @IsOptional()
  @IsObject()
  permissions?: Record<string, string[]>;

  /**
   * 元数据
   */
  @IsOptional()
  @IsObject()
  metadata?: any;

  /**
   * 剩余次数
   */
  @IsOptional()
  @IsNumber()
  remaining?: number;

  /**
   * Refill 数量
   */
  @IsOptional()
  @IsNumber()
  refillAmount?: number;

  /**
   * Refill 间隔（毫秒）
   */
  @IsOptional()
  @IsNumber()
  refillInterval?: number;

  /**
   * 过期时间（秒）
   */
  @IsOptional()
  @IsNumber()
  expiresIn?: number;

  /**
   * 速率限制启用
   */
  @IsOptional()
  @IsBoolean()
  rateLimitEnabled?: boolean;

  /**
   * 速率限制时间窗口（毫秒）
   */
  @IsOptional()
  @IsNumber()
  rateLimitTimeWindow?: number;

  /**
   * 速率限制最大请求数
   */
  @IsOptional()
  @IsNumber()
  rateLimitMax?: number;
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
  // Better Auth 特有字段
  enabled?: boolean;
  remaining?: number | null;
  rateLimitEnabled?: boolean;
  permissions?: Record<string, string[]> | null;
  metadata?: any;
}

/**
 * API Key 列表响应
 */
export interface ApiKeyListResponse {
  success: boolean;
  message: string;
  total?: number;
  apiKeys: ApiKeyResponse[];
}
