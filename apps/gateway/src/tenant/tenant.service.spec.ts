/**
 * TenantService 单元测试
 */

import { EntityManager } from "@mikro-orm/core";
import { Tenant } from "@oksai/iam-identity";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { CreateTenantDto, TenantService } from "./tenant.service.js";

describe("TenantService", () => {
  let service: TenantService;
  let mockEm: any;

  beforeEach(() => {
    // Mock EntityManager
    mockEm = {
      findOne: vi.fn(),
      create: vi.fn(),
      persistAndFlush: vi.fn(),
      findAndCount: vi.fn(),
      flush: vi.fn(),
    };

    service = new TenantService(mockEm as EntityManager);
  });

  describe("create", () => {
    const validDto: CreateTenantDto = {
      name: "企业A",
      slug: "enterprise-a",
      plan: "PRO",
      ownerId: "user-123",
    };

    it("应该成功创建租户", async () => {
      // Mock slug 查询返回 null（不存在）
      mockEm.findOne.mockResolvedValue(null);

      // Mock create
      const mockTenant = {
        id: "tenant-123",
        name: validDto.name,
        slug: validDto.slug,
        plan: validDto.plan,
        ownerId: validDto.ownerId,
        status: "pending",
        maxOrganizations: 1,
        maxMembers: 10,
        maxStorage: 1073741824,
      };
      mockEm.create.mockReturnValue(mockTenant);

      const result = await service.create(validDto);

      expect(mockEm.findOne).toHaveBeenCalledWith(Tenant, { slug: validDto.slug });
      expect(mockEm.create).toHaveBeenCalled();
      expect(mockEm.persistAndFlush).toHaveBeenCalledWith(mockTenant);
      expect(result).toEqual(mockTenant);
    });

    it("应该拒绝重复的 slug", async () => {
      // Mock 查询返回已存在的租户
      mockEm.findOne.mockResolvedValue({
        id: "existing-tenant",
        slug: validDto.slug,
      });

      await expect(service.create(validDto)).rejects.toThrow(`租户 slug "${validDto.slug}" 已存在`);

      expect(mockEm.create).not.toHaveBeenCalled();
      expect(mockEm.persistAndFlush).not.toHaveBeenCalled();
    });

    it("应该使用默认配额", async () => {
      mockEm.findOne.mockResolvedValue(null);

      let createdTenant: any;
      mockEm.create.mockImplementation((entity, data) => {
        createdTenant = data;
        return data;
      });

      await service.create(validDto);

      expect(createdTenant.maxOrganizations).toBe(1);
      expect(createdTenant.maxMembers).toBe(10);
      expect(createdTenant.maxStorage).toBe(1073741824);
    });

    it("应该使用自定义配额", async () => {
      mockEm.findOne.mockResolvedValue(null);

      const customDto = {
        ...validDto,
        maxOrganizations: 10,
        maxMembers: 100,
        maxStorage: 10737418240, // 10GB
      };

      let createdTenant: any;
      mockEm.create.mockImplementation((entity, data) => {
        createdTenant = data;
        return data;
      });

      await service.create(customDto);

      expect(createdTenant.maxOrganizations).toBe(10);
      expect(createdTenant.maxMembers).toBe(100);
      expect(createdTenant.maxStorage).toBe(10737418240);
    });
  });

  describe("getById", () => {
    it("应该返回租户", async () => {
      const mockTenant = {
        id: "tenant-123",
        name: "企业A",
        slug: "enterprise-a",
      };

      mockEm.findOne.mockResolvedValue(mockTenant);

      const result = await service.getById("tenant-123");

      expect(mockEm.findOne).toHaveBeenCalledWith(Tenant, { id: "tenant-123" });
      expect(result).toEqual(mockTenant);
    });

    it("应该在租户不存在时抛出 NotFoundException", async () => {
      mockEm.findOne.mockResolvedValue(null);

      await expect(service.getById("non-existent")).rejects.toThrow("租户 non-existent 不存在");
    });
  });

  describe("getBySlug", () => {
    it("应该返回租户", async () => {
      const mockTenant = {
        id: "tenant-123",
        slug: "enterprise-a",
      };

      mockEm.findOne.mockResolvedValue(mockTenant);

      const result = await service.getBySlug("enterprise-a");

      expect(mockEm.findOne).toHaveBeenCalledWith(Tenant, {
        slug: "enterprise-a",
      });
      expect(result).toEqual(mockTenant);
    });

    it("应该返回 null 如果租户不存在", async () => {
      mockEm.findOne.mockResolvedValue(null);

      const result = await service.getBySlug("non-existent");

      expect(result).toBeNull();
    });
  });

  describe("list", () => {
    it("应该返回租户列表", async () => {
      const mockTenants = [
        { id: "tenant-1", name: "企业A" },
        { id: "tenant-2", name: "企业B" },
      ];

      mockEm.findAndCount.mockResolvedValue([mockTenants, 2]);

      const result = await service.list(1, 20);

      expect(result.data).toEqual(mockTenants);
      expect(result.total).toBe(2);
      expect(mockEm.findAndCount).toHaveBeenCalledWith(
        Tenant,
        {},
        {
          limit: 20,
          offset: 0,
          orderBy: { createdAt: "DESC" },
        }
      );
    });

    it("应该正确计算偏移量", async () => {
      mockEm.findAndCount.mockResolvedValue([[], 0]);

      await service.list(2, 10);

      expect(mockEm.findAndCount).toHaveBeenCalledWith(
        Tenant,
        {},
        expect.objectContaining({
          offset: 10, // (2-1) * 10
        })
      );
    });
  });

  describe("update", () => {
    it("应该更新租户信息", async () => {
      const mockTenant = {
        id: "tenant-123",
        name: "旧名称",
        maxMembers: 10,
      };

      mockEm.findOne.mockResolvedValue(mockTenant);

      const result = await service.update("tenant-123", {
        name: "新名称",
        maxMembers: 20,
      });

      expect(mockTenant.name).toBe("新名称");
      expect(mockTenant.maxMembers).toBe(20);
      expect(mockEm.flush).toHaveBeenCalled();
    });
  });

  describe("activate", () => {
    it("应该激活 pending 状态的租户", async () => {
      const mockTenant = {
        id: "tenant-123",
        status: "pending",
      };

      mockEm.findOne.mockResolvedValue(mockTenant);

      await service.activate("tenant-123");

      expect(mockTenant.status).toBe("active");
      expect(mockEm.flush).toHaveBeenCalled();
    });

    it("应该拒绝激活非 pending 状态的租户", async () => {
      const mockTenant = {
        id: "tenant-123",
        status: "active",
      };

      mockEm.findOne.mockResolvedValue(mockTenant);

      await expect(service.activate("tenant-123")).rejects.toThrow("只有待审核的租户才能激活");

      expect(mockEm.flush).not.toHaveBeenCalled();
    });
  });

  describe("suspend", () => {
    it("应该停用 active 状态的租户", async () => {
      const mockTenant = {
        id: "tenant-123",
        status: "active",
        metadata: {},
      };

      mockEm.findOne.mockResolvedValue(mockTenant);

      await service.suspend("tenant-123", "违反服务条款");

      expect(mockTenant.status).toBe("suspended");
      expect(mockTenant.metadata.suspensionReason).toBe("违反服务条款");
      expect(mockTenant.metadata.suspendedAt).toBeInstanceOf(Date);
      expect(mockEm.flush).toHaveBeenCalled();
    });

    it("应该拒绝停用非 active 状态的租户", async () => {
      const mockTenant = {
        id: "tenant-123",
        status: "pending",
      };

      mockEm.findOne.mockResolvedValue(mockTenant);

      await expect(service.suspend("tenant-123", "违反服务条款")).rejects.toThrow("只有活跃的租户才能停用");

      expect(mockEm.flush).not.toHaveBeenCalled();
    });
  });

  describe("checkQuota", () => {
    it("应该返回 true 如果在配额内", async () => {
      const mockTenant = {
        id: "tenant-123",
        maxOrganizations: 10,
        maxMembers: 100,
        maxStorage: 1073741824,
      };

      mockEm.findOne.mockResolvedValue(mockTenant);
      mockEm.findAndCount.mockResolvedValue([[], 0]);

      // Mock getUsage
      vi.spyOn(service, "getUsage").mockResolvedValue({
        organizations: 5,
        members: 50,
        storage: 536870912,
      });

      const result = await service.checkQuota("tenant-123", "organizations");

      expect(result).toBe(true);
    });

    it("应该返回 false 如果达到配额", async () => {
      const mockTenant = {
        id: "tenant-123",
        maxOrganizations: 10,
        maxMembers: 100,
        maxStorage: 1073741824,
      };

      mockEm.findOne.mockResolvedValue(mockTenant);

      // Mock getUsage 返回已达到限制的使用量
      vi.spyOn(service, "getUsage").mockResolvedValue({
        organizations: 10,
        members: 100,
        storage: 1073741824,
      });

      const result = await service.checkQuota("tenant-123", "organizations");

      expect(result).toBe(false);
    });

    it("应该返回 true 如果配额为无限制", async () => {
      const mockTenant = {
        id: "tenant-123",
        maxOrganizations: -1, // 无限制
        maxMembers: 100,
        maxStorage: 1073741824,
      };

      mockEm.findOne.mockResolvedValue(mockTenant);

      vi.spyOn(service, "getUsage").mockResolvedValue({
        organizations: 1000,
        members: 50,
        storage: 536870912,
      });

      const result = await service.checkQuota("tenant-123", "organizations");

      expect(result).toBe(true);
    });
  });
});
