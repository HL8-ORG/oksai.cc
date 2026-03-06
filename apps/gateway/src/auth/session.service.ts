/**
 * Session 管理服务
 */

import { EntityManager } from "@mikro-orm/core";
import { Injectable, Logger } from "@nestjs/common";
import { Session } from "@oksai/database";
import { BetterAuthApiClient } from "@oksai/nestjs-better-auth";
import { CacheService } from "../common/cache.service";
import type { SessionConfigResponse, SessionInfo, SessionListResponse, UpdateSessionConfigDto } from "./dto";

/**
 * Session 管理服务
 *
 * @description
 * 提供 Session 查询、管理、配置功能
 * - 集成 LRU Cache 提升查询性能
 * - Session 配置缓存：5 分钟
 * - Session 信息缓存：1 分钟
 */
@Injectable()
export class SessionService {
  private readonly logger = new Logger(SessionService.name);

  /** Session 配置缓存前缀 */
  private static readonly CACHE_PREFIX_CONFIG = "session:config:";
  /** Session 列表缓存前缀 */
  private static readonly CACHE_PREFIX_LIST = "session:list:";
  /** Session 配置缓存 TTL：5 分钟 */
  private static readonly CACHE_TTL_CONFIG = 300000;
  /** Session 列表缓存 TTL：1 分钟 */
  private static readonly CACHE_TTL_LIST = 60000;

  constructor(
    private readonly cacheService: CacheService,
    private readonly em: EntityManager,
    private readonly apiClient: BetterAuthApiClient
  ) {}

  /**
   * 获取用户的所有活跃 Session
   *
   * @param userId - 用户 ID
   * @param currentSessionToken - 当前 Session Token（可选，用于标记当前 Session）
   */
  async listActiveSessions(userId: string, currentSessionToken?: string): Promise<SessionListResponse> {
    try {
      const cacheKey = `${SessionService.CACHE_PREFIX_LIST}${userId}`;

      // 尝试从缓存获取
      const cachedResponse = this.cacheService.get<SessionListResponse>(cacheKey);
      if (cachedResponse) {
        return cachedResponse;
      }

      // 使用 Better Auth API 获取活跃会话
      const result = await this.apiClient.listActiveSessions(userId, currentSessionToken);

      // 转换为我们的格式
      const sessionList: SessionInfo[] =
        result.sessions?.map(
          (session: {
            id: string;
            userId: string;
            createdAt: Date;
            expiresAt: Date;
            ipAddress?: string;
            userAgent?: string;
            isCurrent?: boolean;
          }) => ({
            id: session.id,
            userId: session.userId,
            createdAt: session.createdAt,
            expiresAt: session.expiresAt,
            ipAddress: session.ipAddress,
            userAgent: session.userAgent,
            isCurrent: session.isCurrent || false,
          })
        ) || [];

      const response: SessionListResponse = {
        success: true,
        message: "获取活跃 Session 列表成功",
        sessions: sessionList,
        currentSessionId:
          result.currentSessionId || currentSessionToken
            ? sessionList.find((s) => s.isCurrent)?.id
            : undefined,
      };

      // 写入缓存
      this.cacheService.set(cacheKey, response, SessionService.CACHE_TTL_LIST);

      return response;
    } catch (error) {
      this.logger.error(`获取 Session 列表失败: ${userId}`, error);
      throw error;
    }
  }

  /**
   * 撤销指定 Session（登出特定设备）
   *
   * @param userId - 用户 ID
   * @param sessionId - 要撤销的 Session ID
   */
  async revokeSession(userId: string, sessionId: string): Promise<void> {
    try {
      // 使用 Better Auth API 撤销会话
      await this.apiClient.revokeSession(sessionId, sessionId); // 这里 sessionId 作为 token 使用

      // 清除 Session 列表缓存
      this.cacheService.delete(`${SessionService.CACHE_PREFIX_LIST}${userId}`);

      this.logger.log(`Session 已撤销: ${sessionId}`);
    } catch (error) {
      this.logger.error(`撤销 Session 失败: ${sessionId}`, error);
      throw error;
    }
  }

