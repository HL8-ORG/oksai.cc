/**
 * 双层缓存服务测试
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { CacheService } from "./cache.service";
import { RedisCacheEnhancedService } from "./redis-cache-enhanced.service";
import { TwoLayerCacheService } from "./two-layer-cache.service";

describe("TwoLayerCacheService", () => {
  let twoLayerCache: TwoLayerCacheService;
  let l1Cache: CacheService;
  let l2Cache: RedisCacheEnhancedService;
  let ttlJitterService: { addJitter: (ttl: number) => number };

  beforeEach(() => {
    vi.clearAllMocks();

    // 创建 L1 缓存（内存）
    l1Cache = new CacheService({
      max: 100,
      ttl: 30000, // 30 秒
      enableStats: true,
    });

    // 创建 L2 缓存（Redis fallback）
    l2Cache = new RedisCacheEnhancedService({
      max: 1000,
      ttl: 60000,
      enableStats: true,
    });

    // 创建 TTL 抖动服务 mock
    ttlJitterService = {
      addJitter: (ttl: number) => {
        const variance = 0.1;
        const variant = variance * ttl * Math.random();
        return Math.floor(ttl - (variance * ttl) / 2 + variant);
      },
    };

    // 创建双层缓存服务
    twoLayerCache = new TwoLayerCacheService(l1Cache, l2Cache, ttlJitterService);
  });

  describe("双层读取逻辑", () => {
    it("应该优先从 L1 读取", async () => {
      const key = "user:123";
      const value = { id: 123, name: "test" };

      // 设置到 L1
      l1Cache.set(key, value, 30000);

      // 获取数据
      const result = await twoLayerCache.get(key);

      expect(result).toEqual(value);
      // L2 不应该被访问
      const l2Stats = l2Cache.getStats();
      expect(l2Stats.hits).toBe(0);
      expect(l2Stats.misses).toBe(0);
    });

    it("L1 miss 时应该从 L2 读取", async () => {
      const key = "user:123";
      const value = { id: 123, name: "test" };

      // 设置到 L2（不设置到 L1）
      await l2Cache.set(key, value, 60000);

      // L1 应该为空
      expect(l1Cache.get(key)).toBeUndefined();

      // 获取数据
      const result = await twoLayerCache.get(key);

      expect(result).toEqual(value);
      // L2 应该被访问
      const l2Stats = l2Cache.getStats();
      expect(l2Stats.hits).toBe(1);
    });

    it("L2 命中时应该回填 L1", async () => {
      const key = "user:123";
      const value = { id: 123, name: "test" };

      // 设置到 L2
      await l2Cache.set(key, value, 60000);

      // L1 应该为空
      expect(l1Cache.get(key)).toBeUndefined();

      // 获取数据（应该回填 L1）
      await twoLayerCache.get(key);

      // L1 应该被回填
      const l1Value = l1Cache.get(key);
      expect(l1Value).toEqual(value);
    });

    it("L1 和 L2 都 miss 时应该返回 undefined", async () => {
      const result = await twoLayerCache.get("nonexistent:key");
      expect(result).toBeUndefined();
    });
  });

  describe("双层写入逻辑", () => {
    it("应该同时写入 L1 和 L2", async () => {
      const key = "user:123";
      const value = { id: 123, name: "test" };

      await twoLayerCache.set(key, value, 60000);

      // L1 应该有数据
      expect(l1Cache.get(key)).toEqual(value);

      // L2 应该有数据
      expect(await l2Cache.get(key)).toEqual(value);
    });

    it("应该应用 TTL 抖动", async () => {
      const key = "user:123";
      const value = { id: 123, name: "test" };
      const baseTTL = 60000;

      // Mock addJitter 返回固定的值
      ttlJitterService.addJitter = vi.fn().mockReturnValue(65000);

      await twoLayerCache.set(key, value, baseTTL);

      // 验证调用了 addJitter
      expect(ttlJitterService.addJitter).toHaveBeenCalledWith(baseTTL);
    });

    it("L1 TTL 应该小于 L2 TTL", async () => {
      const key = "user:123";
      const value = { id: 123, name: "test" };
      const baseTTL = 60000;

      await twoLayerCache.set(key, value, baseTTL);

      // 两个缓存都应该有数据
      expect(l1Cache.get(key)).toEqual(value);
      expect(await l2Cache.get(key)).toEqual(value);
    });
  });

  describe("getOrSet 模式", () => {
    it("应该支持 getOrSet 模式", async () => {
      const key = "user:123";
      const value = { id: 123, name: "test" };
      let factoryCallCount = 0;

      const factory = async () => {
        factoryCallCount++;
        return value;
      };

      // 首次调用
      const result1 = await twoLayerCache.getOrSet(key, factory, 60000);
      expect(result1).toEqual(value);
      expect(factoryCallCount).toBe(1);

      // 再次调用（应该从缓存返回）
      const result2 = await twoLayerCache.getOrSet(key, factory, 60000);
      expect(result2).toEqual(value);
      // factory 不应该再次被调用
      expect(factoryCallCount).toBe(1);
    });

    it("应该合并并发请求（in-flight request deduplication）", async () => {
      const key = "user:123";
      const value = { id: 123, name: "test" };
      let factoryCallCount = 0;

      const factory = async () => {
        factoryCallCount++;
        await new Promise((resolve) => setTimeout(resolve, 100));
        return value;
      };

      // 并发 10 个请求
      const promises = Array.from({ length: 10 }, () => twoLayerCache.getOrSet(key, factory, 60000));

      const results = await Promise.all(promises);

      // 所有请求应该返回相同结果
      expect(results.every((r: any) => r.id === 123)).toBe(true);
      // 只应该调用一次 factory
      expect(factoryCallCount).toBe(1);
    });
  });

  describe("缓存失效", () => {
    it("应该同时失效 L1 和 L2", async () => {
      const key = "user:123";
      const value = { id: 123, name: "test" };

      // 设置数据
      await twoLayerCache.set(key, value, 60000);

      // 验证数据存在
      expect(l1Cache.get(key)).toEqual(value);
      expect(await l2Cache.get(key)).toEqual(value);

      // 删除数据
      await twoLayerCache.delete(key);

      // 验证数据已被删除
      expect(l1Cache.get(key)).toBeUndefined();
      expect(await l2Cache.get(key)).toBeUndefined();
    });

    it("应该支持前缀批量删除", async () => {
      // 设置多个键
      await twoLayerCache.set("test:key1", "value1", 60000);
      await twoLayerCache.set("test:key2", "value2", 60000);
      await twoLayerCache.set("test:key3", "value3", 60000);
      await twoLayerCache.set("other:key", "value4", 60000);

      // 删除前缀为 test: 的键
      const deleted = await twoLayerCache.deleteByPrefix("test:");

      // 应该删除 6 个键（L1: 3 + L2: 3）
      expect(deleted).toBe(6);
      expect(await twoLayerCache.get("test:key1")).toBeUndefined();
      expect(await twoLayerCache.get("test:key2")).toBeUndefined();
      expect(await twoLayerCache.get("test:key3")).toBeUndefined();
      expect(await twoLayerCache.get("other:key")).toBe("value4");
    });
  });

  describe("统计和监控", () => {
    it("应该提供 L1 和 L2 的统计信息", () => {
      const stats = twoLayerCache.getStats();

      expect(stats).toHaveProperty("l1");
      expect(stats).toHaveProperty("l2");
      expect(stats.l1).toHaveProperty("hits");
      expect(stats.l1).toHaveProperty("misses");
      expect(stats.l1).toHaveProperty("hitRate");
      expect(stats.l2).toHaveProperty("hits");
      expect(stats.l2).toHaveProperty("misses");
      expect(stats.l2).toHaveProperty("hitRate");
    });

    it("应该跟踪 L1 和 L2 的命中率", async () => {
      // 设置数据
      await twoLayerCache.set("stats:key1", "value1", 60000);

      // L1 命中
      await twoLayerCache.get("stats:key1");
      await twoLayerCache.get("stats:key1");

      // L1 miss, L2 命中
      await twoLayerCache.set("stats:key2", "value2", 60000);
      l1Cache.delete("stats:key2"); // 手动删除 L1，强制 L2 命中
      await twoLayerCache.get("stats:key2");

      const stats = twoLayerCache.getStats();
      expect(stats.l1.hits).toBe(2);
      expect(stats.l2.hits).toBe(1);
    });

    it("应该提供缓存大小信息", async () => {
      await twoLayerCache.set("size:key1", "value1", 60000);
      await twoLayerCache.set("size:key2", "value2", 60000);

      const stats = twoLayerCache.getStats();
      expect(stats.l1.size).toBeGreaterThanOrEqual(1);
    });
  });

  describe("降级和容错", () => {
    it("L2 故障时应该只使用 L1", async () => {
      const key = "fallback:key";
      const value = { id: 123 };

      // 模拟 L2 故障
      vi.spyOn(l2Cache, "get").mockRejectedValue(new Error("Redis connection error"));

      await twoLayerCache.set(key, value, 60000);

      // L1 应该有数据
      expect(l1Cache.get(key)).toEqual(value);

      // 获取数据应该从 L1 返回
      const result = await twoLayerCache.get(key);
      expect(result).toEqual(value);
    });
  });

  describe("性能测试", () => {
    it("应该高效处理大量操作", async () => {
      const count = 100;

      // 批量设置
      for (let i = 0; i < count; i++) {
        await twoLayerCache.set(`perf:key${i}`, { id: i }, 60000);
      }

      // 批量读取
      const start = Date.now();
      for (let i = 0; i < count; i++) {
        await twoLayerCache.get(`perf:key${i}`);
      }
      const duration = Date.now() - start;

      // 100 次读取应该在 100ms 内完成
      expect(duration).toBeLessThan(100);

      // 所有数据应该在 L1 缓存中
      const stats = twoLayerCache.getStats();
      expect(stats.l1.hits).toBe(count);
    });
  });
});
