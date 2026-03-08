/**
 * TenantSettingsService 测试
 */

import { EntityManager } from "@mikro-orm/core";
import { BadRequestException, NotFoundException } from "@nestjs/common";
import { Test, TestingModule } from "@nestjs/testing";
import { TenantContextService } from "@oksai/context";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TenantSettingsService } from "./tenant-settings.service.js";

describe("TenantSettingsService", () => {
  let service: TenantSettingsService;
  let mockEm: any;
  let mockTenantContext: any;

  beforeEach(async () => {
    mockEm = {
      findOne: vi.fn(),
      persistAndFlush: vi.fn().mockResolvedValue(undefined),
    };

    mockTenantContext = {
      tenantId: "tenant-123",
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantSettingsService,
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

    service = module.get<TenantSettingsService>(TenantSettingsService);
  });

  describe("getSettings", () => {
    it("应该返回租户配置（合并默认值）", async () => {
      mockEm.findOne.mockResolvedValue({
        id: "tenant-123",
        settings: {
          branding: {
            primaryColor: "#ff0000",
          },
        },
      });

      const result = await service.getSettings("tenant-123");

      expect(result).toBeDefined();
      expect(result.branding.primaryColor).toBe("#ff0000"); // 自定义值
      expect(result.features.webhooksEnabled).toBe(true); // 默认值
    });

    it("如果租户不存在应该抛出 NotFoundException", async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(service.getSettings("nonexistent")).rejects.toThrow(NotFoundException);
    });
  });

  describe("updateSettings", () => {
    it("应该更新租户配置", async () => {
      const tenant = {
        id: "tenant-123",
        settings: {},
      };

      mockEm.findOne.mockResolvedValue(tenant);
      mockEm.persistAndFlush.mockResolvedValue(undefined);

      const dto = {
        branding: {
          primaryColor: "#00ff00",
        },
      };

      const result = await service.updateSettings("tenant-123", dto);

      expect(result).toBeDefined();
      expect(result.branding.primaryColor).toBe("#00ff00");
      expect(mockEm.persistAndFlush).toHaveBeenCalledWith(tenant);
    });

    it("应该验证颜色值", async () => {
      const dto = {
        branding: {
          primaryColor: "invalid-color",
        },
      };

      await expect(service.updateSettings("tenant-123", dto)).rejects.toThrow(BadRequestException);
    });

    it("应该验证域名格式", async () => {
      const dto = {
        branding: {
          customDomain: "invalid-domain",
        },
      };

      await expect(service.updateSettings("tenant-123", dto)).rejects.toThrow(BadRequestException);
    });

    it("应该验证密码最小长度", async () => {
      const dto = {
        security: {
          passwordMinLength: 3, // 小于最小值 6
          requireUppercase: true,
          requireNumbers: true,
          requireSymbols: false,
          sessionTimeout: 10080,
        },
      };

      await expect(service.updateSettings("tenant-123", dto)).rejects.toThrow(BadRequestException);
    });

    it("应该验证会话超时范围", async () => {
      const dto = {
        security: {
          passwordMinLength: 8,
          requireUppercase: true,
          requireNumbers: true,
          requireSymbols: false,
          sessionTimeout: 999999, // 大于最大值 525600
        },
      };

      await expect(service.updateSettings("tenant-123", dto)).rejects.toThrow(BadRequestException);
    });
  });

  describe("resetSettings", () => {
    it("应该重置租户配置到默认值", async () => {
      const tenant = {
        id: "tenant-123",
        settings: {
          branding: {
            primaryColor: "#ff0000",
          },
        },
      };

      mockEm.findOne.mockResolvedValue(tenant);
      mockEm.persistAndFlush.mockResolvedValue(undefined);

      const result = await service.resetSettings("tenant-123");

      expect(result).toBeDefined();
      expect(result.branding.primaryColor).toBe("#1890ff"); // 默认值
      expect(tenant.settings).toEqual({}); // 已重置为空对象
    });
  });
});
