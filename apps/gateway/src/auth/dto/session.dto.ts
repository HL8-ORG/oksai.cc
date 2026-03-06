/**
 * Session DTO
 */

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsBoolean, IsNumber, IsOptional, Max, Min } from "class-validator";

/**
 * 更新 Session 配置请求
 */
export class UpdateSessionConfigDto {
  @ApiPropertyOptional({ description: "会话超时时间（分钟）", minimum: 5, maximum: 43200 })
  @Type(() => Number)
  @IsNumber()
  @Min(5)
  @Max(43200) // 30 天
  @IsOptional()
  sessionTimeout?: number;

  @ApiPropertyOptional({ description: "是否允许并发登录", default: true })
  @IsBoolean()
  @IsOptional()
  allowConcurrentSessions?: boolean;

  @ApiPropertyOptional({ description: "最大并发会话数", minimum: 1, maximum: 10 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(10)
  @IsOptional()
  maxConcurrentSessions?: number;
}

/**
 * Session 配置响应
 */
export class SessionConfigResponse {
  @ApiProperty({ description: "操作是否成功" })
  success!: boolean;

  @ApiProperty({ description: "消息" })
  message!: string;

  @ApiProperty({ description: "会话超时时间（秒）" })
  sessionTimeout!: number;

  @ApiProperty({ description: "会话超时时间（天）" })
  sessionTimeoutDays!: number;

  @ApiProperty({ description: "是否允许并发登录" })
  allowConcurrentSessions!: boolean;

  @ApiProperty({ description: "最大并发会话数" })
  maxConcurrentSessions!: number;
}

/**
 * Session 信息
 */
export class SessionInfo {
  @ApiProperty({ description: "会话 ID" })
  id!: string;

  @ApiPropertyOptional({ description: "用户代理", nullable: true })
  userAgent?: string | null;

  @ApiPropertyOptional({ description: "IP 地址", nullable: true })
  ipAddress!: string | null;

  @ApiProperty({ description: "创建时间" })
  createdAt!: Date;

  @ApiProperty({ description: "过期时间" })
  expiresAt!: Date;

  @ApiPropertyOptional({ description: "是否为当前会话" })
  isCurrent?: boolean;

  @ApiPropertyOptional({ description: "用户 ID" })
  userId?: string;
}

/**
 * Session 列表响应
 */
export class SessionListResponse {
  @ApiProperty({ description: "操作是否成功" })
  success!: boolean;

  @ApiProperty({ description: "消息" })
  message!: string;

  @ApiPropertyOptional({ description: "当前会话 ID", nullable: true })
  currentSessionId?: string | null;

  @ApiProperty({ description: "会话列表", type: [SessionInfo] })
  sessions!: SessionInfo[];
}
