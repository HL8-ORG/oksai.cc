/**
 * TenantController 测试
 */

import { BadRequestException, ForbiddenException, NotFoundException } from "@nestjs/common";
import { Tenant } from "@oksai/iam-identity";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TenantPlan } from "./dto/index.js";
import { TenantController } from "./tenant.controller.js";

// Mock TenantService
const mockTenantService = {
  create: vi.fn(),
  getById: vi.fn(),
  getBySlug: vi.fn(),
  list: vi.fn(),
  update: vi.fn(),
  activate: vi.fn(),
  suspend: vi.fn(),
  getUsage: vi.fn(),
  checkQuota: vi.fn(),
};

// Mock Session
const createMockSession = (role: string = "superadmin"): any => ({
  user: {
    id: "user-123",
    email: "admin@example.com",
    role,
  },
  session: {
    id: "session-123",
    token: "token-123",
  },
});

// Mock Tenant - 使用 Object.create 避免构造函数问题
const createMockTenant = (overrides: Record<string, any> = {}): Tenant => {
  const tenant = Object.create(Tenant.prototype);
  Object.assign(tenant, {
    id: "tenant-123",
    name: "测试租户",
    slug: "test-tenant",
    plan: "PRO",
    status: "pending",
    ownerId: "owner-123",
    maxOrganizations: 10,
    maxMembers: 100,
    maxStorage: 10737418240, // 10GB
    settings: {},
    metadata: {},
    createdAt: new Date("2026-01-01"),
    updatedAt: new Date("2026-01-01"),
    ...overrides,
  });
  return tenant as Tenant;
};

