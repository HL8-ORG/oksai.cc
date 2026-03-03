/**
 * 组织角色和权限测试
 */

import { describe, expect, it } from "vitest";
import {
  getRolePermissions,
  hasPermission,
  OrganizationPermission,
  OrganizationRole,
  ROLE_PERMISSIONS,
} from "./organization-role.enum";

describe("OrganizationRole", () => {
  describe("ROLE_PERMISSIONS", () => {
    it("owner 应该拥有所有权限", () => {
      const permissions = ROLE_PERMISSIONS[OrganizationRole.OWNER];
      expect(permissions.size).toBeGreaterThan(0);
      expect(permissions.has(OrganizationPermission.DELETE_ORGANIZATION)).toBe(true);
      expect(permissions.has(OrganizationPermission.UPDATE_MEMBER_ROLE)).toBe(true);
    });

    it("admin 应该拥有大部分权限（但不能删除组织）", () => {
      const permissions = ROLE_PERMISSIONS[OrganizationRole.ADMIN];
      expect(permissions.has(OrganizationPermission.UPDATE_ORGANIZATION)).toBe(true);
      expect(permissions.has(OrganizationPermission.INVITE_MEMBER)).toBe(true);
      expect(permissions.has(OrganizationPermission.DELETE_ORGANIZATION)).toBe(false);
    });

    it("member 应该只有基础权限", () => {
      const permissions = ROLE_PERMISSIONS[OrganizationRole.MEMBER];
      expect(permissions.has(OrganizationPermission.LIST_MEMBERS)).toBe(true);
      expect(permissions.has(OrganizationPermission.INVITE_MEMBER)).toBe(false);
      expect(permissions.has(OrganizationPermission.UPDATE_ORGANIZATION)).toBe(false);
    });
  });

  describe("hasPermission", () => {
    it("owner 应该有邀请成员的权限", () => {
      const result = hasPermission(OrganizationRole.OWNER, OrganizationPermission.INVITE_MEMBER);
      expect(result).toBe(true);
    });

    it("admin 应该有邀请成员的权限", () => {
      const result = hasPermission(OrganizationRole.ADMIN, OrganizationPermission.INVITE_MEMBER);
      expect(result).toBe(true);
    });

    it("member 不应该有邀请成员的权限", () => {
      const result = hasPermission(OrganizationRole.MEMBER, OrganizationPermission.INVITE_MEMBER);
      expect(result).toBe(false);
    });

    it("owner 应该有删除组织的权限", () => {
      const result = hasPermission(OrganizationRole.OWNER, OrganizationPermission.DELETE_ORGANIZATION);
      expect(result).toBe(true);
    });

    it("admin 不应该有删除组织的权限", () => {
      const result = hasPermission(OrganizationRole.ADMIN, OrganizationPermission.DELETE_ORGANIZATION);
      expect(result).toBe(false);
    });

    it("member 不应该有删除组织的权限", () => {
      const result = hasPermission(OrganizationRole.MEMBER, OrganizationPermission.DELETE_ORGANIZATION);
      expect(result).toBe(false);
    });

    it("所有角色都应该有查看成员列表的权限", () => {
      expect(hasPermission(OrganizationRole.OWNER, OrganizationPermission.LIST_MEMBERS)).toBe(true);
      expect(hasPermission(OrganizationRole.ADMIN, OrganizationPermission.LIST_MEMBERS)).toBe(true);
      expect(hasPermission(OrganizationRole.MEMBER, OrganizationPermission.LIST_MEMBERS)).toBe(true);
    });

    it("无效角色应该返回 false", () => {
      const result = hasPermission("invalid" as OrganizationRole, OrganizationPermission.LIST_MEMBERS);
      expect(result).toBe(false);
    });
  });

  describe("getRolePermissions", () => {
    it("应该返回 owner 的所有权限", () => {
      const permissions = getRolePermissions(OrganizationRole.OWNER);
      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions).toContain(OrganizationPermission.UPDATE_ORGANIZATION);
      expect(permissions).toContain(OrganizationPermission.DELETE_ORGANIZATION);
    });

    it("应该返回 admin 的权限", () => {
      const permissions = getRolePermissions(OrganizationRole.ADMIN);
      expect(permissions.length).toBeGreaterThan(0);
      expect(permissions).toContain(OrganizationPermission.UPDATE_ORGANIZATION);
      expect(permissions).not.toContain(OrganizationPermission.DELETE_ORGANIZATION);
    });

    it("应该返回 member 的权限", () => {
      const permissions = getRolePermissions(OrganizationRole.MEMBER);
      expect(permissions.length).toBe(1);
      expect(permissions).toContain(OrganizationPermission.LIST_MEMBERS);
    });
  });
});
