/**
 * 用户角色枚举
 *
 * @description
 * Better Auth Admin 插件支持的角色类型
 */

/**
 * 用户角色
 */
export type UserRole = "user" | "admin" | "superadmin";

/**
 * 角色权限定义
 */
export const ROLE_PERMISSIONS: Record<UserRole, string[]> = {
  superadmin: [
    // 用户管理
    "user:create",
    "user:list",
    "user:set-role",
    "user:ban",
    "user:impersonate",
    "user:delete",
    // 会话管理
    "session:list",
    "session:revoke",
    "session:delete",
    // 组织管理
    "organization:create",
    "organization:read",
    "organization:update",
    "organization:delete",
  ],
  admin: [
    // 用户管理（不能删除用户）
    "user:create",
    "user:list",
    "user:set-role",
    "user:ban",
    "user:impersonate",
    // 会话管理
    "session:list",
    "session:revoke",
    // 组织管理（不能删除组织）
    "organization:create",
    "organization:read",
    "organization:update",
  ],
  user: [
    // 只能创建和查看组织
    "organization:create",
    "organization:read",
  ],
};

/**
 * 检查角色是否拥有指定权限
 *
 * @param role - 用户角色
 * @param permission - 权限标识（如 "user:create"）
 * @returns 是否拥有权限
 */
export function hasPermission(role: UserRole, permission: string): boolean {
  const permissions = ROLE_PERMISSIONS[role] || [];
  return permissions.includes(permission);
}

/**
 * 获取角色的所有权限
 *
 * @param role - 用户角色
 * @returns 权限列表
 */
export function getRolePermissions(role: UserRole): string[] {
  return ROLE_PERMISSIONS[role] || [];
}
