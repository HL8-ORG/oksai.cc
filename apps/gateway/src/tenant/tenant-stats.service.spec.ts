/**
 * TenantStatsService 测试
 */

import { EntityManager } from "@mikro-orm/core";
import { Test, TestingModule } from "@nestjs/testing";
import { TenantContextService } from "@oksai/context";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TenantStatsService } from "./tenant-stats.service.js";

describe("TenantStatsService", () => {
  let service: TenantStatsService;
  let mockEm: any;
  let mockTenantContext: any;

  beforeEach(async () => {
    mockEm = {
      findOne: vi.fn(),
      count: vi.fn().mockResolvedValue(10),
    };

    mockTenantContext = {
      tenantId: "tenant-123",
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantStatsService,
        {
          provide: EntityManager,
          useValue: mockEm,
        },
        {
          provide: TenantContextService,
          useValue: mockTenantContext,
        },
      ],
    }).compile();

    service = module.get<TenantStatsService>(TenantStatsService);
  });

  describe("getOverview", () => {
    it("应该返回租户统计概览", async () => {
      mockEm.findOne.mockResolvedValue({
        id: "tenant-123",
        maxStorage: 1073741824, // 1GB
      });

      mockEm.count.mockResolvedValue(10);

      const result = await service.getOverview("tenant-123");

      expect(result).toBeDefined();
      expect(result.tenantId).toBe("tenant-123");
      expect(result.organizations).toBeDefined();
      expect(result.members).toBeDefined();
      expect(result.storage).toBeDefined();
      expect(result.webhooks).toBeDefined();
      expect(result.sessions).toBeDefined();
    });

    it("如果租户不存在应该抛出异常", async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(service.getOverview("nonexistent")).rejects.toThrow("租户 nonexistent 不存在");
    });
  });

  describe("getUsageTrend", () => {
    it("应该返回使用趋势数据", async () => {
      const result = await service.getUsageTrend("tenant-123", 7);

      expect(result).toBeDefined();
      expect(Array.isArray(result)).toBe(true);
      expect(result.length).toBe(7);
    });
  });

  describe("getActivityLogs", () => {
    it("应该返回活动日志列表", async () => {
      const result = await service.getActivityLogs("tenant-123", 1, 20);

      expect(result).toBeDefined();
      expect(result.data).toBeDefined();
      expect(result.total).toBeDefined();
    });
  });
});
