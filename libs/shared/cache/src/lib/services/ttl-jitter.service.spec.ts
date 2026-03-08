/**
 * TTL 抖动服务测试
 */

import { beforeEach, describe, expect, it } from "vitest";
import { TTLJitterService } from "./ttl-jitter.service.js";

describe("TTLJitterService", () => {
  let service: TTLJitterService;

  beforeEach(() => {
    service = new TTLJitterService();
  });

  describe("addJitter", () => {
    it("应该为 TTL 添加 ±10% 的随机抖动", () => {
      const ttl = 60000; // 60 秒
      const results: number[] = [];

      // 运行 100 次获取抖动范围
      for (let i = 0; i < 100; i++) {
        const result = service.addJitter(ttl);
        results.push(result);
      }

      const min = Math.min(...results);
      const max = Math.max(...results);

      // 验证抖动范围在 54-66 秒之间（±10%）
      expect(min).toBeGreaterThanOrEqual(54000); // 60s * 0.9
      expect(max).toBeLessThanOrEqual(66000); // 60s * 1.1

      // 验证所有结果都是整数
      for (const result of results) {
        expect(Number.isInteger(result)).toBe(true);
      }
    });

    it("应该正确处理 0 TTL", () => {
      const result = service.addJitter(0);
      expect(result).toBe(0);
    });

    it("应该正确处理负数 TTL", () => {
      const result = service.addJitter(-1000);
      expect(result).toBe(0);
    });

    it("应该正确处理极小 TTL", () => {
      const ttl = 100;
      const results: number[] = [];

      for (let i = 0; i < 100; i++) {
        const result = service.addJitter(ttl);
        results.push(result);
      }

      const min = Math.min(...results);
      const max = Math.max(...results);

      // 验证抖动范围在 90-110 之间
      expect(min).toBeGreaterThanOrEqual(90);
      expect(max).toBeLessThanOrEqual(110);
    });

    it("应该正确处理极大 TTL", () => {
      const ttl = 86400000; // 24 小时
      const results: number[] = [];

      for (let i = 0; i < 100; i++) {
        const result = service.addJitter(ttl);
        results.push(result);
      }

      const min = Math.min(...results);
      const max = Math.max(...results);

      // 验证抖动范围在 21.6-26.4 小时之间
      expect(min).toBeGreaterThanOrEqual(77760000); // 24h * 0.9
      expect(max).toBeLessThanOrEqual(95040000); // 24h * 1.1
    });

    it("应该产生分散的 TTL 值（防止雪崩）", () => {
      const ttl = 60000;
      const results: number[] = [];

      // 运行 1000 次收集抖动分布
      for (let i = 0; i < 1000; i++) {
        const result = service.addJitter(ttl);
        results.push(result);
      }

      // 统计每个 1 秒区间内的数量
      const buckets: Record<number, number> = {};
      for (const result of results) {
        const bucket = Math.floor(result / 1000); // 1 秒区间
        buckets[bucket] = (buckets[bucket] || 0) + 1;
      }

      // 验证至少有 10 个不同的区间（分散性）
      const uniqueBuckets = Object.keys(buckets).length;
      expect(uniqueBuckets).toBeGreaterThan(10);

      // 验证没有单个区间超过 200 个（均匀性）
      const maxCount = Math.max(...Object.values(buckets));
      expect(maxCount).toBeLessThan(200);
    });

    it("应该确保抖动后的 TTL 不为负数", () => {
      // 测试边界情况：极小 TTL
      for (let ttl = 1; ttl <= 10; ttl++) {
        const result = service.addJitter(ttl);
        expect(result).toBeGreaterThanOrEqual(0);
      }
    });

    it("应该保持 TTL 的数量级（不改变数量级）", () => {
      const ttl = 60000;
      const results: number[] = [];

      for (let i = 0; i < 100; i++) {
        const result = service.addJitter(ttl);
        results.push(result);
      }

      // 验证所有结果都在同一个数量级（万级）
      for (const result of results) {
        expect(result).toBeGreaterThan(10000);
        expect(result).toBeLessThan(100000);
      }
    });
  });
});
