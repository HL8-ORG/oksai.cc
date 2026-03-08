import { BadRequestException, ForbiddenException } from "@nestjs/common";
import { TenantContextService } from "@oksai/context";
import type { NextFunction, Request, Response } from "express";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { TenantMiddleware } from "./tenant.middleware.js";

describe("TenantMiddleware", () => {
  let middleware: TenantMiddleware;
  let mockTenantContext: TenantContextService;
  let mockRequest: Partial<Request>;
  let mockResponse: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockTenantContext = {
      run: vi.fn((context, fn) => fn()),
    } as any;

    middleware = new TenantMiddleware(mockTenantContext);

    mockRequest = {
      path: "/api/users",
      headers: {},
      hostname: "app.example.com",
      query: {},
    };

    mockResponse = {};

    mockNext = vi.fn();
  });

  describe("extractTenantId", () => {
    it("should extract from JWT token (highest priority)", async () => {
      (mockRequest as any).user = { id: "user-123", tenantId: "tenant-456" };

      await middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.tenantId).toBe("tenant-456");
    });

    it("should extract from header if no JWT", async () => {
      mockRequest.headers = { "x-tenant-id": "tenant-789" };

      await middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.tenantId).toBe("tenant-789");
    });

    it("should prefer JWT over header", async () => {
      (mockRequest as any).user = { id: "user-123", tenantId: "tenant-jwt" };
      mockRequest.headers = { "x-tenant-id": "tenant-header" };

      await middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.tenantId).toBe("tenant-jwt");
    });

    it("should throw BadRequestException if no tenant ID", async () => {
      await expect(
        middleware.use(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(BadRequestException);
    });

    it("should allow public routes without tenant ID", async () => {
      mockRequest.path = "/api/health";

      await middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });

  describe("tenant validation", () => {
    it("should throw ForbiddenException for invalid tenant", async () => {
      (mockRequest as any).user = { id: "user-123", tenantId: "invalid-tenant" };

      // Mock validateTenant to return null
      vi.spyOn(middleware as any, "validateTenant").mockResolvedValue(null);

      await expect(
        middleware.use(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(ForbiddenException);
    });
  });

  describe("context injection", () => {
    it("should inject tenant context", async () => {
      (mockRequest as any).user = { id: "user-123", tenantId: "tenant-456" };

      await middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockTenantContext.run).toHaveBeenCalled();
      const contextArg = (mockTenantContext.run as any).mock.calls[0][0];
      expect(contextArg.tenantId).toBe("tenant-456");
      expect(contextArg.userId).toBe("user-123");
    });

    it("should set tenant info on request", async () => {
      (mockRequest as any).user = { id: "user-123", tenantId: "tenant-456" };

      await middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.tenant).toBeDefined();
      expect(mockRequest.tenant?.id).toBe("tenant-456");
    });
  });

  describe("subdomain extraction", () => {
    it("should extract from subdomain", async () => {
      mockRequest.hostname = "tenant1.app.example.com";

      await middleware.use(mockRequest as Request, mockResponse as Response, mockNext);

      expect(mockRequest.tenantId).toBe("tenant1");
    });

    it("should ignore common subdomains", async () => {
      mockRequest.hostname = "www.app.example.com";

      await expect(
        middleware.use(mockRequest as Request, mockResponse as Response, mockNext)
      ).rejects.toThrow(BadRequestException);
    });
  });
});
