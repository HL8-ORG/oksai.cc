/**
 * Better Auth 插件 API 类型定义
 *
 * @description
 * 为 Better Auth 插件提供 TypeScript 类型定义
 * 这些类型基于 Better Auth 官方插件 API
 */

/**
 * Better Auth 基础 API
 */
export interface BaseAuthAPI {
  getSession: (options: { headers: Headers }) => Promise<any>;
  signIn: (options: any) => Promise<any>;
  signOut: (options: any) => Promise<any>;
  signUp: (options: any) => Promise<any>;
}

/**
 * Better Auth Organization 插件 API
 *
 * @see https://better-auth.com/docs/plugins/organization
 */
export interface OrganizationAuthAPI {
  // 组织管理
  createOrganization: (options: { name: string; slug?: string; logo?: string; userId: string }) => Promise<{
    id: string;
    name: string;
    slug: string;
    logo?: string;
    createdAt: Date;
  }>;

  getOrganization: (options: { organizationId: string; headers?: Headers }) => Promise<{
    id: string;
    name: string;
    slug: string;
    logo?: string;
    createdAt: Date;
    metadata?: Record<string, any>;
  }>;

  listOrganizations: (options: { userId: string; headers?: Headers }) => Promise<
    Array<{
      id: string;
      name: string;
      slug: string;
      logo?: string;
      createdAt: Date;
    }>
  >;

  updateOrganization: (options: {
    organizationId: string;
    data: {
      name?: string;
      slug?: string;
      logo?: string;
    };
    headers?: Headers;
  }) => Promise<{
    id: string;
    name: string;
    slug: string;
    logo?: string;
  }>;

  deleteOrganization: (options: { organizationId: string; headers?: Headers }) => Promise<void>;

  // 成员管理
  inviteMember: (options: {
    email: string;
    organizationId: string;
    role?: string;
    headers?: Headers;
  }) => Promise<{
    id: string;
    email: string;
    organizationId: string;
    role: string;
    status: string;
    expiresAt: Date;
  }>;

  acceptInvitation: (options: { invitationId: string; headers?: Headers }) => Promise<{
    id: string;
    organizationId: string;
    userId: string;
    role: string;
  }>;

  rejectInvitation: (options: { invitationId: string; headers?: Headers }) => Promise<void>;

  listInvitations: (options: { organizationId: string; headers?: Headers }) => Promise<
    Array<{
      id: string;
      email: string;
      organizationId: string;
      role: string;
      status: string;
      expiresAt: Date;
    }>
  >;

  removeMember: (options: { memberId: string; organizationId: string; headers?: Headers }) => Promise<void>;

  updateMemberRole: (options: {
    memberId: string;
    organizationId: string;
    role: string;
    headers?: Headers;
  }) => Promise<{
    id: string;
    organizationId: string;
    userId: string;
    role: string;
  }>;

  listMembers: (options: { organizationId: string; headers?: Headers }) => Promise<
    Array<{
      id: string;
      organizationId: string;
      userId: string;
      role: string;
      user: {
        id: string;
        email: string;
        name?: string;
        image?: string;
      };
    }>
  >;

  // 活动组织
  setActiveOrganization: (options: { organizationId: string; headers?: Headers }) => Promise<{
    id: string;
    organizationId: string;
    userId: string;
  }>;

  // 辅助方法
  getActiveMember?: (options: { headers: Headers }) => Promise<{
    id: string;
    organizationId: string;
    userId: string;
    role: string;
  } | null>;

  getActiveMemberRole?: (options: { headers: Headers }) => Promise<{
    role: string;
  } | null>;
}

/**
 * Better Auth Admin 插件 API
 *
 * @see https://better-auth.com/docs/plugins/admin
 */
export interface AdminAuthAPI {
  /**
   * 设置用户角色
   */
  setUserRole: (options: { userId: string; role: string; headers?: Headers }) => Promise<{
    id: string;
    role: string;
  }>;

  /**
   * 获取所有用户
   */
  listUsers: (options?: { limit?: number; offset?: number; headers?: Headers }) => Promise<
    Array<{
      id: string;
      email: string;
      name?: string;
      role?: string;
      createdAt: Date;
    }>
  >;

  /**
   * 删除用户
   */
  deleteUser: (options: { userId: string; headers?: Headers }) => Promise<void>;

  /**
   * 禁用用户
   */
  banUser: (options: { userId: string; headers?: Headers }) => Promise<void>;

  /**
   * 启用用户
   */
  unbanUser: (options: { userId: string; headers?: Headers }) => Promise<void>;
}

/**
 * Better Auth Two-Factor 插件 API
 *
 * @see https://better-auth.com/docs/plugins/2fa
 */
export interface TwoFactorAuthAPI {
  /**
   * 启用双因素认证
   */
  enable2FA: (options: { headers?: Headers }) => Promise<{
    backupCodes: string[];
    totpURI: string;
  }>;

  /**
   * 禁用双因素认证
   */
  disable2FA: (options: { code: string; headers?: Headers }) => Promise<void>;

  /**
   * 验证双因素认证
   */
  verify2FA: (options: { code: string; headers?: Headers }) => Promise<{ valid: boolean }>;
}

/**
 * 完整的 Better Auth API 类型
 *
 * @description
 * 包含所有插件的 API 方法
 */
export type BetterAuthAPI = BaseAuthAPI &
  Partial<OrganizationAuthAPI> &
  Partial<AdminAuthAPI> &
  Partial<TwoFactorAuthAPI>;

/**
 * 判断是否启用了 organization 插件
 */
export function hasOrganizationPlugin(api: BetterAuthAPI): api is BetterAuthAPI & OrganizationAuthAPI {
  return typeof (api as OrganizationAuthAPI).createOrganization === "function";
}

/**
 * 判断是否启用了 admin 插件
 */
export function hasAdminPlugin(api: BetterAuthAPI): api is BetterAuthAPI & AdminAuthAPI {
  return typeof (api as AdminAuthAPI).setUserRole === "function";
}

/**
 * 判断是否启用了 twoFactor 插件
 */
export function hasTwoFactorPlugin(api: BetterAuthAPI): api is BetterAuthAPI & TwoFactorAuthAPI {
  return typeof (api as TwoFactorAuthAPI).enable2FA === "function";
}
