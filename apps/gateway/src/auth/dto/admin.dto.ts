/**
 * Admin 管理功能 DTO
 *
 * @description
 * 定义 Better Auth Admin 插件的所有请求和响应类型
 */

import { ApiProperty, ApiPropertyOptional } from "@nestjs/swagger";
import { Type } from "class-transformer";
import {
  IsBoolean,
  IsEmail,
  IsEnum,
  IsNumber,
  IsObject,
  IsOptional,
  IsString,
  Max,
  Min,
} from "class-validator";

// ============================================
// 用户管理
// ============================================

/**
 * 创建用户请求
 */
export class CreateAdminUserDto {
  @ApiProperty({ description: "用户邮箱", example: "admin@example.com" })
  @IsEmail({}, { message: "邮箱格式不正确" })
  email!: string;

  @ApiProperty({ description: "用户密码", example: "SecurePass123!" })
  @IsString()
  password!: string;

  @ApiPropertyOptional({ description: "用户名", example: "系统管理员" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({
    description: "用户角色",
    enum: ["user", "admin", "superadmin"],
    example: "admin",
    default: "user",
  })
  @IsEnum(["user", "admin", "superadmin"])
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ description: "邮箱是否已验证", example: true, default: false })
  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean;
}

/**
 * 更新用户请求
 */
export class UpdateAdminUserDto {
  @ApiPropertyOptional({ description: "用户名" })
  @IsString()
  @IsOptional()
  name?: string;

  @ApiPropertyOptional({ description: "用户邮箱" })
  @IsEmail()
  @IsOptional()
  email?: string;

  @ApiPropertyOptional({ description: "用户角色", enum: ["user", "admin", "superadmin"] })
  @IsEnum(["user", "admin", "superadmin"])
  @IsOptional()
  role?: string;

  @ApiPropertyOptional({ description: "邮箱是否已验证" })
  @IsBoolean()
  @IsOptional()
  emailVerified?: boolean;

  @ApiPropertyOptional({ description: "用户头像 URL" })
  @IsString()
  @IsOptional()
  image?: string;
}

/**
 * 用户列表查询参数
 */
export class ListUsersDto {
  @ApiPropertyOptional({ description: "搜索关键词" })
  @IsString()
  @IsOptional()
  searchValue?: string;

  @ApiPropertyOptional({ description: "搜索字段", enum: ["email", "name"], default: "email" })
  @IsEnum(["email", "name"])
  @IsOptional()
  searchField?: "email" | "name";

  @ApiPropertyOptional({
    description: "搜索操作符",
    enum: ["contains", "starts_with", "ends_with"],
    default: "contains",
  })
  @IsEnum(["contains", "starts_with", "ends_with"])
  @IsOptional()
  searchOperator?: "contains" | "starts_with" | "ends_with";

