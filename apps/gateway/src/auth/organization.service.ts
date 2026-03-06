/**
 * 组织管理服务
 */

import { BadRequestException, Injectable, Logger, NotFoundException } from "@nestjs/common";
import { BetterAuthApiClient } from "@oksai/nestjs-better-auth";

/**
 * 组织管理服务
 *
 * @description
 * 提供组织管理、成员管理功能
 */
@Injectable()
export class OrganizationService {
  private readonly logger = new Logger(OrganizationService.name);
  constructor(private readonly apiClient: BetterAuthApiClient) {
    this.logger = new Logger(OrganizationService.name);
  }

  /**
   * 创建组织
   *
   * @param userId - 用户 ID（创建者自动成为 owner）
   * @param data - 组织数据
   */
  async createOrganization(userId: string, data: { name: string; slug?: string; logo?: string }) {
    try {
      this.logger.log(`创建组织: ${data.name} by ${userId}`);

      const result = await this.apiClient.createOrganization(data, userId);

      this.logger.log(`组织创建成功: ${result.id}`);
      return result;
    } catch (error) {
      this.logger.error(`创建组织失败: ${data.name}`, error);
      throw new BadRequestException("创建组织失败");
    }
  }

  /**
   * 获取组织详情
   *
   * @param organizationId - 组织 ID
   * @param userId - 用户 ID（需要验证权限）
   */
  async getOrganization(organizationId: string, userId: string) {
    try {
      const result = await this.apiClient.getOrganization(organizationId, userId);

      if (!result) {
        throw new NotFoundException("组织不存在或无权访问");
      }

      return result;
    } catch (error) {
      this.logger.error(`获取组织失败: ${organizationId}`, error);
      throw error;
    }
  }

  /**
   * 获取用户的所有组织
   *
   * @param userId - 用户 ID
   */
  async listOrganizations(userId: string) {
    try {
      const result = await this.apiClient.listOrganizations(userId);

      return result;
    } catch (error) {
      this.logger.error(`获取组织列表失败: ${userId}`, error);
      throw error;
    }
  }

  /**
   * 更新组织
   *
   * @param organizationId - 组织 ID
   * @param userId - 用户 ID（需要 owner 权限）
   * @param data - 更新数据
   */
  async updateOrganization(
    organizationId: string,
    userId: string,
    data: { name?: string; slug?: string; logo?: string }
  ) {
    try {
      this.logger.log(`更新组织: ${organizationId} by ${userId}`);

      const result = await this.apiClient.updateOrganization(
        {
          organizationId,
          ...data,
        },
        userId
      );

      this.logger.log(`组织更新成功: ${organizationId}`);
      return result;
    } catch (error) {
      this.logger.error(`更新组织失败: ${organizationId}`, error);
      throw error;
    }
  }

  /**
   * 删除组织
   *
   * @param organizationId - 组织 ID
   * @param userId - 用户 ID（需要 owner 权限）
   */
  async deleteOrganization(organizationId: string, userId: string) {
    try {
      this.logger.log(`删除组织: ${organizationId} by ${userId}`);

      await this.apiClient.deleteOrganization(organizationId, userId);

      this.logger.log(`组织删除成功: ${organizationId}`);
    } catch (error) {
      this.logger.error(`删除组织失败: ${organizationId}`, error);
      throw error;
    }
  }

  /**
   * 邀请成员
   *
   * @param organizationId - 组织 ID
   * @param userId - 邀请人 ID（需要 owner 或 admin 权限）
   * @param email - 被邀请人邮箱
   * @param role - 成员角色
   */
  async inviteMember(organizationId: string, userId: string, email: string, role: string) {
    try {
      this.logger.log(`邀请成员: ${email} to ${organizationId} by ${userId}`);

      const result = await this.apiClient.inviteMember(
        {
          organizationId,
          email,
          role,
        },
        userId
      );

      this.logger.log(`成员邀请成功: ${email}`);
      return result;
    } catch (error) {
      this.logger.error(`邀请成员失败: ${email}`, error);
      throw error;
    }
  }

  /**
   * 接受邀请
   *
   * @param invitationId - 邀请 ID
   * @param userId - 用户 ID
   */
  async acceptInvitation(invitationId: string, userId: string) {
    try {
      this.logger.log(`接受邀请: ${invitationId} by ${userId}`);

      const result = await this.apiClient.acceptInvitation({
        invitationId,
      });

      this.logger.log(`邀请接受成功: ${invitationId}`);
      return result;
    } catch (error) {
      this.logger.error(`接受邀请失败: ${invitationId}`, error);
      throw error;
    }
  }

