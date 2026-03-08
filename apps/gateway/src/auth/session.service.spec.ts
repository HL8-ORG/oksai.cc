/**
 * Session 管理服务测试
 */

import type { TwoLayerCacheService } from "@oksai/cache";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { SessionService } from "./session.service.js";

// Mock EntityManager
const mockEm = {
  find: vi.fn(),
  findOne: vi.fn(),
  remove: vi.fn(),
  removeAndFlush: vi.fn(),
  flush: vi.fn(),
  create: vi.fn(),
} as any;

// Mock BetterAuthApiClient
const mockApiClient = {
  listActiveSessions: vi.fn(),
  revokeSession: vi.fn(),
  revokeAllSessions: vi.fn(),
  getSessionConfig: vi.fn(),
  updateSessionConfig: vi.fn(),
} as any;

describe("SessionService", () => {
  let sessionService: SessionService;
  let mockCacheService: TwoLayerCacheService;

  beforeEach(() => {
    vi.clearAllMocks();

    // 创建 TwoLayerCacheService mock
    mockCacheService = {
      get: vi.fn(),
      set: vi.fn(),
      delete: vi.fn(),
      deleteByPrefix: vi.fn(),
      getStats: vi.fn(),
      resetStats: vi.fn(),
    } as any;

    sessionService = new SessionService(mockEm, mockApiClient, mockCacheService);
  });

  describe("listActiveSessions", () => {
    it("应该成功获取活跃 Session 列表", async () => {
      // Arrange
      const userId = "user-001";
      const mockSessions = [
        {
          id: "session-001",
          userId,
          createdAt: new Date("2026-03-01"),
          expiresAt: new Date("2026-03-10"),
          ipAddress: "192.168.1.1",
          userAgent: "Chrome",
        },
        {
          id: "session-002",
          userId,
          createdAt: new Date("2026-03-02"),
          expiresAt: new Date("2026-03-11"),
          ipAddress: "192.168.1.2",
          userAgent: "Firefox",
        },
      ];

      // 缓存未命中
      mockCacheService.get = vi.fn().mockReturnValue(undefined);
      mockApiClient.listActiveSessions.mockResolvedValue({
        sessions: mockSessions,
        currentSessionId: undefined,
      });

      // Act
      const result = await sessionService.listActiveSessions(userId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sessions).toHaveLength(2);
      expect(result.sessions[0].id).toBe("session-001");
      expect(result.sessions[0].isCurrent).toBe(false);
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
      expect(mockApiClient.listActiveSessions).not.toHaveBeenCalled();
    });

    it("应该正确标记当前 Session", async () => {
      // Arrange
      const userId = "user-001";
      const currentToken = "token-001";
      const mockSessions = [
        {
          id: "session-001",
          userId,
          createdAt: new Date("2026-03-01"),
          expiresAt: new Date("2026-03-10"),
          ipAddress: "192.168.1.1",
          userAgent: "Chrome",
          isCurrent: true,
        },
      ];

      mockCacheService.get = vi.fn().mockReturnValue(undefined);
      mockApiClient.listActiveSessions.mockResolvedValue({
        sessions: mockSessions,
        currentSessionId: "session-001",
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

      mockCacheService.get = vi.fn().mockReturnValue(undefined);
      mockApiClient.listActiveSessions.mockRejectedValue(error);

      // Act & Assert
      await expect(sessionService.listActiveSessions(userId)).rejects.toThrow("Database error");
    });
  });

  describe("revokeSession", () => {
    it("应该成功撤销 Session 并清除缓存", async () => {
      // Arrange
      const userId = "user-001";
      const sessionId = "session-001";

      mockApiClient.revokeSession.mockResolvedValue(undefined);

      // Act
      await sessionService.revokeSession(userId, sessionId);

      // Assert
      expect(mockApiClient.revokeSession).toHaveBeenCalledWith(sessionId, sessionId);
      expect(mockCacheService.delete).toHaveBeenCalledWith(`session:list:${userId}`);
    });

    it("Session 不存在时应该抛出 NotFoundException", async () => {
      // Arrange
      const userId = "user-001";
      const sessionId = "session-001";
      const error = new Error("Session not found");

      mockApiClient.revokeSession.mockRejectedValue(error);

      // Act & Assert
      await expect(sessionService.revokeSession(userId, sessionId)).rejects.toThrow("Session not found");
    });

    it("数据库删除失败时应该抛出错误", async () => {
      // Arrange
      const userId = "user-001";
      const sessionId = "session-001";
      const error = new Error("Database error");

      mockApiClient.revokeSession.mockRejectedValue(error);

      // Act & Assert
      await expect(sessionService.revokeSession(userId, sessionId)).rejects.toThrow("Database error");
    });
  });

  describe("revokeOtherSessions", () => {
    it("应该成功撤销其他 Session 并清除缓存", async () => {
      // Arrange
      const userId = "user-001";
      const currentToken = "token-001";

      mockApiClient.revokeAllSessions.mockResolvedValue({ deletedCount: 2 });

      // Act
      const result = await sessionService.revokeOtherSessions(userId, currentToken);

      // Assert
      expect(result).toBe(2);
      expect(mockApiClient.revokeAllSessions).toHaveBeenCalledWith(userId, currentToken);
      expect(mockCacheService.delete).toHaveBeenCalledWith(`session:list:${userId}`);
    });

    it("没有其他 Session 时应该返回 0", async () => {
      // Arrange
      const userId = "user-001";
      const currentToken = "token-001";

      mockApiClient.revokeAllSessions.mockResolvedValue({ deletedCount: 0 });

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

      mockApiClient.revokeAllSessions.mockRejectedValue(error);

      // Act & Assert
      await expect(sessionService.revokeOtherSessions(userId, currentToken)).rejects.toThrow(
        "Database error"
      );
    });
  });

  describe("getSessionConfig", () => {
    it("应该成功获取 Session 配置", async () => {
      // Arrange
      const userId = "user-001";

      mockCacheService.get = vi.fn().mockReturnValue(undefined);
      mockApiClient.getSessionConfig.mockResolvedValue({
        sessionTimeout: 604800,
        allowConcurrentSessions: true,
        maxConcurrentSessions: 5,
      });

      // Act
      const result = await sessionService.getSessionConfig(userId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sessionTimeout).toBe(604800);
      expect(result.sessionTimeoutDays).toBe(7);
      expect(result.allowConcurrentSessions).toBe(true);
      expect(result.maxConcurrentSessions).toBe(5);
    });

    it("应该从缓存中返回配置", async () => {
      // Arrange
      const userId = "user-001";
      const cachedConfig = {
        success: true,
        message: "获取 Session 配置成功",
        sessionTimeout: 86400,
        sessionTimeoutDays: 1,
        allowConcurrentSessions: false,
        maxConcurrentSessions: 1,
      };

      mockCacheService.get = vi.fn().mockReturnValue(cachedConfig);

      // Act
      const result = await sessionService.getSessionConfig(userId);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sessionTimeout).toBe(86400);
      expect(mockApiClient.getSessionConfig).not.toHaveBeenCalled();
    });

    it("用户不存在时应该抛出错误", async () => {
      // Arrange
      const userId = "user-001";
      const error = new Error("User not found");

      mockCacheService.get = vi.fn().mockReturnValue(undefined);
      mockApiClient.getSessionConfig.mockRejectedValue(error);

      // Act & Assert
      await expect(sessionService.getSessionConfig(userId)).rejects.toThrow("User not found");
    });

    it("没有自定义配置时应该返回默认值（7 天）", async () => {
      // Arrange
      const userId = "user-001";

      mockCacheService.get = vi.fn().mockReturnValue(undefined);
      mockApiClient.getSessionConfig.mockResolvedValue({});

      // Act
      const result = await sessionService.getSessionConfig(userId);

      // Assert
      expect(result.sessionTimeout).toBe(604800); // 默认 7 天
      expect(result.sessionTimeoutDays).toBe(7);
      expect(result.allowConcurrentSessions).toBe(true); // 默认允许
      expect(result.maxConcurrentSessions).toBe(5); // 默认 5 个
    });

    it("数据库查询失败时应该抛出错误", async () => {
      // Arrange
      const userId = "user-001";
      const error = new Error("Database error");

      mockCacheService.get = vi.fn().mockReturnValue(undefined);
      mockApiClient.getSessionConfig.mockRejectedValue(error);

      // Act & Assert
      await expect(sessionService.getSessionConfig(userId)).rejects.toThrow("Database error");
    });
  });

  describe("updateSessionConfig", () => {
    it("应该成功更新 Session 配置并清除缓存", async () => {
      // Arrange
      const userId = "user-001";
      const dto = {
        sessionTimeout: 86400,
      };

      mockCacheService.get = vi.fn().mockReturnValue(undefined);
      mockApiClient.updateSessionConfig.mockResolvedValue(undefined);
      mockApiClient.getSessionConfig.mockResolvedValue({
        sessionTimeout: 86400,
        allowConcurrentSessions: true,
        maxConcurrentSessions: 5,
      });

      // Act
      const result = await sessionService.updateSessionConfig(userId, dto);

      // Assert
      expect(result.success).toBe(true);
      expect(result.sessionTimeout).toBe(86400);
      expect(mockApiClient.updateSessionConfig).toHaveBeenCalledWith(dto);
      expect(mockCacheService.delete).toHaveBeenCalledWith(`session:config:${userId}`);
    });

    it("应该支持更新并发登录配置", async () => {
      // Arrange
      const userId = "user-001";
      const dto = {
        allowConcurrentSessions: false,
        maxConcurrentSessions: 1,
      };

      mockCacheService.get = vi.fn().mockReturnValue(undefined);
      mockApiClient.updateSessionConfig.mockResolvedValue(undefined);
      mockApiClient.getSessionConfig.mockResolvedValue({
        sessionTimeout: 604800,
        allowConcurrentSessions: false,
        maxConcurrentSessions: 1,
      });

      // Act
      const result = await sessionService.updateSessionConfig(userId, dto);

      // Assert
      expect(result.allowConcurrentSessions).toBe(false);
      expect(result.maxConcurrentSessions).toBe(1);
    });

    it("数据库更新失败时应该抛出错误", async () => {
      // Arrange
      const userId = "user-001";
      const dto = {
        sessionTimeout: 86400,
      };
      const error = new Error("Database error");

      mockApiClient.updateSessionConfig.mockRejectedValue(error);

      // Act & Assert
      await expect(sessionService.updateSessionConfig(userId, dto)).rejects.toThrow("Database error");
    });
  });

  describe("handleConcurrentSessions", () => {
    it("不允许并发登录时应该撤销其他 Session", async () => {
      // Arrange
      const userId = "user-001";
      const currentToken = "token-001";

      mockCacheService.get = vi.fn().mockReturnValue(undefined);
      mockApiClient.getSessionConfig.mockResolvedValue({
        sessionTimeout: 604800,
        allowConcurrentSessions: false,
        maxConcurrentSessions: 1,
      });
      mockApiClient.revokeAllSessions.mockResolvedValue({ deletedCount: 2 });

      // Act
      const result = await sessionService.handleConcurrentSessions(userId, currentToken);

      // Assert
      expect(result).toBe(2);
      expect(mockApiClient.revokeAllSessions).toHaveBeenCalled();
    });

    it("允许并发登录时不应该撤销 Session", async () => {
      // Arrange
      const userId = "user-001";
      const currentToken = "token-001";

      mockCacheService.get = vi.fn().mockReturnValue(undefined);
      mockApiClient.getSessionConfig.mockResolvedValue({
        sessionTimeout: 604800,
        allowConcurrentSessions: true,
        maxConcurrentSessions: 5,
      });

      // Act
      const result = await sessionService.handleConcurrentSessions(userId, currentToken);

      // Assert
      expect(result).toBe(0);
      expect(mockApiClient.revokeAllSessions).not.toHaveBeenCalled();
    });
  });
});
