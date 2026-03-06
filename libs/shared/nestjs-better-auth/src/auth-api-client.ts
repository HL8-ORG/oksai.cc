/**
 * Better Auth API 客户端
 *
 * @description
 * 为 Better Auth API 提供类型安全的客户端封装
 */

import type { BetterAuthAPI } from "./better-auth-types";

/**
 * Better Auth API 客户端类
 *
 * 提供类型安全的方法包装，避免直接使用 (auth.api as any)
 */
export class BetterAuthApiClient {
  constructor(private readonly api: BetterAuthAPI) {}

  /**
   * 获取认证头
   */
  private getAuthHeaders(token: string): Record<string, string> {
    return {
      authorization: `Bearer ${token}`,
    };
  }

  // ============================================
  // 基础认证方法
  // ============================================

  /**
   * 用户注册
   */
  async signUpEmail(options: any): Promise<any> {
    return (this.api as any).signUpEmail({
      body: options,
    });
  }

  /**
   * 用户登录
   */
  async signInEmail(options: any): Promise<any> {
    return (this.api as any).signInEmail({
      body: options,
    });
  }

  /**
   * 验证邮箱
   */
  async verifyEmail(options: any): Promise<any> {
    return (this.api as any).verifyEmail({
      body: options,
    });
  }

  /**
   * 忘记密码
   */
  async forgotPassword(options: any): Promise<any> {
    return (this.api as any).forgotPassword({
      body: options,
    });
  }

  /**
   * 重置密码
   */
  async resetPassword(options: any): Promise<any> {
    return (this.api as any).resetPassword({
      body: options,
    });
  }

  /**
   * Magic Link
   */
  async sendMagicLink(options: any): Promise<any> {
    return (this.api as any).sendMagicLink({
      body: options,
    });
  }

