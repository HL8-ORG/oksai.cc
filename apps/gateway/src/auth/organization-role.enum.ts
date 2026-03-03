/**
 * 组织角色和权限定义
 */

/**
 * 组织角色枚举
 *
 * @description
 * 基于 Better Auth Organization Plugin 的角色系统
 * - owner: 组织所有者，拥有所有权限
 * - admin: 管理员，可以管理成员和大部分设置
 * - member: 普通成员，可以访问组织资源
 */
export enum OrganizationRole {
  OWNER = "owner",
  ADMIN = "admin",
  MEMBER = "member",
}

/**
 * 组织权限枚举
 *
 * @description
 * 定义组织内的各种操作权限
 */
export enum OrganizationPermission {
  // 组织管理
  UPDATE_ORGANIZATION = "update:organization",
  DELETE_ORGANIZATION = "delete:organization",

  // 成员管理
  INVITE_MEMBER = "invite:member",
  REMOVE_MEMBER = "remove:member",
  UPDATE_MEMBER_ROLE = "update:member_role",
  LIST_MEMBERS = "list:members",

  // 邀请管理
  CANCEL_INVITATION = "cancel:invitation",
  LIST_INVITATIONS = "list:invitations",

  // 团队管理（如果支持）
  CREATE_TEAM = "create:team",
  UPDATE_TEAM = "update:team",
  DELETE_TEAM = "delete:team",
}

/**
 * 角色权限映射
 *
 * @description
 * 定义每个角色拥有的权限
 */
export const ROLE_PERMISSIONS: Record<OrganizationRole, Set<OrganizationPermission>> = {
  [OrganizationRole.OWNER]: new Set([
    // 组织管理（所有权限）
    OrganizationPermission.UPDATE_ORGANIZATION,
    OrganizationPermission.DELETE_ORGANIZATION,

    // 成员管理（所有权限）
    OrganizationPermission.INVITE_MEMBER,
    OrganizationPermission.REMOVE_MEMBER,
    OrganizationPermission.UPDATE_MEMBER_ROLE,
    OrganizationPermission.LIST_MEMBERS,

    // 邀请管理（所有权限）
    OrganizationPermission.CANCEL_INVITATION,
    OrganizationPermission.LIST_INVITATIONS,

    // 团队管理（所有权限）
    OrganizationPermission.CREATE_TEAM,
    OrganizationPermission.UPDATE_TEAM,
    OrganizationPermission.DELETE_TEAM,
  ]),

  [OrganizationRole.ADMIN]: new Set([
    // 组织管理（部分权限）
    OrganizationPermission.UPDATE_ORGANIZATION,

    // 成员管理（大部分权限）
    OrganizationPermission.INVITE_MEMBER,
    OrganizationPermission.REMOVE_MEMBER,
    OrganizationPermission.UPDATE_MEMBER_ROLE,
    OrganizationPermission.LIST_MEMBERS,

    // 邀请管理（所有权限）
    OrganizationPermission.CANCEL_INVITATION,
    OrganizationPermission.LIST_INVITATIONS,

    // 团队管理（所有权限）
    OrganizationPermission.CREATE_TEAM,
    OrganizationPermission.UPDATE_TEAM,
    OrganizationPermission.DELETE_TEAM,
  ]),

  [OrganizationRole.MEMBER]: new Set([
    // 成员管理（只读权限）
    OrganizationPermission.LIST_MEMBERS,
  ]),
};

/**
 * 检查角色是否拥有指定权限
 *
 * @param role - 组织角色
 * @param permission - 权限
 * @returns 是否拥有权限
 */
export function hasPermission(role: OrganizationRole, permission: OrganizationPermission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  return permissions?.has(permission) ?? false;
}

/**
 * 获取角色的所有权限
 *
 * @param role - 组织角色
 * @returns 权限列表
 */
export function getRolePermissions(role: OrganizationRole): OrganizationPermission[] {
  const permissions = ROLE_PERMISSIONS[role];
  if (permissions) {
    return Array.from(permissions);
  }
  return [];
}