  /**
   * 撤销所有其他 Session（保留当前 Session）
   *
   * @param userId - 用户 ID
   * @param currentSessionToken - 当前 Session Token
   */
  async revokeOtherSessions(userId: string, currentSessionToken: string): Promise<number> {
    try {
      // 使用 Better Auth API 撤销所有其他会话
      const result = await this.apiClient.revokeAllSessions(userId, currentSessionToken);

      const deletedCount = result.deletedCount || 0;

      // 清除 Session 列表缓存
      this.cacheService.delete(`${SessionService.CACHE_PREFIX_LIST}${userId}`);

      this.logger.log(`已撤销 ${deletedCount} 个其他 Session`);
      return deletedCount;
    } catch (error) {
      this.logger.error(`撤销其他 Session 失败: ${userId}`, error);
      throw error;
    }
  }

  /**
   * 获取用户的 Session 超时配置
   *
   * @param userId - 用户 ID
   */
  async getSessionConfig(userId: string): Promise<SessionConfigResponse> {
    try {
      const cacheKey = `${SessionService.CACHE_PREFIX_CONFIG}${userId}`;

      // 尝试从缓存获取
      const cachedConfig = this.cacheService.get<SessionConfigResponse>(cacheKey);
      if (cachedConfig) {
        return cachedConfig;
      }

      // 使用 Better Auth API 获取会话配置
      const result = await this.apiClient.getSessionConfig(userId);

      // 转换为我们的格式
      const sessionTimeout = result.sessionTimeout || 604800; // 默认 7 天
      const sessionTimeoutDays = Math.round((sessionTimeout / 86400) * 10) / 10;
      const allowConcurrentSessions = result.allowConcurrentSessions ?? true;
      const maxConcurrentSessions = result.maxConcurrentSessions ?? 5; // 默认 5 个会话

      const response: SessionConfigResponse = {
        success: true,
        message: "获取 Session 配置成功",
        sessionTimeout,
        sessionTimeoutDays,
        allowConcurrentSessions,
        maxConcurrentSessions,
      };

      // 写入缓存
      this.cacheService.set(cacheKey, response, SessionService.CACHE_TTL_CONFIG);

      return response;
    } catch (error) {
      this.logger.error(`获取 Session 配置失败: ${userId}`, error);
      throw error;
    }
  }

  /**
   * 更新用户的 Session 超时配置
   *
   * @param userId - 用户 ID
   * @param dto - 更新配置 DTO
   */
  async updateSessionConfig(userId: string, dto: UpdateSessionConfigDto): Promise<SessionConfigResponse> {
    try {
      this.logger.log(`更新 Session 配置: ${userId}`, dto);

      // 使用 Better Auth API 更新会话配置
      await this.apiClient.updateSessionConfig(dto);

      // 获取更新后的完整配置
      const config = await this.getSessionConfig(userId);

      // 清除配置缓存
      this.cacheService.delete(`${SessionService.CACHE_PREFIX_CONFIG}${userId}`);

      return config;
    } catch (error) {
      this.logger.error(`更新 Session 配置失败: ${userId}`, error);
      throw error;
    }
  }

  /**
   * 检查并发登录并处理
   *
   * @param userId - 用户 ID
   * @param currentSessionToken - 当前 Session Token
   * @returns 撤销的 Session 数量
   */
  async handleConcurrentSessions(userId: string, currentSessionToken: string): Promise<number> {
    try {
      // 获取用户配置
      const config = await this.getSessionConfig(userId);

      // 如果允许并发登录，不做任何处理
      if (config.allowConcurrentSessions) {
        this.logger.debug(`用户 ${userId} 允许并发登录`);
        return 0;
      }

      // 不允许并发登录，撤销所有其他 Session
      this.logger.log(`用户 ${userId} 不允许并发登录，撤销其他 Session`);
      const revokedCount = await this.revokeOtherSessions(userId, currentSessionToken);

      return revokedCount;
    } catch (error) {
      this.logger.error(`处理并发登录失败: ${userId}`, error);
      // 即使失败也不应该阻止登录
      return 0;
    }
  }

  /**
   * 清理过期的 Session（定时任务调用）
   */
  async cleanExpiredSessions(): Promise<number> {
    try {
      const now = new Date();
      const sessions = await this.em.find(Session, {
        expiresAt: { $lte: now },
      });

      for (const session of sessions) {
        this.em.remove(session);
      }

      await this.em.flush();

      const deletedCount = sessions.length;
      this.logger.log(`清理了 ${deletedCount} 个过期 Session`);
      return deletedCount;
    } catch (error) {
      this.logger.error(`清理过期 Session 失败`, error);
      throw error;
    }
  }
}
