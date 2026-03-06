/**
 * Better Auth Admin 插件 API 类型定义
 */

import type { BetterAuthRequestOptions } from "./base.types";
import type {
  BanUserRequest,
  CheckPermissionRequest,
  CreateAdminUserRequest,
  ImpersonateUserRequest,
  ListUsersQuery,
  RevokeSessionRequest,
  SetUserRoleRequest,
  UnbanUserRequest,
  UpdateAdminUserRequest,
} from "./requests/admin.requests";
import type {
  AdminPermissionResponse,
  AdminSessionListResponse,
  AdminUserListResponse,
  AdminUserResponse,
  BanUserResponse,
  ImpersonateUserResponse,
  RevokeSessionResponse,
  SetRoleResponse,
  StopImpersonatingResponse,
  UnbanUserResponse,
} from "./responses/admin.responses";

/**
 * Better Auth Admin 插件 API 接口
 *
 * @see https://better-auth.com/docs/plugins/admin
 */
export interface AdminAPI {
  /**
   * 列出所有用户
   */
  listUsers: (
    options?: BetterAuthRequestOptions & {
      query?: ListUsersQuery;
    }
  ) => Promise<AdminUserListResponse>;

  /**
   * 获取单个用户
   */
  getUser: (
    options: BetterAuthRequestOptions & {
      query: { userId: string };
    }
  ) => Promise<AdminUserResponse>;

  /**
   * 创建用户
   */
  createUser: (
    options: BetterAuthRequestOptions & {
      body: CreateAdminUserRequest;
    }
  ) => Promise<AdminUserResponse>;

  /**
   * 更新用户
   */
  updateUser: (
    options: BetterAuthRequestOptions & {
      body: UpdateAdminUserRequest;
    }
  ) => Promise<AdminUserResponse>;

  /**
   * 删除用户
   */
  removeUser: (
    options: BetterAuthRequestOptions & {
      body: { userId: string };
    }
  ) => Promise<void>;

  /**
   * 设置用户角色
   */
  setRole: (
    options: BetterAuthRequestOptions & {
      body: SetUserRoleRequest;
    }
  ) => Promise<SetRoleResponse>;

  /**
   * 检查用户权限
   */
  userHasPermission: (
    options: BetterAuthRequestOptions & {
      body: CheckPermissionRequest;
    }
  ) => Promise<AdminPermissionResponse>;

  /**
   * 封禁用户
   */
  banUser: (
    options: BetterAuthRequestOptions & {
      body: BanUserRequest;
    }
  ) => Promise<BanUserResponse>;

  /**
   * 解封用户
   */
  unbanUser: (
    options: BetterAuthRequestOptions & {
      body: UnbanUserRequest;
    }
  ) => Promise<UnbanUserResponse>;

  /**
   * 列出用户会话
   */
  listUserSessions: (
    options: BetterAuthRequestOptions & {
      body: { userId: string };
    }
  ) => Promise<AdminSessionListResponse>;

  /**
   * 撤销用户会话
   */
  revokeUserSession: (
    options: BetterAuthRequestOptions & {
      body: RevokeSessionRequest;
    }
  ) => Promise<RevokeSessionResponse>;

  /**
   * 模拟用户
   */
  impersonateUser: (
    options: BetterAuthRequestOptions & {
      body: ImpersonateUserRequest;
    }
  ) => Promise<ImpersonateUserResponse>;

  /**
   * 停止模拟
   */
  stopImpersonating: (options: BetterAuthRequestOptions) => Promise<StopImpersonatingResponse>;
}
