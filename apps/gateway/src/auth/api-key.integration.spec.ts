/**
 * API Key 认证集成测试
 *
 * 注意：ApiKeyGuard 使用 Better Auth API 验证 API Key
 * 测试需要 mock auth.api.verifyApiKey
 */

import { UnauthorizedException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { BetterAuthApiClient } from "@oksai/nestjs-better-auth";
import { beforeAll, beforeEach, describe, expect, it, vi } from "vitest";
import { ApiKeyGuard, type ApiKeyPayload } from "./api-key.guard.js";

// 类型检查辅助函数
function ensureApiClientExists(): typeof BetterAuthApiClient {
  return BetterAuthApiClient;
}

describe("API Key 认证", () => {
  // 确保类型检查通过
  beforeAll(() => {
    ensureApiClientExists();
  });
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

      // Mock Better Auth API Client
      const { BetterAuthApiClient } = await import("@oksai/nestjs-better-auth");
      (BetterAuthApiClient.prototype.verifyApiKey as any).mockResolvedValueOnce({
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

      // Mock Better Auth API Client 返回无效结果
      const { BetterAuthApiClient } = await import("@oksai/nestjs-better-auth");
      (BetterAuthApiClient.prototype.verifyApiKey as any).mockResolvedValueOnce({
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

      const { BetterAuthApiClient } = await import("@oksai/nestjs-better-auth");
      (BetterAuthApiClient.prototype.verifyApiKey as any).mockResolvedValueOnce({
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