describe("TenantController", () => {
  let controller: TenantController;

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new TenantController(mockTenantService as any);
  });

  // ============================================
  // create()
  // ============================================
  describe("create", () => {
    const createDto = {
      name: "企业A",
      slug: "enterprise-a",
      plan: TenantPlan.PRO,
      ownerId: "owner-123",
      maxOrganizations: 10,
      maxMembers: 100,
    };

    it("应该成功创建租户", async () => {
      const mockTenant = createMockTenant();
      mockTenantService.create.mockResolvedValue(mockTenant);

      const result = await controller.create(createMockSession(), createDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe("租户创建成功");
      expect(result.tenant?.name).toBe("测试租户");
      expect(mockTenantService.create).toHaveBeenCalledWith({
        name: createDto.name,
        slug: createDto.slug,
        plan: createDto.plan,
        ownerId: createDto.ownerId,
        maxOrganizations: createDto.maxOrganizations,
        maxMembers: createDto.maxMembers,
        maxStorage: undefined,
      });
    });

    it("应该拒绝非超级管理员创建租户", async () => {
      await expect(controller.create(createMockSession("admin"), createDto)).rejects.toThrow(
        ForbiddenException
      );

      expect(mockTenantService.create).not.toHaveBeenCalled();
    });

    it("应该在 slug 已存在时抛出异常", async () => {
      mockTenantService.create.mockRejectedValue(new BadRequestException('租户 slug "enterprise-a" 已存在'));

      await expect(controller.create(createMockSession(), createDto)).rejects.toThrow(BadRequestException);
    });
  });

  // ============================================
  // list()
  // ============================================
  describe("list", () => {
    it("应该返回租户列表", async () => {
      const mockTenants = [createMockTenant(), createMockTenant({ id: "tenant-456" })];
      mockTenantService.list.mockResolvedValue({ data: mockTenants, total: 2 });

      const result = await controller.list(createMockSession(), {
        page: 1,
        limit: 20,
      });

      expect(result.data).toHaveLength(2);
      expect(result.total).toBe(2);
      expect(result.page).toBe(1);
      expect(result.limit).toBe(20);
      expect(mockTenantService.list).toHaveBeenCalledWith(1, 20);
    });

    it("应该使用默认分页参数", async () => {
      mockTenantService.list.mockResolvedValue({ data: [], total: 0 });

      await controller.list(createMockSession(), {});

      expect(mockTenantService.list).toHaveBeenCalledWith(1, 20);
    });

    it("应该拒绝非超级管理员访问", async () => {
      await expect(controller.list(createMockSession("user"), {})).rejects.toThrow(ForbiddenException);
    });
  });

  // ============================================
  // getOne()
  // ============================================
  describe("getOne", () => {
    it("应该返回租户详情", async () => {
      const mockTenant = createMockTenant({ status: "active" });
      mockTenantService.getById.mockResolvedValue(mockTenant);
      mockTenantService.getUsage.mockResolvedValue({
        organizations: 5,
        members: 50,
        storage: 5000000000,
      });

      const result = await controller.getOne(createMockSession(), "tenant-123");

      expect(result.id).toBe("tenant-123");
      expect(result.status).toBe("active");
      expect(result.usage?.organizations).toBe(5);
      expect(result.usage?.members).toBe(50);
      expect(result.usage?.storage).toBe(5000000000);
    });

    it("应该在租户不存在时抛出异常", async () => {
      mockTenantService.getById.mockRejectedValue(new NotFoundException("租户 tenant-404 不存在"));

      await expect(controller.getOne(createMockSession(), "tenant-404")).rejects.toThrow(NotFoundException);
    });

    it("应该拒绝非超级管理员访问", async () => {
      await expect(controller.getOne(createMockSession("admin"), "tenant-123")).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  // ============================================
  // update()
  // ============================================
  describe("update", () => {
    const updateDto = {
      name: "企业A（更新）",
      maxMembers: 200,
    };

    it("应该成功更新租户", async () => {
      const mockTenant = createMockTenant({
        name: "企业A（更新）",
        maxMembers: 200,
      });
      mockTenantService.update.mockResolvedValue(mockTenant);

      const result = await controller.update(createMockSession(), "tenant-123", updateDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe("租户更新成功");
      expect(result.tenant?.name).toBe("企业A（更新）");
    });

    it("应该在租户不存在时抛出异常", async () => {
      mockTenantService.update.mockRejectedValue(new NotFoundException("租户 tenant-404 不存在"));

      await expect(controller.update(createMockSession(), "tenant-404", updateDto)).rejects.toThrow(
        NotFoundException
      );
    });

    it("应该拒绝非超级管理员访问", async () => {
      await expect(controller.update(createMockSession("admin"), "tenant-123", updateDto)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  // ============================================
  // activate()
  // ============================================
  describe("activate", () => {
    it("应该成功激活租户", async () => {
      const mockTenant = createMockTenant({ status: "pending" });
      mockTenantService.activate.mockResolvedValue(undefined);
      mockTenantService.getById.mockResolvedValue({
        ...mockTenant,
        status: "active",
      });

      const result = await controller.activate(createMockSession(), "tenant-123");

      expect(result.success).toBe(true);
      expect(result.message).toBe("租户激活成功");
      expect(result.tenant?.status).toBe("active");
    });

    it("应该在租户状态不允许时抛出异常", async () => {
      mockTenantService.activate.mockRejectedValue(
        new BadRequestException("只有待审核的租户才能激活。当前状态：active")
      );

      await expect(controller.activate(createMockSession(), "tenant-123")).rejects.toThrow(
        BadRequestException
      );
    });

    it("应该拒绝非超级管理员访问", async () => {
      await expect(controller.activate(createMockSession("admin"), "tenant-123")).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  // ============================================
  // suspend()
  // ============================================
  describe("suspend", () => {
    const suspendDto = {
      reason: "违反服务条款",
    };

    it("应该成功停用租户", async () => {
      const mockTenant = createMockTenant({ status: "active" });
      mockTenantService.suspend.mockResolvedValue(undefined);
      mockTenantService.getById.mockResolvedValue({
        ...mockTenant,
        status: "suspended",
      });

      const result = await controller.suspend(createMockSession(), "tenant-123", suspendDto);

      expect(result.success).toBe(true);
      expect(result.message).toBe("租户停用成功");
      expect(result.tenant?.status).toBe("suspended");
    });

    it("应该在租户状态不允许时抛出异常", async () => {
      mockTenantService.suspend.mockRejectedValue(
        new BadRequestException("只有活跃的租户才能停用。当前状态：pending")
      );

      await expect(controller.suspend(createMockSession(), "tenant-123", suspendDto)).rejects.toThrow(
        BadRequestException
      );
    });

    it("应该拒绝非超级管理员访问", async () => {
      await expect(controller.suspend(createMockSession("admin"), "tenant-123", suspendDto)).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  // ============================================
  // getUsage()
  // ============================================
  describe("getUsage", () => {
    it("应该返回租户使用情况", async () => {
      const mockTenant = createMockTenant();
      mockTenantService.getById.mockResolvedValue(mockTenant);
      mockTenantService.getUsage.mockResolvedValue({
        organizations: 5,
        members: 50,
        storage: 5000000000,
      });

      const result = await controller.getUsage(createMockSession(), "tenant-123");

      expect(result.quota.maxOrganizations).toBe(10);
      expect(result.quota.maxMembers).toBe(100);
      expect(result.quota.maxStorage).toBe(10737418240);
      expect(result.usage.organizations).toBe(5);
      expect(result.usage.members).toBe(50);
      expect(result.usage.storage).toBe(5000000000);
      expect(result.available.organizations).toBe(5); // 10 - 5
      expect(result.available.members).toBe(50); // 100 - 50
      expect(result.available.storage).toBe(5737418240); // 10737418240 - 5000000000
    });

    it("应该在租户不存在时抛出异常", async () => {
      mockTenantService.getById.mockRejectedValue(new NotFoundException("租户 tenant-404 不存在"));

      await expect(controller.getUsage(createMockSession(), "tenant-404")).rejects.toThrow(NotFoundException);
    });

    it("应该拒绝非超级管理员访问", async () => {
      await expect(controller.getUsage(createMockSession("admin"), "tenant-123")).rejects.toThrow(
        ForbiddenException
      );
    });
  });
});
