/**
 * API Key 认证集成测试
 */

import { createHash } from "node:crypto";
import { NotFoundException, UnauthorizedException } from "@nestjs/common";
import { Test, type TestingModule } from "@nestjs/testing";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { ApiKeyGuard } from "./api-key.guard";
import { ApiKeyService } from "./api-key.service";

// Mock database
vi.mock("@oksai/database", () => ({
  db: {
    insert: vi.fn(() => ({
      values: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
    select: vi.fn(() => ({
      from: vi.fn(() => ({
        where: vi.fn(() => ({
          limit: vi.fn(),
          orderBy: vi.fn(),
        })),
      })),
    })),
    update: vi.fn(() => ({
      set: vi.fn(() => ({
        where: vi.fn(() => ({
          returning: vi.fn(),
          execute: vi.fn(),
        })),
      })),
    })),
  },
  apiKeys: {
    id: "id",
    userId: "user_id",
    name: "name",
    prefix: "prefix",
    hashedKey: "hashed_key",
    expiresAt: "expires_at",
    lastUsedAt: "last_used_at",
    createdAt: "created_at",
    revokedAt: "revoked_at",
    tenantId: "tenant_id",
  },
}));

describe("API Key 认证", () => {
  let apiKeyService: ApiKeyService;
  let apiKeyGuard: ApiKeyGuard;

  beforeEach(async () => {
    const module: TestingModule = await Test.createTestingModule({
      providers: [ApiKeyService, ApiKeyGuard],
    }).compile();

    apiKeyService = module.get<ApiKeyService>(ApiKeyService);
    apiKeyGuard = module.get<ApiKeyGuard>(ApiKeyGuard);
  });

  describe("ApiKeyService", () => {
    describe("createApiKey", () => {
      it("应该成功创建 API Key", async () => {
        const userId = "user-123";
        const dto = { name: "Test API Key" };

        const mockResult = {
          id: "api-key-id",
          userId,
          name: dto.name,
          prefix: "oks_abc123",
          hashedKey: "hashed...",
          expiresAt: null,
          lastUsedAt: null,
          createdAt: new Date(),
          revokedAt: null,
          tenantId: null,
        };

        // Mock db.insert().values().returning()
        const db = await import("@oksai/database");
        (db.db.insert as any).mockReturnValue({
          values: vi.fn(() => ({
            returning: vi.fn().mockResolvedValue([mockResult]),
          })),
        });

        const result = await apiKeyService.createApiKey(userId, dto);

        expect(result).toBeDefined();
        expect(result.name).toBe(dto.name);
        expect(result.key).toBeDefined();
        expect(result.key).toMatch(/^oks_/);
      });
    });

    describe("listApiKeys", () => {
      it("应该返回用户的 API Key 列表", async () => {
        const userId = "user-123";
        const mockApiKeys = [
          {
            id: "key-1",
            userId,
            name: "Key 1",
            prefix: "oks_abc",
            createdAt: new Date(),
            expiresAt: null,
            lastUsedAt: null,
          },
          {
            id: "key-2",
            userId,
            name: "Key 2",
            prefix: "oks_def",
            createdAt: new Date(),
            expiresAt: null,
            lastUsedAt: null,
          },
        ];

        const db = await import("@oksai/database");
        (db.db.select as any).mockReturnValue({
          from: vi.fn(() => ({
            where: vi.fn(() => ({
              orderBy: vi.fn().mockResolvedValue(mockApiKeys),
            })),
          })),
        });

        const result = await apiKeyService.listApiKeys(userId);

        expect(result).toHaveLength(2);
        expect(result[0].name).toBe("Key 1");
        expect(result[1].name).toBe("Key 2");
      });
    });

    describe("revokeApiKey", () => {
      it("应该成功撤销 API Key", async () => {
        const userId = "user-123";
        const apiKeyId = "key-1";

        const db = await import("@oksai/database");
        (db.db.update as any).mockReturnValue({
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue([{ id: apiKeyId }]),
            })),
          })),
        });

        await expect(apiKeyService.revokeApiKey(userId, apiKeyId)).resolves.not.toThrow();
      });

      it("API Key 不存在时应该抛出 NotFoundException", async () => {
        const userId = "user-123";
        const apiKeyId = "non-existent";

        const db = await import("@oksai/database");
        (db.db.update as any).mockReturnValue({
          set: vi.fn(() => ({
            where: vi.fn(() => ({
              returning: vi.fn().mockResolvedValue([]),
            })),
          })),
        });

        await expect(apiKeyService.revokeApiKey(userId, apiKeyId)).rejects.toThrow(NotFoundException);
      });
    });
  });

  describe("ApiKeyGuard", () => {
    it("应该验证有效的 API Key", async () => {
      const apiKey = "oks_valid_test_key";
      const hashedKey = createHash("sha256").update(apiKey).digest("hex");

      const mockKeyRecord = {
        id: "key-id",
        userId: "user-123",
        hashedKey,
        expiresAt: null,
        revokedAt: null,
        tenantId: null,
      };

      const db = await import("@oksai/database");
      (db.db.select as any).mockReturnValue({
        from: vi.fn(() => ({
          where: vi.fn(() => ({
            limit: vi.fn().mockResolvedValue([mockKeyRecord]),
          })),
        })),
      });
      (db.db.update as any).mockReturnValue({
        set: vi.fn(() => ({
          where: vi.fn(() => ({
            execute: vi.fn().mockResolvedValue(undefined),
          })),
        })),
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
  });
});
