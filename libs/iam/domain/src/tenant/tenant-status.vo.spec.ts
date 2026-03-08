import { describe, it, expect } from "vitest";
import { TenantStatus } from "./tenant-status.vo.js";

describe("TenantStatus", () => {
  describe("factory methods", () => {
    it("should create PENDING status", () => {
      const status = TenantStatus.pending();
      expect(status.value).toBe("PENDING");
      expect(status.isPending()).toBe(true);
      expect(status.canBeActivated()).toBe(true);
    });

    it("should create ACTIVE status", () => {
      const status = TenantStatus.active();
      expect(status.value).toBe("ACTIVE");
      expect(status.isActive()).toBe(true);
      expect(status.canBeAccessed()).toBe(true);
    });

    it("should create SUSPENDED status", () => {
      const status = TenantStatus.suspended();
      expect(status.value).toBe("SUSPENDED");
      expect(status.isSuspended()).toBe(true);
    });

    it("should create DELETED status", () => {
      const status = TenantStatus.deleted();
      expect(status.value).toBe("DELETED");
      expect(status.isDeleted()).toBe(true);
    });
  });

  describe("state checks", () => {
    describe("isPending", () => {
      it("should return true for PENDING status", () => {
        expect(TenantStatus.pending().isPending()).toBe(true);
        expect(TenantStatus.active().isPending()).toBe(false);
        expect(TenantStatus.suspended().isPending()).toBe(false);
        expect(TenantStatus.deleted().isPending()).toBe(false);
      });
    });

    describe("isActive", () => {
      it("should return true for ACTIVE status", () => {
        expect(TenantStatus.active().isActive()).toBe(true);
        expect(TenantStatus.pending().isActive()).toBe(false);
        expect(TenantStatus.suspended().isActive()).toBe(false);
        expect(TenantStatus.deleted().isActive()).toBe(false);
      });
    });

    describe("isSuspended", () => {
      it("should return true for SUSPENDED status", () => {
        expect(TenantStatus.suspended().isSuspended()).toBe(true);
        expect(TenantStatus.pending().isSuspended()).toBe(false);
        expect(TenantStatus.active().isSuspended()).toBe(false);
        expect(TenantStatus.deleted().isSuspended()).toBe(false);
      });
    });

    describe("isDeleted", () => {
      it("should return true for DELETED status", () => {
        expect(TenantStatus.deleted().isDeleted()).toBe(true);
        expect(TenantStatus.pending().isDeleted()).toBe(false);
        expect(TenantStatus.active().isDeleted()).toBe(false);
        expect(TenantStatus.suspended().isDeleted()).toBe(false);
      });
    });
  });

  describe("transition checks", () => {
    describe("canBeActivated", () => {
      it("should return true only for PENDING status", () => {
        expect(TenantStatus.pending().canBeActivated()).toBe(true);
        expect(TenantStatus.active().canBeActivated()).toBe(false);
        expect(TenantStatus.suspended().canBeActivated()).toBe(false);
        expect(TenantStatus.deleted().canBeActivated()).toBe(false);
      });
    });

    describe("canBeSuspended", () => {
      it("should return true only for ACTIVE status", () => {
        expect(TenantStatus.active().canBeSuspended()).toBe(true);
        expect(TenantStatus.pending().canBeSuspended()).toBe(false);
        expect(TenantStatus.suspended().canBeSuspended()).toBe(false);
        expect(TenantStatus.deleted().canBeSuspended()).toBe(false);
      });
    });

    describe("canBeAccessed", () => {
      it("should return true only for ACTIVE status", () => {
        expect(TenantStatus.active().canBeAccessed()).toBe(true);
        expect(TenantStatus.pending().canBeAccessed()).toBe(false);
        expect(TenantStatus.suspended().canBeAccessed()).toBe(false);
        expect(TenantStatus.deleted().canBeAccessed()).toBe(false);
      });
    });
  });

  describe("getDisplayName", () => {
    it("should return Chinese display name", () => {
      expect(TenantStatus.pending().getDisplayName()).toBe("待审核");
      expect(TenantStatus.active().getDisplayName()).toBe("活跃");
      expect(TenantStatus.suspended().getDisplayName()).toBe("已停用");
      expect(TenantStatus.deleted().getDisplayName()).toBe("已删除");
    });
  });

  describe("equals (from ValueObject)", () => {
    it("should be equal when values are the same", () => {
      const status1 = TenantStatus.active();
      const status2 = TenantStatus.active();
      expect(status1.equals(status2)).toBe(true);
    });

    it("should not be equal when values are different", () => {
      const status1 = TenantStatus.pending();
      const status2 = TenantStatus.active();
      expect(status1.equals(status2)).toBe(false);
    });
  });
});
