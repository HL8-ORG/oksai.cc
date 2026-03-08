/**
 * Admin 管理功能集成测试
 *
 * @description
 * 测试完整的 Admin 管理流程，包括与 Better Auth API 的集成
 */

import { ForbiddenException, NotFoundException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminController } from "./admin.controller.js";
import * as authModule from "./auth.js";

// Mock Better Auth
vi.mock("./auth", () => ({
  auth: {
    api: {
      listUsers: vi.fn(),
      getUser: vi.fn(),
      createUser: vi.fn(),
      updateUser: vi.fn(),
      removeUser: vi.fn(),
      setRole: vi.fn(),
      userHasPermission: vi.fn(),
      banUser: vi.fn(),
      unbanUser: vi.fn(),
      listUserSessions: vi.fn(),
      revokeUserSession: vi.fn(),
      impersonateUser: vi.fn(),
      stopImpersonating: vi.fn(),
    },
  },
}));

describe("Admin 管理功能集成测试", () => {
  let controller: AdminController;
  let mockAuthAPI: any;

  // Mock sessions
  const superAdminSession = {
    user: {
      id: "superadmin-001",
      email: "superadmin@example.com",
      name: "Super Admin",
      role: "superadmin",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: "session-superadmin",
      token: "superadmin-token",
      userId: "superadmin-001",
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const adminSession = {
    user: {
      id: "admin-001",
      email: "admin@example.com",
      name: "Admin User",
      role: "admin",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: "session-admin",
      token: "admin-token",
      userId: "admin-001",
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const userSession = {
    user: {
      id: "user-001",
      email: "user@example.com",
      name: "Regular User",
      role: "user",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: "session-user",
      token: "user-token",
      userId: "user-001",
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new AdminController();
    mockAuthAPI = authModule.auth.api;
  });

  // ============================================
  // 完整的用户管理流程
  // ============================================

  describe("完整的用户管理流程", () => {
    it("应该完成完整的用户生命周期（创建→查看→更新→删除）", async () => {
      // 1. 创建用户
      const createDto = {
        email: "newuser@example.com",
        password: "SecurePass123",
        name: "New User",
        role: "user" as const,
      };

      const createdUser = {
        id: "user-new",
        ...createDto,
        emailVerified: false,
        banned: false,
        banReason: null,
        bannedAt: null,
        banExpires: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };

      mockAuthAPI.createUser.mockResolvedValue(createdUser);

      const createResult = await controller.createUser(adminSession, createDto);
      expect(createResult.email).toBe(createDto.email);
      expect(createResult.role).toBe("user");

      // 2. 查看用户
      mockAuthAPI.getUser.mockResolvedValue(createdUser);

      const getResult = await controller.getUser(adminSession, createdUser.id);
      expect(getResult.id).toBe(createdUser.id);
      expect(getResult.email).toBe(createDto.email);

      // 3. 更新用户
      const updateDto = {
        name: "Updated User",
        role: "admin" as const,
      };

      const updatedUser = {
        ...createdUser,
        ...updateDto,
      };

      mockAuthAPI.updateUser.mockResolvedValue(updatedUser);

      const updateResult = await controller.updateUser(adminSession, createdUser.id, updateDto);
      expect(updateResult.name).toBe(updateDto.name);
      expect(updateResult.role).toBe("admin");

      // 4. 删除用户（需要超级管理员）
      mockAuthAPI.removeUser.mockResolvedValue({ success: true });

      const deleteResult = await controller.deleteUser(superAdminSession, createdUser.id);
      expect(deleteResult.success).toBe(true);
    });

    it("应该支持批量查询用户", async () => {
      const mockUsers = [
        { id: "user-001", email: "user1@example.com", role: "user" },
        { id: "user-002", email: "user2@example.com", role: "user" },
        { id: "user-003", email: "user3@example.com", role: "admin" },
      ];

      mockAuthAPI.listUsers.mockResolvedValue({
        users: mockUsers,
        total: 3,
      });

      const result = await controller.listUsers(adminSession, {
        limit: 10,
        offset: 0,
      });

      expect(result.users).toHaveLength(3);
      expect(result.total).toBe(3);
    });
  });

  // ============================================
  // 角色设置和权限检查流程
  // ============================================

  describe("角色设置和权限检查流程", () => {
    it("应该成功设置用户角色并验证权限", async () => {
      // 1. 设置用户角色为 admin
      mockAuthAPI.setRole.mockResolvedValue({ success: true });

      const setResult = await controller.setUserRole(adminSession, "user-001", {
        role: "admin",
      });
      expect(setResult.success).toBe(true);

      // 2. 检查用户权限
      mockAuthAPI.userHasPermission.mockResolvedValue(true);

      const checkResult = await controller.checkPermission(adminSession, {
        userId: "user-001",
        permissions: { user: ["create", "list"] },
      });
      expect(checkResult.hasPermission).toBe(true);
    });

    it("应该拒绝普通管理员设置超级管理员角色", async () => {
      await expect(
        controller.setUserRole(adminSession, "user-001", {
          role: "superadmin",
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it("应该允许超级管理员设置超级管理员角色", async () => {
      mockAuthAPI.setRole.mockResolvedValue({ success: true });

      const result = await controller.setUserRole(superAdminSession, "user-001", { role: "superadmin" });
      expect(result.success).toBe(true);
    });
  });

  // ============================================
  // 封禁/解封流程
  // ============================================

  describe("封禁/解封流程", () => {
    it("应该成功封禁用户", async () => {
      mockAuthAPI.banUser.mockResolvedValue({ success: true });

      const result = await controller.banUser(adminSession, "user-001", {
        banReason: "违反服务条款",
        banExpiresIn: 86400, // 1 天
      });

      expect(result.success).toBe(true);
      expect(mockAuthAPI.banUser).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            userId: "user-001",
            banReason: "违反服务条款",
            banExpiresIn: 86400,
          }),
        })
      );
    });

    it("应该成功解封用户", async () => {
      mockAuthAPI.unbanUser.mockResolvedValue({ success: true });

      const result = await controller.unbanUser(adminSession, "user-001");

      expect(result.success).toBe(true);
      expect(result.message).toBe("用户已解封");
      expect(result.userId).toBe("user-001");
    });

    it("应该使用默认封禁原因", async () => {
      mockAuthAPI.banUser.mockResolvedValue({ success: true });

      await controller.banUser(adminSession, "user-001", {});

      expect(mockAuthAPI.banUser).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            banReason: "违反服务条款",
          }),
        })
      );
    });
  });

  // ============================================
  // 会话管理流程
  // ============================================

  describe("会话管理流程", () => {
    it("应该成功列出和撤销会话", async () => {
      // 1. 列出用户会话
      const mockSessions = [
        {
          id: "session-001",
          userId: "user-001",
          token: "token-001",
          expiresAt: new Date(Date.now() + 3600000),
          ipAddress: "192.168.1.1",
          userAgent: "Chrome",
        },
        {
          id: "session-002",
          userId: "user-001",
          token: "token-002",
          expiresAt: new Date(Date.now() + 3600000),
          ipAddress: "192.168.1.2",
          userAgent: "Firefox",
        },
      ];

      mockAuthAPI.listUserSessions.mockResolvedValue(mockSessions);

      const listResult = await controller.listUserSessions(adminSession, "user-001");
      expect(listResult.sessions).toHaveLength(2);
      expect(listResult.total).toBe(2);

      // 2. 撤销会话
      mockAuthAPI.revokeUserSession.mockResolvedValue({ success: true });

      const revokeResult = await controller.revokeUserSession(adminSession, "token-001");
      expect(revokeResult.success).toBe(true);
      expect(revokeResult.message).toBe("会话已撤销");
    });
  });

  // ============================================
  // 用户模拟流程
  // ============================================

  describe("用户模拟流程", () => {
    it("应该成功模拟用户并停止模拟", async () => {
      // 1. 模拟用户
      const mockImpersonateResponse = {
        session: {
          id: "impersonation-session",
          token: "impersonation-token",
          expiresAt: new Date(Date.now() + 3600000),
        },
        user: {
          id: "user-001",
          email: "user@example.com",
          name: "Test User",
        },
      };

      mockAuthAPI.impersonateUser.mockResolvedValue(mockImpersonateResponse);

      const impersonateResult = await controller.impersonateUser(adminSession, "user-001");
      expect(impersonateResult.success).toBe(true);
      expect(impersonateResult.message).toBe("模拟登录成功");
      expect(impersonateResult.impersonatedUser.id).toBe("user-001");

      // 2. 停止模拟
      mockAuthAPI.stopImpersonating.mockResolvedValue({ success: true });

      const stopResult = await controller.stopImpersonating(adminSession);
      expect(stopResult.success).toBe(true);
      expect(stopResult.message).toBe("已停止模拟");
    });

    it("应该拒绝普通用户模拟", async () => {
      await expect(controller.impersonateUser(userSession, "user-001")).rejects.toThrow(ForbiddenException);
    });
  });

  // ============================================
  // 权限验证测试
  // ============================================

  describe("权限验证", () => {
    it("应该拒绝普通用户访问所有管理功能", async () => {
      // 测试多个端点
      await expect(controller.listUsers(userSession, {})).rejects.toThrow(ForbiddenException);

      await expect(controller.getUser(userSession, "user-001")).rejects.toThrow(ForbiddenException);

      await expect(controller.createUser(userSession, {} as any)).rejects.toThrow(ForbiddenException);

      await expect(controller.banUser(userSession, "user-001", {})).rejects.toThrow(ForbiddenException);

      await expect(controller.impersonateUser(userSession, "user-001")).rejects.toThrow(ForbiddenException);
    });

    it("应该允许管理员访问大部分管理功能", async () => {
      // Mock API 响应
      mockAuthAPI.listUsers.mockResolvedValue({ users: [], total: 0 });
      mockAuthAPI.getUser.mockResolvedValue({ id: "user-001" });
      mockAuthAPI.createUser.mockResolvedValue({ id: "new-user" });
      mockAuthAPI.banUser.mockResolvedValue({ success: true });

      // 这些操作不应该抛出异常
      await expect(controller.listUsers(adminSession, {})).resolves.toBeDefined();

      await expect(controller.getUser(adminSession, "user-001")).resolves.toBeDefined();

      await expect(controller.createUser(adminSession, {} as any)).resolves.toBeDefined();

      await expect(controller.banUser(adminSession, "user-001", {})).resolves.toBeDefined();
    });

    it("应该拒绝管理员删除用户", async () => {
      await expect(controller.deleteUser(adminSession, "user-001")).rejects.toThrow(ForbiddenException);
    });

    it("应该允许超级管理员访问所有管理功能", async () => {
      mockAuthAPI.removeUser.mockResolvedValue({ success: true });

      // 删除用户（仅超级管理员）
      await expect(controller.deleteUser(superAdminSession, "user-001")).resolves.toBeDefined();
    });
  });

  // ============================================
  // 错误处理测试
  // ============================================

  describe("错误处理", () => {
    it("应该在用户不存在时抛出 NotFoundException", async () => {
      mockAuthAPI.getUser.mockResolvedValue(null);

      await expect(controller.getUser(adminSession, "non-existent")).rejects.toThrow(NotFoundException);
    });

    it("应该处理 Better Auth API 错误", async () => {
      mockAuthAPI.createUser.mockRejectedValue(new Error("Database error"));

      await expect(
        controller.createUser(adminSession, {
          email: "test@example.com",
          password: "password",
        })
      ).rejects.toThrow("Database error");
    });
  });
});
