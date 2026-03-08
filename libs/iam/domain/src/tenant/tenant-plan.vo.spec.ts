import { describe, it, expect } from "vitest";
import { TenantPlan } from "./tenant-plan.vo.js";

describe("TenantPlan", () => {
  describe("create", () => {
    it("should create plan with valid value", () => {
      const result = TenantPlan.create("PRO");

      expect(result.isOk()).toBe(true);
      expect(result.value.value).toBe("PRO");
    });

    it("should fail with empty value", () => {
      const result = TenantPlan.create("");

      expect(result.isFail()).toBe(true);
      expect(result.error.message).toContain("plan 不能为空");
    });

    it("should fail with invalid value", () => {
      const result = TenantPlan.create("INVALID");

      expect(result.isFail()).toBe(true);
      expect(result.error.message).toContain("无效的套餐类型");
    });

    it.each(["FREE", "STARTER", "PRO", "ENTERPRISE"])(
      "should create %s plan",
      (plan) => {
        const result = TenantPlan.create(plan);

        expect(result.isOk()).toBe(true);
        expect(result.value.value).toBe(plan);
      }
    );
  });

  describe("factory methods", () => {
    it("should create FREE plan", () => {
      const plan = TenantPlan.free();
      expect(plan.value).toBe("FREE");
    });

    it("should create STARTER plan", () => {
      const plan = TenantPlan.starter();
      expect(plan.value).toBe("STARTER");
    });

    it("should create PRO plan", () => {
      const plan = TenantPlan.pro();
      expect(plan.value).toBe("PRO");
    });

    it("should create ENTERPRISE plan", () => {
      const plan = TenantPlan.enterprise();
      expect(plan.value).toBe("ENTERPRISE");
    });
  });

  describe("business methods", () => {
    describe("supportsFeature", () => {
      it("should support basic_auth for FREE plan", () => {
        const plan = TenantPlan.free();
        expect(plan.supportsFeature("basic_auth")).toBe(true);
        expect(plan.supportsFeature("sso")).toBe(false);
      });

      it("should support sso for STARTER plan", () => {
        const plan = TenantPlan.starter();
        expect(plan.supportsFeature("basic_auth")).toBe(true);
        expect(plan.supportsFeature("sso")).toBe(true);
        expect(plan.supportsFeature("api_access")).toBe(false);
      });

      it("should support api_access for PRO plan", () => {
        const plan = TenantPlan.pro();
        expect(plan.supportsFeature("api_access")).toBe(true);
        expect(plan.supportsFeature("custom_domain")).toBe(true);
        expect(plan.supportsFeature("sla")).toBe(false);
      });

      it("should support all features for ENTERPRISE plan", () => {
        const plan = TenantPlan.enterprise();
        expect(plan.supportsFeature("basic_auth")).toBe(true);
        expect(plan.supportsFeature("sso")).toBe(true);
        expect(plan.supportsFeature("api_access")).toBe(true);
        expect(plan.supportsFeature("custom_domain")).toBe(true);
        expect(plan.supportsFeature("sla")).toBe(true);
        expect(plan.supportsFeature("support")).toBe(true);
      });
    });

    describe("isHigherThan", () => {
      it("should compare plan levels correctly", () => {
        const free = TenantPlan.free();
        const starter = TenantPlan.starter();
        const pro = TenantPlan.pro();
        const enterprise = TenantPlan.enterprise();

        expect(free.isHigherThan(starter)).toBe(false);
        expect(starter.isHigherThan(free)).toBe(true);
        expect(pro.isHigherThan(starter)).toBe(true);
        expect(enterprise.isHigherThan(pro)).toBe(true);
        expect(pro.isHigherThan(enterprise)).toBe(false);
      });

      it("should return false when comparing same plans", () => {
        const pro1 = TenantPlan.pro();
        const pro2 = TenantPlan.pro();

        expect(pro1.isHigherThan(pro2)).toBe(false);
      });
    });
  });

  describe("equals (from ValueObject)", () => {
    it("should be equal when values are the same", () => {
      const plan1 = TenantPlan.pro();
      const plan2 = TenantPlan.pro();

      expect(plan1.equals(plan2)).toBe(true);
    });

    it("should not be equal when values are different", () => {
      const plan1 = TenantPlan.free();
      const plan2 = TenantPlan.pro();

      expect(plan1.equals(plan2)).toBe(false);
    });
  });
});
