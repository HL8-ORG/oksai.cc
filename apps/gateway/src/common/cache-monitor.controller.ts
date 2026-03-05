/**
 * 缓存监控控制器
 *
 * @module common/cache-monitor.controller
 */

import { Controller, Get } from "@nestjs/common";
import { ApiOperation, ApiResponse, ApiTags } from "@nestjs/swagger";
import { CacheService } from "./cache.service";

/**
 * 缓存监控控制器
 *
 * @description
 * 提供缓存性能监控和统计信息的 API 端点
 */
@ApiTags("缓存监控")
@Controller("monitor/cache")
export class CacheMonitorController {
  constructor(private readonly cacheService: CacheService) {}

  /**
   * 获取缓存统计信息
   *
   * @description
   * 返回缓存性能指标，包括：
   * - 命中次数
   * - 未命中次数
   * - 命中率
   * - 当前缓存大小
   *
   * @example
   * GET /monitor/cache/stats
   * Response: {
   *   "hits": 1000,
   *   "misses": 100,
   *   "hitRate": 90.91,
   *   "size": 50
   * }
   */
  @Get("stats")
  @ApiOperation({ summary: "获取缓存统计信息", description: "返回缓存性能指标，包括命中率、缓存大小等" })
  @ApiResponse({
    status: 200,
    description: "成功",
    schema: {
      example: {
        hits: 1000,
        misses: 100,
        hitRate: 90.91,
        size: 50,
      },
    },
  })
  getStats() {
    return this.cacheService.getStats();
  }

  /**
   * 获取详细的缓存健康信息
   *
   * @description
   * 返回缓存健康状态和性能指标
   *
   * @example
   * GET /monitor/cache/health
   * Response: {
   *   "status": "healthy",
   *   "stats": { ... },
   *   "performance": {
   *     "hitRate": "90.91%",
   *     "recommendation": "缓存性能良好"
   *   }
   * }
   */
  @Get("health")
  @ApiOperation({ summary: "获取缓存健康信息", description: "返回缓存健康状态和性能建议" })
  @ApiResponse({
    status: 200,
    description: "成功",
    schema: {
      example: {
        status: "healthy",
        stats: {
          hits: 1000,
          misses: 100,
          hitRate: 90.91,
          size: 50,
        },
        performance: {
          hitRate: "90.91%",
          recommendation: "缓存性能良好",
        },
      },
    },
  })
  getHealth() {
    const stats = this.cacheService.getStats();
    const status = stats.hitRate >= 80 ? "healthy" : stats.hitRate >= 50 ? "warning" : "critical";

    const recommendations: string[] = [];
    if (stats.hitRate < 50) {
      recommendations.push("缓存命中率较低，建议检查缓存配置");
    }
    if (stats.hitRate >= 50 && stats.hitRate < 80) {
      recommendations.push("缓存命中率中等，可考虑增加缓存容量");
    }
    if (stats.hitRate >= 80) {
      recommendations.push("缓存性能良好");
    }

    return {
      status,
      stats,
      performance: {
        hitRate: `${stats.hitRate.toFixed(2)}%`,
        recommendation: recommendations[0],
      },
    };
  }

  /**
   * 重置缓存统计信息
   *
   * @description
   * 清零缓存统计计数器（不影响缓存数据）
   *
   * @example
   * POST /monitor/cache/stats/reset
   * Response: { "success": true, "message": "统计信息已重置" }
   */
  @Get("stats/reset")
  @ApiOperation({ summary: "重置缓存统计", description: "清零缓存统计计数器（不影响缓存数据）" })
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
    this.cacheService.resetStats();
    return {
      success: true,
      message: "统计信息已重置",
    };
  }
}