  @ApiPropertyOptional({ description: "每页数量", default: 100, minimum: 1, maximum: 1000 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @Max(1000)
  @IsOptional()
  limit?: number;

  @ApiPropertyOptional({ description: "偏移量", default: 0, minimum: 0 })
  @Type(() => Number)
  @IsNumber()
  @Min(0)
  @IsOptional()
  offset?: number;

  @ApiPropertyOptional({
    description: "排序字段",
    enum: ["createdAt", "updatedAt", "email", "name"],
    default: "createdAt",
  })
  @IsEnum(["createdAt", "updatedAt", "email", "name"])
  @IsOptional()
  sortBy?: "createdAt" | "updatedAt" | "email" | "name";

  @ApiPropertyOptional({ description: "排序方向", enum: ["asc", "desc"], default: "desc" })
  @IsEnum(["asc", "desc"])
  @IsOptional()
  sortDirection?: "asc" | "desc";
}

/**
 * 用户响应
 */
export class AdminUserResponse {
  @ApiProperty({ description: "用户 ID" })
  id!: string;

  @ApiProperty({ description: "用户邮箱" })
  email!: string;

  @ApiPropertyOptional({ description: "用户名", nullable: true })
  name!: string | null;

  @ApiPropertyOptional({ description: "用户头像", nullable: true })
  image!: string | null;

  @ApiProperty({ description: "邮箱是否已验证" })
  emailVerified!: boolean;

  @ApiProperty({ description: "用户角色", enum: ["user", "admin", "superadmin"] })
  role!: string;

  @ApiProperty({ description: "是否被封禁" })
  banned!: boolean;

  @ApiPropertyOptional({ description: "封禁原因", nullable: true })
  banReason!: string | null;

  @ApiPropertyOptional({ description: "封禁时间", nullable: true })
  bannedAt!: Date | null;

  @ApiPropertyOptional({ description: "封禁过期时间", nullable: true })
  banExpires!: Date | null;

  @ApiProperty({ description: "创建时间" })
  createdAt!: Date;

  @ApiProperty({ description: "更新时间" })
  updatedAt!: Date;
}

/**
 * 用户列表响应
 */
export class AdminUserListResponse {
  @ApiProperty({ description: "用户列表", type: [AdminUserResponse] })
  users!: AdminUserResponse[];

  @ApiProperty({ description: "总数" })
  total!: number;

  @ApiProperty({ description: "每页数量" })
  limit!: number;

  @ApiProperty({ description: "偏移量" })
  offset!: number;
}

// ============================================
// 角色与权限
// ============================================

/**
 * 设置用户角色请求
 */
export class SetUserRoleDto {
  @ApiProperty({ description: "用户角色", enum: ["user", "admin", "superadmin"] })
  @IsEnum(["user", "admin", "superadmin"])
  role!: string;
}

/**
 * 检查权限请求
 */
export class CheckPermissionDto {
  @ApiProperty({ description: "用户 ID" })
  @IsString()
  userId!: string;

  @ApiProperty({ description: "权限配置", example: { user: ["create", "list"] } })
  @IsObject()
  permissions!: Record<string, string[]>;
}

/**
 * 检查权限响应
 */
export class CheckPermissionResponse {
  @ApiProperty({ description: "是否拥有权限" })
  hasPermission!: boolean;

  @ApiProperty({ description: "用户 ID" })
  userId!: string;

  @ApiProperty({ description: "权限配置" })
  permissions!: Record<string, string[]>;
}

// ============================================
// 用户状态管理（封禁）
// ============================================

/**
 * 封禁用户请求（重命名为 BanUserDto 以匹配控制器）
 */
export class BanUserDto {
  @ApiPropertyOptional({ description: "封禁原因", example: "违反服务条款" })
  @IsString()
  @IsOptional()
  banReason?: string;

  @ApiPropertyOptional({ description: "封禁时长（秒）", example: 86400, minimum: 1 })
  @Type(() => Number)
  @IsNumber()
  @Min(1)
  @IsOptional()
  banExpiresIn?: number;
}

/**
 * 解封用户响应
 */
export class UnbanUserResponse {
  @ApiProperty({ description: "操作是否成功" })
  success!: boolean;

  @ApiProperty({ description: "消息" })
  message!: string;

  @ApiProperty({ description: "用户 ID" })
  userId!: string;
}

// ============================================
// 会话管理
// ============================================

/**
 * 会话信息
 */
export class AdminSessionResponse {
  @ApiProperty({ description: "会话 ID" })
  id!: string;

  @ApiProperty({ description: "用户 ID" })
  userId!: string;

  @ApiProperty({ description: "会话 Token" })
  token!: string;

  @ApiProperty({ description: "过期时间" })
  expiresAt!: Date;

  @ApiPropertyOptional({ description: "IP 地址", nullable: true })
  ipAddress!: string | null;

  @ApiPropertyOptional({ description: "User Agent", nullable: true })
  userAgent!: string | null;

  @ApiProperty({ description: "创建时间" })
  createdAt!: Date;

  @ApiProperty({ description: "更新时间" })
  updatedAt!: Date;
}

/**
 * 会话列表响应
 */
export class AdminSessionListResponse {
  @ApiProperty({ description: "会话列表", type: [AdminSessionResponse] })
  sessions!: AdminSessionResponse[];

  @ApiProperty({ description: "总数" })
  total!: number;
}

/**
 * 撤销会话响应
 */
export class RevokeSessionResponse {
  @ApiProperty({ description: "操作是否成功" })
  success!: boolean;

  @ApiProperty({ description: "消息" })
  message!: string;

  @ApiProperty({ description: "会话 Token" })
  sessionToken!: string;
}

// ============================================
// 用户模拟
// ============================================

/**
 * 用户模拟响应
 */
export class AdminImpersonateResponse {
  @ApiProperty({ description: "操作是否成功" })
  success!: boolean;

  @ApiProperty({ description: "消息" })
  message!: string;

  @ApiProperty({
    description: "模拟会话信息",
    example: {
      id: "session-id",
      token: "session-token",
      expiresAt: "2026-03-13T00:00:00Z",
    },
  })
  session!: {
    id: string;
    token: string;
    expiresAt: Date;
  };

  @ApiProperty({
    description: "被模拟用户信息",
    example: {
      id: "user-id",
      email: "user@example.com",
      name: "John Doe",
    },
  })
  impersonatedUser!: {
    id: string;
    email: string;
    name: string | null;
  };
}

/**
 * 停止模拟响应
 */
export class StopImpersonatingResponse {
  @ApiProperty({ description: "操作是否成功" })
  success!: boolean;

  @ApiProperty({ description: "消息" })
  message!: string;
}
