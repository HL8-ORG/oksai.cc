/**
 * 缓存服务测试
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { CacheService } from "./cache.service";

describe("CacheService", () => {
  let cacheService: CacheService;

  beforeEach(() => {
    vi.clearAllMocks();
    cacheService = new CacheService({ max: 100, ttl: 1000, enableStats: false });
  });

  describe("get / set", () => {
    it("应该成功设置和获取缓存", () => {
      // Arrange
      const key = "test-key";
      const value = { name: "test" };

      // Act
      cacheService.set(key, value);
      const result = cacheService.get(key);

      // Assert
      expect(result).toEqual(value);
    });

    it("获取不存在的缓存应该返回 undefined", () => {
      // Act
      const result = cacheService.get("non-existent-key");

      // Assert
      expect(result).toBeUndefined();
    });

    it("应该支持自定义 TTL", async () => {
      // Arrange
      const key = "test-key";
      const value = "test-value";

      // Act
      cacheService.set(key, value, 100); // 100ms TTL

      // Assert - 立即获取应该存在
      expect(cacheService.get(key)).toBe("test-value");

      // 等待 TTL 过期
      await new Promise((resolve) => setTimeout(resolve, 150));

      // Assert - 过期后应该返回 undefined
      expect(cacheService.get(key)).toBeUndefined();
    });
  });

  describe("getOrSet", () => {
    it("缓存不存在时应该调用 factory 并缓存结果", async () => {
      // Arrange
      const key = "test-key";
      const value = { id: "123", name: "test" };
      const factory = vi.fn().mockResolvedValue(value);

      // Act
      const result = await cacheService.getOrSet(key, factory);

      // Assert
      expect(result).toEqual(value);
      expect(factory).toHaveBeenCalledTimes(1);
    });

    it("缓存存在时不应该调用 factory", async () => {
      // Arrange
      const key = "test-key";
      const value = { id: "123", name: "test" };
      cacheService.set(key, value);
      const factory = vi.fn().mockResolvedValue({ id: "456", name: "new" });

      // Act
      const result = await cacheService.getOrSet(key, factory);

      // Assert
      expect(result).toEqual(value);
      expect(factory).not.toHaveBeenCalled();
    });

    it("应该支持自定义 TTL", async () => {
      // Arrange
      const key = "test-key";
      const value = "test-value";
      const factory = vi.fn().mockResolvedValue(value);

      // Act
      const result = await cacheService.getOrSet(key, factory, 100);

      // Assert
      expect(result).toBe("test-value");
      expect(factory).toHaveBeenCalledTimes(1);

      // 等待 TTL 过期
      await new Promise((resolve) => setTimeout(resolve, 150));

      // 再次获取应该调用 factory
      factory.mockClear();
      await cacheService.getOrSet(key, factory, 100);
      expect(factory).toHaveBeenCalledTimes(1);
    });
  });

  describe("delete", () => {
    it("应该成功删除缓存", () => {
      // Arrange
      const key = "test-key";
      cacheService.set(key, "test-value");

      // Act
      const result = cacheService.delete(key);

      // Assert
      expect(result).toBe(true);
      expect(cacheService.get(key)).toBeUndefined();
    });

    it("删除不存在的缓存应该返回 false", () => {
      // Act
      const result = cacheService.delete("non-existent-key");

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("deleteByPrefix", () => {
    it("应该删除指定前缀的所有缓存", () => {
      // Arrange
      cacheService.set("user:1", { id: 1 });
      cacheService.set("user:2", { id: 2 });
      cacheService.set("session:1", { id: 1 });

      // Act
      const count = cacheService.deleteByPrefix("user:");

      // Assert
      expect(count).toBe(2);
      expect(cacheService.get("user:1")).toBeUndefined();
      expect(cacheService.get("user:2")).toBeUndefined();
      expect(cacheService.get("session:1")).toBeDefined();
    });

    it("没有匹配的前缀应该返回 0", () => {
      // Arrange
      cacheService.set("test-key", "test-value");

      // Act
      const count = cacheService.deleteByPrefix("non-existent:");

      // Assert
      expect(count).toBe(0);
    });
  });

  describe("clear", () => {
    it("应该清空所有缓存", () => {
      // Arrange
      cacheService.set("key1", "value1");
      cacheService.set("key2", "value2");
      cacheService.set("key3", "value3");

      // Act
      cacheService.clear();

      // Assert
      expect(cacheService.size()).toBe(0);
    });
  });

  describe("has", () => {
    it("缓存存在时应该返回 true", () => {
      // Arrange
      const key = "test-key";
      cacheService.set(key, "test-value");

      // Act
      const result = cacheService.has(key);

      // Assert
      expect(result).toBe(true);
    });

    it("缓存不存在时应该返回 false", () => {
      // Act
      const result = cacheService.has("non-existent-key");

      // Assert
      expect(result).toBe(false);
    });
  });

  describe("size", () => {
    it("应该返回缓存数量", () => {
      // Arrange
      cacheService.set("key1", "value1");
      cacheService.set("key2", "value2");

      // Act
      const size = cacheService.size();

      // Assert
      expect(size).toBe(2);
    });

    it("空缓存应该返回 0", () => {
      // Act
      const size = cacheService.size();

      // Assert
      expect(size).toBe(0);
    });
  });

  describe("getStats / resetStats", () => {
    it("应该正确统计缓存命中和未命中", () => {
      // Arrange
      cacheService.set("key1", "value1");

      // Act
      cacheService.get("key1"); // 命中
      cacheService.get("key1"); // 命中
      cacheService.get("key2"); // 未命中

      // Assert
      const stats = cacheService.getStats();
      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBe(66.67);
      expect(stats.size).toBe(1);
    });

    it("resetStats 应该重置统计信息", () => {
      // Arrange
      cacheService.set("key1", "value1");
      cacheService.get("key1"); // 命中
      cacheService.get("key2"); // 未命中

      // Act
      cacheService.resetStats();

      // Assert
      const stats = cacheService.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe("LRU 淘汰策略", () => {
    it("应该淘汰最久未使用的缓存", () => {
      // Arrange - 创建一个容量为 3 的缓存
      const smallCache = new CacheService({ max: 3, ttl: 60000 });

      smallCache.set("key1", "value1");
      smallCache.set("key2", "value2");
      smallCache.set("key3", "value3");

      // 访问 key1，使其变为最近使用
      smallCache.get("key1");

      // 添加第 4 个缓存，应该淘汰 key2（最久未使用）
      smallCache.set("key4", "value4");

      // Assert
      expect(smallCache.get("key1")).toBe("value1"); // 仍然存在
      expect(smallCache.get("key2")).toBeUndefined(); // 被淘汰
      expect(smallCache.get("key3")).toBe("value3"); // 仍然存在
      expect(smallCache.get("key4")).toBe("value4"); // 仍然存在
    });
  });
});
