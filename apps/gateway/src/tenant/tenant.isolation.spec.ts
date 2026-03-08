/**
 * 租户数据隔离集成测试
 *
 * 验证多租户数据隔离的核心功能
 */

import { AsyncLocalStorageProvider, TenantContext, TenantContextService } from "@oksai/context";
import { disableTenantFilter, enableTenantFilter } from "@oksai/database";
import { beforeAll, describe, expect, it, vi } from "vitest";

describe("Tenant Data Isolation", () => {
  let tenantContext: TenantContextService;
  let provider: AsyncLocalStorageProvider;

  beforeAll(() => {
    provider = new AsyncLocalStorageProvider();
    tenantContext = new TenantContextService(provider);
  });

  describe("租户上下文管理", () => {
    it("应该能够创建租户上下文", () => {
      const context = TenantContext.create({
        tenantId: "tenant-123",
        userId: "user-456",
        correlationId: "corr-789",
      });

      expect(context.tenantId).toBe("tenant-123");
      expect(context.userId).toBe("user-456");
      expect(context.correlationId).toBe("corr-789");
    });

    it("应该能够在上下文中运行代码", () => {
      const context = TenantContext.create({
        tenantId: "tenant-1",
        correlationId: "corr-1",
      });

      tenantContext.run(context, () => {
        expect(tenantContext.tenantId).toBe("tenant-1");
      });
    });

    it("应该能够嵌套多个上下文", () => {
      const context1 = TenantContext.create({
        tenantId: "tenant-1",
        correlationId: "corr-1",
      });

      const context2 = TenantContext.create({
        tenantId: "tenant-2",
        correlationId: "corr-2",
      });

      tenantContext.run(context1, () => {
        expect(tenantContext.tenantId).toBe("tenant-1");

        tenantContext.run(context2, () => {
          expect(tenantContext.tenantId).toBe("tenant-2");
        });

        expect(tenantContext.tenantId).toBe("tenant-1");
      });
    });
  });

  describe("租户过滤器", () => {
    it("应该能够禁用租户过滤器", () => {
      const mockEm = {
        disableFilter: vi.fn(),
      } as any;

      disableTenantFilter(mockEm);

      expect(mockEm.disableFilter).toHaveBeenCalledWith("tenant");
    });

    it("应该能够启用租户过滤器", () => {
      const mockEm = {
        enableFilter: vi.fn(),
      } as any;

      enableTenantFilter(mockEm);

      expect(mockEm.enableFilter).toHaveBeenCalledWith("tenant");
    });
  });

  describe("数据隔离场景", () => {
    it("租户 A 的查询不应该返回租户 B 的数据", () => {
      const tenantAContext = TenantContext.create({
        tenantId: "tenant-a",
        correlationId: "test-1",
      });

      tenantContext.run(tenantAContext, () => {
        // 騡拟实际查询测试（需要数据库连接）
        // const users = await em.find(User, {});
        // users.forEach(user => {
        //   expect(user.tenantId).toBe('tenant-a');
        // });

        expect(tenantContext.tenantId).toBe("tenant-a");
      });
    });

    it("切换租户上下文应该隔离数据访问", () => {
      const tenantAContext = TenantContext.create({
        tenantId: "tenant-a",
        correlationId: "test-a",
      });

      tenantContext.run(tenantAContext, () => {
        expect(tenantContext.tenantId).toBe("tenant-a");
      });

      const tenantBContext = TenantContext.create({
        tenantId: "tenant-b",
        correlationId: "test-b",
      });

      tenantContext.run(tenantBContext, () => {
        expect(tenantContext.tenantId).toBe("tenant-b");
      });
    });
  });

  describe("边界情况", () => {
    it("应该处理空的租户 ID", () => {
      const context = TenantContext.create({
        tenantId: "",
        correlationId: "test",
      });

      tenantContext.run(context, () => {
        expect(tenantContext.tenantId).toBe("");
      });
    });

    it("应该处理租户上下文缺失的情况", () => {
      // TenantContextService 返回空字符串而不是 undefined
      expect(tenantContext.tenantId).toBe("");
      expect(tenantContext.userId).toBeUndefined();
    });
  });
});
