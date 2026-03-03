/**
 * Session 管理 DTO
 */

import { IsBoolean, IsInt, IsOptional, Max, Min } from "class-validator";

/**
 * 更新 Session 超时配置 DTO
 */
export class UpdateSessionTimeoutDto {
  /**
   * Session 超时时间（秒）
   * 最小 1 小时（3600秒），最大 30 天（2592000秒）
   */
  @IsInt()
  @Min(3600, { message: "Session 超时时间不能少于 1 小时" })
  @Max(2592000, { message: "Session 超时时间不能超过 30 天" })
  sessionTimeout!: number;
}

/**
 * 更新并发登录配置 DTO
 */
export class UpdateConcurrentSessionsDto {
  /**
   * 是否允许并发登录
   */
  @IsBoolean()
  allowConcurrentSessions!: boolean;
}

/**
 * 更新 Session 配置 DTO（完整）
 */
export class UpdateSessionConfigDto {
  /**
   * Session 超时时间（秒）
   */
  @IsOptional()
  @IsInt()
  @Min(3600, { message: "Session 超时时间不能少于 1 小时" })
  @Max(2592000, { message: "Session 超时时间不能超过 30 天" })
  sessionTimeout?: number;

  /**
   * 是否允许并发登录
   */
  @IsOptional()
  @IsBoolean()
  allowConcurrentSessions?: boolean;
}

/**
 * Session 信息响应
 */
export interface SessionInfo {
  id: string;
  userId: string;
  createdAt: Date;
  expiresAt: Date;
  ipAddress?: string | null;
  userAgent?: string | null;
  isCurrent?: boolean;
}

/**
 * Session 列表响应
 */
export interface SessionListResponse {
  success: boolean;
  message: string;
  sessions: SessionInfo[];
  currentSessionId?: string;
}

/**
 * Session 配置响应
 */
export interface SessionConfigResponse {
  success: boolean;
  message: string;
  sessionTimeout: number;
  sessionTimeoutDays: number;
  allowConcurrentSessions: boolean;
}
