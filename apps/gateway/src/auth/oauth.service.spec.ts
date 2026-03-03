/**
 * OAuth 2.0 Service 单元测试
 */

import { BadRequestException, UnauthorizedException } from "@nestjs/common";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { OAuthService } from "./oauth.service";

// Mock 数据库
vi.mock("@oksai/database", () => {
  const mockSelect = vi.fn(() => ({
    from: vi.fn(() => ({
      where: vi.fn(),
    })),
  }));

  const mockInsert = vi.fn(() => ({
    values: vi.fn(() => ({
      returning: vi.fn(),
    })),
  }));

  const mockUpdate = vi.fn(() => ({
    set: vi.fn(() => ({
      where: vi.fn(() => ({
        returning: vi.fn(),
      })),
    })),
  }));

  const mockDelete = vi.fn(() => ({
    where: vi.fn(),
  }));

  return {
    db: {
      select: mockSelect,
      insert: mockInsert,
      update: mockUpdate,
      delete: mockDelete,
    },
    oauthClients: {},
    oauthAuthorizationCodes: {},
    oauthAccessTokens: {},
    oauthRefreshTokens: {},
    users: {},
  };
});

describe("OAuthService", () => {
  let service: OAuthService;

  beforeEach(() => {
    vi.clearAllMocks();
    service = new OAuthService();
  });

  describe("registerClient", () => {
    it("应该成功注册 confidential 客户端并返回密钥", async () => {
      const mockClient = {
        id: crypto.randomUUID(),
        name: "Test App",
        clientId: "client_test",
        clientSecret: "secret123",
        clientType: "confidential",
        redirectUris: JSON.stringify(["http://localhost:3000/callback"]),
        allowedScopes: JSON.stringify(["read", "write"]),
      };

      const { db } = await import("@oksai/database");
      vi.mocked(db.insert().values().returning).mockResolvedValueOnce([mockClient]);

      const result = await service.registerClient({
        name: "Test App",
        redirectUris: ["http://localhost:3000/callback"],
        allowedScopes: ["read", "write"],
        clientType: "confidential",
      });

      expect(result.clientId).toMatch(/^client_/);
      expect(result.clientSecret).toBeDefined();
      expect(result.clientType).toBe("confidential");
      expect(result.name).toBe("Test App");
    });

    it("应该成功注册 public 客户端且不返回密钥", async () => {
      const mockClient = {
        id: crypto.randomUUID(),
        name: "Mobile App",
        clientId: "client_mobile",
        clientSecret: null,
        clientType: "public",
        redirectUris: JSON.stringify(["myapp://callback"]),
        allowedScopes: JSON.stringify(["read"]),
      };

      const { db } = await import("@oksai/database");
      vi.mocked(db.insert().values().returning).mockResolvedValueOnce([mockClient]);

      const result = await service.registerClient({
        name: "Mobile App",
        redirectUris: ["myapp://callback"],
        allowedScopes: ["read"],
        clientType: "public",
      });

      expect(result.clientSecret).toBeNull();
      expect(result.clientType).toBe("public");
    });
  });

  describe("generateAuthorizationCode", () => {
    it("应该成功生成授权码", async () => {
      const mockCode = {
        id: crypto.randomUUID(),
        code: "code_test",
        clientId: "client_test",
        userId: "user_test",
        redirectUri: "http://localhost:3000/callback",
        scope: "read write",
        expiresAt: new Date(Date.now() + 600000),
      };

      const { db } = await import("@oksai/database");
      vi.mocked(db.insert().values().returning).mockResolvedValueOnce([mockCode]);

      const result = await service.generateAuthorizationCode({
        clientId: "client_test",
        userId: "user_test",
        redirectUri: "http://localhost:3000/callback",
        scope: "read write",
      });

      expect(result.code).toBeDefined();
      expect(result.expiresAt).toBeInstanceOf(Date);
    });

    it("应该支持 PKCE code challenge", async () => {
      const mockCode = {
        id: crypto.randomUUID(),
        code: "code_pkce",
        clientId: "client_test",
        userId: "user_test",
        redirectUri: "http://localhost:3000/callback",
        scope: "read",
        codeChallenge: "challenge123",
        codeChallengeMethod: "S256",
        expiresAt: new Date(Date.now() + 600000),
      };

      const { db } = await import("@oksai/database");
      vi.mocked(db.insert().values().returning).mockResolvedValueOnce([mockCode]);

      const result = await service.generateAuthorizationCode({
        clientId: "client_test",
        userId: "user_test",
        redirectUri: "http://localhost:3000/callback",
        scope: "read",
        codeChallenge: "challenge123",
        codeChallengeMethod: "S256",
      });

      expect(result.code).toBeDefined();
    });
  });

  describe("exchangeAccessToken", () => {
    it("应该成功交换授权码获取 access token", async () => {
      const mockCode = {
        id: crypto.randomUUID(),
        code: "valid_code",
        clientId: "client_test",
        userId: "user_test",
        redirectUri: "http://localhost:3000/callback",
        scope: "read write",
        expiresAt: new Date(Date.now() + 600000),
      };

      const mockToken = {
        id: crypto.randomUUID(),
        accessToken: "access_test",
        refreshToken: "refresh_test",
        clientId: "client_test",
        userId: "user_test",
        scope: "read write",
        expiresAt: new Date(Date.now() + 3600000),
      };

      const { db } = await import("@oksai/database");
      vi.mocked(db.select().from().where).mockResolvedValueOnce([mockCode]);
      vi.mocked(db.insert().values().returning).mockResolvedValueOnce([mockToken]);

      const result = await service.exchangeAccessToken({
        code: "valid_code",
        clientId: "client_test",
        clientSecret: "secret123",
        redirectUri: "http://localhost:3000/callback",
      });

      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
      expect(result.token_type).toBe("Bearer");
      expect(result.expires_in).toBe(3600);
    });

    it("应该拒绝无效的授权码", async () => {
      const { db } = await import("@oksai/database");
      vi.mocked(db.select().from().where).mockResolvedValueOnce([]);

      await expect(
        service.exchangeAccessToken({
          code: "invalid_code",
          clientId: "client_test",
          clientSecret: "secret123",
          redirectUri: "http://localhost:3000/callback",
        })
      ).rejects.toThrow(BadRequestException);
    });

    it("应该拒绝过期的授权码", async () => {
      const mockCode = {
        id: crypto.randomUUID(),
        code: "expired_code",
        clientId: "client_test",
        userId: "user_test",
        redirectUri: "http://localhost:3000/callback",
        scope: "read",
        expiresAt: new Date(Date.now() - 1000),
      };

      const { db } = await import("@oksai/database");
      vi.mocked(db.select().from().where).mockResolvedValueOnce([mockCode]);

      await expect(
        service.exchangeAccessToken({
          code: "expired_code",
          clientId: "client_test",
          clientSecret: "secret123",
          redirectUri: "http://localhost:3000/callback",
        })
      ).rejects.toThrow(BadRequestException);
    });
  });

  describe("refreshAccessToken", () => {
    it("应该成功刷新 access token 并返回新的 refresh token", async () => {
      const mockRefreshToken = {
        id: crypto.randomUUID(),
        refreshToken: "refresh_test",
        clientId: "client_test",
        userId: "user_test",
        scope: "read write",
        expiresAt: new Date(Date.now() + 2592000000),
      };

      const mockNewToken = {
        id: crypto.randomUUID(),
        accessToken: "new_access",
        refreshToken: "new_refresh",
        clientId: "client_test",
        userId: "user_test",
        scope: "read write",
        expiresAt: new Date(Date.now() + 3600000),
      };

      const { db } = await import("@oksai/database");
      vi.mocked(db.select().from().where).mockResolvedValueOnce([mockRefreshToken]);
      vi.mocked(db.insert().values().returning).mockResolvedValueOnce([mockNewToken]);

      const result = await service.refreshAccessToken({
        refreshToken: "refresh_test",
        clientId: "client_test",
        clientSecret: "secret123",
      });

      expect(result.access_token).toBeDefined();
      expect(result.refresh_token).toBeDefined();
    });

    it("应该拒绝无效的 refresh token", async () => {
      const { db } = await import("@oksai/database");
      vi.mocked(db.select().from().where).mockResolvedValueOnce([]);

      await expect(
        service.refreshAccessToken({
          refreshToken: "invalid_refresh",
          clientId: "client_test",
          clientSecret: "secret123",
        })
      ).rejects.toThrow(UnauthorizedException);
    });
  });

  describe("validateAccessToken", () => {
    it("应该返回有效的 token 信息和用户数据", async () => {
      const mockToken = {
        id: crypto.randomUUID(),
        accessToken: "valid_access",
        clientId: "client_test",
        userId: "user_test",
        scope: "read write",
        expiresAt: new Date(Date.now() + 3600000),
      };

      const { db } = await import("@oksai/database");
      vi.mocked(db.select().from().where).mockResolvedValueOnce([mockToken]);

      const result = await service.validateAccessToken("valid_access");

      expect(result).toBeDefined();
      expect(result?.userId).toBe("user_test");
    });

    it("应该返回 null 表示无效的 token", async () => {
      const { db } = await import("@oksai/database");
      vi.mocked(db.select().from().where).mockResolvedValueOnce([]);

      const result = await service.validateAccessToken("invalid_access");

      expect(result).toBeNull();
    });

    it("应该返回 null 表示过期的 token", async () => {
      const mockToken = {
        id: crypto.randomUUID(),
        accessToken: "expired_access",
        clientId: "client_test",
        userId: "user_test",
        scope: "read",
        expiresAt: new Date(Date.now() - 1000),
      };

      const { db } = await import("@oksai/database");
      vi.mocked(db.select().from().where).mockResolvedValueOnce([mockToken]);

      const result = await service.validateAccessToken("expired_access");

      expect(result).toBeNull();
    });
  });

  describe("revokeToken", () => {
    it("应该成功撤销 access token", async () => {
      const mockToken = {
        id: crypto.randomUUID(),
        accessToken: "access_to_revoke",
        clientId: "client_test",
        userId: "user_test",
        scope: "read",
        expiresAt: new Date(Date.now() + 3600000),
      };

      const { db } = await import("@oksai/database");
      vi.mocked(db.select().from().where).mockResolvedValueOnce([mockToken]);
      vi.mocked(db.update().set().where().returning).mockResolvedValueOnce([mockToken]);

      const result = await service.revokeToken({
        token: "access_to_revoke",
        tokenTypeHint: "access_token",
      });

      expect(result).toBeUndefined();
    });

    it("应该成功撤销 refresh token", async () => {
      const mockRefreshToken = {
        id: crypto.randomUUID(),
        refreshToken: "refresh_to_revoke",
        clientId: "client_test",
        userId: "user_test",
        scope: "read",
        expiresAt: new Date(Date.now() + 2592000000),
      };

      const { db } = await import("@oksai/database");
      vi.mocked(db.select().from().where).mockResolvedValueOnce([mockRefreshToken]);
      vi.mocked(db.update().set().where().returning).mockResolvedValueOnce([mockRefreshToken]);

      const result = await service.revokeToken({
        token: "refresh_to_revoke",
        tokenTypeHint: "refresh_token",
      });

      expect(result).toBeUndefined();
    });

    it("应该忽略不存在的 token（符合 OAuth 2.0 规范）", async () => {
      const { db } = await import("@oksai/database");
      vi.mocked(db.select().from().where).mockResolvedValueOnce([]);

      const result = await service.revokeToken({
        token: "non_existent_token",
        tokenTypeHint: "access_token",
      });

      expect(result).toBeUndefined();
    });
  });
});
