/**
 * Admin 管理功能 DTO
 *
 * @description
 * 定义 Better Auth Admin 插件的所有请求和响应类型
 */

import type { UserRole } from "./user-role.enum";

// ============================================
// 用户管理
// ============================================

/**
 * 创建用户请求
 */
export interface CreateAdminUserDto {
  email: string;
  password: string;
  name?: string;
  role?: UserRole;
  emailVerified?: boolean;
}

/**
 * 更新用户请求
 */
export interface UpdateAdminUserDto {
  name?: string;
  email?: string;
  role?: UserRole;
  emailVerified?: boolean;
  image?: string;
}

/**
 * 用户列表查询参数
 */
export interface ListUsersDto {
  searchValue?: string;
  searchField?: "email" | "name";
  searchOperator?: "contains" | "starts_with" | "ends_with";
  limit?: number;
  offset?: number;
  sortBy?: "createdAt" | "updatedAt" | "email" | "name";
  sortDirection?: "asc" | "desc";
}

/**
 * 用户响应
 */
export interface AdminUserResponse {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  role: UserRole;
  banned: boolean;
  banReason: string | null;
  bannedAt: Date | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 用户列表响应
 */
export interface AdminUserListResponse {
  users: AdminUserResponse[];
  total: number;
  limit: number;
  offset: number;
}

// ============================================
// 角色与权限
// ============================================

/**
 * 设置用户角色请求
 */
export interface SetUserRoleDto {
  role: UserRole;
}

/**
 * 检查权限请求
 */
export interface CheckPermissionDto {
  userId: string;
  permissions: Record<string, string[]>;
}

/**
 * 检查权限响应
 */
export interface CheckPermissionResponse {
  hasPermission: boolean;
  userId: string;
  permissions: Record<string, string[]>;
}

// ============================================
// 用户状态管理（封禁）
// ============================================

/**
 * 封禁用户请求
 */
export interface BanUserDto {
  banReason?: string;
  banExpiresIn?: number; // 秒数
}

/**
 * 解封用户响应
 */
export interface UnbanUserResponse {
  success: boolean;
  message: string;
  userId: string;
}

// ============================================
// 会话管理
// ============================================

/**
 * 会话信息
 */
export interface AdminSessionResponse {
  id: string;
  userId: string;
  token: string;
  expiresAt: Date;
  ipAddress: string | null;
  userAgent: string | null;
  createdAt: Date;
  updatedAt: Date;
}

/**
 * 会话列表响应
 */
export interface AdminSessionListResponse {
  sessions: AdminSessionResponse[];
  total: number;
}

/**
 * 撤销会话响应
 */
export interface RevokeSessionResponse {
  success: boolean;
  message: string;
  sessionToken: string;
}

// ============================================
// 用户模拟
// ============================================

/**
 * 用户模拟响应
 */
export interface AdminImpersonateResponse {
  success: boolean;
  message: string;
  session: {
    id: string;
    token: string;
    expiresAt: Date;
  };
  impersonatedUser: {
    id: string;
    email: string;
    name: string | null;
  };
}

/**
 * 停止模拟响应
 */
export interface StopImpersonatingResponse {
  success: boolean;
  message: string;
}
