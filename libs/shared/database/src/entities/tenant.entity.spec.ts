import { afterEach, beforeEach, describe, expect, it } from "vitest";
import { Tenant } from "./tenant.entity.js";

describe("Tenant Entity", () => {
  describe("创建租户", () => {
    it("应该创建租户并生成 TenantCreatedEvent", () => {
      const tenant = new Tenant("测试公司", "basic");

      expect(tenant.name).toBe("测试公司");
      expect(tenant.plan).toBe("basic");
      expect(tenant.status).toBe("pending");
      expect(tenant.id).toBeDefined();
      expect(tenant.createdAt).toBeInstanceOf(Date);
      expect(tenant.updatedAt).toBeInstanceOf(Date);
    });

    it("应该生成领域事件", () => {
      const tenant = new Tenant("测试公司", "basic");

      expect(tenant.hasDomainEvents()).toBe(true);
      expect(tenant.domainEvents).toHaveLength(1);
      expect(tenant.domainEvents[0].eventName).toBe("TenantCreated");
    });

    it("应该清除领域事件", () => {
      const tenant = new Tenant("测试公司", "basic");

      tenant.clearDomainEvents();

      expect(tenant.hasDomainEvents()).toBe(false);
      expect(tenant.domainEvents).toHaveLength(0);
    });
  });

  describe("激活租户", () => {
    it("应该激活待审核的租户", () => {
      const tenant = new Tenant("测试公司", "basic");

      tenant.clearDomainEvents();
      tenant.activate();

      expect(tenant.status).toBe("active");
      expect(tenant.hasDomainEvents()).toBe(true);
      expect(tenant.domainEvents).toHaveLength(1);
      expect(tenant.domainEvents[0].eventName).toBe("TenantActivated");
    });

    it("应该拒绝激活已激活的租户", () => {
      const tenant = new Tenant("测试公司", "basic");
      tenant.activate();

      expect(() => tenant.activate()).toThrow("只有待审核的租户才能激活");
    });
  });

  describe("聚合根功能", () => {
    it("应该返回 aggregateId", () => {
      const tenant = new Tenant("测试公司", "basic");

      expect(tenant.aggregateId).toBeDefined();
      expect(tenant.aggregateId.toString()).toBe(tenant.id);
    });
  });
});
