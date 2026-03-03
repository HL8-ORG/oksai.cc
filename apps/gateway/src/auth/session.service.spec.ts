/**
 * Session 管理服务测试
 */

import { NotFoundException } from "@nestjs/common";
import { db } from "@oksai/database";
import { beforeEach, describe, expect, it, vi } from "vitest";
import type { CacheService } from "../common/cache.service";
import { SessionService } from "./session.service";

// Mock 数据库
vi.mock("@oksai/database", () => ({
  db: {
    select: vi.fn(),
    delete: vi.fn(),
    update: vi.fn(),
  },
  sessions: {},
  users: {},
}));

describe("SessionService", () => {
  let sessionService: SessionService;
  let mockDb: any;
  let mockCacheService: CacheService;

  beforeEach(() => {
    vi.clearAllMocks();
    mockDb = db as any;

    // 创建 CacheService mock
    mockCacheService = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      deleteByPrefix: vi.fn(),
      clear: vi.fn(),
      has: vi.fn(),
      size: vi.fn(),
      getStats: vi.fn(),
      resetStats: vi.fn(),
      getOrSet: vi.fn(),
    } as any;

    sessionService = new SessionService(mockCacheService);
  });

  describe("listActiveSessions", () => {
    it("应该成功获取活跃 Session 列表", async () => {
      // Arrange
      const userId = "user-001";
      const mockSessions = [
        {
          id: "session-001",
          userId,
          token: "token-001",
          createdAt: new Date("2026-03-01"),
          expiresAt: new Date("2026-03-10"),
          ipAddress: "192.168.1.1",
          userAgent: "Chrome",
        },
        {
          id: "session-002",
          userId,
          token: "token-002",
          createdAt: new Date("2026-03-02"),
          expiresAt: new Date("2026-03-11"),
          ipAddress: "192.168.1.2",
          userAgent: "Firefox",
        },
      ];

      // 缓存未命中
      mockCacheService.get = vi.fn().mockReturnValue(undefined);

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockSessions),
          }),
        }),
      });

      // Act
      const result = await sessionService.listActiveSessions(userId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sessions).toHaveLength(2);
      expect(result.sessions[0].id).toBe("session-001");
      expect(result.sessions[0].isCurrent).toBe(false);
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it("应该从缓存中返回 Session 列表", async () => {
      // Arrange
      const userId = "user-001";
      const cachedResponse = {
        success: true,
        message: "获取活跃 Session 列表成功",
        sessions: [
          {
            id: "session-001",
            userId,
            createdAt: new Date("2026-03-01"),
            expiresAt: new Date("2026-03-10"),
            ipAddress: "192.168.1.1",
            userAgent: "Chrome",
            isCurrent: false,
          },
        ],
        currentSessionId: undefined,
      };

      // 缓存命中
      mockCacheService.get = vi.fn().mockReturnValue(cachedResponse);

      // Act
      const result = await sessionService.listActiveSessions(userId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sessions).toHaveLength(1);
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it("应该正确标记当前 Session", async () => {
      // Arrange
      const userId = "user-001";
      const currentToken = "token-001";
      const mockSessions = [
        {
          id: "session-001",
          userId,
          token: currentToken,
          createdAt: new Date("2026-03-01"),
          expiresAt: new Date("2026-03-10"),
          ipAddress: "192.168.1.1",
          userAgent: "Chrome",
        },
      ];

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockResolvedValue(mockSessions),
          }),
        }),
      });

      // Act
      const result = await sessionService.listActiveSessions(userId, currentToken);

      // Assert
      expect(result.sessions[0].isCurrent).toBe(true);
      expect(result.currentSessionId).toBe("session-001");
    });

    it("数据库查询失败时应该抛出错误", async () => {
      // Arrange
      const userId = "user-001";
      const error = new Error("Database error");

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            orderBy: vi.fn().mockRejectedValue(error),
          }),
        }),
      });

      // Act & Assert
      await expect(sessionService.listActiveSessions(userId)).rejects.toThrow("Database error");
    });
  });

  describe("revokeSession", () => {
    it("应该成功撤销 Session 并清除缓存", async () => {
      // Arrange
      const userId = "user-001";
      const sessionId = "session-001";

      mockDb.delete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: sessionId }]),
        }),
      });

      // Act
      await sessionService.revokeSession(userId, sessionId);

      // Assert
      expect(mockDb.delete).toHaveBeenCalled();
      expect(mockCacheService.delete).toHaveBeenCalledWith(`session:list:${userId}`);
    });

    it("Session 不存在时应该抛出 NotFoundException", async () => {
      // Arrange
      const userId = "user-001";
      const sessionId = "session-999";

      mockDb.delete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      });

      // Act & Assert
      await expect(sessionService.revokeSession(userId, sessionId)).rejects.toThrow(NotFoundException);
      await expect(sessionService.revokeSession(userId, sessionId)).rejects.toThrow(
        "Session 不存在或无权访问"
      );
    });

    it("数据库删除失败时应该抛出错误", async () => {
      // Arrange
      const userId = "user-001";
      const sessionId = "session-001";
      const error = new Error("Database error");

      mockDb.delete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(error),
        }),
      });

      // Act & Assert
      await expect(sessionService.revokeSession(userId, sessionId)).rejects.toThrow("Database error");
    });
  });

  describe("revokeOtherSessions", () => {
    it("应该成功撤销其他 Session 并清除缓存", async () => {
      // Arrange
      const userId = "user-001";
      const currentToken = "token-001";

      mockDb.delete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "session-002" }, { id: "session-003" }]),
        }),
      });

      // Act
      const result = await sessionService.revokeOtherSessions(userId, currentToken);

      // Assert
      expect(result).toBe(2);
      expect(mockCacheService.delete).toHaveBeenCalledWith(`session:list:${userId}`);
    });

    it("没有其他 Session 时应该返回 0", async () => {
      // Arrange
      const userId = "user-001";
      const currentToken = "token-001";

      mockDb.delete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      });

      // Act
      const result = await sessionService.revokeOtherSessions(userId, currentToken);

      // Assert
      expect(result).toBe(0);
    });

    it("数据库删除失败时应该抛出错误", async () => {
      // Arrange
      const userId = "user-001";
      const currentToken = "token-001";
      const error = new Error("Database error");

      mockDb.delete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(error),
        }),
      });

      // Act & Assert
      await expect(sessionService.revokeOtherSessions(userId, currentToken)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("getSessionConfig", () => {
    it("应该成功从数据库获取 Session 配置", async () => {
      // Arrange
      const userId = "user-001";
      const mockUser = {
        id: userId,
        sessionTimeout: 86400, // 1 天
      };

      // 缓存未命中
      mockCacheService.get = vi.fn().mockReturnValue(undefined);

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      // Act
      const result = await sessionService.getSessionConfig(userId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sessionTimeout).toBe(86400);
      expect(result.sessionTimeoutDays).toBe(1);
      expect(mockCacheService.set).toHaveBeenCalled();
    });

    it("应该从缓存中返回 Session 配置", async () => {
      // Arrange
      const userId = "user-001";
      const cachedConfig = {
        success: true,
        message: "获取 Session 配置成功",
        sessionTimeout: 86400,
        sessionTimeoutDays: 1,
      };

      // 缓存命中
      mockCacheService.get = vi.fn().mockReturnValue(cachedConfig);

      // Act
      const result = await sessionService.getSessionConfig(userId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sessionTimeout).toBe(86400);
      expect(mockDb.select).not.toHaveBeenCalled();
    });

    it("用户不存在时应该抛出 NotFoundException", async () => {
      // Arrange
      const userId = "user-999";

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([]),
          }),
        }),
      });

      // Act & Assert
      await expect(sessionService.getSessionConfig(userId)).rejects.toThrow(NotFoundException);
      await expect(sessionService.getSessionConfig(userId)).rejects.toThrow("用户不存在");
    });

    it("没有自定义配置时应该返回默认值（7 天）", async () => {
      // Arrange
      const userId = "user-001";
      const mockUser = {
        id: userId,
        sessionTimeout: null, // 未设置
      };

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      // Act
      const result = await sessionService.getSessionConfig(userId);

      // Assert
      expect(result.sessionTimeout).toBe(604800); // 7 天
      expect(result.sessionTimeoutDays).toBe(7);
    });

    it("数据库查询失败时应该抛出错误", async () => {
      // Arrange
      const userId = "user-001";
      const error = new Error("Database error");

      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(error),
          }),
        }),
      });

      // Act & Assert
      await expect(sessionService.getSessionConfig(userId)).rejects.toThrow("Database error");
    });
  });

  describe("updateSessionConfig", () => {
    it("应该成功更新 Session 配置并清除缓存", async () => {
      // Arrange
      const userId = "user-001";
      const dto = { sessionTimeout: 2592000 }; // 30 天
      const mockUser = {
        id: userId,
        sessionTimeout: 2592000,
        allowConcurrentSessions: true,
      };

      // Mock 更新操作
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      // Mock 查询操作（updateSessionConfig 会调用 getSessionConfig）
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      // 缓存未命中（getSessionConfig 会检查缓存）
      mockCacheService.get = vi.fn().mockReturnValue(undefined);

      // Act
      const result = await sessionService.updateSessionConfig(userId, dto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sessionTimeout).toBe(2592000);
      expect(result.sessionTimeoutDays).toBe(30);
      expect(mockCacheService.delete).toHaveBeenCalledWith(`session:config:${userId}`);
    });

    it("应该支持更新为 1 小时", async () => {
      // Arrange
      const userId = "user-001";
      const dto = { sessionTimeout: 3600 }; // 1 小时
      const mockUser = {
        id: userId,
        sessionTimeout: 3600,
        allowConcurrentSessions: true,
      };

      // Mock 更新操作
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      // Mock 查询操作
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      // 缓存未命中
      mockCacheService.get = vi.fn().mockReturnValue(undefined);

      // Act
      const result = await sessionService.updateSessionConfig(userId, dto);

      // Assert
      expect(result.sessionTimeout).toBe(3600);
      expect(result.sessionTimeoutDays).toBeCloseTo(0);
    });

    it("应该支持更新并发登录配置", async () => {
      // Arrange
      const userId = "user-001";
      const dto = { allowConcurrentSessions: false };
      const mockUser = {
        id: userId,
        sessionTimeout: 604800,
        allowConcurrentSessions: false,
      };

      // Mock 更新操作
      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue(undefined),
        }),
      });

      // Mock 查询操作
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockResolvedValue([mockUser]),
          }),
        }),
      });

      // 缓存未命中
      mockCacheService.get = vi.fn().mockReturnValue(undefined);

      // Act
      const result = await sessionService.updateSessionConfig(userId, dto);

      // Assert
      expect(result.allowConcurrentSessions).toBe(false);
    });

    it("数据库更新失败时应该抛出错误", async () => {
      // Arrange
      const userId = "user-001";
      const dto = { sessionTimeout: 86400 };
      const error = new Error("Database error");

      mockDb.update.mockReturnValue({
        set: vi.fn().mockReturnValue({
          where: vi.fn().mockRejectedValue(error),
        }),
      });

      // Act & Assert
      await expect(sessionService.updateSessionConfig(userId, dto)).rejects.toThrow("Database error");
    });
  });

  describe("cleanExpiredSessions", () => {
    it("应该成功清理过期 Session", async () => {
      // Arrange
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi
            .fn()
            .mockResolvedValue([{ id: "session-001" }, { id: "session-002" }, { id: "session-003" }]),
        }),
      });

      // Act
      const result = await sessionService.cleanExpiredSessions();

      // Assert
      expect(result).toBe(3);
    });

    it("没有过期 Session 时应该返回 0", async () => {
      // Arrange
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([]),
        }),
      });

      // Act
      const result = await sessionService.cleanExpiredSessions();

      // Assert
      expect(result).toBe(0);
    });

    it("数据库清理失败时应该抛出错误", async () => {
      // Arrange
      const error = new Error("Database error");

      mockDb.delete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockRejectedValue(error),
        }),
      });

      // Act & Assert
      await expect(sessionService.cleanExpiredSessions()).rejects.toThrow("Database error");
    });
  });

  describe("handleConcurrentSessions", () => {
    it("允许并发登录时应该返回 0", async () => {
      // Arrange
      const userId = "user-001";
      const currentToken = "token-001";
      const mockConfig = {
        success: true,
        message: "获取 Session 配置成功",
        sessionTimeout: 604800,
        sessionTimeoutDays: 7,
        allowConcurrentSessions: true,
      };

      // 缓存命中
      mockCacheService.get = vi.fn().mockReturnValue(mockConfig);

      // Act
      const result = await sessionService.handleConcurrentSessions(userId, currentToken);

      // Assert
      expect(result).toBe(0);
    });

    it("不允许并发登录时应该撤销其他 Session", async () => {
      // Arrange
      const userId = "user-001";
      const currentToken = "token-001";
      const mockConfig = {
        success: true,
        message: "获取 Session 配置成功",
        sessionTimeout: 604800,
        sessionTimeoutDays: 7,
        allowConcurrentSessions: false,
      };

      // 缓存命中
      mockCacheService.get = vi.fn().mockReturnValue(mockConfig);

      // Mock revokeOtherSessions
      mockDb.delete.mockReturnValue({
        where: vi.fn().mockReturnValue({
          returning: vi.fn().mockResolvedValue([{ id: "session-002" }, { id: "session-003" }]),
        }),
      });

      // Act
      const result = await sessionService.handleConcurrentSessions(userId, currentToken);

      // Assert
      expect(result).toBe(2);
    });

    it("获取配置失败时应该返回 0（不阻止登录）", async () => {
      // Arrange
      const userId = "user-001";
      const currentToken = "token-001";

      // 缓存未命中，数据库查询失败
      mockCacheService.get = vi.fn().mockReturnValue(undefined);
      mockDb.select.mockReturnValue({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockReturnValue({
            limit: vi.fn().mockRejectedValue(new Error("Database error")),
          }),
        }),
      });

      // Act
      const result = await sessionService.handleConcurrentSessions(userId, currentToken);

      // Assert
      expect(result).toBe(0); // 即使失败也不应该阻止登录
    });
  });
});
