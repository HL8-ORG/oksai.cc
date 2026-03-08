/**
 * @CachedResponse 装饰器测试
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { CacheService } from "../services/cache.service.js";
import { RedisCacheEnhancedService } from "../services/redis-cache-enhanced.service.js";
import { TwoLayerCacheService } from "../services/two-layer-cache.service.js";
import { CachedResponse } from "./cached-response.decorator.js";

describe("@CachedResponse Decorator", () => {
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
    it("应该缓存方法结果", async () => {
      let callCount = 0;

      class TestService {
        @CachedResponse({
          cacheKey: (id: string) => `user:${id}`,
          ttl: 60000,
        })
        async getUser(id: string) {
          callCount++;
          return { id, name: "test", callCount };
        }
      }

      const service = new TestService();
      (service as any).cacheService = twoLayerCache;

      // 首次调用
      const result1 = await service.getUser("123");
      expect(result1).toEqual({ id: "123", name: "test", callCount: 1 });

      // 再次调用（应该从缓存返回）
      const result2 = await service.getUser("123");
      expect(result2).toEqual({ id: "123", name: "test", callCount: 1 });

      // 验证只调用一次
      expect(callCount).toBe(1);
    });

    it("应该使用自定义缓存键构建器", async () => {
      class TestService {
        @CachedResponse({
          cacheKey: (userId: string, postId: string) => `post:${userId}:${postId}`,
          ttl: 60000,
        })
        async getPost(userId: string, postId: string) {
          return { userId, postId, title: "Test Post" };
        }
      }

      const service = new TestService();
      (service as any).cacheService = twoLayerCache;

      await service.getPost("user1", "post1");

      // 验证缓存键被正确构建
      const cached = await twoLayerCache.get("post:user1:post1");
      expect(cached).toEqual({ userId: "user1", postId: "post1", title: "Test Post" });
    });

    it("应该支持异步方法", async () => {
      class TestService {
        @CachedResponse({
          cacheKey: (id: string) => `async:${id}`,
          ttl: 60000,
        })
        async fetchData(id: string) {
          await new Promise((resolve) => setTimeout(resolve, 10));
          return { id, data: "fetched" };
        }
      }

      const service = new TestService();
      (service as any).cacheService = twoLayerCache;

      const start = Date.now();
      await service.fetchData("123"); // 首次调用
      const firstDuration = Date.now() - start;

      const start2 = Date.now();
      await service.fetchData("123"); // 缓存调用
      const secondDuration = Date.now() - start2;

      // 第二次应该更快（从缓存返回）
      expect(secondDuration).toBeLessThan(firstDuration);
    });
  });

  describe("条件缓存", () => {
    it("应该支持 skipCache 条件跳过缓存", async () => {
      let callCount = 0;

      class TestService {
        @CachedResponse({
          cacheKey: (id: string) => `user:${id}`,
          ttl: 60000,
          skipCache: (id: string) => id === "admin",
        })
        async getUser(id: string) {
          callCount++;
          return { id, callCount };
        }
      }

      const service = new TestService();
      (service as any).cacheService = twoLayerCache;

      // admin 用户应该跳过缓存
      await service.getUser("admin");
      await service.getUser("admin");

      // 应该调用两次（跳过缓存）
      expect(callCount).toBe(2);

      // 重置计数
      callCount = 0;

      // 普通用户应该缓存
      await service.getUser("123");
      await service.getUser("123");

      // 只调用一次（缓存）
      expect(callCount).toBe(1);
    });

    it("应该支持 skipSaveToCache 条件不缓存", async () => {
      class TestService {
        @CachedResponse({
          cacheKey: (id: string) => `user:${id}`,
          ttl: 60000,
          skipSaveToCache: (result: any) => result.error,
        })
        async getUser(id: string) {
          if (id === "error") {
            return { id, error: "Not found" };
          }
          return { id, name: "test" };
        }
      }

      const service = new TestService();
      (service as any).cacheService = twoLayerCache;

      // 错误结果不应该缓存
      await service.getUser("error");
      const errorResult = await twoLayerCache.get("user:error");
      expect(errorResult).toBeUndefined();

      // 正常结果应该缓存
      await service.getUser("123");
      const normalResult = await twoLayerCache.get("user:123");
      expect(normalResult).toEqual({ id: "123", name: "test" });
    });
  });

  describe("TTL 配置", () => {
    it("应该使用自定义 TTL", async () => {
      class TestService {
        @CachedResponse({
          cacheKey: (id: string) => `user:${id}`,
          ttl: 30000,
        })
        async getUser(id: string) {
          return { id, name: "test" };
        }
      }

      const service = new TestService();
      (service as any).cacheService = twoLayerCache;

      await service.getUser("123");

      // 验证数据被缓存
      const result = await twoLayerCache.get("user:123");
      expect(result).toEqual({ id: "123", name: "test" });
    });

    it("应该使用默认 TTL（60 秒）", async () => {
      class TestService {
        @CachedResponse({
          cacheKey: (id: string) => `user:${id}`,
        })
        async getUser(id: string) {
          return { id, name: "test" };
        }
      }

      const service = new TestService();
      (service as any).cacheService = twoLayerCache;

      await service.getUser("123");

      const result = await twoLayerCache.get("user:123");
      expect(result).toEqual({ id: "123", name: "test" });
    });
  });

  describe("错误处理", () => {
    it("应该正确处理方法抛出的错误", async () => {
      class TestService {
        @CachedResponse({
          cacheKey: (id: string) => `user:${id}`,
          ttl: 60000,
        })
        async getUser(id: string) {
          if (id === "error") {
            throw new Error("User not found");
          }
          return { id, name: "test" };
        }
      }

      const service = new TestService();
      (service as any).cacheService = twoLayerCache;

      // 错误应该被抛出
      await expect(service.getUser("error")).rejects.toThrow("User not found");

      // 错误不应该被缓存
      const result = await twoLayerCache.get("user:error");
      expect(result).toBeUndefined();
    });

    it("缓存键构建器返回空时应该跳过缓存", async () => {
      let callCount = 0;

      class TestService {
        @CachedResponse({
          cacheKey: (id: string) => (id === "skip" ? "" : `user:${id}`),
          ttl: 60000,
        })
        async getUser(id: string) {
          callCount++;
          return { id, callCount };
        }
      }

      const service = new TestService();
      (service as any).cacheService = twoLayerCache;

      // 空缓存键应该跳过缓存
      await service.getUser("skip");
      await service.getUser("skip");

      // 应该调用两次（跳过缓存）
      expect(callCount).toBe(2);
    });
  });

  describe("性能优化", () => {
    it("应该减少重复计算", async () => {
      let computeCount = 0;

      class TestService {
        @CachedResponse({
          cacheKey: (n: number) => `compute:${n}`,
          ttl: 60000,
        })
        async heavyCompute(n: number): Promise<number> {
          computeCount++;
          await new Promise((resolve) => setTimeout(resolve, 10));
          return n * n;
        }
      }

      const service = new TestService();
      (service as any).cacheService = twoLayerCache;

      // 首次计算
      await service.heavyCompute(10);
      expect(computeCount).toBe(1);

      // 再次计算（应该从缓存返回）
      await service.heavyCompute(10);
      expect(computeCount).toBe(1); // 不应该增加

      // 不同的参数
      await service.heavyCompute(20);
      expect(computeCount).toBe(2); // 应该增加
    });
  });
});