  /**
   * 启用双因素认证
   */
  async enableTwoFactor(options: any, token: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).enableTwoFactor({
      body: options,
      headers,
    });
  }

  /**
   * 验证双因素认证
   */
  async verifyTwoFactor(options: any, token: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).verifyTwoFactor({
      body: options,
      headers,
    });
  }

  /**
   * 禁用双因素认证
   */
  async disableTwoFactor(options: any, token: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).disableTwoFactor({
      body: options,
      headers,
    });
  }

  /**
   * 获取会话
   */
  async getSession(token: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).getSession({
      headers,
    });
  }

  /**
   * 登出
   */
  async signOut(token: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).signOut({
      headers,
    });
  }

  // ============================================
  // Admin 插件方法
  // ============================================

  /**
   * 列出用户
   */
  async listUsers(options?: any): Promise<any> {
    return (this.api as any).listUsers({
      query: options || {},
    });
  }

  /**
   * 列出用户（带认证）
   */
  async listUsersWithAuth(options: any, token: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).listUsers({
      query: options,
      headers,
    });
  }

  /**
   * 获取用户
   */
  async getUser(userId: string, token: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).getUser({
      query: { userId },
      headers,
    });
  }

  /**
   * 创建用户
   */
  async createUser(userData: any, token: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).createUser({
      body: userData,
      headers,
    });
  }

  /**
   * 更新用户
   */
  async updateUser(userData: any, token: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).updateUser({
      body: userData,
      headers,
    });
  }

  /**
   * 删除用户
   */
  async removeUser(userId: string, token: string): Promise<void> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).removeUser({
      body: { userId },
      headers,
    });
  }

  /**
   * 设置用户角色
   */
  async setRole(userId: string, role: string, token: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).setRole({
      body: { userId, role },
      headers,
    });
  }

  /**
   * 检查用户权限
   */
  async userHasPermission(userId: string, permissions: any, token: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).userHasPermission({
      body: { userId, permissions },
      headers,
    });
  }

  /**
   * 封禁用户
   */
  async banUser(userId: string, token: string, banReason?: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).banUser({
      body: { userId, banReason },
      headers,
    });
  }

  /**
   * 解封用户
   */
  async unbanUser(userId: string, token: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).unbanUser({
      body: { userId },
      headers,
    });
  }

  /**
   * 列出用户会话
   */
  async listUserSessions(userId: string, token: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).listUserSessions({
      body: { userId },
      headers,
    });
  }

  /**
   * 撤销用户会话
   */
  async revokeUserSession(sessionToken: string, token: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).revokeUserSession({
      body: { sessionToken },
      headers,
    });
  }

  /**
   * 模拟用户
   */
  async impersonateUser(userId: string, token: string, reason?: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).impersonateUser({
      body: { userId, reason },
      headers,
    });
  }

  /**
   * 停止模拟
   */
  async stopImpersonating(token: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).stopImpersonating({
      headers,
    });
  }

  // ============================================
  // API Key 插件方法
  // ============================================

  /**
   * 创建 API Key
   */
  async createApiKey(userId: string, data: any, token: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).createApiKey({
      body: { userId, ...data },
      headers,
    });
  }

  /**
   * 列出 API Keys
   */
  async listApiKeys(options?: any, token?: string): Promise<any> {
    const headers = token ? this.getAuthHeaders(token) : undefined;
    return (this.api as any).listApiKeys({
      query: options || {},
      headers,
    });
  }

  /**
   * 获取 API Key
   */
  async getApiKey(id: string, token: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).getApiKey({
      query: { id },
      headers,
    });
  }

  /**
   * 更新 API Key
   */
  async updateApiKey(data: any, token: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).updateApiKey({
      body: data,
      headers,
    });
  }

  /**
   * 删除 API Key
   */
  async deleteApiKey(keyId: string, token: string): Promise<void> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).deleteApiKey({
      body: { keyId },
      headers,
    });
  }

  /**
   * 验证 API Key
   */
  async verifyApiKey(key: string): Promise<any> {
    return (this.api as any).verifyApiKey({
      body: { key },
    });
  }

  // ============================================
  // Session 管理方法
  // ============================================

  /**
   * 列出活跃会话
   */
  async listActiveSessions(userId: string, currentSessionToken?: string, token?: string): Promise<any> {
    const headers = token ? this.getAuthHeaders(token) : undefined;
    return (this.api as any).listActiveSessions({
      query: { userId, currentSessionToken },
      headers,
    });
  }

  /**
   * 获取会话配置
   */
  async getSessionConfig(userId?: string, token?: string): Promise<any> {
    const headers = token ? this.getAuthHeaders(token) : undefined;
    return (this.api as any).getSessionConfig({
      query: userId ? { userId } : {},
      headers,
    });
  }

  /**
   * 更新会话配置
   */
  async updateSessionConfig(config: any, token?: string): Promise<any> {
    const headers = token ? this.getAuthHeaders(token) : undefined;
    return (this.api as any).updateSessionConfig({
      body: config,
      headers,
    });
  }

  /**
   * 撤销会话
   */
  async revokeSession(sessionToken: string, token: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).revokeSession({
      body: { sessionToken },
      headers,
    });
  }

  /**
   * 撤销所有会话
   */
  async revokeAllSessions(userId: string, token: string): Promise<any> {
    const headers = this.getAuthHeaders(token);
    return (this.api as any).revokeAllSessions({
      body: { userId },
      headers,
    });
  }

  // ============================================
  // Organization 插件方法
  // ============================================

  /**
   * 创建组织
   */
  async createOrganization(data: any, userId: string): Promise<any> {
    return (this.api as any).createOrganization({
      body: data,
      headers: {
        "x-user-id": userId,
      },
    });
  }

  /**
   * 获取组织
   */
  async getOrganization(organizationId: string, userId: string): Promise<any> {
    return (this.api as any).getOrganization({
      query: { organizationId },
      headers: {
        "x-user-id": userId,
      },
    });
  }

  /**
   * 列出组织
   */
  async listOrganizations(userId: string): Promise<any> {
    return (this.api as any).listOrganizations({
      headers: {
        "x-user-id": userId,
      },
    });
  }

  /**
   * 更新组织
   */
  async updateOrganization(data: any, userId: string): Promise<any> {
    return (this.api as any).updateOrganization({
      body: data,
      headers: {
        "x-user-id": userId,
      },
    });
  }

  /**
   * 删除组织
   */
  async deleteOrganization(organizationId: string, userId: string): Promise<void> {
    return (this.api as any).deleteOrganization({
      body: { organizationId },
      headers: {
        "x-user-id": userId,
      },
    });
  }

  /**
   * 邀请成员
   */
  async inviteMember(data: any, userId: string): Promise<any> {
    return (this.api as any).inviteMember({
      body: data,
      headers: {
        "x-user-id": userId,
      },
    });
  }

  /**
   * 接受邀请
   */
  async acceptInvitation(data: any): Promise<any> {
    return (this.api as any).acceptInvitation({
      body: data,
    });
  }

  /**
   * 拒绝邀请
   */
  async rejectInvitation(data: any): Promise<void> {
    return (this.api as any).rejectInvitation({
      body: data,
    });
  }

  /**
   * 移除成员
   */
  async removeMember(data: any, userId: string): Promise<void> {
    return (this.api as any).removeMember({
      body: data,
      headers: {
        "x-user-id": userId,
      },
    });
  }

  /**
   * 更新成员角色
   */
  async updateMemberRole(data: any, userId: string): Promise<any> {
    return (this.api as any).updateMemberRole({
      body: data,
      headers: {
        "x-user-id": userId,
      },
    });
  }

  /**
   * 列出成员
   */
  async listMembers(organizationId: string, userId: string): Promise<any> {
    return (this.api as any).listMembers({
      query: { organizationId },
      headers: {
        "x-user-id": userId,
      },
    });
  }

  /**
   * 设置活跃组织
   */
  async setActiveOrganization(data: any, userId: string): Promise<any> {
    return (this.api as any).setActiveOrganization({
      body: data,
      headers: {
        "x-user-id": userId,
      },
    });
  }

  /**
   * 列出邀请
   */
  async listInvitations(userId: string): Promise<any> {
    return (this.api as any).listInvitations({
      headers: {
        "x-user-id": userId,
      },
    });
  }
}
