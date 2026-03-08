/**
 * Admin Controller 单元测试
 */

import { ForbiddenException, NotFoundException } from "@nestjs/common";
import type { UserSession } from "@oksai/nestjs-better-auth";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { AdminController } from "./admin.controller.js";
import * as authModule from "./auth.js";

// Mock auth module
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

describe("AdminController", () => {
  let controller: AdminController;
  let mockAuthAPI: any;

  // Mock session
  const mockAdminSession: UserSession = {
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
      id: "session-001",
      token: "admin-token",
      userId: "admin-001",
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  const mockSuperAdminSession: UserSession = {
    user: {
      ...mockAdminSession.user,
      id: "superadmin-001",
      email: "superadmin@example.com",
      role: "superadmin",
    },
    session: {
      ...mockAdminSession.session,
      id: "session-002",
      token: "superadmin-token",
      userId: "superadmin-001",
    },
  };

  const mockUserSession: UserSession = {
    user: {
      ...mockAdminSession.user,
      id: "user-001",
      email: "user@example.com",
      role: "user",
    },
    session: {
      ...mockAdminSession.session,
      id: "session-003",
      token: "user-token",
      userId: "user-001",
    },
  };

  beforeEach(() => {
    vi.clearAllMocks();
    controller = new AdminController();
    mockAuthAPI = authModule.auth.api;
  });

  // ============================================
  // 用户管理测试
  // ============================================

  describe("listUsers", () => {
    it("应该成功获取用户列表（管理员权限）", async () => {
      // Arrange
      const mockResponse = {
        users: [
          { id: "user-001", email: "user1@example.com", role: "user" },
          { id: "user-002", email: "user2@example.com", role: "user" },
        ],
        total: 2,
      };

      mockAuthAPI.listUsers.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.listUsers(mockAdminSession, {
        limit: 10,
        offset: 0,
      });

      // Assert
      expect(mockAuthAPI.listUsers).toHaveBeenCalled();
      expect(result.users).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("应该拒绝普通用户访问", async () => {
      // Act & Assert
      await expect(controller.listUsers(mockUserSession, { limit: 10, offset: 0 })).rejects.toThrow(
        ForbiddenException
      );
    });

    it("应该支持搜索和分页", async () => {
      // Arrange
      const mockResponse = {
        users: [{ id: "user-001", email: "john@example.com" }],
        total: 1,
      };

      mockAuthAPI.listUsers.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.listUsers(mockAdminSession, {
        searchValue: "john",
        limit: 10,
        offset: 0,
      });

      // Assert
      expect(mockAuthAPI.listUsers).toHaveBeenCalledWith(
        expect.objectContaining({
          query: expect.objectContaining({
            searchValue: "john",
            limit: 10,
            offset: 0,
          }),
        })
      );
      expect(result.users).toHaveLength(1);
    });
  });

  describe("getUser", () => {
    it("应该成功获取用户详情", async () => {
      // Arrange
      const mockUser = {
        id: "user-001",
        email: "user@example.com",
        name: "Test User",
        role: "user",
      };

      mockAuthAPI.getUser.mockResolvedValue(mockUser);

      // Act
      const result = await controller.getUser(mockAdminSession, "user-001");

      // Assert
      expect(result.id).toBe("user-001");
      expect(result.email).toBe("user@example.com");
    });

    it("应该在用户不存在时抛出 NotFoundException", async () => {
      // Arrange
      mockAuthAPI.getUser.mockResolvedValue(null);

      // Act & Assert
      await expect(controller.getUser(mockAdminSession, "non-existent")).rejects.toThrow(NotFoundException);
    });
  });

  describe("createUser", () => {
    it("应该成功创建用户", async () => {
      // Arrange
      const createDto = {
        email: "new@example.com",
        password: "SecurePass123",
        name: "New User",
        role: "user" as const,
      };

      const mockCreatedUser = {
        id: "user-new",
        ...createDto,
        emailVerified: false,
      };

      mockAuthAPI.createUser.mockResolvedValue(mockCreatedUser);

      // Act
      const result = await controller.createUser(mockAdminSession, createDto);

      // Assert
      expect(result.email).toBe("new@example.com");
      expect(result.role).toBe("user");
    });
  });

  describe("updateUser", () => {
    it("应该成功更新用户", async () => {
      // Arrange
      const updateDto = {
        name: "Updated Name",
        role: "admin" as const,
      };

      const mockUpdatedUser = {
        id: "user-001",
        email: "user@example.com",
        ...updateDto,
      };

      mockAuthAPI.updateUser.mockResolvedValue(mockUpdatedUser);

      // Act
      const result = await controller.updateUser(mockAdminSession, "user-001", updateDto);

      // Assert
      expect(result.name).toBe("Updated Name");
      expect(result.role).toBe("admin");
    });
  });

  describe("deleteUser", () => {
    it("应该允许超级管理员删除用户", async () => {
      // Arrange
      mockAuthAPI.removeUser.mockResolvedValue({ success: true });

      // Act
      const result = await controller.deleteUser(mockSuperAdminSession, "user-001");

      // Assert
      expect(result.success).toBe(true);
      expect(mockAuthAPI.removeUser).toHaveBeenCalled();
    });

    it("应该拒绝普通管理员删除用户", async () => {
      // Act & Assert
      await expect(controller.deleteUser(mockAdminSession, "user-001")).rejects.toThrow(ForbiddenException);
    });
  });

  // ============================================
  // 角色与权限测试
  // ============================================

  describe("setUserRole", () => {
    it("应该成功设置用户角色", async () => {
      // Arrange
      mockAuthAPI.setRole.mockResolvedValue({ success: true });

      // Act
      const result = await controller.setUserRole(mockAdminSession, "user-001", { role: "admin" });

      // Assert
      expect(result.success).toBe(true);
    });

    it("应该拒绝普通管理员设置超级管理员角色", async () => {
      // Act & Assert
      await expect(
        controller.setUserRole(mockAdminSession, "user-001", {
          role: "superadmin",
        })
      ).rejects.toThrow(ForbiddenException);
    });

    it("应该允许超级管理员设置超级管理员角色", async () => {
      // Arrange
      mockAuthAPI.setRole.mockResolvedValue({ success: true });

      // Act
      const result = await controller.setUserRole(mockSuperAdminSession, "user-001", { role: "superadmin" });

      // Assert
      expect(result.success).toBe(true);
    });
  });

  describe("checkPermission", () => {
    it("应该成功检查用户权限", async () => {
      // Arrange
      mockAuthAPI.userHasPermission.mockResolvedValue(true);

      // Act
      const result = await controller.checkPermission(mockAdminSession, {
        userId: "user-001",
        permissions: { user: ["create", "list"] },
      });

      // Assert
      expect(result.hasPermission).toBe(true);
    });

    it("应该返回 false 当用户没有权限", async () => {
      // Arrange
      mockAuthAPI.userHasPermission.mockResolvedValue(false);

      // Act
      const result = await controller.checkPermission(mockAdminSession, {
        userId: "user-001",
        permissions: { user: ["delete"] },
      });

      // Assert
      expect(result.hasPermission).toBe(false);
    });
  });

  // ============================================
  // 用户状态管理（封禁）测试
  // ============================================

  describe("banUser", () => {
    it("应该成功封禁用户", async () => {
      // Arrange
      mockAuthAPI.banUser.mockResolvedValue({ success: true });

      // Act
      const result = await controller.banUser(mockAdminSession, "user-001", {
        banReason: "违反服务条款",
        banExpiresIn: 86400,
      });

      // Assert
      expect(result.success).toBe(true);
    });

    it("应该使用默认封禁原因", async () => {
      // Arrange
      mockAuthAPI.banUser.mockResolvedValue({ success: true });

      // Act
      await controller.banUser(mockAdminSession, "user-001", {});

      // Assert
      expect(mockAuthAPI.banUser).toHaveBeenCalledWith(
        expect.objectContaining({
          body: expect.objectContaining({
            banReason: "违反服务条款",
          }),
        })
      );
    });
  });

  describe("unbanUser", () => {
    it("应该成功解封用户", async () => {
      // Arrange
      mockAuthAPI.unbanUser.mockResolvedValue({ success: true });

      // Act
      const result = await controller.unbanUser(mockAdminSession, "user-001");

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("用户已解封");
      expect(result.userId).toBe("user-001");
    });
  });

  // ============================================
  // 会话管理测试
  // ============================================

  describe("listUserSessions", () => {
    it("应该成功列出用户会话", async () => {
      // Arrange
      const mockSessions = [
        {
          id: "session-001",
          userId: "user-001",
          token: "token-001",
          expiresAt: new Date(),
        },
        {
          id: "session-002",
          userId: "user-001",
          token: "token-002",
          expiresAt: new Date(),
        },
      ];

      mockAuthAPI.listUserSessions.mockResolvedValue(mockSessions);

      // Act
      const result = await controller.listUserSessions(mockAdminSession, "user-001");

      // Assert
      expect(result.sessions).toHaveLength(2);
      expect(result.total).toBe(2);
    });

    it("应该返回空列表当用户没有会话", async () => {
      // Arrange
      mockAuthAPI.listUserSessions.mockResolvedValue([]);

      // Act
      const result = await controller.listUserSessions(mockAdminSession, "user-001");

      // Assert
      expect(result.sessions).toHaveLength(0);
      expect(result.total).toBe(0);
    });
  });

  describe("revokeUserSession", () => {
    it("应该成功撤销会话", async () => {
      // Arrange
      mockAuthAPI.revokeUserSession.mockResolvedValue({ success: true });

      // Act
      const result = await controller.revokeUserSession(mockAdminSession, "session-token");

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("会话已撤销");
      expect(result.sessionToken).toBe("session-token");
    });
  });

  // ============================================
  // 用户模拟测试
  // ============================================

  describe("impersonateUser", () => {
    it("应该成功模拟用户", async () => {
      // Arrange
      const mockResponse = {
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

      mockAuthAPI.impersonateUser.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.impersonateUser(mockAdminSession, "user-001");

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("模拟登录成功");
      expect(result.impersonatedUser.id).toBe("user-001");
    });

    it("应该拒绝普通用户模拟", async () => {
      // Act & Assert
      await expect(controller.impersonateUser(mockUserSession, "user-001")).rejects.toThrow(
        ForbiddenException
      );
    });
  });

  describe("stopImpersonating", () => {
    it("应该成功停止模拟", async () => {
      // Arrange
      mockAuthAPI.stopImpersonating.mockResolvedValue({ success: true });

      // Act
      const result = await controller.stopImpersonating(mockAdminSession);

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("已停止模拟");
    });
  });

  // ============================================
  // 权限验证测试
  // ============================================

  describe("权限验证", () => {
    it("应该拒绝普通用户访问所有管理功能", async () => {
      // List Users
      await expect(controller.listUsers(mockUserSession, {})).rejects.toThrow(ForbiddenException);

      // Get User
      await expect(controller.getUser(mockUserSession, "user-001")).rejects.toThrow(ForbiddenException);

      // Create User
      await expect(controller.createUser(mockUserSession, {} as any)).rejects.toThrow(ForbiddenException);

      // Ban User
      await expect(controller.banUser(mockUserSession, "user-001", {})).rejects.toThrow(ForbiddenException);

      // Impersonate User
      await expect(controller.impersonateUser(mockUserSession, "user-001")).rejects.toThrow(
        ForbiddenException
      );
    });

    it("应该允许管理员访问大部分管理功能", async () => {
      // 这些操作不应该抛出 ForbiddenException
      mockAuthAPI.listUsers.mockResolvedValue({ users: [], total: 0 });
      mockAuthAPI.getUser.mockResolvedValue({ id: "user-001" });
      mockAuthAPI.createUser.mockResolvedValue({ id: "new-user" });
      mockAuthAPI.banUser.mockResolvedValue({ success: true });

      // List Users
      await expect(controller.listUsers(mockAdminSession, {})).resolves.not.toThrow();

      // Get User
      await expect(controller.getUser(mockAdminSession, "user-001")).resolves.not.toThrow();

      // Create User
      await expect(controller.createUser(mockAdminSession, {} as any)).resolves.not.toThrow();

      // Ban User
      await expect(controller.banUser(mockAdminSession, "user-001", {})).resolves.not.toThrow();
    });

    it("应该拒绝管理员删除用户", async () => {
      await expect(controller.deleteUser(mockAdminSession, "user-001")).rejects.toThrow(ForbiddenException);
    });

    it("应该允许超级管理员访问所有管理功能", async () => {
      mockAuthAPI.removeUser.mockResolvedValue({ success: true });

      // Delete User (仅超级管理员)
      await expect(controller.deleteUser(mockSuperAdminSession, "user-001")).resolves.not.toThrow();
    });
  });
});
