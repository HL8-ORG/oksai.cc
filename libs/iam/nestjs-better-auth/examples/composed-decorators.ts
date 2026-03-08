/**
 * 组合装饰器使用示例
 *
 * 展示如何使用便捷装饰器来简化权限控制
 */

import { Controller, Delete, Get, Post } from "@nestjs/common";
import type { UserSession } from "@oksai/iam/nestjs-better-auth";
import {
  // 组合装饰器（便捷方法）
  AdminOnly,
  // 基础装饰器
  AllowAnonymous,
  MemberOnly,
  OptionalAuth,
  OrgAdminOnly,
  OrgRoles,
  OwnerOnly,
  Roles,
  Session,
  SuperAdminOnly,
} from "@oksai/iam/nestjs-better-auth";

@Controller("api")
export class AppController {
  // ==================== 公开路由 ====================

  @Get("public/info")
  @AllowAnonymous()
  getPublicInfo() {
    return { message: "任何人都可以访问" };
  }

  @Get("optional/profile")
  @OptionalAuth()
  getOptionalProfile(@Session() session: UserSession | null) {
    if (session) {
      return { user: session.user, message: "欢迎回来" };
    }
    return { message: "请登录以查看更多信息" };
  }

  // ==================== 系统级权限 ====================

  @Get("admin/dashboard")
  @AdminOnly()
  getAdminDashboard() {
    return { message: "仅系统管理员可访问" };
  }

  @Delete("admin/dangerous-action")
  @SuperAdminOnly()
  dangerousAction() {
    return { message: "仅超级管理员可访问" };
  }

  @Get("admin/users")
  @AdminOnly()
  getAllUsers() {
    // 获取所有用户列表
    return { users: [] };
  }

  // ==================== 组织级权限 ====================

  @Delete("organization")
  @OwnerOnly()
  deleteOrganization() {
    return { message: "仅组织所有者可访问" };
  }

  @Post("organization/members")
  @OrgAdminOnly()
  addMember() {
    return { message: "组织管理员及以上可访问" };
  }

  @Get("organization/resources")
  @MemberOnly()
  getResources(@Session() session: UserSession) {
    return {
      message: "所有组织成员可访问",
      orgId: session.session.activeOrganizationId,
    };
  }

  // ==================== 组合使用 ====================

  @Get("admin/organization/stats")
  @AdminOnly()
  @MemberOnly()
  getOrgStats() {
    /**
     * 同时满足两个条件：
     * 1. 系统角色为 admin
     * 2. 在当前组织中至少是 member
     */
    return { message: "系统管理员且是组织成员可访问" };
  }

  // ==================== 传统方式对比 ====================

  // 以下两种写法完全等价：

  // 使用组合装饰器（推荐）
  @Get("v1/admin/quick")
  @AdminOnly()
  quickAdmin() {
    return { version: 1 };
  }

  // 使用基础装饰器
  @Get("v2/admin/quick")
  @Roles(["admin"])
  quickAdminV2() {
    return { version: 2 };
  }

  // 组织权限也是一样：

  // 使用组合装饰器（推荐）
  @Post("v1/org/invite")
  @OrgAdminOnly()
  inviteMemberV1() {
    return { version: 1 };
  }

  // 使用基础装饰器
  @Post("v2/org/invite")
  @OrgRoles(["owner", "admin"])
  inviteMemberV2() {
    return { version: 2 };
  }
}

/**
 * 完整的权限控制示例
 */
@Controller("api/advanced")
export class AdvancedController {
  // 系统管理员 + 组织所有者
  @Delete("organization/force-delete")
  @AdminOnly()
  @OwnerOnly()
  forceDeleteOrganization() {
    /**
     * 双重保护：
     * 1. 必须是系统管理员（防止普通用户误操作）
     * 2. 必须是组织所有者（确保有组织级权限）
     */
    return { message: "组织已强制删除" };
  }

  // 可选认证 + 查看公开信息
  @Get("profile/:userId")
  @OptionalAuth()
  getProfile(@Session() session: UserSession | null) {
    if (session) {
      // 已登录用户可以看到更多信息
      return { detailed: true };
    }
    // 未登录用户只能看到基本信息
    return { detailed: false };
  }
}
