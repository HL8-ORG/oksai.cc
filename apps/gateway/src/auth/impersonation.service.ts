/**
 * 用户模拟服务
 */

import {
  BadRequestException,
  ForbiddenException,
  Injectable,
  Logger,
  NotFoundException,
} from "@nestjs/common";
import { db, users } from "@oksai/database";
import { eq } from "drizzle-orm";
import type { ImpersonateUserDto, ImpersonateUserResponse, ImpersonationSession } from "./impersonation.dto";

/**
 * 用户模拟服务
 *
 * @description
 * 提供用户模拟功能，允许管理员以其他用户身份登录，用于技术支持和调试
 *
 * 安全措施：
 * - 只有管理员可以模拟用户
 * - 记录审计日志
 * - 支持退出模拟
 */
@Injectable()
export class ImpersonationService {
  private readonly logger = new Logger(ImpersonationService.name);

  /** 模拟会话存储（生产环境应使用 Redis） */
  private readonly impersonationSessions = new Map<string, ImpersonationSession>();

  /**
   * 模拟用户登录
   *
   * @param adminUserId - 管理员用户 ID
   * @param dto - 模拟请求
   */
  async impersonateUser(adminUserId: string, dto: ImpersonateUserDto): Promise<ImpersonateUserResponse> {
    try {
      this.logger.log(`管理员 ${adminUserId} 请求模拟用户 ${dto.userId}`);

      // 1. 验证管理员权限
      const admin = await this.getUserById(adminUserId);
      if (!admin) {
        throw new ForbiddenException("管理员用户不存在");
      }

      if (admin.role !== "admin" && admin.role !== "owner") {
        throw new ForbiddenException("只有管理员可以模拟用户");
      }

      // 2. 获取目标用户
      const targetUser = await this.getUserById(dto.userId);
      if (!targetUser) {
        throw new NotFoundException("目标用户不存在");
      }

      // 3. 创建模拟会话
      const sessionId = `imp_${crypto.randomUUID()}`;
      const session: ImpersonationSession = {
        impersonatorId: adminUserId,
        impersonatorEmail: admin.email,
        impersonatorName: admin.name,
        targetUserId: targetUser.id,
        targetUserEmail: targetUser.email,
        targetUserName: targetUser.name,
        reason: dto.reason,
        startedAt: new Date(),
        sessionId,
      };

      // 4. 存储模拟会话（生产环境应使用 Redis）
      this.impersonationSessions.set(sessionId, session);

      this.logger.log(`用户模拟成功: ${admin.email} -> ${targetUser.email} (原因: ${dto.reason})`);

      return {
        success: true,
        message: "模拟登录成功",
        impersonatedUser: {
          id: targetUser.id,
          email: targetUser.email,
          name: targetUser.name,
        },
        session: {
          id: sessionId,
          token: sessionId, // 简化实现，生产环境应生成真实 token
          expiresAt: new Date(Date.now() + 3600000), // 1 小时后过期
        },
        impersonator: {
          id: admin.id,
          email: admin.email,
          name: admin.name,
        },
      };
    } catch (error) {
      this.logger.error(`模拟用户失败`, error);
      throw error;
    }
  }

  /**
   * 停止模拟会话
   *
   * @param sessionId - 模拟会话 ID
   */
  async stopImpersonating(sessionId: string): Promise<void> {
    try {
      this.logger.log(`停止模拟会话: ${sessionId}`);

      const session = this.impersonationSessions.get(sessionId);
      if (!session) {
        throw new NotFoundException("模拟会话不存在或已过期");
      }

      // 删除模拟会话
      this.impersonationSessions.delete(sessionId);

      this.logger.log(`模拟会话已停止: ${session.impersonatorEmail} -> ${session.targetUserEmail}`);
    } catch (error) {
      this.logger.error(`停止模拟失败`, error);
      throw error;
    }
  }

  /**
   * 获取模拟会话信息
   *
   * @param sessionId - 模拟会话 ID
   */
  async getImpersonationSession(sessionId: string): Promise<ImpersonationSession | null> {
    return this.impersonationSessions.get(sessionId) || null;
  }

  /**
   * 获取用户的所有活跃模拟会话
   *
   * @param adminUserId - 管理员用户 ID
   */
  async listActiveImpersonations(adminUserId: string): Promise<ImpersonationSession[]> {
    const sessions: ImpersonationSession[] = [];
    for (const session of this.impersonationSessions.values()) {
      if (session.impersonatorId === adminUserId) {
        sessions.push(session);
      }
    }
    return sessions;
  }

  /**
   * 获取用户信息
   */
  private async getUserById(userId: string) {
    const result = await db.select().from(users).where(eq(users.id, userId)).limit(1);
    return result[0] || null;
  }
}
