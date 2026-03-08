import { describe, it, expect } from "vitest";
import { TenantQuota } from "./tenant-quota.vo.js";
import { TenantPlan } from "./tenant-plan.vo.js";

describe("TenantQuota", () => {
  describe("create", () => {
    it("should create quota with valid props", () => {
      const result = TenantQuota.create({
        maxOrganizations: 10,
        maxMembers: 100,
        maxStorage: 1073741824, // 1GB
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.maxOrganizations).toBe(10);
      expect(result.value.maxMembers).toBe(100);
      expect(result.value.maxStorage).toBe(1073741824);
    });

    it("should fail with null values", () => {
      const result = TenantQuota.create({
        maxOrganizations: null as any,
        maxMembers: 100,
        maxStorage: 1073741824,
      });

      expect(result.isFail()).toBe(true);
      expect(result.error.message).toContain("maxOrganizations");
    });

    it("should fail with negative values less than -1", () => {
      const result = TenantQuota.create({
        maxOrganizations: -2,
        maxMembers: 100,
        maxStorage: 1073741824,
      });

      expect(result.isFail()).toBe(true);
      expect(result.error.message).toContain("配额不能小于 -1");
    });

    it("should allow -1 (unlimited)", () => {
      const result = TenantQuota.create({
        maxOrganizations: -1,
        maxMembers: -1,
        maxStorage: -1,
      });

      expect(result.isOk()).toBe(true);
      expect(result.value.isUnlimited()).toBe(true);
    });
  });

  describe("createForPlan", () => {
    it("should create FREE plan quota", () => {
      const plan = TenantPlan.free();
      const quota = TenantQuota.createForPlan(plan);

      expect(quota.maxOrganizations).toBe(1);
      expect(quota.maxMembers).toBe(5);
      expect(quota.maxStorage).toBe(1073741824); // 1GB
    });

    it("should create STARTER plan quota", () => {
      const plan = TenantPlan.starter();
      const quota = TenantQuota.createForPlan(plan);

      expect(quota.maxOrganizations).toBe(3);
      expect(quota.maxMembers).toBe(20);
      expect(quota.maxStorage).toBe(10737418240); // 10GB
    });

    it("should create PRO plan quota", () => {
      const plan = TenantPlan.pro();
      const quota = TenantQuota.createForPlan(plan);

      expect(quota.maxOrganizations).toBe(10);
      expect(quota.maxMembers).toBe(100);
      expect(quota.maxStorage).toBe(107374182400); // 100GB
    });

    it("should create ENTERPRISE plan quota (unlimited)", () => {
      const plan = TenantPlan.enterprise();
      const quota = TenantQuota.createForPlan(plan);

      expect(quota.maxOrganizations).toBe(-1);
      expect(quota.maxMembers).toBe(-1);
      expect(quota.maxStorage).toBe(-1);
      expect(quota.isUnlimited()).toBe(true);
    });
  });

  describe("unlimited", () => {
    it("should create unlimited quota", () => {
      const quota = TenantQuota.unlimited();

      expect(quota.maxOrganizations).toBe(-1);
      expect(quota.maxMembers).toBe(-1);
      expect(quota.maxStorage).toBe(-1);
      expect(quota.isUnlimited()).toBe(true);
    });
  });

  describe("isWithinLimit", () => {
    it("should return true when under limit", () => {
      const quota = TenantQuota.create({
        maxOrganizations: 10,
        maxMembers: 100,
        maxStorage: 1073741824,
      }).value;

      expect(quota.isWithinLimit("organizations", 9)).toBe(true);
      expect(quota.isWithinLimit("members", 99)).toBe(true);
      expect(quota.isWithinLimit("storage", 1073741823)).toBe(true);
    });

    it("should return false when at limit", () => {
      const quota = TenantQuota.create({
        maxOrganizations: 10,
        maxMembers: 100,
        maxStorage: 1073741824,
      }).value;

      expect(quota.isWithinLimit("organizations", 10)).toBe(false);
      expect(quota.isWithinLimit("members", 100)).toBe(false);
      expect(quota.isWithinLimit("storage", 1073741824)).toBe(false);
    });

    it("should return true for unlimited quota", () => {
      const quota = TenantQuota.unlimited();

      expect(quota.isWithinLimit("organizations", 1000)).toBe(true);
      expect(quota.isWithinLimit("members", 10000)).toBe(true);
      expect(quota.isWithinLimit("storage", 1073741824000)).toBe(true);
    });
  });

  describe("isAtLimit", () => {
    it("should return true when at or over limit", () => {
      const quota = TenantQuota.create({
        maxOrganizations: 10,
        maxMembers: 100,
        maxStorage: 1073741824,
      }).value;

      expect(quota.isAtLimit("organizations", 10)).toBe(true);
      expect(quota.isAtLimit("organizations", 11)).toBe(true);
    });

    it("should return false when under limit", () => {
      const quota = TenantQuota.create({
        maxOrganizations: 10,
        maxMembers: 100,
        maxStorage: 1073741824,
      }).value;

      expect(quota.isAtLimit("organizations", 9)).toBe(false);
    });
  });

  describe("getRemaining", () => {
    it("should return remaining quota", () => {
      const quota = TenantQuota.create({
        maxOrganizations: 10,
        maxMembers: 100,
        maxStorage: 1073741824,
      }).value;

      expect(quota.getRemaining("organizations", 7)).toBe(3);
      expect(quota.getRemaining("members", 95)).toBe(5);
    });

    it("should return 0 when at or over limit", () => {
      const quota = TenantQuota.create({
        maxOrganizations: 10,
        maxMembers: 100,
        maxStorage: 1073741824,
      }).value;

      expect(quota.getRemaining("organizations", 10)).toBe(0);
      expect(quota.getRemaining("organizations", 15)).toBe(0);
    });

    it("should return -1 for unlimited quota", () => {
      const quota = TenantQuota.unlimited();

      expect(quota.getRemaining("organizations", 1000)).toBe(-1);
      expect(quota.getRemaining("members", 10000)).toBe(-1);
    });
  });

  describe("increase", () => {
    it("should return new instance with increased quota", () => {
      const quota = TenantQuota.create({
        maxOrganizations: 10,
        maxMembers: 100,
        maxStorage: 1073741824,
      }).value;

      const increased = quota.increase("organizations", 5);

      expect(increased.maxOrganizations).toBe(15);
      expect(quota.maxOrganizations).toBe(10); // 原实例不变
    });

    it("should increase members quota", () => {
      const quota = TenantQuota.create({
        maxOrganizations: 10,
        maxMembers: 100,
        maxStorage: 1073741824,
      }).value;

      const increased = quota.increase("members", 50);

      expect(increased.maxMembers).toBe(150);
    });

    it("should increase storage quota", () => {
      const quota = TenantQuota.create({
        maxOrganizations: 10,
        maxMembers: 100,
        maxStorage: 1073741824,
      }).value;

      const increased = quota.increase("storage", 1073741824);

      expect(increased.maxStorage).toBe(2147483648); // 2GB
    });
  });

  describe("setLimit", () => {
    it("should return new instance with new limit", () => {
      const quota = TenantQuota.create({
        maxOrganizations: 10,
        maxMembers: 100,
        maxStorage: 1073741824,
      }).value;

      const updated = quota.setLimit("organizations", 20);

      expect(updated.maxOrganizations).toBe(20);
      expect(quota.maxOrganizations).toBe(10); // 原实例不变
    });
  });

  describe("toString", () => {
    it("should format quota as readable string", () => {
      const quota = TenantQuota.create({
        maxOrganizations: 10,
        maxMembers: 100,
        maxStorage: 1073741824, // 1GB
      }).value;

      const str = quota.toString();

      expect(str).toContain("组织: 10");
      expect(str).toContain("成员: 100");
      expect(str).toContain("存储:");
    });

    it("should show unlimited for -1 values", () => {
      const quota = TenantQuota.unlimited();
      const str = quota.toString();

      expect(str).toContain("无限制");
    });
  });

  describe("equals (from ValueObject)", () => {
    it("should be equal when all values are the same", () => {
      const quota1 = TenantQuota.create({
        maxOrganizations: 10,
        maxMembers: 100,
        maxStorage: 1073741824,
      }).value;

      const quota2 = TenantQuota.create({
        maxOrganizations: 10,
        maxMembers: 100,
        maxStorage: 1073741824,
      }).value;

      expect(quota1.equals(quota2)).toBe(true);
    });

    it("should not be equal when values are different", () => {
      const quota1 = TenantQuota.create({
        maxOrganizations: 10,
        maxMembers: 100,
        maxStorage: 1073741824,
      }).value;

      const quota2 = TenantQuota.create({
        maxOrganizations: 20,
        maxMembers: 100,
        maxStorage: 1073741824,
      }).value;

      expect(quota1.equals(quota2)).toBe(false);
    });
  });
});
