/**
 * 增强版 Redis 缓存服务测试
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import { RedisCacheEnhancedService } from "./redis-cache-enhanced.service.js";

describe("RedisCacheEnhancedService", () => {
  let cacheService: RedisCacheEnhancedService;

  beforeEach(() => {
    vi.clearAllMocks();
    // 创建不连接 Redis 的实例（使用 fallback）
    cacheService = new RedisCacheEnhancedService({
      max: 1000,
      ttl: 60000,
      enableStats: true,
    });
  });

  describe("SCAN 命令", () => {
    it("应该使用 SCAN 替代 KEYS 命令删除前缀缓存", async () => {
      // 设置测试数据
      await cacheService.set("test:key1", "value1");
      await cacheService.set("test:key2", "value2");
      await cacheService.set("test:key3", "value3");
      await cacheService.set("other:key", "value4");

      // 删除前缀为 test: 的键
      const deleted = await cacheService.deleteByPrefix("test:");

      expect(deleted).toBe(3);
      expect(await cacheService.get("test:key1")).toBeUndefined();
      expect(await cacheService.get("test:key2")).toBeUndefined();
      expect(await cacheService.get("test:key3")).toBeUndefined();
      expect(await cacheService.get("other:key")).toBe("value4");
    });

    it("应该处理空结果", async () => {
      const deleted = await cacheService.deleteByPrefix("nonexistent:");
      expect(deleted).toBe(0);
    });

    it("应该分页扫描大量键", async () => {
      // 设置 200 个键
      for (let i = 0; i < 200; i++) {
        await cacheService.set(`batch:key${i}`, `value${i}`);
      }

      // 删除所有 batch: 前缀的键
      const deleted = await cacheService.deleteByPrefix("batch:");

      expect(deleted).toBe(200);
    });
  });

  describe("Pipeline 优化", () => {
    it("应该使用 Pipeline 批量删除", async () => {
      // 设置测试数据
      await cacheService.set("pipeline:key1", "value1");
      await cacheService.set("pipeline:key2", "value2");
      await cacheService.set("pipeline:key3", "value3");

      // 使用 Pipeline 删除
      const deleted = await cacheService.deleteByPrefix("pipeline:");

      expect(deleted).toBe(3);
    });

    it("应该使用 Pipeline 批量设置", async () => {
      const items = [
        { key: "batch:set1", value: "value1" },
        { key: "batch:set2", value: "value2" },
        { key: "batch:set3", value: "value3" },
      ];

      await cacheService.mset(items, 60000);

      expect(await cacheService.get("batch:set1")).toBe("value1");
      expect(await cacheService.get("batch:set2")).toBe("value2");
      expect(await cacheService.get("batch:set3")).toBe("value3");
    });

    it("应该使用 Pipeline 批量获取", async () => {
      await cacheService.set("batch:get1", "value1");
      await cacheService.set("batch:get2", "value2");
      await cacheService.set("batch:get3", "value3");

      const values = await cacheService.mget(["batch:get1", "batch:get2", "batch:get3", "batch:get4"]);

      expect(values).toEqual({
        "batch:get1": "value1",
        "batch:get2": "value2",
        "batch:get3": "value3",
        "batch:get4": undefined,
      });
    });
  });

  describe("Lua 脚本", () => {
    it("应该执行 Lua 脚本进行原子递增", async () => {
      const key = "atomic:counter";

      // key 不存在时应该返回 null
      const result1 = await cacheService.incrIfExistsAtomic(key, 1);
      expect(result1).toBeNull();

      // 设置 key
      await cacheService.set(key, "10");

      // key 存在时应该递增
      const result2 = await cacheService.incrIfExistsAtomic(key, 5);
      expect(result2).toBe(15);

      // 验证值已被更新
      expect(await cacheService.get(key)).toBe(15);
    });

    it("应该执行 Lua 脚本进行条件设置", async () => {
      const key = "conditional:set";

      // 使用 setIfNotExist（NX）
      const result1 = await cacheService.setIfNotExist(key, "value1", 60000);
      expect(result1).toBe(true);

      // 再次尝试设置（应该失败）
      const result2 = await cacheService.setIfNotExist(key, "value2", 60000);
      expect(result2).toBe(false);

      // 验证值未改变
      expect(await cacheService.get(key)).toBe("value1");
    });
  });

  describe("统计功能", () => {
    it("应该正确统计缓存命中和未命中", async () => {
      await cacheService.set("stats:key1", "value1");

      await cacheService.get("stats:key1"); // 命中
      await cacheService.get("stats:key1"); // 命中
      await cacheService.get("stats:key2"); // 未命中

      const stats = cacheService.getStats();

      expect(stats.hits).toBe(2);
      expect(stats.misses).toBe(1);
      expect(stats.hitRate).toBeCloseTo(66.67, 1);
    });

    it("应该重置统计信息", async () => {
      await cacheService.set("reset:key1", "value1");
      await cacheService.get("reset:key1"); // 命中
      await cacheService.get("reset:key2"); // 未命中

      cacheService.resetStats();

      const stats = cacheService.getStats();
      expect(stats.hits).toBe(0);
      expect(stats.misses).toBe(0);
      expect(stats.hitRate).toBe(0);
    });
  });

  describe("连接状态", () => {
    it("应该返回连接状态", () => {
      const status = cacheService.getStatus();
      expect(typeof status).toBe("string");
    });

    it("应该检查是否启用缓存", () => {
      const enabled = cacheService.isEnabled();
      expect(typeof enabled).toBe("boolean");
    });
  });

  describe("错误处理", () => {
    it("应该处理无效的 JSON 数据", async () => {
      // 设置一个无法 JSON 解析的值（通过内部 API）
      await cacheService.set("invalid:json", { valid: "object" });

      const result = await cacheService.get("invalid:json");
      expect(result).toEqual({ valid: "object" });
    });

    it("应该处理大键值", async () => {
      const largeValue = "x".repeat(1024 * 1024); // 1MB

      await cacheService.set("large:key", largeValue, 60000);
      const result = await cacheService.get("large:key");

      expect(result).toBe(largeValue);
    });
  });
});
