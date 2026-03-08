/**
 * Admin 插件请求类型定义
 */

export interface CreateAdminUserRequest {
  userId?: string;
  email: string;
  password: string;
  name?: string;
  role?: string;
  emailVerified?: boolean;
  image?: string;
}

export interface UpdateAdminUserRequest {
  userId: string;
  email?: string;
  name?: string;
  role?: string;
  emailVerified?: boolean;
  image?: string;
}

export interface ListUsersQuery {
  searchValue?: string;
  searchField?: string;
  searchOperator?: "contains" | "startsWith" | "endsWith";
  limit?: number;
  offset?: number;
  sortBy?: string;
  sortDirection?: "asc" | "desc";
}

export interface SetUserRoleRequest {
  userId: string;
  role: string;
}

export interface CheckPermissionRequest {
  userId: string;
  permissions: string | string[];
}

export interface BanUserRequest {
  userId: string;
  banReason?: string;
  banExpiresIn?: number; // 秒数
}

export interface UnbanUserRequest {
  userId: string;
}

export interface RevokeSessionRequest {
  sessionToken: string;
}

export interface ImpersonateUserRequest {
  userId: string;
  reason?: string;
}
