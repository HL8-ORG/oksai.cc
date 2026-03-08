import { describe, it, expect, beforeEach, vi } from "vitest";
import { TenantFilter, disableTenantFilter, enableTenantFilter } from "./tenant.filter.js";

// Mock TenantContextService
vi.mock("@oksai/context", () => ({
  TenantContextService: {
    getCurrentContext: vi.fn(),
  },
}));

import { TenantContextService } from "@oksai/context";

describe("TenantFilter", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  describe("filter definition", () => {
    it("should have correct name", () => {
      expect(TenantFilter.name).toBe("tenant");
    });

    it("should be enabled by default", () => {
      expect(TenantFilter.default).toBe(true);
    });

    it("should apply to correct entities", () => {
      const entities = TenantFilter.entity as string[];
      expect(entities).toContain("User");
      expect(entities).toContain("Organization");
      expect(entities).toContain("Webhook");
    });
  });

  describe("cond function", () => {
    const mockEm = {} as any;

    it("should return tenantId filter when context exists", () => {
      vi.mocked(TenantContextService.getCurrentContext).mockReturnValue({
        tenantId: "tenant-123",
        userId: "user-456",
        correlationId: "corr-789",
      });

      const cond = TenantFilter.cond!({}, "select", mockEm);

      expect(cond).toEqual({ tenantId: "tenant-123" });
    });

    it("should return empty object when no context exists", () => {
      vi.mocked(TenantContextService.getCurrentContext).mockReturnValue(undefined);

      const cond = TenantFilter.cond!({}, "select", mockEm);

      expect(cond).toEqual({});
    });

    it("should return empty object when tenantId is empty", () => {
      vi.mocked(TenantContextService.getCurrentContext).mockReturnValue({
        tenantId: "",
        userId: "user-456",
        correlationId: "corr-789",
      });

      const cond = TenantFilter.cond!({}, "select", mockEm);

      expect(cond).toEqual({});
    });

    it("should return empty object when context throws error", () => {
      vi.mocked(TenantContextService.getCurrentContext).mockImplementation(() => {
        throw new Error("Context error");
      });

      const cond = TenantFilter.cond!({}, "select", mockEm);

      expect(cond).toEqual({});
    });
  });

  describe("helper functions", () => {
    it("should disable tenant filter", () => {
      const mockEm = {
        disableFilter: vi.fn(),
      } as any;

      disableTenantFilter(mockEm);

      expect(mockEm.disableFilter).toHaveBeenCalledWith("tenant");
    });

    it("should enable tenant filter", () => {
      const mockEm = {
        enableFilter: vi.fn(),
      } as any;

      enableTenantFilter(mockEm);

      expect(mockEm.enableFilter).toHaveBeenCalledWith("tenant");
    });
  });
});
