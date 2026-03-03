/**
 * OAuth 2.0 集成测试
 */

import type { INestApplication } from "@nestjs/common";
import type { TestingModule } from "@nestjs/testing";
import { Test } from "@nestjs/testing";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { AuthFeatureModule } from "./auth.module";

describe("OAuth 2.0 Integration", () => {
  let app: INestApplication;
  let module: TestingModule;

  beforeAll(async () => {
    module = await Test.createTestingModule({
      imports: [AuthFeatureModule],
    }).compile();

    app = module.createNestApplication();
    await app.init();
  });

  afterAll(async () => {
    await app.close();
  });

  describe("POST /oauth/register - 客户端注册", () => {
    it("应该成功注册 OAuth 客户端", async () => {
      const response = await request(app.getHttpServer())
        .post("/oauth/register")
        .set("x-user-id", "test-user-id")
        .send({
          name: "Test OAuth App",
          redirectUris: ["http://localhost:3000/callback"],
          allowedScopes: ["read", "write"],
          clientType: "confidential",
          description: "Test OAuth application",
        });

      expect(response.status).toBe(201);
      expect(response.body).toHaveProperty("clientId");
      expect(response.body).toHaveProperty("clientSecret");
      expect(response.body.name).toBe("Test OAuth App");
    });

    it("应该拒绝无效的重定向 URI", async () => {
      const response = await request(app.getHttpServer())
        .post("/oauth/register")
        .set("x-user-id", "test-user-id")
        .send({
          name: "Test OAuth App",
          redirectUris: ["invalid-uri"],
          allowedScopes: ["read"],
        });

      expect(response.status).toBe(400);
    });
  });

  describe("GET /oauth/authorize - 授权端点", () => {
    let clientId: string;

    beforeEach(async () => {
      // 注册测试客户端
      const response = await request(app.getHttpServer())
        .post("/oauth/register")
        .set("x-user-id", "test-user-id")
        .send({
          name: "Test App",
          redirectUris: ["http://localhost:3000/callback"],
          allowedScopes: ["read", "write"],
        });
      clientId = response.body.clientId;
    });

    it("应该成功生成授权码", async () => {
      const response = await request(app.getHttpServer())
        .get("/oauth/authorize")
        .set("x-user-id", "test-user-id")
        .query({
          client_id: clientId,
          redirect_uri: "http://localhost:3000/callback",
          scope: "read write",
          state: "random-state",
        });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("code");
      expect(response.body).toHaveProperty("expires_in", 600);
    });

    it("应该拒绝无效的 scope", async () => {
      const response = await request(app.getHttpServer())
        .get("/oauth/authorize")
        .set("x-user-id", "test-user-id")
        .query({
          client_id: clientId,
          redirect_uri: "http://localhost:3000/callback",
          scope: "admin", // 不允许的 scope
        });

      expect(response.status).toBe(400);
    });

    it("应该拒绝无效的 redirect_uri", async () => {
      const response = await request(app.getHttpServer())
        .get("/oauth/authorize")
        .set("x-user-id", "test-user-id")
        .query({
          client_id: clientId,
          redirect_uri: "http://evil.com/callback",
          scope: "read",
        });

      expect(response.status).toBe(400);
    });
  });

  describe("POST /oauth/token - Token 端点", () => {
    let clientId: string;
    let clientSecret: string;
    let code: string;

    beforeEach(async () => {
      // 注册客户端
      const registerResponse = await request(app.getHttpServer())
        .post("/oauth/register")
        .set("x-user-id", "test-user-id")
        .send({
          name: "Test App",
          redirectUris: ["http://localhost:3000/callback"],
          allowedScopes: ["read", "write"],
          clientType: "confidential",
        });
      clientId = registerResponse.body.clientId;
      clientSecret = registerResponse.body.clientSecret;

      // 生成授权码
      const authorizeResponse = await request(app.getHttpServer())
        .get("/oauth/authorize")
        .set("x-user-id", "test-user-id")
        .query({
          client_id: clientId,
          redirect_uri: "http://localhost:3000/callback",
          scope: "read write",
        });
      code = authorizeResponse.body.code;
    });

    it("应该成功交换授权码获取 Access Token", async () => {
      const response = await request(app.getHttpServer()).post("/oauth/token").send({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: "http://localhost:3000/callback",
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("access_token");
      expect(response.body).toHaveProperty("refresh_token");
      expect(response.body).toHaveProperty("token_type", "Bearer");
      expect(response.body).toHaveProperty("expires_in", 3600);
    });

    it("应该拒绝无效的授权码", async () => {
      const response = await request(app.getHttpServer()).post("/oauth/token").send({
        grant_type: "authorization_code",
        code: "invalid-code",
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: "http://localhost:3000/callback",
      });

      expect(response.status).toBe(400);
    });

    it("应该拒绝错误的客户端密钥", async () => {
      const response = await request(app.getHttpServer()).post("/oauth/token").send({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: "wrong-secret",
        redirect_uri: "http://localhost:3000/callback",
      });

      expect(response.status).toBe(401);
    });

    it("应该成功刷新 Access Token", async () => {
      // 先获取 token
      const tokenResponse = await request(app.getHttpServer()).post("/oauth/token").send({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        client_secret: clientSecret,
        redirect_uri: "http://localhost:3000/callback",
      });
      const refreshToken = tokenResponse.body.refresh_token;

      // 刷新 token
      const response = await request(app.getHttpServer()).post("/oauth/token").send({
        grant_type: "refresh_token",
        refresh_token: refreshToken,
        client_id: clientId,
        client_secret: clientSecret,
      });

      expect(response.status).toBe(200);
      expect(response.body).toHaveProperty("access_token");
      expect(response.body).toHaveProperty("refresh_token");
      expect(response.body.refresh_token).not.toBe(refreshToken); // 新的 refresh token
    });
  });

  describe("POST /oauth/revoke - Token 撤销", () => {
    let accessToken: string;

    beforeEach(async () => {
      // 获取 access token
      const registerResponse = await request(app.getHttpServer())
        .post("/oauth/register")
        .set("x-user-id", "test-user-id")
        .send({
          name: "Test App",
          redirectUris: ["http://localhost:3000/callback"],
          allowedScopes: ["read"],
        });
      const clientId = registerResponse.body.clientId;

      const authorizeResponse = await request(app.getHttpServer())
        .get("/oauth/authorize")
        .set("x-user-id", "test-user-id")
        .query({
          client_id: clientId,
          redirect_uri: "http://localhost:3000/callback",
          scope: "read",
        });
      const code = authorizeResponse.body.code;

      const tokenResponse = await request(app.getHttpServer()).post("/oauth/token").send({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        redirect_uri: "http://localhost:3000/callback",
      });
      accessToken = tokenResponse.body.access_token;
    });

    it("应该成功撤销 Access Token", async () => {
      const response = await request(app.getHttpServer()).post("/oauth/revoke").send({
        token: accessToken,
        token_type_hint: "access_token",
      });

      expect(response.status).toBe(200);
      expect(response.body.success).toBe(true);
    });
  });

  describe("POST /oauth/introspect - Token 内省", () => {
    let accessToken: string;

    beforeEach(async () => {
      // 获取 access token
      const registerResponse = await request(app.getHttpServer())
        .post("/oauth/register")
        .set("x-user-id", "test-user-id")
        .send({
          name: "Test App",
          redirectUris: ["http://localhost:3000/callback"],
          allowedScopes: ["read"],
        });
      const clientId = registerResponse.body.clientId;

      const authorizeResponse = await request(app.getHttpServer())
        .get("/oauth/authorize")
        .set("x-user-id", "test-user-id")
        .query({
          client_id: clientId,
          redirect_uri: "http://localhost:3000/callback",
          scope: "read",
        });
      const code = authorizeResponse.body.code;

      const tokenResponse = await request(app.getHttpServer()).post("/oauth/token").send({
        grant_type: "authorization_code",
        code,
        client_id: clientId,
        redirect_uri: "http://localhost:3000/callback",
      });
      accessToken = tokenResponse.body.access_token;
    });

    it("应该返回活跃的 Token 信息", async () => {
      const response = await request(app.getHttpServer()).post("/oauth/introspect").send({
        token: accessToken,
      });

      expect(response.status).toBe(200);
      expect(response.body.active).toBe(true);
      expect(response.body).toHaveProperty("user_id");
      expect(response.body).toHaveProperty("scope", "read");
    });

    it("应该返回无效的 Token 信息", async () => {
      const response = await request(app.getHttpServer()).post("/oauth/introspect").send({
        token: "invalid-token",
      });

      expect(response.status).toBe(200);
      expect(response.body.active).toBe(false);
    });
  });
});
