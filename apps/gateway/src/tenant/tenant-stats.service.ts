/**
 * 租户统计服务
 *
 * @description
 * 提供租户使用统计、活动日志、使用趋势分析等功能
 */

import { EntityManager } from "@mikro-orm/core";
import { Injectable, Logger } from "@nestjs/common";
import { TenantContextService } from "@oksai/context";
import { Webhook } from "@oksai/iam-identity";
import { Session, Tenant, User } from "@oksai/iam-identity";

/**
 * 租户统计概览
 */
export interface TenantStatsOverview {
  tenantId: string;
  organizations: {
    total: number;
    active: number;
  };
  members: {
    total: number;
    active: number;
  };
  storage: {
    used: number;
    limit: number;
    percentage: number;
  };
  webhooks: {
    total: number;
    active: number;
  };
  sessions: {
    total: number;
    active: number;
  };
}

/**
 * 使用趋势数据点
 */
export interface UsageTrendDataPoint {
  date: string;
  organizations: number;
  members: number;
  storage: number;
}

/**
 * 租户活动日志
 */
export interface TenantActivityLog {
  id: string;
  tenantId: string;
  action: string;
  resource: string;
  resourceId: string;
  userId?: string;
  metadata: Record<string, any>;
  createdAt: Date;
}

/**
 * 租户统计服务
 */
@Injectable()
export class TenantStatsService {
  private readonly logger = new Logger(TenantStatsService.name);

  constructor(
    private readonly em: EntityManager,
    private readonly _tenantContext: TenantContextService
  ) {}

  /**
   * 获取租户统计概览
   *
   * @param tenantId - 租户 ID
   * @returns 统计概览数据
   */
  async getOverview(tenantId: string): Promise<TenantStatsOverview> {
    this.logger.debug(`获取租户统计概览: ${tenantId}`);

    // 获取租户信息
    const tenant = await this.em.findOne(Tenant, { id: tenantId });
    if (!tenant) {
      throw new Error(`租户 ${tenantId} 不存在`);
    }

    // 并行查询所有统计数据
    const [orgStats, memberStats, webhookStats, sessionStats, storageUsed] = await Promise.all([
      this.getOrganizationStats(tenantId),
      this.getMemberStats(tenantId),
      this.getWebhookStats(tenantId),
      this.getSessionStats(tenantId),
      this.getStorageUsed(tenantId),
    ]);

    return {
      tenantId,
      organizations: orgStats,
      members: memberStats,
      storage: {
        used: storageUsed,
        limit: tenant.maxStorage,
        percentage: (storageUsed / tenant.maxStorage) * 100,
      },
      webhooks: webhookStats,
      sessions: sessionStats,
    };
  }

  /**
   * 获取使用趋势
   *
   * @param tenantId - 租户 ID
   * @param days - 查询天数（默认 30 天）
   * @returns 使用趋势数据
   */
  async getUsageTrend(tenantId: string, days = 30): Promise<UsageTrendDataPoint[]> {
    this.logger.debug(`获取租户使用趋势: ${tenantId}, 最近 ${days} 天`);

    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);

    // 这里简化实现，实际应该从数据库查询历史数据
    // 可以使用 DomainEvent 表来统计历史趋势
    const trends: UsageTrendDataPoint[] = [];

    for (let i = 0; i < days; i++) {
      const date = new Date(startDate);
      date.setDate(date.getDate() + i);

      trends.push({
        date: date.toISOString().split("T")[0],
        organizations: 0, // TODO: 从历史数据计算
        members: 0, // TODO: 从历史数据计算
        storage: 0, // TODO: 从历史数据计算
      });
    }

    return trends;
  }

  /**
   * 获取活动日志
   *
   * @param tenantId - 租户 ID
   * @param page - 页码
   * @param limit - 每页数量
   * @returns 活动日志列表
   */
  async getActivityLogs(
    tenantId: string,
    _page = 1,
    _limit = 20
  ): Promise<{ data: TenantActivityLog[]; total: number }> {
    this.logger.debug(`获取租户活动日志: ${tenantId}`);

    // 这里简化实现，实际应该从 DomainEvent 表查询
    // const [events, total] = await this.em.findAndCount(
    //   DomainEvent,
    //   { tenantId },
    //   {
    //     limit,
    //     offset: (page - 1) * limit,
    //     orderBy: { createdAt: 'DESC' },
    //   }
    // );

    return {
      data: [],
      total: 0,
    };
  }

  /**
   * 获取组织统计
   */
  private async getOrganizationStats(tenantId: string): Promise<{ total: number; active: number }> {
    // TODO: 查询 organization 表
    // const total = await this.em.count(Organization, { tenantId });
    // const active = await this.em.count(Organization, { tenantId, status: 'active' });

    return {
      total: 0,
      active: 0,
    };
  }

  /**
   * 获取成员统计
   */
  private async getMemberStats(tenantId: string): Promise<{ total: number; active: number }> {
    const total = await this.em.count(User, { tenantId });
    const active = await this.em.count(User, { tenantId, emailVerified: true });

    return { total, active };
  }

  /**
   * 获取 Webhook 统计
   */
  private async getWebhookStats(tenantId: string): Promise<{ total: number; active: number }> {
    const total = await this.em.count(Webhook, { tenantId });
    // Webhook 实体可能没有 active 字段，暂时返回 total
    return { total, active: total };
  }

  /**
   * 获取会话统计
   */
  private async getSessionStats(tenantId: string): Promise<{ total: number; active: number }> {
    const total = await this.em.count(Session, { tenantId });

    // 活跃会话：过期时间大于当前时间
    const now = new Date();
    const active = await this.em.count(Session, {
      tenantId,
      expiresAt: { $gt: now },
    });

    return { total, active };
  }

  /**
   * 获取存储使用量
   *
   * TODO: 实际应该统计文件存储、数据库大小等
   */
  private async getStorageUsed(_tenantId: string): Promise<number> {
    // 暂时返回 0，实际应该统计：
    // 1. 文件存储（S3/本地存储）
    // 2. 数据库大小
    // 3. 日志大小

    return 0;
  }
}
