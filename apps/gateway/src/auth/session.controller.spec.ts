/**
 * Session Controller 单元测试
 */

import { beforeEach, describe, expect, it, vi } from "vitest";
import type { SessionConfigResponse, SessionListResponse, UpdateSessionConfigDto } from "./dto";
import { SessionController } from "./session.controller";

describe("SessionController", () => {
  let controller: SessionController;
  let mockSessionService: {
    listActiveSessions: ReturnType<typeof vi.fn>;
    getSessionConfig: ReturnType<typeof vi.fn>;
    updateSessionConfig: ReturnType<typeof vi.fn>;
    revokeSession: ReturnType<typeof vi.fn>;
    revokeOtherSessions: ReturnType<typeof vi.fn>;
  };

  beforeEach(() => {
    vi.clearAllMocks();

    mockSessionService = {
      listActiveSessions: vi.fn(),
      getSessionConfig: vi.fn(),
      updateSessionConfig: vi.fn(),
      revokeSession: vi.fn(),
      revokeOtherSessions: vi.fn(),
    };

    controller = new SessionController(mockSessionService as any);
  });

  describe("listSessions", () => {
    it("应该成功获取 Session 列表", async () => {
      // Arrange
      const mockResponse: SessionListResponse = {
        success: true,
        message: "获取活跃 Session 列表成功",
        sessions: [
          {
            id: "session-001",
            userId: "user-001",
            createdAt: new Date("2026-03-01"),
            expiresAt: new Date("2026-03-10"),
            ipAddress: "192.168.1.1",
            userAgent: "Chrome",
            isCurrent: true,
          },
        ],
        currentSessionId: "session-001",
      };

      mockSessionService.listActiveSessions.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.listSessions("Bearer token");

      // Assert
      expect(mockSessionService.listActiveSessions).toHaveBeenCalledWith(
        "temp-user-id",
        "temp-session-token"
      );
      expect(result).toEqual(mockResponse);
      expect(result.sessions).toHaveLength(1);
      expect(result.currentSessionId).toBe("session-001");
    });

    it("应该返回空列表当没有活跃 Session", async () => {
      // Arrange
      const mockResponse: SessionListResponse = {
        success: true,
        message: "获取活跃 Session 列表成功",
        sessions: [],
        currentSessionId: undefined,
      };

      mockSessionService.listActiveSessions.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.listSessions("Bearer token");

      // Assert
      expect(result.sessions).toHaveLength(0);
      expect(result.currentSessionId).toBeUndefined();
    });
  });

  describe("getConfig", () => {
    it("应该成功获取 Session 配置", async () => {
      // Arrange
      const mockResponse: SessionConfigResponse = {
        success: true,
        message: "获取 Session 配置成功",
        sessionTimeout: 604800,
        sessionTimeoutDays: 7,
        allowConcurrentSessions: true,
        maxConcurrentSessions: 5,
      };

      mockSessionService.getSessionConfig.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.getConfig("Bearer token");

      // Assert
      expect(mockSessionService.getSessionConfig).toHaveBeenCalledWith("temp-user-id");
      expect(result).toEqual(mockResponse);
      expect(result.sessionTimeout).toBe(604800);
      expect(result.sessionTimeoutDays).toBe(7);
    });

    it("应该返回默认配置（7 天）", async () => {
      // Arrange
      const mockResponse: SessionConfigResponse = {
        success: true,
        message: "获取 Session 配置成功",
        sessionTimeout: 604800,
        sessionTimeoutDays: 7,
        allowConcurrentSessions: true,
        maxConcurrentSessions: 5,
      };

      mockSessionService.getSessionConfig.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.getConfig("Bearer token");

      // Assert
      expect(result.sessionTimeoutDays).toBe(7);
    });
  });

  describe("updateConfig", () => {
    it("应该成功更新 Session 配置为 30 天", async () => {
      // Arrange
      const dto: UpdateSessionConfigDto = {
        sessionTimeout: 2592000, // 30 天
      };

      const mockResponse: SessionConfigResponse = {
        success: true,
        message: "Session 配置更新成功",
        sessionTimeout: 2592000,
        sessionTimeoutDays: 30,
        allowConcurrentSessions: true,
        maxConcurrentSessions: 5,
      };

      mockSessionService.updateSessionConfig.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.updateConfig("Bearer token", dto);

      // Assert
      expect(mockSessionService.updateSessionConfig).toHaveBeenCalledWith("temp-user-id", dto);
      expect(result.sessionTimeout).toBe(2592000);
      expect(result.sessionTimeoutDays).toBe(30);
    });

    it("应该成功更新 Session 配置为 1 小时", async () => {
      // Arrange
      const dto: UpdateSessionConfigDto = {
        sessionTimeout: 3600, // 1 小时
      };

      const mockResponse: SessionConfigResponse = {
        success: true,
        message: "Session 配置已更新",
        sessionTimeout: 3600,
        sessionTimeoutDays: 0.04, // 1 小时
        allowConcurrentSessions: true,
        maxConcurrentSessions: 5,
      };

      mockSessionService.updateSessionConfig.mockResolvedValue(mockResponse);

      // Act
      const result = await controller.updateConfig("Bearer token", dto);

      // Assert
      expect(result.sessionTimeout).toBe(3600);
      expect(result.sessionTimeoutDays).toBe(0.04);
    });
  });

  describe("revokeSession", () => {
    it("应该成功撤销 Session", async () => {
      // Arrange
      const sessionId = "session-001";
      mockSessionService.revokeSession.mockResolvedValue(undefined);

      // Act
      const result = await controller.revokeSession("Bearer token", sessionId);

      // Assert
      expect(mockSessionService.revokeSession).toHaveBeenCalledWith("temp-user-id", sessionId);
      expect(result.success).toBe(true);
      expect(result.message).toBe("Session 已撤销");
    });

    it("应该处理撤销不存在的 Session", async () => {
      // Arrange
      const sessionId = "session-999";
      const error = new Error("Session 不存在或无权访问");
      mockSessionService.revokeSession.mockRejectedValue(error);

      // Act & Assert
      await expect(controller.revokeSession("Bearer token", sessionId)).rejects.toThrow(
        "Session 不存在或无权访问"
      );
    });
  });

  describe("revokeOtherSessions", () => {
    it("应该成功撤销 2 个其他 Session", async () => {
      // Arrange
      mockSessionService.revokeOtherSessions.mockResolvedValue(2);

      // Act
      const result = await controller.revokeOtherSessions("Bearer token");

      // Assert
      expect(mockSessionService.revokeOtherSessions).toHaveBeenCalledWith(
        "temp-user-id",
        "temp-session-token"
      );
      expect(result.success).toBe(true);
      expect(result.message).toBe("已撤销 2 个其他 Session");
      expect(result.count).toBe(2);
    });

    it("应该返回 0 当没有其他 Session", async () => {
      // Arrange
      mockSessionService.revokeOtherSessions.mockResolvedValue(0);

      // Act
      const result = await controller.revokeOtherSessions("Bearer token");

      // Assert
      expect(result.success).toBe(true);
      expect(result.message).toBe("已撤销 0 个其他 Session");
      expect(result.count).toBe(0);
    });
  });
});
