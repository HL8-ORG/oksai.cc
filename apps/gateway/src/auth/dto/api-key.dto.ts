/**
 * API Key DTO
 */

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsArray, IsBoolean, IsNumber, IsOptional, IsString, Max, Min } from "class-validator";

/**
 * 创建 API Key 请求
 */
export class CreateApiKeyDto {
  @ApiProperty({ description: "API Key 名称", example: "Production API Key" })
  @IsString()
  name!: string;

  @ApiPropertyOptional({ description: "过期时间（秒）", example: 7776000, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  expiresIn?: number;

  @ApiPropertyOptional({ description: "过期天数", example: 90, minimum: 1, maximum: 365 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(365)
  @IsOptional()
  expiresInDays?: number;

  @ApiPropertyOptional({ description: "权限范围", type: [String], example: ["read:user", "write:user"] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];

  @ApiPropertyOptional({ description: "元数据" })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: "是否启用速率限制", default: false })
  @IsBoolean()
  @IsOptional()
  rateLimitEnabled?: boolean;

  @ApiPropertyOptional({ description: "速率限制时间窗口（毫秒）", example: 60000 })
  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  @IsOptional()
  rateLimitTimeWindow?: number;

  @ApiPropertyOptional({ description: "速率限制最大请求数", example: 100 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  rateLimitMax?: number;

  @ApiPropertyOptional({ description: "剩余请求次数" })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  remaining?: number;

  @ApiPropertyOptional({ description: "补充请求数量" })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  refillAmount?: number;

  @ApiPropertyOptional({ description: "补充间隔（毫秒）" })
  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  @IsOptional()
  refillInterval?: number;
}

/**
 * 更新 API Key 请求
 */
export class UpdateApiKeyDto {
  @ApiPropertyOptional({ description: "API Key 名称" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: "权限范围", type: [String] })
  @IsArray()
  @IsString({ each: true })
  @IsOptional()
  permissions?: string[];

  @ApiPropertyOptional({ description: "是否激活" })
  @IsBoolean()
  @IsOptional()
  isActive?: boolean;

  @ApiPropertyOptional({ description: "元数据" })
  @IsOptional()
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: "是否启用" })
  @IsBoolean()
  @IsOptional()
  enabled?: boolean;

  @ApiPropertyOptional({ description: "剩余请求次数" })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  remaining?: number;

  @ApiPropertyOptional({ description: "补充请求数量" })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  refillAmount?: number;

  @ApiPropertyOptional({ description: "补充间隔（毫秒）" })
  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  @IsOptional()
  refillInterval?: number;

  @ApiPropertyOptional({ description: "过期时间（秒）" })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  expiresIn?: number;

  @ApiPropertyOptional({ description: "是否启用速率限制" })
  @IsBoolean()
  @IsOptional()
  rateLimitEnabled?: boolean;

  @ApiPropertyOptional({ description: "速率限制时间窗口（毫秒）" })
  @Type(() => Number)
  @IsNumber()
  @Min(1000)
  @IsOptional()
  rateLimitTimeWindow?: number;

  @ApiPropertyOptional({ description: "速率限制最大请求数" })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  rateLimitMax?: number;
}

/**
 * API Key 响应
 */
export class ApiKeyResponse {
  @ApiProperty({ description: "API Key ID" })
  id!: string;

  @ApiProperty({ description: "名称" })
  name!: string;

  @ApiPropertyOptional({ description: "完整 Key（仅创建时返回）", nullable: true })
  key?: string;

  @ApiPropertyOptional({ description: "Key 前缀", nullable: true })
  prefix!: string | null;

  @ApiPropertyOptional({ description: "权限", type: [String], nullable: true })
  permissions!: string[] | null;

  @ApiProperty({ description: "是否激活" })
  isActive!: boolean;

  @ApiPropertyOptional({ description: "是否启用（向后兼容）" })
  enabled?: boolean;

  @ApiPropertyOptional({ description: "剩余请求次数", nullable: true })
  remaining?: number;

  @ApiPropertyOptional({ description: "是否启用速率限制" })
  rateLimitEnabled?: boolean;

  @ApiPropertyOptional({ description: "元数据", nullable: true })
  metadata?: Record<string, any>;

  @ApiPropertyOptional({ description: "过期时间", nullable: true })
  expiresAt!: Date | null;

  @ApiPropertyOptional({ description: "最后使用时间", nullable: true })
  lastUsedAt!: Date | null;

  @ApiProperty({ description: "创建时间" })
  createdAt!: Date;
}

/**
 * API Key 列表响应
 */
export class ApiKeyListResponse {
  @ApiProperty({ description: "操作是否成功" })
  success!: boolean;

  @ApiProperty({ description: "消息" })
  message!: string;

  @ApiProperty({ description: "API Key 列表", type: [ApiKeyResponse] })
  apiKeys!: ApiKeyResponse[];

  @ApiProperty({ description: "API Key 列表（别名）", type: [ApiKeyResponse] })
  keys!: ApiKeyResponse[];

  @ApiProperty({ description: "总数" })
  total!: number;
}
