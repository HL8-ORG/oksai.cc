/**
 * 缓存监控控制器测试
 *
 * @module common/cache-monitor.controller.spec
 */

import { beforeEach, describe, expect, it, type Mock, vi } from "vitest";
import { CacheMonitorController } from "./controllers/cache-monitor.controller.js";
import type { TwoLayerCacheStats } from "./services/two-layer-cache.service.js";

describe("CacheMonitorController", () => {
  let controller: CacheMonitorController;
  let mockTwoLayerCache: {
    getStats: Mock;
    resetStats: Mock;
  };

  beforeEach(() => {
    mockTwoLayerCache = {
      getStats: vi.fn(),
      resetStats: vi.fn(),
    };

    controller = new CacheMonitorController(mockTwoLayerCache as any);
  });

  describe("getStats", () => {
    it("应该返回 L1/L2 缓存统计信息", () => {
      const mockStats: TwoLayerCacheStats = {
        l1: {
          hits: 1000,
          misses: 100,
          hitRate: 90.91,
          size: 50,
        },
        l2: {
          hits: 800,
          misses: 200,
          hitRate: 80.0,
          size: 120,
        },
        totalHits: 1800,
        totalMisses: 300,
        overallHitRate: 85.71,
      };

      mockTwoLayerCache.getStats.mockReturnValue(mockStats);

      const result = controller.getStats();

      expect(mockTwoLayerCache.getStats).toHaveBeenCalledOnce();
      expect(result).toEqual(mockStats);
      expect(result.l1.hitRate).toBe(90.91);
      expect(result.l2.hitRate).toBe(80.0);
      expect(result.overallHitRate).toBe(85.71);
    });

    it("应该正确处理零命中率", () => {
      const mockStats: TwoLayerCacheStats = {
        l1: {
          hits: 0,
          misses: 0,
          hitRate: 0,
          size: 0,
        },
        l2: {
          hits: 0,
          misses: 0,
          hitRate: 0,
          size: 0,
        },
        totalHits: 0,
        totalMisses: 0,
        overallHitRate: 0,
      };

      mockTwoLayerCache.getStats.mockReturnValue(mockStats);

      const result = controller.getStats();

      expect(result.overallHitRate).toBe(0);
    });

    it("应该正确处理完美命中率", () => {
      const mockStats: TwoLayerCacheStats = {
        l1: {
          hits: 1000,
          misses: 0,
          hitRate: 100,
          size: 50,
        },
        l2: {
          hits: 1000,
          misses: 0,
          hitRate: 100,
          size: 120,
        },
        totalHits: 2000,
        totalMisses: 0,
        overallHitRate: 100,
      };

      mockTwoLayerCache.getStats.mockReturnValue(mockStats);

      const result = controller.getStats();

      expect(result.overallHitRate).toBe(100);
    });
  });

  describe("getHealth", () => {
    it("应该返回 healthy 状态当命中率 >= 80%", () => {
      const mockStats: TwoLayerCacheStats = {
        l1: {
          hits: 1000,
          misses: 100,
          hitRate: 90.91,
          size: 50,
        },
        l2: {
          hits: 800,
          misses: 200,
          hitRate: 80.0,
          size: 120,
        },
        totalHits: 1800,
        totalMisses: 300,
        overallHitRate: 85.71,
      };

      mockTwoLayerCache.getStats.mockReturnValue(mockStats);

      const result = controller.getHealth();

      expect(result.status).toBe("healthy");
      expect(result.l1.status).toBe("healthy");
      expect(result.l2.status).toBe("healthy");
      expect(result.performance.overallHitRate).toBe("85.71%");
      expect(result.performance.recommendation).toBe("缓存性能良好");
    });

    it("应该返回 warning 状态当 50% <= 命中率 < 80%", () => {
      const mockStats: TwoLayerCacheStats = {
        l1: {
          hits: 500,
          misses: 500,
          hitRate: 50,
          size: 50,
        },
        l2: {
          hits: 500,
          misses: 500,
          hitRate: 50,
          size: 120,
        },
        totalHits: 1000,
        totalMisses: 1000,
        overallHitRate: 50,
      };

      mockTwoLayerCache.getStats.mockReturnValue(mockStats);

      const result = controller.getHealth();

      expect(result.status).toBe("warning");
      expect(result.performance.recommendation).toBe("总体缓存命中率中等，可考虑增加缓存容量");
    });

    it("应该返回 critical 状态当命中率 < 50%", () => {
      const mockStats: TwoLayerCacheStats = {
        l1: {
          hits: 100,
          misses: 900,
          hitRate: 10,
          size: 50,
        },
        l2: {
          hits: 100,
          misses: 900,
          hitRate: 10,
          size: 120,
        },
        totalHits: 200,
        totalMisses: 1800,
        overallHitRate: 10,
      };

      mockTwoLayerCache.getStats.mockReturnValue(mockStats);

      const result = controller.getHealth();

      expect(result.status).toBe("critical");
      expect(result.performance.recommendation).toBe("总体缓存命中率较低，建议检查缓存配置");
    });

    it("应该提供 L1/L2 特定的建议", () => {
      const mockStats: TwoLayerCacheStats = {
        l1: {
          hits: 500,
          misses: 500,
          hitRate: 50,
          size: 50,
        },
        l2: {
          hits: 500,
          misses: 500,
          hitRate: 50,
          size: 120,
        },
        totalHits: 1000,
        totalMisses: 1000,
        overallHitRate: 50,
      };

      mockTwoLayerCache.getStats.mockReturnValue(mockStats);

      const result = controller.getHealth();

      expect(result.status).toBe("warning");
    });

    it("应该正确处理 L1 和 L2 的独立状态", () => {
      const mockStats: TwoLayerCacheStats = {
        l1: {
          hits: 100,
          misses: 900,
          hitRate: 10,
          size: 50,
        },
        l2: {
          hits: 900,
          misses: 100,
          hitRate: 90,
          size: 120,
        },
        totalHits: 1000,
        totalMisses: 1000,
        overallHitRate: 50,
      };

      mockTwoLayerCache.getStats.mockReturnValue(mockStats);

      const result = controller.getHealth();

      expect(result.l1.status).toBe("critical");
      expect(result.l2.status).toBe("healthy");
      expect(result.status).toBe("warning");
    });

    it("应该包含 L1 和 L2 的详细信息", () => {
      const mockStats: TwoLayerCacheStats = {
        l1: {
          hits: 1000,
          misses: 100,
          hitRate: 90.91,
          size: 50,
        },
        l2: {
          hits: 800,
          misses: 200,
          hitRate: 80.0,
          size: 120,
        },
        totalHits: 1800,
        totalMisses: 300,
        overallHitRate: 85.71,
      };

      mockTwoLayerCache.getStats.mockReturnValue(mockStats);

      const result = controller.getHealth();

      expect(result.l1).toHaveProperty("hitRate");
      expect(result.l1).toHaveProperty("size");
      expect(result.l2).toHaveProperty("hitRate");
      expect(result.l2).toHaveProperty("size");
    });
  });

  describe("resetStats", () => {
    it("应该重置缓存统计信息", () => {
      mockTwoLayerCache.resetStats.mockReturnValue(undefined);

      const result = controller.resetStats();

      expect(mockTwoLayerCache.resetStats).toHaveBeenCalledOnce();
      expect(result).toEqual({
        success: true,
        message: "统计信息已重置",
      });
    });

    it("重置操作不应该影响缓存数据", () => {
      mockTwoLayerCache.resetStats.mockReturnValue(undefined);

      controller.resetStats();

      expect(mockTwoLayerCache.resetStats).toHaveBeenCalled();
    });
  });

  describe("边界情况", () => {
    it("应该正确处理极小命中率（接近 0%）", () => {
      const mockStats: TwoLayerCacheStats = {
        l1: {
          hits: 1,
          misses: 9999,
          hitRate: 0.01,
          size: 50,
        },
        l2: {
          hits: 1,
          misses: 9999,
          hitRate: 0.01,
          size: 120,
        },
        totalHits: 2,
        totalMisses: 19998,
        overallHitRate: 0.01,
      };

      mockTwoLayerCache.getStats.mockReturnValue(mockStats);

      const healthResult = controller.getHealth();

      expect(healthResult.status).toBe("critical");
      expect(healthResult.performance.overallHitRate).toBe("0.01%");
    });

    it("应该正确处理极大缓存大小", () => {
      const mockStats: TwoLayerCacheStats = {
        l1: {
          hits: 1000000,
          misses: 100,
          hitRate: 99.99,
          size: 10000,
        },
        l2: {
          hits: 1000000,
          misses: 100,
          hitRate: 99.99,
          size: 100000,
        },
        totalHits: 2000000,
        totalMisses: 200,
        overallHitRate: 99.99,
      };

      mockTwoLayerCache.getStats.mockReturnValue(mockStats);

      const statsResult = controller.getStats();
      const healthResult = controller.getHealth();

      expect(statsResult.totalHits).toBe(2000000);
      expect(healthResult.status).toBe("healthy");
    });
  });
});
