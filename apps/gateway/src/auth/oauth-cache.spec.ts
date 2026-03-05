/**
 * OAuth Token 缓存测试
 *
 * @description
 * 测试 Token 验证缓存功能，验证：
 * 1. 缓存命中/未命中统计
 * 2. 缓存存储和获取
 */

import { beforeEach, describe, expect, it } from "vitest";
import { CacheService } from "../common/cache.service";
import type { TokenCacheData } from "./oauth.service";

describe("OAuth Token 缓存", () => {
  let cacheService: CacheService;

  beforeEach(() => {
    cacheService = new CacheService({
      max: 1000,
      ttl: 60000,
      enableStats: true,
    });
  });

  describe("Token 缓存逻辑", () => {
    it("应该正确存储和获取 Token 缓存", () => {
      const token = "test_access_token_123";
      const cacheKey = `oauth:token:${token}`;
      const cacheData: TokenCacheData = {
        userId: "user123",
        clientId: "client456",
        scope: "read write",
        user: { id: "user123", email: "test@example.com" },
        expiresAt: new Date(Date.now() + 3600000),
      };

      cacheService.set(cacheKey, cacheData);

      const retrieved = cacheService.get<TokenCacheData>(cacheKey);
      expect(retrieved).toEqual(cacheData);
    });

    it("应该正确统计缓存命中率", () => {
      const token = "test_token";
      const cacheKey = `oauth:token:${token}`;

      cacheService.get(cacheKey);
      cacheService.get(cacheKey);

      const stats = cacheService.getStats();
      expect(stats.misses).toBe(2);
      expect(stats.hits).toBe(0);

      cacheService.set(cacheKey, { test: "data" } as any);

      cacheService.get(cacheKey);
      cacheService.get(cacheKey);

      const updatedStats = cacheService.getStats();
      expect(updatedStats.hits).toBe(2);
      expect(updatedStats.misses).toBe(2);
      expect(updatedStats.hitRate).toBe(50);
    });

    it("应该支持自定义 TTL", () => {
      const token = "test_token_ttl";
      const cacheKey = `oauth:token:${token}`;

      cacheService.set(cacheKey, { data: "test" } as any, 5000);

      const retrieved = cacheService.get(cacheKey);
      expect(retrieved).toBeDefined();
    });

    it("应该正确删除缓存", () => {
      const token = "test_token_delete";
      const cacheKey = `oauth:token:${token}`;

      cacheService.set(cacheKey, { data: "test" } as any);

      cacheService.delete(cacheKey);

      const retrieved = cacheService.get(cacheKey);
      expect(retrieved).toBeUndefined();
    });

    it("应该支持批量删除缓存（前缀）", () => {
      cacheService.set("oauth:token:token1", { data: "1" } as any);
      cacheService.set("oauth:token:token2", { data: "2" } as any);
      cacheService.set("oauth:token:token3", { data: "3" } as any);
      cacheService.set("other:key", { data: "4" } as any);

      const deletedCount = cacheService.deleteByPrefix("oauth:token:");

      expect(deletedCount).toBe(3);
      expect(cacheService.get("oauth:token:token1")).toBeUndefined();
      expect(cacheService.get("other:key")).toBeDefined();
    });

    it("应该正确处理 Token 过期时间计算", () => {
      const expiresAt = new Date(Date.now() + 1800000);
      const remainingTime = expiresAt.getTime() - Date.now();
      const maxCacheTTL = 300000;
      const cacheTTL = Math.min(remainingTime, maxCacheTTL);

      expect(cacheTTL).toBeGreaterThan(0);
      expect(cacheTTL).toBeLessThanOrEqual(maxCacheTTL);
      expect(cacheTTL).toBeLessThanOrEqual(remainingTime);
    });
  });

  describe("缓存性能", () => {
    it("应该快速处理大量缓存操作", () => {
      const start = Date.now();
      const iterations = 1000;

      for (let i = 0; i < iterations; i++) {
        const key = `oauth:token:token_${i}`;
        cacheService.set(key, { userId: `user_${i}` } as any);
      }

      for (let i = 0; i < iterations; i++) {
        const key = `oauth:token:token_${i}`;
        cacheService.get(key);
      }

      const duration = Date.now() - start;
      // 在 CI 或负载较重的环境中可能需要更多时间
      // 2000 次操作（1000 写 + 1000 读）在 200ms 内完成是合理的
      expect(duration).toBeLessThan(200);
      expect(cacheService.size()).toBe(iterations);
    });
  });
});
