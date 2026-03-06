/**
 * Admin 插件响应类型定义
 */

export interface AdminUserResponse {
  id: string;
  email: string;
  name: string | null;
  image: string | null;
  emailVerified: boolean;
  role: string;
  banned: boolean;
  banReason: string | null;
  bannedAt: Date | null;
  banExpires: Date | null;
  createdAt: Date;
  updatedAt: Date;
}

export interface AdminUserListResponse {
  users: AdminUserResponse[];
  total: number;
}

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

export interface AdminSessionListResponse {
  sessions: AdminSessionResponse[];
}

export interface AdminPermissionResponse {
  hasPermission: boolean;
}

export interface SetRoleResponse {
  id: string;
  role: string;
}

export interface BanUserResponse {
  id: string;
  banned: boolean;
  banReason?: string;
  bannedAt: Date;
  banExpires?: Date;
}

export interface UnbanUserResponse {
  id: string;
  banned: boolean;
}

export interface RevokeSessionResponse {
  success: boolean;
  message: string;
}

export interface ImpersonateUserResponse {
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

export interface StopImpersonatingResponse {
  success: boolean;
  message: string;
}
