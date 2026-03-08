import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException } from "@nestjs/common";
import { TenantContext, TenantContextService } from "@oksai/context";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SkipTenantGuard, TenantGuard, TenantResourceGuard } from "./tenant.guard.js";

describe("TenantGuard", () => {
  let guard: TenantGuard;
  let mockTenantContext: TenantContextService;
  let mockReflector: any;
  let mockContext: ExecutionContext;

  beforeEach(() => {
    mockReflector = {
      getAllAndOverride: vi.fn(),
    };

    mockTenantContext = {
      getContext: vi.fn(),
      tenantId: "tenant-123",
      userId: "user-456",
    } as any;

    guard = new TenantGuard(mockReflector, mockTenantContext);

    mockContext = {
      switchToHttp: vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue({
          user: { id: "user-456", tenantId: "tenant-123" },
          params: {},
          body: {},
          query: {},
        }),
      }),
      getHandler: vi.fn(),
      getClass: vi.fn(),
    } as any;
  });

  describe("canActivate", () => {
    it("should allow access when skip decorator is present", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(true);

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it("should throw ForbiddenException when no tenant context", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockTenantContext.getContext = vi.fn().mockReturnValue(undefined);

      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    it("should throw ForbiddenException when user tenant mismatch", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockTenantContext.getContext = vi.fn().mockReturnValue(
        TenantContext.create({
          tenantId: "tenant-123",
          userId: "user-456",
        })
      );

      const mockRequest = {
        user: { id: "user-456", tenantId: "tenant-456" }, // 不同的租户
      };

      mockContext.switchToHttp = vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue(mockRequest),
      });

      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    it("should allow access when tenant matches", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockTenantContext.getContext = vi.fn().mockReturnValue(
        TenantContext.create({
          tenantId: "tenant-123",
          userId: "user-456",
        })
      );

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });

    it("should allow access when no user (anonymous)", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockTenantContext.getContext = vi.fn().mockReturnValue(
        TenantContext.create({
          tenantId: "tenant-123",
        })
      );

      const mockRequest = {
        user: undefined,
      };

      mockContext.switchToHttp = vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue(mockRequest),
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });
  });

  describe("resource tenant check", () => {
    it("should throw ForbiddenException when resource tenant mismatch", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockTenantContext.getContext = vi.fn().mockReturnValue(
        TenantContext.create({
          tenantId: "tenant-123",
        })
      );

      const mockRequest = {
        user: undefined,
        params: { tenantId: "tenant-456" }, // 资源属于其他租户
      };

      mockContext.switchToHttp = vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue(mockRequest),
      });

      await expect(guard.canActivate(mockContext)).rejects.toThrow(ForbiddenException);
    });

    it("should allow access when resource tenant matches", async () => {
      mockReflector.getAllAndOverride.mockReturnValue(false);
      mockTenantContext.getContext = vi.fn().mockReturnValue(
        TenantContext.create({
          tenantId: "tenant-123",
        })
      );

      const mockRequest = {
        user: undefined,
        params: { tenantId: "tenant-123" }, // 资源属于相同租户
      };

      mockContext.switchToHttp = vi.fn().mockReturnValue({
        getRequest: vi.fn().mockReturnValue(mockRequest),
      });

      const result = await guard.canActivate(mockContext);

      expect(result).toBe(true);
    });
  });

  describe("SkipTenantGuard decorator", () => {
    it("should be defined", () => {
      expect(SkipTenantGuard).toBeDefined();
    });
  });

  describe("TenantResourceGuard", () => {
    it("should extend TenantGuard", () => {
      const resourceGuard = new TenantResourceGuard(mockReflector, mockTenantContext);

      expect(resourceGuard).toBeInstanceOf(TenantGuard);
    });
  });
});
