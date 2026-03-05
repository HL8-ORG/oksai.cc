import { describe, expect, it } from "vitest";
import { OAuthAccessToken } from "./oauth-access-token.entity";
import { OAuthAuthorizationCode } from "./oauth-authorization-code.entity";
import { OAuthClient } from "./oauth-client.entity";
import { OAuthRefreshToken } from "./oauth-refresh-token.entity";

describe("OAuth Entities", () => {
  describe("OAuthClient", () => {
    it("应该创建 OAuth 客户端", () => {
      const client = new OAuthClient(
        "测试应用",
        "client_123",
        ["http://localhost:3000/callback"],
        ["read", "write"],
        "confidential"
      );

      expect(client.name).toBe("测试应用");
      expect(client.clientId).toBe("client_123");
      expect(client.redirectUris).toContain("http://localhost:3000/callback");
      expect(client.allowedScopes).toContain("read");
      expect(client.isActive).toBe(true);
    });

    it("应该验证 redirectUri", () => {
      const client = new OAuthClient("测试应用", "client_123", ["http://localhost:3000/callback"], ["read"]);

      expect(client.validateRedirectUri("http://localhost:3000/callback")).toBe(true);
      expect(client.validateRedirectUri("http://evil.com")).toBe(false);
    });

    it("应该验证 scope", () => {
      const client = new OAuthClient(
        "测试应用",
        "client_123",
        ["http://localhost:3000/callback"],
        ["read", "write"]
      );

      expect(client.validateScope("read")).toBe(true);
      expect(client.validateScope("read write")).toBe(true);
      expect(client.validateScope("read admin")).toBe(false);
    });

    it("应该激活和停用客户端", () => {
      const client = new OAuthClient("测试应用", "client_123", ["http://localhost:3000/callback"], ["read"]);

      client.deactivate();
      expect(client.isActive).toBe(false);

      client.activate();
      expect(client.isActive).toBe(true);
    });

    it("应该轮换密钥", () => {
      const client = new OAuthClient("测试应用", "client_123", ["http://localhost:3000/callback"], ["read"]);
      client.clientSecret = "old_secret";

      client.rotateSecret("new_secret");

      expect(client.clientSecret).toBe("new_secret");
    });
  });

  describe("OAuthAccessToken", () => {
    it("应该创建访问令牌", () => {
      const expiresAt = new Date(Date.now() + 3600000); // 1 小时后
      const token = new OAuthAccessToken(
        "access_token_123",
        "client_123",
        "user_123",
        "read write",
        expiresAt
      );

      expect(token.accessToken).toBe("access_token_123");
      expect(token.clientId).toBe("client_123");
      expect(token.userId).toBe("user_123");
      expect(token.isValid()).toBe(true);
    });

    it("应该检测过期令牌", () => {
      const expiresAt = new Date(Date.now() - 1000); // 1 秒前
      const token = new OAuthAccessToken("access_token_123", "client_123", "user_123", "read", expiresAt);

      expect(token.isExpired()).toBe(true);
      expect(token.isValid()).toBe(false);
    });

    it("应该撤销令牌", () => {
      const expiresAt = new Date(Date.now() + 3600000);
      const token = new OAuthAccessToken("access_token_123", "client_123", "user_123", "read", expiresAt);

      token.revoke();

      expect(token.isRevoked()).toBe(true);
      expect(token.isValid()).toBe(false);
    });
  });

  describe("OAuthAuthorizationCode", () => {
    it("应该创建授权码", () => {
      const expiresAt = new Date(Date.now() + 600000); // 10 分钟后
      const authCode = new OAuthAuthorizationCode(
        "code_123",
        "client_123",
        "user_123",
        "http://localhost:3000/callback",
        "read write",
        expiresAt
      );

      expect(authCode.code).toBe("code_123");
      expect(authCode.clientId).toBe("client_123");
      expect(authCode.isUsed()).toBe(false);
    });

    it("应该标记授权码为已使用", () => {
      const expiresAt = new Date(Date.now() + 600000);
      const authCode = new OAuthAuthorizationCode(
        "code_123",
        "client_123",
        "user_123",
        "http://localhost:3000/callback",
        "read",
        expiresAt
      );

      authCode.markAsUsed();

      expect(authCode.isUsed()).toBe(true);
    });
  });

  describe("OAuthRefreshToken", () => {
    it("应该创建刷新令牌", () => {
      const expiresAt = new Date(Date.now() + 86400000); // 1 天后
      const refreshToken = new OAuthRefreshToken(
        "refresh_token_123",
        "client_123",
        "user_123",
        "read write",
        expiresAt
      );

      expect(refreshToken.refreshToken).toBe("refresh_token_123");
      expect(refreshToken.isValid()).toBe(true);
    });

    it("应该撤销刷新令牌", () => {
      const expiresAt = new Date(Date.now() + 86400000);
      const refreshToken = new OAuthRefreshToken(
        "refresh_token_123",
        "client_123",
        "user_123",
        "read",
        expiresAt
      );

      refreshToken.revoke();

      expect(refreshToken.isRevoked()).toBe(true);
      expect(refreshToken.isValid()).toBe(false);
    });
  });
});
