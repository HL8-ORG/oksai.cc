/**
 * Redis 缓存测试
 *
 * @description
 * 测试 Redis 缓存功能
 */

import { beforeEach, describe, expect, it } from "vitest";
import { RedisCacheService } from "./redis-cache.service.js";

describe("Redis 缓存服务", () => {
  let cacheService: RedisCacheService;

  beforeEach(() => {
    cacheService = new RedisCacheService({
      max: 1000,
      ttl: 60000,
      enableStats: true,
    });
  });

  describe("内存缓存降级", () => {
    it("应该在未配置 Redis 时使用内存缓存", async () => {
      const key = "test_key";
      const value = { data: "test" };

      await cacheService.set(key, value);
      const result = await cacheService.get(key);

      expect(result).toEqual(value);
    });

    it("应该正确处理 TTL", async () => {
      const key = "test_ttl_key";
      const value = { data: "test" };
      const ttl = 100; // 100ms

      await cacheService.set(key, value, ttl);

      const result1 = await cacheService.get(key);
      expect(result1).toEqual(value);

      await new Promise((resolve) => setTimeout(resolve, 150));

      const result2 = await cacheService.get(key);
      expect(result2).toBeUndefined();
    });

    it("应该正确删除缓存", async () => {
      const key = "test_delete_key";
      const value = { data: "test" };

      await cacheService.set(key, value);
      const deleted = await cacheService.delete(key);

      expect(deleted).toBe(true);

      const result = await cacheService.get(key);
      expect(result).toBeUndefined();
    });

    it("应该正确使用 getOrSet", async () => {
      const key = "test_get_or_set";
      const value = { data: "factory" };
      let factoryCalled = 0;

      const result1 = await cacheService.getOrSet(key, async () => {
        factoryCalled++;
        return value;
      });

      expect(result1).toEqual(value);
      expect(factoryCalled).toBe(1);

      const result2 = await cacheService.getOrSet(key, async () => {
        factoryCalled++;
        return value;
      });

      expect(result2).toEqual(value);
      expect(factoryCalled).toBe(1); // 不应该再次调用 factory
    });

    it("应该正确统计缓存命中率", async () => {
      const key = "test_stats_key";

      await cacheService.get(key); // miss
      await cacheService.set(key, { data: "test" });
      await cacheService.get(key); // hit
      await cacheService.get(key); // hit

      const stats = cacheService.getStats();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(66.67, 1);
    });
  });

  describe("批量操作", () => {
    it("应该支持批量删除（前缀）", async () => {
      await cacheService.set("prefix:key1", { data: 1 });
      await cacheService.set("prefix:key2", { data: 2 });
      await cacheService.set("prefix:key3", { data: 3 });
      await cacheService.set("other:key", { data: 4 });

      const deleted = await cacheService.deleteByPrefix("prefix:");

      expect(deleted).toBe(3);

      const result1 = await cacheService.get("prefix:key1");
      const result2 = await cacheService.get("other:key");

      expect(result1).toBeUndefined();
      expect(result2).toBeDefined();
    });

    it("应该正确检查缓存是否存在", async () => {
      const key = "test_has_key";

      const exists1 = await cacheService.has(key);
      expect(exists1).toBe(false);

      await cacheService.set(key, { data: "test" });

      const exists2 = await cacheService.has(key);
      expect(exists2).toBe(true);
    });
  });
});
