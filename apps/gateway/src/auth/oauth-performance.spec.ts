/**
 * OAuth Token 验证性能测试
 *
 * @description
 * 测量 Token 验证缓存的性能提升
 */

import process from "node:process";
import { beforeEach, describe, expect, it } from "vitest";
import { CacheService } from "../common/cache.service";

describe("OAuth Token 验证性能", () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService({
      max: 10000,
      ttl: 300000, // 5 分钟
      enableStats: false,
    });
  });

  describe("缓存性能测试", () => {
    it("应该正确计算缓存带来的性能提升", async () => {
      const iterations = 100;
      const cacheKey = "oauth:token:test_token";
      const cacheData = {
        userId: "user123",
        clientId: "client456",
        scope: "read write",
        user: { id: "user123", email: "test@example.com" },
        expiresAt: new Date(Date.now() + 3600000),
      };

      const noCacheStart = Date.now();
      for (let i = 0; i < iterations; i++) {
        cacheService.get(cacheKey);
      }
      const noCacheTime = Date.now() - noCacheStart;

      cacheService.set(cacheKey, cacheData as any);

      const withCacheStart = Date.now();
      for (let i = 0; i < iterations; i++) {
        cacheService.get(cacheKey);
      }
      const withCacheTime = Date.now() - withCacheStart;

      const improvement = ((noCacheTime - withCacheTime) / noCacheTime) * 100;

      console.log("\n📊 性能测试结果:");
      console.log(`  无缓存: ${noCacheTime}ms (${iterations} 次查询)`);
      console.log(`  有缓存: ${withCacheTime}ms (${iterations} 次查询)`);
      console.log(`  性能提升: ${improvement.toFixed(2)}%`);
      console.log(`  平均查询时间: ${(withCacheTime / iterations).toFixed(3)}ms`);

      // 缓存命中时间应该合理（100 次操作应在 50ms 内完成）
      expect(withCacheTime).toBeLessThan(50);
      // 缓存数据应该正确
      const cachedData = cacheService.get(cacheKey);
      expect(cachedData).toBeDefined();
      expect(cachedData?.userId).toBe("user123");
    });

    it("应该快速处理大量缓存操作", () => {
      const iterations = 10000;
      const start = Date.now();

      for (let i = 0; i < iterations; i++) {
        const key = `oauth:token:token_${i}`;
        cacheService.set(key, { userId: `user_${i}` } as any);
      }

      const setTime = Date.now() - start;

      const getStart = Date.now();
      for (let i = 0; i < iterations; i++) {
        const key = `oauth:token:token_${i}`;
        cacheService.get(key);
      }
      const getTime = Date.now() - getStart;

      console.log("\n🚀 大量缓存操作性能:");
      console.log(`  设置 ${iterations} 个缓存: ${setTime}ms`);
      console.log(`  获取 ${iterations} 个缓存: ${getTime}ms`);
      console.log(`  平均设置时间: ${(setTime / iterations).toFixed(3)}ms`);
      console.log(`  平均获取时间: ${(getTime / iterations).toFixed(3)}ms`);

      expect(setTime).toBeLessThan(1000);
      expect(getTime).toBeLessThan(500);
    });

    it("应该在缓存容量达到上限时自动淘汰旧数据", () => {
      const maxCacheSize = 1000;
      const smallCache = new CacheService({
        max: maxCacheSize,
        ttl: 60000,
        enableStats: false,
      });

      for (let i = 0; i < maxCacheSize * 2; i++) {
        smallCache.set(`key_${i}`, { value: i });
      }

      const size = smallCache.size();
      console.log("\n📦 缓存容量测试:");
      console.log(`  最大容量: ${maxCacheSize}`);
      console.log(`  插入数量: ${maxCacheSize * 2}`);
      console.log(`  实际容量: ${size}`);

      expect(size).toBeLessThanOrEqual(maxCacheSize);
    });
  });

  describe("内存使用测试", () => {
    it("应该高效使用内存", () => {
      const iterations = 5000;
      const startMemory = process.memoryUsage().heapUsed;

      for (let i = 0; i < iterations; i++) {
        const key = `oauth:token:token_${i}`;
        const data = {
          userId: `user_${i}`,
          clientId: `client_${i}`,
          scope: "read write delete",
          user: {
            id: `user_${i}`,
            email: `user${i}@example.com`,
            name: `User ${i}`,
          },
          expiresAt: new Date(Date.now() + 3600000),
        };
        cacheService.set(key, data as any);
      }

      const endMemory = process.memoryUsage().heapUsed;
      const memoryIncrease = endMemory - startMemory;
      const memoryPerItem = memoryIncrease / iterations;

      console.log("\n💾 内存使用测试:");
      console.log(`  缓存数量: ${iterations}`);
      console.log(`  内存增加: ${(memoryIncrease / 1024 / 1024).toFixed(2)} MB`);
      console.log(`  平均每项: ${(memoryPerItem / 1024).toFixed(2)} KB`);

      expect(memoryPerItem).toBeLessThan(2 * 1024);
    });
  });

  describe("并发访问测试", () => {
    it("应该正确处理并发读写", async () => {
      const concurrentOps = 100;
      const promises: Promise<void>[] = [];

      const start = Date.now();

      for (let i = 0; i < concurrentOps; i++) {
        const index = i;
        promises.push(
          (async () => {
            const key = `concurrent_key_${index % 10}`;
            if (index % 2 === 0) {
              cacheService.set(key, { value: index });
            } else {
              cacheService.get(key);
            }
          })()
        );
      }

      await Promise.all(promises);

      const duration = Date.now() - start;

      console.log("\n🔄 并发访问测试:");
      console.log(`  并发操作数: ${concurrentOps}`);
      console.log(`  总耗时: ${duration}ms`);
      console.log(`  平均每操作: ${(duration / concurrentOps).toFixed(3)}ms`);

      expect(duration).toBeLessThan(100);
    });
  });
});
