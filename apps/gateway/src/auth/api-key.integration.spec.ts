/**
 * API Key 认证集成测试
 *
 * 注意：ApiKeyGuard 使用 Better Auth API 验证 API Key
 * 测试需要 mock auth.api.verifyApiKey
 */

import { UnauthorizedException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiKeyGuard, type ApiKeyPayload } from "./api-key.guard";

// Mock Better Auth API
vi.mock("./auth", () => ({
  auth: {
    api: {
      verifyApiKey: vi.fn(),
    },
  },
}));

describe("API Key 认证", () => {
  let apiKeyGuard: ApiKeyGuard;

  beforeEach(async () => {
    vi.clearAllMocks();

    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiKeyGuard],
    }).compile();

    apiKeyGuard = module.get<ApiKeyGuard>(ApiKeyGuard);
  });

  describe("ApiKeyGuard", () => {
    it("应该验证有效的 API Key", async () => {
      const apiKey = "oks_valid_test_key";
      const mockPayload: ApiKeyPayload = {
        id: "key-id",
        userId: "user-123",
        enabled: true,
        expiresAt: null,
        name: "Test Key",
        prefix: "oks_valid",
      };

      // Mock Better Auth API
      const { auth } = await import("./auth");
      (auth.api.verifyApiKey as any).mockResolvedValueOnce({
        valid: true,
        key: {
          id: mockPayload.id,
          referenceId: mockPayload.userId,
          name: mockPayload.name,
          prefix: mockPayload.prefix,
          enabled: mockPayload.enabled,
          expiresAt: null,
        },
      });

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { "x-api-key": apiKey },
          }),
        }),
      };

      const result = await apiKeyGuard.canActivate(mockContext as any);
      expect(result).toBe(true);
    });

    it("缺少 API Key 时应该抛出 UnauthorizedException", async () => {
      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: {},
          }),
        }),
      };

      await expect(apiKeyGuard.canActivate(mockContext as any)).rejects.toThrow(UnauthorizedException);
    });

    it("无效的 API Key 应该抛出 UnauthorizedException", async () => {
      const apiKey = "oks_invalid_key";

      // Mock Better Auth API 返回无效结果
      const { auth } = await import("./auth");
      (auth.api.verifyApiKey as any).mockResolvedValueOnce({
        valid: false,
        key: null,
      });

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { "x-api-key": apiKey },
          }),
        }),
      };

      await expect(apiKeyGuard.canActivate(mockContext as any)).rejects.toThrow(UnauthorizedException);
    });

    it("应该支持 Bearer Token 格式的 API Key", async () => {
      const apiKey = "oks_bearer_test_key";
      const mockPayload: ApiKeyPayload = {
        id: "key-id",
        userId: "user-456",
        enabled: true,
        expiresAt: null,
        name: "Bearer Key",
        prefix: "oks_bearer",
      };

      const { auth } = await import("./auth");
      (auth.api.verifyApiKey as any).mockResolvedValueOnce({
        valid: true,
        key: {
          id: mockPayload.id,
          referenceId: mockPayload.userId,
          name: mockPayload.name,
          prefix: mockPayload.prefix,
          enabled: mockPayload.enabled,
          expiresAt: null,
        },
      });

      const mockContext = {
        switchToHttp: () => ({
          getRequest: () => ({
            headers: { authorization: `Bearer ${apiKey}` },
          }),
        }),
      };

      const result = await apiKeyGuard.canActivate(mockContext as any);
      expect(result).toBe(true);
    });
  });
});