  /**
   * 拒绝邀请
   *
   * @param invitationId - 邀请 ID
   * @param userId - 用户 ID
   */
  async rejectInvitation(invitationId: string, userId: string) {
    try {
      this.logger.log(`拒绝邀请: ${invitationId} by ${userId}`);

      await this.apiClient.rejectInvitation({
        invitationId,
      });

      this.logger.log(`邀请拒绝成功: ${invitationId}`);
    } catch (error) {
      this.logger.error(`拒绝邀请失败: ${invitationId}`, error);
      throw error;
    }
  }

  /**
   * 移除成员
   *
   * @param organizationId - 组织 ID
   * @param memberId - 成员 ID
   * @param userId - 操作人 ID（需要 owner 或 admin 权限）
   */
  async removeMember(organizationId: string, memberId: string, userId: string) {
    try {
      this.logger.log(`移除成员: ${memberId} from ${organizationId} by ${userId}`);

      await this.apiClient.removeMember(
        {
          organizationId,
          memberId,
        },
        userId
      );

      this.logger.log(`成员移除成功: ${memberId}`);
    } catch (error) {
      this.logger.error(`移除成员失败: ${memberId}`, error);
      throw error;
    }
  }

  /**
   * 更新成员角色
   *
   * @param organizationId - 组织 ID
   * @param memberId - 成员 ID
   * @param role - 新角色
   * @param userId - 操作人 ID（需要 owner 权限）
   */
  async updateMemberRole(organizationId: string, memberId: string, role: string, userId: string) {
    try {
      this.logger.log(`更新成员角色: ${memberId} to ${role} by ${userId}`);

      const result = await this.apiClient.updateMemberRole(
        {
          organizationId,
          memberId,
          role,
        },
        userId
      );

      this.logger.log(`成员角色更新成功: ${memberId}`);
      return result;
    } catch (error) {
      this.logger.error(`更新成员角色失败: ${memberId}`, error);
      throw error;
    }
  }

  /**
   * 获取组织成员列表
   *
   * @param organizationId - 组织 ID
   * @param userId - 用户 ID（需要是组织成员）
   */
  async listMembers(organizationId: string, userId: string) {
    try {
      const result = await this.apiClient.listMembers(organizationId, userId);

      return result;
    } catch (error) {
      this.logger.error(`获取成员列表失败: ${organizationId}`, error);
      throw error;
    }
  }

  /**
   * 设置当前活动组织
   *
   * @param organizationId - 组织 ID
   * @param userId - 用户 ID
   */
  async setActiveOrganization(organizationId: string, userId: string) {
    try {
      this.logger.log(`设置活动组织: ${organizationId} for ${userId}`);

      const result = await this.apiClient.setActiveOrganization(
        {
          organizationId,
        },
        userId
      );

      this.logger.log(`活动组织设置成功: ${organizationId}`);
      return result;
    } catch (error) {
      this.logger.error(`设置活动组织失败: ${organizationId}`, error);
      throw error;
    }
  }

  /**
   * 获取用户的邀请列表
   *
   * @param userId - 用户 ID
   */
  async listInvitations(userId: string) {
    try {
      const result = await this.apiClient.listInvitations(userId);

      return result;
    } catch (error) {
      this.logger.error(`获取邀请列表失败: ${userId}`, error);
      throw error;
    }
  }

  /**
   * 检查用户在组织中的权限
   *
   * @param organizationId - 组织 ID
   * @param userId - 用户 ID
   * @param requiredRole - 需要的最低角色
   */
  async checkPermission(
    organizationId: string,
    userId: string,
    requiredRole: "owner" | "admin" | "member"
  ): Promise<boolean> {
    try {
      const org = await this.getOrganization(organizationId, userId);

      if (!org || !org.role) {
        return false;
      }

      const roleHierarchy = {
        owner: 3,
        admin: 2,
        member: 1,
      };

      const userRoleLevel = roleHierarchy[org.role as keyof typeof roleHierarchy] || 0;
      const requiredRoleLevel = roleHierarchy[requiredRole] || 0;

      return userRoleLevel >= requiredRoleLevel;
    } catch (error) {
      this.logger.error(`检查权限失败: ${organizationId}, ${userId}`, error);
      return false;
    }
  }
}
