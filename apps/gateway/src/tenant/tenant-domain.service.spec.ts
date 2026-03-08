/**
 * TenantDomainService 测试
 */

import { EntityManager } from "@mikro-orm/core";
import { Test, TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TenantDomainService } from "./tenant-domain.service.js";

describe("TenantDomainService", () => {
  let service: TenantDomainService;
  let mockEm: any;

  beforeEach(async () => {
    mockEm = {
      findOne: vi.fn(),
      find: vi.fn().mockResolvedValue([]),
      persistAndFlush: vi.fn().mockResolvedValue(undefined),
    };

    const module: TestingModule = await Test.createTestingModule({
      providers: [
        TenantDomainService,
        {
          provide: EntityManager,
          useValue: mockEm,
        },
      ],
    }).compile();

    service = module.get<TenantDomainService>(TenantDomainService);
  });

  describe("identifyTenant", () => {
    it("应该识别子域名租户", async () => {
      mockEm.findOne.mockResolvedValueOnce({
        id: "tenant-123",
        slug: "acme",
      });
      mockEm.find.mockResolvedValue([]);

      const result = await service.identifyTenant("acme.app.oksai.cc");

      expect(result).toBeDefined();
      expect(result?.tenantId).toBe("tenant-123");
      expect(result?.tenantSlug).toBe("acme");
      expect(result?.domainType).toBe("subdomain");
      expect(result?.isVerified).toBe(true);
    });

    it("应该识别自定义域名租户", async () => {
      mockEm.findOne.mockResolvedValue(null); // 不是子域名

      mockEm.find.mockResolvedValue([
        {
          id: "tenant-123",
          slug: "acme",
          settings: {
            domain: {
              custom: "acme.com",
              verified: true,
            },
          },
        },
      ]);

      const result = await service.identifyTenant("acme.com");

      expect(result).toBeDefined();
      expect(result?.tenantId).toBe("tenant-123");
      expect(result?.domainType).toBe("custom");
      expect(result?.isVerified).toBe(true);
    });

    it("应该返回 null 如果无法识别", async () => {
      mockEm.findOne.mockResolvedValue(null);
      mockEm.find.mockResolvedValue([]);

      const result = await service.identifyTenant("unknown.com");

      expect(result).toBeNull();
    });

    it("应该忽略 www 子域名", async () => {
      mockEm.findOne.mockResolvedValue(null);
      mockEm.find.mockResolvedValue([]);

      const result = await service.identifyTenant("www.app.oksai.cc");

      expect(result).toBeNull();
    });
  });

  describe("bindDomain", () => {
    it("应该绑定域名到租户", async () => {
      const tenant = {
        id: "tenant-123",
        slug: "acme",
        settings: {},
      };

      mockEm.findOne.mockResolvedValue(tenant);
      mockEm.find.mockResolvedValue([]); // 域名未被绑定

      const result = await service.bindDomain({
        tenantId: "tenant-123",
        domain: "acme.com",
        domainType: "custom",
      });

      expect(result).toBeDefined();
      expect(result.domain).toBe("acme.com");
      expect(result.isVerified).toBe(false);
      expect(mockEm.persistAndFlush).toHaveBeenCalledWith(tenant);
    });

    it("应该拒绝无效的域名格式", async () => {
      const tenant = { id: "tenant-123", settings: {} };
      mockEm.findOne.mockResolvedValue(tenant);

      await expect(
        service.bindDomain({
          tenantId: "tenant-123",
          domain: "invalid-domain",
          domainType: "custom",
        })
      ).rejects.toThrow("无效的域名格式");
    });

    it("应该拒绝已被绑定的域名", async () => {
      const tenant = { id: "tenant-123", settings: {} };
      mockEm.findOne.mockResolvedValue(tenant);

      mockEm.find.mockResolvedValue([
        {
          id: "tenant-456",
          settings: {
            domain: {
              custom: "acme.com",
            },
          },
        },
      ]);

      await expect(
        service.bindDomain({
          tenantId: "tenant-123",
          domain: "acme.com",
          domainType: "custom",
        })
      ).rejects.toThrow("已被其他租户绑定");
    });
  });

  describe("getTenantDomains", () => {
    it("应该返回租户的所有绑定域名", async () => {
      const tenant = {
        id: "tenant-123",
        slug: "acme",
        settings: {
          domain: {
            subdomain: "acme.app.oksai.cc",
            custom: "acme.com",
            verified: true,
          },
        },
      };

      mockEm.findOne.mockResolvedValue(tenant);

      const result = await service.getTenantDomains("tenant-123");

      expect(result).toHaveLength(2);
      expect(result[0].domainType).toBe("subdomain");
      expect(result[1].domainType).toBe("custom");
    });
  });
});
