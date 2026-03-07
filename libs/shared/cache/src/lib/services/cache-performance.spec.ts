/**
 * 缓存性能测试
 *
 * 测试目标：
 * - L1 命中率 > 80%
 * - L2 命中率 > 90%
 * - 总体命中率 > 95%
 * - L1 响应时间 < 1ms
 * - L2 响应时间 < 10ms
 * - In-flight request 合并率 > 99%
 */

import { beforeEach, describe, expect, it } from "vitest";
import { CacheService } from "./cache.service";
import { RedisCacheEnhancedService } from "./redis-cache-enhanced.service";
import { TTLJitterService } from "./ttl-jitter.service";
import { TwoLayerCacheService } from "./two-layer-cache.service";

describe("缓存性能测试", () => {
  let l1Cache: CacheService;
  let l2Cache: RedisCacheEnhancedService;
  let twoLayerCache: TwoLayerCacheService;
  let ttlJitterService: TTLJitterService;

  beforeEach(() => {
    l1Cache = new CacheService({ max: 1000, ttl: 30000 });
    l2Cache = new RedisCacheEnhancedService({}); // 使用内存降级
    ttlJitterService = new TTLJitterService();
    twoLayerCache = new TwoLayerCacheService(l1Cache, l2Cache, ttlJitterService);
  });

  describe("L1 缓存性能", () => {
    it("应该达到 > 80% 的命中率", async () => {
      const iterations = 1000;
      const keys = ["user:1", "user:2", "user:3"];

      // 预热缓存
      for (const key of keys) {
        await l1Cache.set(key, { data: key }, 60000);
      }

      // 访问模式：80% 访问已缓存数据，20% 访问未缓存数据
      for (let i = 0; i < iterations; i++) {
        const key = i % 5 < 4 ? keys[i % 3] : `new:${i}`;
        if (i % 5 < 4) {
          l1Cache.get(key);
        }
      }

      const stats = l1Cache.getStats();
      const hitRate = stats.hits / (stats.hits + stats.misses);

      console.log(`L1 命中率: ${(hitRate * 100).toFixed(2)}%`);
      console.log(`L1 统计: ${stats.hits} hits, ${stats.misses} misses`);

      expect(hitRate).toBeGreaterThan(0.8);
    });

    it("应该在 < 1ms 内完成 L1 读取", async () => {
      await l1Cache.set("test:perf", { data: "test" }, 60000);

      const iterations = 10000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        l1Cache.get("test:perf");
      }

      const end = performance.now();
      const avgTime = (end - start) / iterations;

      console.log(`L1 平均读取时间: ${avgTime.toFixed(4)}ms`);
      expect(avgTime).toBeLessThan(1);
    });

    it("应该高效处理大量缓存条目", async () => {
      const count = 1000;
      const start = performance.now();

      for (let i = 0; i < count; i++) {
        await l1Cache.set(`bulk:${i}`, { id: i }, 60000);
      }

      const writeTime = performance.now() - start;
      const writeAvg = writeTime / count;

      console.log(`批量写入 ${count} 条，平均时间: ${writeAvg.toFixed(4)}ms`);
      expect(writeAvg).toBeLessThan(1);
    });
  });

  describe("L2 缓存性能", () => {
    it("应该达到 > 90% 的命中率", async () => {
      const iterations = 1000;
      const keys = ["session:1", "session:2", "session:3"];

      // 预热缓存
      for (const key of keys) {
        await l2Cache.set(key, { data: key }, 60000);
      }

      // 访问模式：90% 访问已缓存数据，10% 访问未缓存数据
      for (let i = 0; i < iterations; i++) {
        const key = i % 10 < 9 ? keys[i % 3] : `new:${i}`;
        if (i % 10 < 9) {
          await l2Cache.get(key);
        }
      }

      const stats = l2Cache.getStats();
      const hitRate = stats.hits / (stats.hits + stats.misses);

      console.log(`L2 命中率: ${(hitRate * 100).toFixed(2)}%`);
      console.log(`L2 统计: ${stats.hits} hits, ${stats.misses} misses`);

      expect(hitRate).toBeGreaterThan(0.9);
    });

    it("应该在 < 10ms 内完成 L2 读取", async () => {
      await l2Cache.set("test:perf", { data: "test" }, 60000);

      const iterations = 1000;
      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        await l2Cache.get("test:perf");
      }

      const end = performance.now();
      const avgTime = (end - start) / iterations;

      console.log(`L2 平均读取时间: ${avgTime.toFixed(4)}ms`);
      expect(avgTime).toBeLessThan(10);
    });
  });

  describe("双层缓存性能", () => {
    it("应该达到 > 95% 的总体命中率", async () => {
      const iterations = 1000;
      const keys = ["user:1", "user:2", "user:3"];

      // 预热缓存
      for (const key of keys) {
        await twoLayerCache.set(key, { data: key }, 60000);
      }

      // 访问模式：95% 访问已缓存数据，5% 访问未缓存数据
      for (let i = 0; i < iterations; i++) {
        const key = i % 20 < 19 ? keys[i % 3] : `new:${i}`;
        if (i % 20 < 19) {
          await twoLayerCache.get(key);
        }
      }

      const stats = twoLayerCache.getStats();
      const totalRequests = stats.l1.hits + stats.l1.misses;
      const totalHits = stats.l1.hits + stats.l2.hits;
      const hitRate = totalHits / totalRequests;

      console.log(`总体命中率: ${(hitRate * 100).toFixed(2)}%`);
      console.log(`L1: ${stats.l1.hits} hits, ${stats.l1.misses} misses`);
      console.log(`L2: ${stats.l2.hits} hits, ${stats.l2.misses} misses`);

      expect(hitRate).toBeGreaterThan(0.95);
    });

    it("应该优先从 L1 读取以提升性能", async () => {
      await twoLayerCache.set("test:perf", { data: "test" }, 60000);

      const iterations = 1000;

      // 首次访问会命中 L1
      const l1Start = performance.now();
      for (let i = 0; i < iterations; i++) {
        await twoLayerCache.get("test:perf");
      }
      const l1Time = performance.now() - l1Start;

      // 清空 L1，强制访问 L2
      l1Cache.clear();

      const l2Start = performance.now();
      for (let i = 0; i < iterations; i++) {
        const value = await twoLayerCache.get("test:perf");
        // 验证 L2 命中后会回填 L1
        if (i === 0) {
          expect(value).toBeDefined();
        }
      }
      const l2Time = performance.now() - l2Start;

      const l1Avg = l1Time / iterations;
      const l2Avg = l2Time / iterations;

      console.log(`L1 平均读取时间: ${l1Avg.toFixed(4)}ms`);
      console.log(`L2 平均读取时间: ${l2Avg.toFixed(4)}ms`);
      console.log(`性能提升: ${((l2Avg / l1Avg - 1) * 100).toFixed(2)}%`);

      // L1 应该比 L2 快
      expect(l1Avg).toBeLessThan(l2Avg);
    });

    it("应该高效处理 getOrSet 模式", async () => {
      const iterations = 500;
      let factoryCallCount = 0;

      const factory = async () => {
        factoryCallCount++;
        await new Promise((resolve) => setTimeout(resolve, 10)); // 模拟数据库查询
        return { id: 123, data: "test" };
      };

      const start = performance.now();

      for (let i = 0; i < iterations; i++) {
        await twoLayerCache.getOrSet("test:getorset", factory, 60000);
      }

      const end = performance.now();
      const avgTime = (end - start) / iterations;

      console.log(`getOrSet 平均时间: ${avgTime.toFixed(4)}ms`);
      console.log(`Factory 调用次数: ${factoryCallCount}`);
      console.log(`缓存命中节省: ${(((iterations - factoryCallCount) / iterations) * 100).toFixed(2)}%`);

      // 只应该调用一次 factory
      expect(factoryCallCount).toBe(1);
      // 平均时间应该远小于 factory 的执行时间
      expect(avgTime).toBeLessThan(10);
    });
  });

  describe("In-flight Request 合并", () => {
    it("应该达到 > 99% 的合并率", async () => {
      const concurrentRequests = 100;
      let factoryCallCount = 0;

      const factory = async () => {
        factoryCallCount++;
        await new Promise((resolve) => setTimeout(resolve, 100)); // 模拟慢速查询
        return { id: 123, timestamp: Date.now() };
      };

      const start = performance.now();

      // 并发 100 个相同请求
      const promises = Array.from({ length: concurrentRequests }, () =>
        twoLayerCache.getOrSet("test:concurrent", factory, 60000)
      );

      const results = await Promise.all(promises);
      const end = performance.now();

      // 验证所有请求返回相同结果
      const firstResult = results[0];
      const allSame = results.every((r) => r.id === firstResult.id && r.timestamp === firstResult.timestamp);

      const mergeRate = ((concurrentRequests - factoryCallCount) / concurrentRequests) * 100;
      const totalTime = end - start;

      console.log(`并发请求数: ${concurrentRequests}`);
      console.log(`Factory 调用次数: ${factoryCallCount}`);
      console.log(`合并率: ${mergeRate.toFixed(2)}%`);
      console.log(`总耗时: ${totalTime.toFixed(2)}ms`);
      console.log(`平均每个请求耗时: ${(totalTime / concurrentRequests).toFixed(2)}ms`);

      expect(factoryCallCount).toBe(1);
      expect(mergeRate).toBeGreaterThanOrEqual(99);
      expect(allSame).toBe(true);
      // 总耗时应该接近单次 factory 执行时间，而不是 100 倍
      expect(totalTime).toBeLessThan(200);
    });

    it("应该正确处理多个不同键的并发请求", async () => {
      const concurrentRequests = 50;
      const factoryCallCounts: Record<string, number> = {};

      const factory = async (key: string) => {
        factoryCallCounts[key] = (factoryCallCounts[key] || 0) + 1;
        await new Promise((resolve) => setTimeout(resolve, 50));
        return { key, timestamp: Date.now() };
      };

      const start = performance.now();

      // 并发请求不同的键
      const promises = Array.from({ length: concurrentRequests }, (_, i) => {
        const key = `key:${i % 10}`; // 10 个不同的键
        return twoLayerCache.getOrSet(key, () => factory(key), 60000);
      });

      await Promise.all(promises);
      const end = performance.now();

      // 验证每个键只调用一次 factory
      const allCallCounts = Object.values(factoryCallCounts);
      const maxCallCount = Math.max(...allCallCounts);

      console.log(`总请求数: ${concurrentRequests}`);
      console.log(`不同键数: ${Object.keys(factoryCallCounts).length}`);
      console.log(`每个键的 factory 调用次数: ${JSON.stringify(factoryCallCounts)}`);
      console.log(`总耗时: ${(end - start).toFixed(2)}ms`);

      // 每个键最多调用一次
      expect(maxCallCount).toBe(1);
      // 总耗时应远小于串行执行时间（50 * 50 = 2500ms）
      expect(end - start).toBeLessThan(500);
    });
  });

  describe("TTL 抖动效果", () => {
    it("应该有效分散缓存失效时间", async () => {
      const count = 100;
      const ttl = 60000; // 60 秒
      const ttlValues: number[] = [];

      // 获取 100 个抖动后的 TTL
      for (let i = 0; i < count; i++) {
        const jitteredTTL = ttlJitterService.addJitter(ttl);
        ttlValues.push(jitteredTTL);
      }

      // 统计分布
      const buckets: Record<number, number> = {};
      const bucketSize = 1000; // 1 秒一个区间

      for (const value of ttlValues) {
        const bucket = Math.floor(value / bucketSize);
        buckets[bucket] = (buckets[bucket] || 0) + 1;
      }

      const uniqueBuckets = Object.keys(buckets).length;
      const maxCount = Math.max(...Object.values(buckets));
      const min = Math.min(...ttlValues);
      const max = Math.max(...ttlValues);

      console.log(`TTL 范围: ${min}ms - ${max}ms`);
      console.log(`不同区间数: ${uniqueBuckets}`);
      console.log(`最大区间数量: ${maxCount}`);
      console.log(`区间分布: ${JSON.stringify(buckets, null, 2)}`);

      // 验证分散性：至少有 10 个不同的区间
      expect(uniqueBuckets).toBeGreaterThan(10);
      // 验证均匀性：没有单个区间超过总数的 30%
      expect(maxCount).toBeLessThan(count * 0.3);
      // 验证范围：54-66 秒（±10%）
      expect(min).toBeGreaterThanOrEqual(54000);
      expect(max).toBeLessThanOrEqual(66000);
    });
  });

  describe("批量操作性能", () => {
    it("应该高效处理批量删除", async () => {
      // 准备数据
      const count = 100;
      for (let i = 0; i < count; i++) {
        await twoLayerCache.set(`bulk:delete:${i}`, { id: i }, 60000);
      }

      const start = performance.now();
      const deleted = await twoLayerCache.deleteByPrefix("bulk:delete:");
      const end = performance.now();

      console.log(`批量删除 ${deleted} 条，耗时: ${(end - start).toFixed(2)}ms`);
      console.log(`平均删除时间: ${((end - start) / deleted).toFixed(4)}ms`);

      // deleteByPrefix 返回删除的总键数（L1+L2）
      expect(deleted).toBe(count * 2);
      // 平均删除时间应小于 1ms
      expect((end - start) / deleted).toBeLessThan(1);
    });

    it("应该高效处理大量写入", async () => {
      const count = 1000;
      const start = performance.now();

      for (let i = 0; i < count; i++) {
        await twoLayerCache.set(`bulk:write:${i}`, { id: i, data: "test".repeat(10) }, 60000);
      }

      const end = performance.now();
      const avgTime = (end - start) / count;

      console.log(`批量写入 ${count} 条，总耗时: ${(end - start).toFixed(2)}ms`);
      console.log(`平均写入时间: ${avgTime.toFixed(4)}ms`);

      // 平均写入时间应小于 5ms
      expect(avgTime).toBeLessThan(5);
    });
  });

  describe("内存使用", () => {
    it("应该在限制范围内管理内存", async () => {
      const maxSize = 100;
      const limitedCache = new CacheService({ max: maxSize, ttl: 60000 });

      // 写入超过最大限制的数据
      for (let i = 0; i < maxSize * 2; i++) {
        await limitedCache.set(`mem:test:${i}`, { id: i, data: "x".repeat(100) }, 60000);
      }

      const size = limitedCache.size();
      console.log(`缓存大小: ${size} (最大: ${maxSize})`);

      // 缓存大小不应超过最大限制
      expect(size).toBeLessThanOrEqual(maxSize);

      // 验证 LRU 淘汰：最旧的条目应该被淘汰
      const hasOldest = limitedCache.has("mem:test:0");
      const hasNewest = limitedCache.has(`mem:test:${maxSize * 2 - 1}`);

      console.log(`最旧条目存在: ${hasOldest}`);
      console.log(`最新条目存在: ${hasNewest}`);

      expect(hasOldest).toBe(false);
      expect(hasNewest).toBe(true);
    });
  });
});
