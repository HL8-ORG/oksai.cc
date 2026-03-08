import { UniqueEntityID } from "@oksai/kernel";
import { beforeEach, describe, expect, it } from "vitest";
import { Tenant } from "./tenant.aggregate.js";
import { TenantPlan } from "./tenant-plan.vo.js";
import { TenantQuota } from "./tenant-quota.vo.js";
import { TenantStatus } from "./tenant-status.vo.js";

describe("Tenant", () => {
  describe("create", () => {
    it("should create tenant with valid props", () => {
      const result = Tenant.create({
        name: "企业A",
        slug: "enterprise-a",
        plan: "PRO",
        ownerId: "user-123",
      });

      expect(result.isOk()).toBe(true);

      const tenant = result.value;
      expect(tenant.name).toBe("企业A");
      expect(tenant.slug).toBe("enterprise-a");
      expect(tenant.plan.value).toBe("PRO");
      expect(tenant.status.isPending()).toBe(true);
      expect(tenant.ownerId.toString()).toBe("user-123");
    });

    it("should generate TenantCreated event", () => {
      const result = Tenant.create({
        name: "企业A",
        slug: "enterprise-a",
        plan: "PRO",
        ownerId: "user-123",
      });

      const tenant = result.value;
      expect(tenant.hasDomainEvents()).toBe(true);
      expect(tenant.domainEventsCount).toBe(1);
      expect(tenant.domainEvents[0].eventName).toBe("tenant.created");
      expect(tenant.domainEvents[0].payload.name).toBe("企业A");
    });

    it("should fail with empty name", () => {
      const result = Tenant.create({
        name: "",
        slug: "enterprise-a",
        plan: "PRO",
        ownerId: "user-123",
      });

      expect(result.isFail()).toBe(true);
      expect(result.error.message).toContain("name");
    });

    it("should fail with invalid slug format", () => {
      const result = Tenant.create({
        name: "企业A",
        slug: "Enterprise_A", // 包含大写和下划线
        plan: "PRO",
        ownerId: "user-123",
      });

      expect(result.isFail()).toBe(true);
      expect(result.error.message).toContain("slug 只能包含小写字母、数字和连字符");
    });

    it("should create with default quota based on plan", () => {
      const result = Tenant.create({
        name: "企业A",
        slug: "enterprise-a",
        plan: "PRO",
        ownerId: "user-123",
      });

      const tenant = result.value;
      expect(tenant.quota.maxMembers).toBe(100); // PRO 套餐配额
    });

    it("should create with custom quota", () => {
      const customQuota = TenantQuota.create({
        maxOrganizations: 20,
        maxMembers: 200,
        maxStorage: 2147483648, // 2GB
      }).value;

      const result = Tenant.create({
        name: "企业A",
        slug: "enterprise-a",
        plan: "PRO",
        ownerId: "user-123",
        quota: customQuota,
      });

      const tenant = result.value;
      expect(tenant.quota.maxMembers).toBe(200);
    });
  });

  describe("activate", () => {
    it("should activate pending tenant", () => {
      const tenant = Tenant.create({
        name: "企业A",
        slug: "enterprise-a",
        plan: "PRO",
        ownerId: "user-123",
      }).value;

      expect(tenant.status.isPending()).toBe(true);

      const result = tenant.activate();

      expect(result.isOk()).toBe(true);
      expect(tenant.status.isActive()).toBe(true);
      expect(tenant.hasDomainEvents()).toBe(true);
      expect(tenant.domainEvents[1].eventName).toBe("tenant.activated");
    });

    it("should fail to activate non-pending tenant", () => {
      const tenant = Tenant.create({
        name: "企业A",
        slug: "enterprise-a",
        plan: "PRO",
        ownerId: "user-123",
      }).value;

      tenant.activate(); // 第一次激活

      const result = tenant.activate(); // 再次激活

      expect(result.isFail()).toBe(true);
      expect(result.error.message).toContain("只有待审核的租户才能激活");
    });
  });

  describe("suspend", () => {
    let activeTenant: Tenant;

    beforeEach(() => {
      activeTenant = Tenant.create({
        name: "企业A",
        slug: "enterprise-a",
        plan: "PRO",
        ownerId: "user-123",
      }).value;
      activeTenant.activate();
      activeTenant.clearDomainEvents();
    });

    it("should suspend active tenant with reason", () => {
      const result = activeTenant.suspend("违规操作");

      expect(result.isOk()).toBe(true);
      expect(activeTenant.status.isSuspended()).toBe(true);
      expect(activeTenant.domainEvents[0].eventName).toBe("tenant.suspended");
      expect(activeTenant.domainEvents[0].payload.reason).toBe("违规操作");
    });

    it("should fail to suspend non-active tenant", () => {
      const pendingTenant = Tenant.create({
        name: "企业B",
        slug: "enterprise-b",
        plan: "PRO",
        ownerId: "user-456",
      }).value;

      const result = pendingTenant.suspend("测试停用");

      expect(result.isFail()).toBe(true);
      expect(result.error.message).toContain("只有活跃的租户才能停用");
    });

    it("should fail with empty reason", () => {
      const result = activeTenant.suspend("");

      expect(result.isFail()).toBe(true);
      expect(result.error.message).toContain("不能为空");
    });
  });

  describe("checkQuota", () => {
    it("should return true when under quota", () => {
      const tenant = Tenant.create({
        name: "企业A",
        slug: "enterprise-a",
        plan: "PRO", // maxMembers: 100
        ownerId: "user-123",
      }).value;

      const hasQuota = tenant.checkQuota("members", 99);

      expect(hasQuota).toBe(true);
    });

    it("should return false when at quota", () => {
      const tenant = Tenant.create({
        name: "企业A",
        slug: "enterprise-a",
        plan: "PRO", // maxMembers: 100
        ownerId: "user-123",
      }).value;

      const hasQuota = tenant.checkQuota("members", 100);

      expect(hasQuota).toBe(false);
    });

    it("should always return true for ENTERPRISE plan (unlimited)", () => {
      const tenant = Tenant.create({
        name: "企业A",
        slug: "enterprise-a",
        plan: "ENTERPRISE",
        ownerId: "user-123",
      }).value;

      expect(tenant.checkQuota("members", 10000)).toBe(true);
      expect(tenant.checkQuota("organizations", 1000)).toBe(true);
    });
  });

  describe("updateQuota", () => {
    it("should update quota and generate event", () => {
      const tenant = Tenant.create({
        name: "企业A",
        slug: "enterprise-a",
        plan: "PRO",
        ownerId: "user-123",
      }).value;

      tenant.clearDomainEvents();

      const newQuota = TenantQuota.create({
        maxOrganizations: 20,
        maxMembers: 200,
        maxStorage: 2147483648,
      }).value;

      const result = tenant.updateQuota(newQuota);

      expect(result.isOk()).toBe(true);
      expect(tenant.quota.maxMembers).toBe(200);
      expect(tenant.domainEvents[0].eventName).toBe("tenant.quota_updated");
    });
  });

  describe("updateSettings", () => {
    it("should merge settings", () => {
      const tenant = Tenant.create({
        name: "企业A",
        slug: "enterprise-a",
        plan: "PRO",
        ownerId: "user-123",
      }).value;

      tenant.updateSettings({ theme: "dark" });
      tenant.updateSettings({ language: "zh" });

      expect(tenant.settings.theme).toBe("dark");
      expect(tenant.settings.language).toBe("zh");
    });
  });

  describe("canBeAccessed", () => {
    it("should return true only for active tenant", () => {
      const pendingTenant = Tenant.create({
        name: "企业A",
        slug: "enterprise-a",
        plan: "PRO",
        ownerId: "user-123",
      }).value;

      expect(pendingTenant.canBeAccessed()).toBe(false);

      pendingTenant.activate();
      expect(pendingTenant.canBeAccessed()).toBe(true);

      pendingTenant.suspend("测试");
      expect(pendingTenant.canBeAccessed()).toBe(false);
    });
  });

  describe("clearDomainEvents", () => {
    it("should clear all domain events", () => {
      const tenant = Tenant.create({
        name: "企业A",
        slug: "enterprise-a",
        plan: "PRO",
        ownerId: "user-123",
      }).value;

      expect(tenant.hasDomainEvents()).toBe(true);

      tenant.clearDomainEvents();

      expect(tenant.hasDomainEvents()).toBe(false);
      expect(tenant.domainEventsCount).toBe(0);
    });
  });

  describe("reconstitute", () => {
    it("should reconstitute tenant from persistence", () => {
      const id = new UniqueEntityID("tenant-123");
      const props = {
        name: "企业A",
        slug: "enterprise-a",
        plan: TenantPlan.pro(),
        status: TenantStatus.active(),
        ownerId: new UniqueEntityID("user-123"),
        quota: TenantQuota.createForPlan(TenantPlan.pro()),
        settings: { theme: "light" },
        metadata: { industry: "tech" },
      };

      const tenant = Tenant.reconstitute(props, id);

      expect(tenant.id.equals(id)).toBe(true);
      expect(tenant.name).toBe("企业A");
      expect(tenant.status.isActive()).toBe(true);
      expect(tenant.hasDomainEvents()).toBe(false); // 重建不应该产生事件
    });
  });

  describe("equals (from Entity)", () => {
    it("should be equal when ids are the same", () => {
      const id = new UniqueEntityID();
      const tenant1 = Tenant.create(
        {
          name: "企业A",
          slug: "enterprise-a",
          plan: "PRO",
          ownerId: "user-123",
        },
        id
      ).value;

      const tenant2 = Tenant.create(
        {
          name: "企业B", // 不同的名称
          slug: "enterprise-b", // 不同的 slug
          plan: "FREE", // 不同的套餐
          ownerId: "user-456", // 不同的所有者
        },
        id // 相同的 ID
      ).value;

      expect(tenant1.equals(tenant2)).toBe(true);
    });

    it("should not be equal when ids are different", () => {
      const tenant1 = Tenant.create({
        name: "企业A",
        slug: "enterprise-a",
        plan: "PRO",
        ownerId: "user-123",
      }).value;

      const tenant2 = Tenant.create({
        name: "企业A",
        slug: "enterprise-a",
        plan: "PRO",
        ownerId: "user-123",
      }).value;

      expect(tenant1.equals(tenant2)).toBe(false);
    });
  });
});
