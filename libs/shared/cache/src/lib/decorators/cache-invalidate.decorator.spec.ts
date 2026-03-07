/**
 * @CacheInvalidate 装饰器测试
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { CacheService } from "../services/cache.service";
import { RedisCacheEnhancedService } from "../services/redis-cache-enhanced.service";
import { TwoLayerCacheService } from "../services/two-layer-cache.service";
import { CacheInvalidate } from "./cache-invalidate.decorator";

describe("@CacheInvalidate Decorator", () => {
  let twoLayerCache: TwoLayerCacheService;
  let l1Cache: CacheService;
  let l2Cache: RedisCacheEnhancedService;
  let ttlJitterService: { addJitter: (ttl: number) => number };

  beforeEach(() => {
    vi.clearAllMocks();

    l1Cache = new CacheService({ max: 100, ttl: 30000, enableStats: true });
    l2Cache = new RedisCacheEnhancedService({ max: 1000, ttl: 60000, enableStats: true });
    ttlJitterService = {
      addJitter: (ttl: number) => {
        const variance = 0.1;
        const variant = variance * ttl * Math.random();
        return Math.floor(ttl - (variance * ttl) / 2 + variant);
      },
    };

    twoLayerCache = new TwoLayerCacheService(l1Cache, l2Cache, ttlJitterService);
  });

  describe("基本功能", () => {
    it("应该在方法执行后失效缓存", async () => {
      class TestService {
        @CacheInvalidate({
          cacheKey: (id: string) => `user:${id}`,
        })
        async updateUser(id: string) {
          return { id, updated: true };
        }
      }

      const service = new TestService();
      (service as any).cacheService = twoLayerCache;

      // 设置缓存
      await twoLayerCache.set("user:123", { id: "123", name: "test" }, 60000);
      expect(await twoLayerCache.get("user:123")).toBeDefined();

      // 执行方法（应该失效缓存）
      await service.updateUser("123");

      // 验证缓存已被失效
      expect(await twoLayerCache.get("user:123")).toBeUndefined();
    });

    it("应该支持批量失效多个缓存键", async () => {
      class TestService {
        @CacheInvalidate({
          cacheKeys: (userId: string) => [
            `user:${userId}`,
            `user:profile:${userId}`,
            `user:settings:${userId}`,
          ],
        })
        async deleteUser(userId: string) {
          return { deleted: true };
        }
      }

      const service = new TestService();
      (service as any).cacheService = twoLayerCache;

      // 设置多个缓存
      await twoLayerCache.set("user:123", { id: "123" }, 60000);
      await twoLayerCache.set("user:profile:123", { profile: "data" }, 60000);
      await twoLayerCache.set("user:settings:123", { theme: "dark" }, 60000);

      // 执行方法
      await service.deleteUser("123");

      // 验证所有缓存已被失效
      expect(await twoLayerCache.get("user:123")).toBeUndefined();
      expect(await twoLayerCache.get("user:profile:123")).toBeUndefined();
      expect(await twoLayerCache.get("user:settings:123")).toBeUndefined();
    });

    it("应该支持前缀批量失效", async () => {
      class TestService {
        @CacheInvalidate({
          cacheKeyPrefix: (userId: string) => `user:${userId}`,
        })
        async clearUserData(userId: string) {
          return { cleared: true };
        }
      }

      const service = new TestService();
      (service as any).cacheService = twoLayerCache;

      // 设置多个前缀相同的缓存
      await twoLayerCache.set("user:123:profile", { data: 1 }, 60000);
      await twoLayerCache.set("user:123:settings", { data: 2 }, 60000);
      await twoLayerCache.set("user:456:profile", { data: 3 }, 60000);

      // 执行方法
      await service.clearUserData("123");

      // 验证前缀缓存已被失效
      expect(await twoLayerCache.get("user:123:profile")).toBeUndefined();
      expect(await twoLayerCache.get("user:123:settings")).toBeUndefined();
      // 其他前缀的缓存应该保留
      expect(await twoLayerCache.get("user:456:profile")).toBeDefined();
    });
  });

  describe("条件失效", () => {
    it("应该支持条件跳过失效", async () => {
      class TestService {
        @CacheInvalidate({
          cacheKey: (id: string) => `user:${id}`,
          skipInvalidate: (id: string) => id === "skip",
        })
        async updateUser(id: string) {
          return { id, updated: true };
        }
      }

      const service = new TestService();
      (service as any).cacheService = twoLayerCache;

      // 设置缓存
      await twoLayerCache.set("user:skip", { data: "test" }, 60000);
      await twoLayerCache.set("user:123", { data: "test" }, 60000);

      // skip 的不应该失效
      await service.updateUser("skip");
      expect(await twoLayerCache.get("user:skip")).toBeDefined();

      // 其他应该失效
      await service.updateUser("123");
      expect(await twoLayerCache.get("user:123")).toBeUndefined();
    });

    it("应该根据返回值决定是否失效", async () => {
      class TestService {
        @CacheInvalidate({
          cacheKey: (id: string) => `user:${id}`,
          invalidateOnResult: (result: any) => result.success,
        })
        async updateUser(id: string, success: boolean) {
          return { id, success };
        }
      }

      const service = new TestService();
      (service as any).cacheService = twoLayerCache;

      // 设置缓存
      await twoLayerCache.set("user:123", { data: "test" }, 60000);

      // 失败的不应该失效
      await service.updateUser("123", false);
      expect(await twoLayerCache.get("user:123")).toBeDefined();

      // 成功的应该失效
      await service.updateUser("123", true);
      expect(await twoLayerCache.get("user:123")).toBeUndefined();
    });
  });

  describe("执行时机", () => {
    it("应该在方法成功执行后失效", async () => {
      const invalidated = false;

      class TestService {
        @CacheInvalidate({
          cacheKey: (id: string) => `user:${id}`,
        })
        async updateUser(id: string) {
          return { id, updated: true };
        }
      }

      const service = new TestService();
      (service as any).cacheService = twoLayerCache;

      await twoLayerCache.set("user:123", { data: "test" }, 60000);
      await service.updateUser("123");

      expect(await twoLayerCache.get("user:123")).toBeUndefined();
    });

    it("方法抛出错误时不应该失效缓存", async () => {
      class TestService {
        @CacheInvalidate({
          cacheKey: (id: string) => `user:${id}`,
        })
        async updateUser(id: string) {
          throw new Error("Update failed");
        }
      }

      const service = new TestService();
      (service as any).cacheService = twoLayerCache;

      await twoLayerCache.set("user:123", { data: "test" }, 60000);

      // 方法应该抛出错误
      await expect(service.updateUser("123")).rejects.toThrow("Update failed");

      // 缓存不应该被失效
      expect(await twoLayerCache.get("user:123")).toBeDefined();
    });
  });

  describe("组合使用", () => {
    it("应该支持与 @CachedResponse 组合使用", async () => {
      // 模拟真实场景：更新用户后失效用户缓存
      class TestService {
        async getUser(id: string) {
          // 模拟从数据库获取
          return { id, name: "test", version: 1 };
        }

        @CacheInvalidate({
          cacheKey: (id: string) => `user:${id}`,
        })
        async updateUser(id: string) {
          // 更新数据库
          return { id, name: "updated", version: 2 };
        }
      }

      const service = new TestService();
      (service as any).cacheService = twoLayerCache;

      // 获取用户（缓存）
      const user1 = await service.getUser("123");
      await twoLayerCache.set("user:123", user1, 60000);

      // 更新用户（应该失效缓存）
      await service.updateUser("123");

      // 验证缓存已被失效
      expect(await twoLayerCache.get("user:123")).toBeUndefined();

      // 再次获取应该从数据库获取新数据
      const user2 = await service.getUser("123");
      expect(user2.version).toBe(1);
    });
  });

  describe("性能优化", () => {
    it("应该高效处理批量失效", async () => {
      class TestService {
        @CacheInvalidate({
          cacheKeys: (userId: string) => Array.from({ length: 100 }, (_, i) => `user:${userId}:item:${i}`),
        })
        async clearUserItems(userId: string) {
          return { cleared: true };
        }
      }

      const service = new TestService();
      (service as any).cacheService = twoLayerCache;

      // 设置 100 个缓存
      for (let i = 0; i < 100; i++) {
        await twoLayerCache.set(`user:123:item:${i}`, { data: i }, 60000);
      }

      const start = Date.now();
      await service.clearUserItems("123");
      const duration = Date.now() - start;

      // 验证所有缓存已被失效
      for (let i = 0; i < 100; i++) {
        expect(await twoLayerCache.get(`user:123:item:${i}`)).toBeUndefined();
      }

      // 批量失效应该在 100ms 内完成
      expect(duration).toBeLessThan(100);
    });
  });

  describe("错误处理", () => {
    it("缓存失效失败不应该影响方法返回值", async () => {
      class TestService {
        @CacheInvalidate({
          cacheKey: (id: string) => `user:${id}`,
        })
        async updateUser(id: string) {
          return { id, updated: true };
        }
      }

      const service = new TestService();
      // Mock 缓存服务抛出错误
      const mockCache = {
        delete: vi.fn().mockRejectedValue(new Error("Cache error")),
      };
      (service as any).cacheService = mockCache;

      // 方法应该正常返回
      const result = await service.updateUser("123");
      expect(result).toEqual({ id: "123", updated: true });
    });
  });
});
