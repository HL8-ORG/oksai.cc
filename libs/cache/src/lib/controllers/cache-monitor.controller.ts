/**
 * 缓存监控控制器
 *
 * @module common/cache-monitor.controller
 */

import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import type { TwoLayerCacheStats } from "../services/two-layer-cache.service";
import { TwoLayerCacheService } from "../services/two-layer-cache.service";

/**
 * 缓存监控控制器
 *
 * @description
 * 提供缓存性能监控和统计信息的 API 端点
 */
@ApiTags("缓存监控")
@Controller("monitor/cache")
export class CacheMonitorController {
  constructor(private readonly twoLayerCache: TwoLayerCacheService) {}

  /**
   * 获取缓存统计信息（L1 + L2 分层统计）
   *
   * @description
   * 返回 L1/L2 缓存性能指标
   *
   * @example
   * GET /monitor/cache/stats
   * Response: {
   *   "l1": { "hits": 1000, "misses": 100, "hitRate": 90.91, "size": 50 },
   *   "l2": { "hits": 800, "misses": 200, "hitRate": 80.0, "size": 120 },
   *   "totalHits": 1800,
   *   "totalMisses": 300,
   *   "overallHitRate": 85.71
   * }
   */
  @Get("stats")
  @ApiOperation({
    summary: "获取缓存统计信息",
    description: "返回 L1/L2 缓存性能指标，包括命中率、缓存大小等",
  })
  @ApiResponse({
    status: 200,
    description: "成功",
    schema: {
      example: {
        l1: { hits: 1000, misses: 100, hitRate: 90.91, size: 50 },
        l2: { hits: 800, misses: 200, hitRate: 80.0, size: 120 },
        totalHits: 1800,
        totalMisses: 300,
        overallHitRate: 85.71,
      },
    },
  })
  getStats(): TwoLayerCacheStats {
    return this.twoLayerCache.getStats();
  }

  /**
   * 获取详细的缓存健康信息
   *
   * @description
   * 返回 L1/L2 缓存健康状态和性能指标
   *
   * @example
   * GET /monitor/cache/health
   * Response: {
   *   "status": "healthy",
   *   "l1": { "status": "healthy", "hitRate": 90.91 },
   *   "l2": { "status": "connected", "hitRate": 80.0 },
   *   "performance": {
   *     "overallHitRate": "85.71%",
   *     "recommendation": "缓存性能良好"
   *   }
   * }
   */
  @Get("health")
  @ApiOperation({
    summary: "获取缓存健康信息",
    description: "返回 L1/L2 缓存健康状态和性能建议",
  })
  @ApiResponse({
    status: 200,
    description: "成功",
    schema: {
      example: {
        status: "healthy",
        l1: { status: "healthy", hitRate: 90.91 },
        l2: { status: "connected", hitRate: 80.0 },
        performance: {
          overallHitRate: "85.71%",
          recommendation: "缓存性能良好",
        },
      },
    },
  })
  getHealth() {
    const stats = this.twoLayerCache.getStats();
    const overallStatus =
      stats.overallHitRate >= 80 ? "healthy" : stats.overallHitRate >= 50 ? "warning" : "critical";

    const recommendations: string[] = [];
    if (stats.overallHitRate < 50) {
      recommendations.push("总体缓存命中率较低，建议检查缓存配置");
    }
    if (stats.overallHitRate >= 50 && stats.overallHitRate < 80) {
      recommendations.push("总体缓存命中率中等，可考虑增加缓存容量");
    }
    if (stats.overallHitRate >= 80) {
      recommendations.push("缓存性能良好");
    }
    if (stats.l1.hitRate < 70) {
      recommendations.push("L1 缓存命中率较低，建议增加 L1 容量");
    }
    if (stats.l2.hitRate < 70) {
      recommendations.push("L2 缓存命中率较低，建议检查 Redis 配置");
    }

    return {
      status: overallStatus,
      l1: {
        status: stats.l1.hitRate >= 80 ? "healthy" : stats.l1.hitRate >= 50 ? "warning" : "critical",
        hitRate: stats.l1.hitRate,
        size: stats.l1.size,
      },
      l2: {
        status: stats.l2.hitRate >= 80 ? "healthy" : stats.l2.hitRate >= 50 ? "warning" : "critical",
        hitRate: stats.l2.hitRate,
        size: stats.l2.size,
      },
      performance: {
        overallHitRate: `${stats.overallHitRate.toFixed(2)}%`,
        recommendation: recommendations[0],
      },
    };
  }

  /**
   * 重置缓存统计信息
   *
   * @description
   * 清零 L1/L2 缓存统计计数器（不影响缓存数据）
   *
   * @example
   * POST /monitor/cache/stats/reset
   * Response: { "success": true, "message": "统计信息已重置" }
   */
  @Get("stats/reset")
  @ApiOperation({
    summary: "重置缓存统计",
    description: "清零 L1/L2 缓存统计计数器（不影响缓存数据）",
  })
  @ApiResponse({
    status: 200,
    description: "重置成功",
    schema: {
      example: {
        success: true,
        message: "统计信息已重置",
      },
    },
  })
  resetStats() {
    this.twoLayerCache.resetStats();
    return {
      success: true,
      message: "统计信息已重置",
    };
  }
}
