/**
 * 租户管理 DTO
 *
 * @description
 * 定义租户管理的所有请求和响应类型
 */

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import { IsEnum, IsNumber, IsOptional, IsString, Matches, Max, Min } from "class-validator";

// ============================================
// 枚举定义
// ============================================

/**
 * 租户套餐类型
 */
export enum TenantPlan {
  FREE = "FREE",
  STARTER = "STARTER",
  PRO = "PRO",
  ENTERPRISE = "ENTERPRISE",
}

/**
 * 租户状态
 */
export enum TenantStatus {
  PENDING = "PENDING",
  ACTIVE = "ACTIVE",
  SUSPENDED = "SUSPENDED",
  DELETED = "DELETED",
}

// ============================================
// 创建租户
// ============================================

/**
 * 创建租户请求
 */
export class CreateTenantDto {
  @ApiProperty({ description: "租户名称", example: "企业A" })
  @IsString()
  name!: string;

  @ApiProperty({
    description: "租户标识（用于 URL，只能包含小写字母、数字和连字符）",
    example: "enterprise-a",
  })
  @Matches(/^[a-z0-9-]+$/, { message: "slug 只能包含小写字母、数字和连字符" })
  @IsString()
  slug!: string;

  @ApiProperty({
    description: "租户套餐",
    enum: TenantPlan,
    example: TenantPlan.PRO,
  })
  @IsEnum(TenantPlan)
  plan!: TenantPlan;

  @ApiProperty({ description: "所有者用户 ID", example: "user-123" })
  @IsString()
  ownerId!: string;

  @ApiPropertyOptional({
    description: "最大组织数量",
    example: 10,
    default: 1,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxOrganizations?: number;

  @ApiPropertyOptional({
    description: "最大成员数量",
    example: 100,
    default: 10,
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxMembers?: number;

  @ApiPropertyOptional({
    description: "最大存储空间（字节）",
    example: 107374182400, // 100GB
    default: 1073741824, // 1GB
    minimum: 1,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxStorage?: number;
}

// ============================================
// 更新租户
// ============================================

/**
 * 更新租户请求
 */
export class UpdateTenantDto {
  @ApiPropertyOptional({ description: "租户名称" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: "租户标识" })
  @Matches(/^[a-z0-9-]+$/, { message: "slug 只能包含小写字母、数字和连字符" })
  @IsString()
  @IsOptional()
  slug?: string;

  @ApiPropertyOptional({ description: "租户套餐", enum: TenantPlan })
  @IsEnum(TenantPlan)
  @IsOptional()
  plan?: TenantPlan;

  @ApiPropertyOptional({ description: "最大组织数量", minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxOrganizations?: number;

  @ApiPropertyOptional({ description: "最大成员数量", minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxMembers?: number;

  @ApiPropertyOptional({ description: "最大存储空间（字节）", minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  maxStorage?: number;
}

// ============================================
// 停用租户
// ============================================

/**
 * 停用租户请求
 */
export class SuspendTenantDto {
  @ApiProperty({ description: "停用原因", example: "违反服务条款" })
  @IsString()
  reason!: string;
}

// ============================================
// 查询租户列表
// ============================================

/**
 * 租户列表查询参数
 */
export class ListTenantsDto {
  @ApiPropertyOptional({ description: "搜索关键词（名称或 slug）" })
  @IsString()
  @IsOptional()
  search?: string;

  @ApiPropertyOptional({
    description: "租户状态",
    enum: TenantStatus,
  })
  @IsEnum(TenantStatus)
  @IsOptional()
  status?: TenantStatus;

  @ApiPropertyOptional({
    description: "租户套餐",
    enum: TenantPlan,
  })
  @IsEnum(TenantPlan)
  @IsOptional()
  plan?: TenantPlan;

  @ApiPropertyOptional({
    description: "每页数量",
    default: 20,
    minimum: 1,
    maximum: 100,
  })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(100)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: "页码", default: 1, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  page?: number;
}

// ============================================
// 响应类型
// ============================================

/**
 * 租户配额信息
 */
export class TenantQuotaResponse {
  @ApiProperty({ description: "最大组织数量" })
  maxOrganizations!: number;

  @ApiProperty({ description: "最大成员数量" })
  maxMembers!: number;

  @ApiProperty({ description: "最大存储空间（字节）" })
  maxStorage!: number;
}

/**
 * 租户使用情况
 */
export class TenantUsageResponse {
  @ApiProperty({ description: "当前组织数量" })
  organizations!: number;

  @ApiProperty({ description: "当前成员数量" })
  members!: number;

  @ApiProperty({ description: "当前存储使用量（字节）" })
  storage!: number;
}

/**
 * 租户详情响应
 */
export class TenantResponse {
  @ApiProperty({ description: "租户 ID" })
  id!: string;

  @ApiProperty({ description: "租户名称" })
  name!: string;

  @ApiProperty({ description: "租户标识" })
  slug!: string;

  @ApiProperty({ description: "租户套餐", enum: TenantPlan })
  plan!: string;

  @ApiProperty({ description: "租户状态", enum: TenantStatus })
  status!: string;

  @ApiProperty({ description: "所有者用户 ID" })
  ownerId!: string;

  @ApiProperty({ description: "配额信息", type: TenantQuotaResponse })
  quota!: TenantQuotaResponse;

  @ApiPropertyOptional({ description: "使用情况", type: TenantUsageResponse })
  usage?: TenantUsageResponse;

  @ApiProperty({ description: "创建时间" })
  createdAt!: Date;

  @ApiProperty({ description: "更新时间" })
  updatedAt!: Date;
}

/**
 * 租户列表响应
 */
export class TenantListResponse {
  @ApiProperty({ description: "租户列表", type: [TenantResponse] })
  data!: TenantResponse[];

  @ApiProperty({ description: "总数" })
  total!: number;

  @ApiProperty({ description: "当前页码" })
  page!: number;

  @ApiProperty({ description: "每页数量" })
  limit!: number;
}

/**
 * 操作成功响应
 */
export class TenantActionResponse {
  @ApiProperty({ description: "操作是否成功" })
  success!: boolean;

  @ApiProperty({ description: "消息" })
  message!: string;

  @ApiPropertyOptional({ description: "租户信息", type: TenantResponse })
  tenant?: TenantResponse;
}

/**
 * 租户使用情况响应（详情）
 */
export class TenantUsageDetailResponse {
  @ApiProperty({ description: "配额信息", type: TenantQuotaResponse })
  quota!: TenantQuotaResponse;

  @ApiProperty({ description: "使用情况", type: TenantUsageResponse })
  usage!: TenantUsageResponse;

  @ApiProperty({
    description: "可用配额",
    example: { organizations: 5, members: 52, storage: 53687091200 },
  })
  available!: {
    organizations: number;
    members: number;
    storage: number;
  };
}
