import type { ExecutionContext } from "@nestjs/common";
import { ForbiddenException, UnauthorizedException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { vi } from "vitest";
import { AuthGuard, type UserSession } from "./auth-guard";

// 创建完整 mock session 的辅助函数
function createMockSession(
  overrides: { user?: Partial<UserSession["user"]>; session?: Partial<UserSession["session"]> } = {}
): UserSession {
  const baseSession: UserSession = {
    user: {
      id: "1",
      email: "test@example.com",
      name: "Test User",
      emailVerified: true,
      createdAt: new Date(),
      updatedAt: new Date(),
    },
    session: {
      id: "session-1",
      userId: "1",
      token: "token-123",
      expiresAt: new Date(Date.now() + 86400000),
      createdAt: new Date(),
      updatedAt: new Date(),
    },
  };

  return {
    user: { ...baseSession.user, ...overrides.user },
    session: { ...baseSession.session, ...overrides.session },
  } as UserSession;
}

describe("AuthGuard", () => {
  let guard: AuthGuard;
  let mockReflector: Reflector;
  let mockAuth: any;
  let mockOptions: any;

  beforeEach(() => {
    mockReflector = new Reflector();

    mockAuth = {
      api: {
        getSession: vi.fn(),
        getActiveMemberRole: vi.fn(),
        getActiveMember: vi.fn(),
      },
      options: {
        basePath: "/api/auth",
      },
    };

    mockOptions = {
      auth: mockAuth,
    };

    guard = new AuthGuard(mockReflector, mockOptions);
  });

  const createMockExecutionContext = (
    request: any,
    type: "http" | "graphql" | "ws" | "rpc" = "http"
  ): ExecutionContext => {
    return {
      getType: () => type,
      switchToHttp: () => ({
        getRequest: () => request,
      }),
      switchToWs: () => ({
        getClient: () => request,
      }),
      getHandler: vi.fn(),
      getClass: vi.fn(),
    } as any;
  };

  describe("HTTP 上下文", () => {
    it("应该为有效会话允许访问", async () => {
      const mockSession = createMockSession();
      mockAuth.api.getSession.mockResolvedValue(mockSession);

      const request: any = { headers: {} };
      mockReflector.getAllAndOverride = vi.fn().mockReturnValue(false);

      const context = createMockExecutionContext(request, "http");
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.session).toBe(mockSession);
      expect(request.user).toBe(mockSession.user);
    });

    it("应该拒绝无会话的请求", async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const request = { headers: {} };
      mockReflector.getAllAndOverride = vi.fn().mockReturnValue(false);

      const context = createMockExecutionContext(request, "http");

      await expect(guard.canActivate(context)).rejects.toThrow(UnauthorizedException);
    });

    it("应该允许 @AllowAnonymous 标记的路由", async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const request = { headers: {} };
      mockReflector.getAllAndOverride = vi.fn().mockImplementation((key: string) => {
        if (key === "PUBLIC") return true;
        return false;
      });

      const context = createMockExecutionContext(request, "http");
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("应该允许 @OptionalAuth 标记的路由无会话访问", async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const request = { headers: {} };
      mockReflector.getAllAndOverride = vi.fn().mockImplementation((key: string) => {
        if (key === "OPTIONAL") return true;
        return false;
      });

      const context = createMockExecutionContext(request, "http");
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe("@Roles() 角色检查", () => {
    it("应该允许具有所需角色的用户", async () => {
      const mockSession = createMockSession({
        user: { role: "admin" },
      });
      mockAuth.api.getSession.mockResolvedValue(mockSession);

      const request = { headers: {} };
      mockReflector.getAllAndOverride = vi.fn().mockImplementation((key: string) => {
        if (key === "ROLES") return ["admin"];
        return false;
      });

      const context = createMockExecutionContext(request, "http");
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("应该拒绝不具有所需角色的用户", async () => {
      const mockSession = createMockSession({
        user: { role: "user" },
      });
      mockAuth.api.getSession.mockResolvedValue(mockSession);

      const request = { headers: {} };
      mockReflector.getAllAndOverride = vi.fn().mockImplementation((key: string) => {
        if (key === "ROLES") return ["admin"];
        return false;
      });

      const context = createMockExecutionContext(request, "http");

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it("应该支持多个角色（数组）", async () => {
      const mockSession = createMockSession({
        user: { role: ["admin", "editor"] },
      });
      mockAuth.api.getSession.mockResolvedValue(mockSession);

      const request = { headers: {} };
      mockReflector.getAllAndOverride = vi.fn().mockImplementation((key: string) => {
        if (key === "ROLES") return ["editor"];
        return false;
      });

      const context = createMockExecutionContext(request, "http");
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("应该支持逗号分隔的角色字符串", async () => {
      const mockSession = createMockSession({
        user: { role: "admin,editor" },
      });
      mockAuth.api.getSession.mockResolvedValue(mockSession);

      const request = { headers: {} };
      mockReflector.getAllAndOverride = vi.fn().mockImplementation((key: string) => {
        if (key === "ROLES") return ["editor"];
        return false;
      });

      const context = createMockExecutionContext(request, "http");
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });

  describe("@OrgRoles() 组织角色检查", () => {
    it("应该允许具有所需组织角色的用户", async () => {
      const mockSession = createMockSession({
        session: { activeOrganizationId: "org-1" },
      });
      mockAuth.api.getSession.mockResolvedValue(mockSession);
      mockAuth.api.getActiveMemberRole.mockResolvedValue({ role: "owner" });

      const request = { headers: {} };
      mockReflector.getAllAndOverride = vi.fn().mockImplementation((key: string) => {
        if (key === "ORG_ROLES") return ["owner"];
        return false;
      });

      const context = createMockExecutionContext(request, "http");
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("应该拒绝无活动组织的用户", async () => {
      const mockSession = createMockSession();
      mockAuth.api.getSession.mockResolvedValue(mockSession);

      const request = { headers: {} };
      mockReflector.getAllAndOverride = vi.fn().mockImplementation((key: string) => {
        if (key === "ORG_ROLES") return ["owner"];
        return false;
      });

      const context = createMockExecutionContext(request, "http");

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it("应该拒绝不具有所需组织角色的用户", async () => {
      const mockSession = createMockSession({
        session: { activeOrganizationId: "org-1" },
      });
      mockAuth.api.getSession.mockResolvedValue(mockSession);
      mockAuth.api.getActiveMemberRole.mockResolvedValue({ role: "member" });

      const request = { headers: {} };
      mockReflector.getAllAndOverride = vi.fn().mockImplementation((key: string) => {
        if (key === "ORG_ROLES") return ["owner", "admin"];
        return false;
      });

      const context = createMockExecutionContext(request, "http");

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });

    it("应该处理组织插件错误", async () => {
      const mockSession = createMockSession({
        session: { activeOrganizationId: "org-1" },
      });
      mockAuth.api.getSession.mockResolvedValue(mockSession);
      mockAuth.api.getActiveMemberRole.mockRejectedValue(new Error("API Error"));

      const request = { headers: {} };
      mockReflector.getAllAndOverride = vi.fn().mockImplementation((key: string) => {
        if (key === "ORG_ROLES") return ["owner"];
        return false;
      });

      const context = createMockExecutionContext(request, "http");

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });

  describe("WebSocket 上下文", () => {
    it("应该从 handshake.headers 获取会话", async () => {
      const mockSession = createMockSession();
      mockAuth.api.getSession.mockResolvedValue(mockSession);

      const client = {
        handshake: { headers: { cookie: "session=abc" } },
      };
      mockReflector.getAllAndOverride = vi.fn().mockReturnValue(false);

      const context = createMockExecutionContext(client, "ws");
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("应该为 WebSocket 上下文抛出 WsException（未授权）", async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const client = {
        handshake: { headers: { cookie: "session=abc" } },
      };
      mockReflector.getAllAndOverride = vi.fn().mockReturnValue(false);

      const context = createMockExecutionContext(client, "ws");

      // 现在安装了 @nestjs/websockets，应该抛出 WsException
      await expect(guard.canActivate(context)).rejects.toThrow("UNAUTHORIZED");
    });

    it("应该为 WebSocket 上下文抛出 WsException（禁止访问）", async () => {
      const mockSession = createMockSession({
        user: { role: "user" },
      });
      mockAuth.api.getSession.mockResolvedValue(mockSession);

      const client = {
        handshake: { headers: { cookie: "session=abc" } },
      };
      mockReflector.getAllAndOverride = vi.fn().mockImplementation((key: string) => {
        if (key === "ROLES") return ["admin"];
        return false;
      });

      const context = createMockExecutionContext(client, "ws");

      await expect(guard.canActivate(context)).rejects.toThrow("FORBIDDEN");
    });
  });

  describe("GraphQL 错误处理", () => {
    // 注意：GraphQL 上下文测试需要 @nestjs/graphql 包
    // 由于 utils.ts 使用 require() 懒加载，mock 无法拦截
    // 这些测试验证 GraphQL 上下文的错误抛出行为

    it("应该为 GraphQL 上下文抛出错误（未授权）", async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const request = { headers: {} };
      mockReflector.getAllAndOverride = vi.fn().mockReturnValue(false);

      const context = createMockExecutionContext(request, "graphql");

      // GraphQL 错误需要 graphql 包
      await expect(guard.canActivate(context)).rejects.toThrow();
    });

    it("应该为 GraphQL 上下文抛出错误（禁止访问）", async () => {
      const mockSession = createMockSession({
        user: { role: "user" },
      });
      mockAuth.api.getSession.mockResolvedValue(mockSession);

      const request = { headers: {} };
      mockReflector.getAllAndOverride = vi.fn().mockImplementation((key: string) => {
        if (key === "ROLES") return ["admin"];
        return false;
      });

      const context = createMockExecutionContext(request, "graphql");

      await expect(guard.canActivate(context)).rejects.toThrow();
    });
  });

  describe("RPC 上下文", () => {
    it("应该为 RPC 上下文抛出标准错误", async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const request = { headers: {} };
      mockReflector.getAllAndOverride = vi.fn().mockReturnValue(false);

      const context = createMockExecutionContext(request, "rpc");

      await expect(guard.canActivate(context)).rejects.toThrow("UNAUTHORIZED");
    });

    it("应该为 RPC 上下文抛出 FORBIDDEN 错误", async () => {
      const mockSession = createMockSession({
        user: { role: "user" },
      });
      mockAuth.api.getSession.mockResolvedValue(mockSession);

      const request = { headers: {} };
      mockReflector.getAllAndOverride = vi.fn().mockImplementation((key: string) => {
        if (key === "ROLES") return ["admin"];
        return false;
      });

      const context = createMockExecutionContext(request, "rpc");

      await expect(guard.canActivate(context)).rejects.toThrow("FORBIDDEN");
    });
  });

  describe("角色字符串格式处理", () => {
    it("应该处理逗号分隔的角色字符串（用户角色）", async () => {
      const mockSession = createMockSession({
        user: { role: "admin,editor" },
      });
      mockAuth.api.getSession.mockResolvedValue(mockSession);

      const request = { headers: {} };
      mockReflector.getAllAndOverride = vi.fn().mockImplementation((key: string) => {
        if (key === "ROLES") return ["editor"];
        return false;
      });

      const context = createMockExecutionContext(request, "http");
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("应该处理角色数组", async () => {
      const mockSession = createMockSession({
        user: { role: ["admin", "editor"] },
      });
      mockAuth.api.getSession.mockResolvedValue(mockSession);

      const request = { headers: {} };
      mockReflector.getAllAndOverride = vi.fn().mockImplementation((key: string) => {
        if (key === "ROLES") return ["editor"];
        return false;
      });

      const context = createMockExecutionContext(request, "http");
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });

    it("应该处理空角色字符串", async () => {
      const mockSession = createMockSession({
        user: { role: "" },
      });
      mockAuth.api.getSession.mockResolvedValue(mockSession);

      const request = { headers: {} };
      mockReflector.getAllAndOverride = vi.fn().mockImplementation((key: string) => {
        if (key === "ROLES") return ["admin"];
        return false;
      });

      const context = createMockExecutionContext(request, "http");

      await expect(guard.canActivate(context)).rejects.toThrow(ForbiddenException);
    });
  });

  describe("OptionalAuth 边界情况", () => {
    it("应该在 OptionalAuth 且无会话时附加 null 用户", async () => {
      mockAuth.api.getSession.mockResolvedValue(null);

      const request: any = { headers: {} };
      mockReflector.getAllAndOverride = vi.fn().mockImplementation((key: string) => {
        if (key === "OPTIONAL") return true;
        return false;
      });

      const context = createMockExecutionContext(request, "http");
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toBeNull();
      expect(request.session).toBeNull();
    });

    it("应该在 OptionalAuth 且有会话时附加用户", async () => {
      const mockSession = createMockSession();
      mockAuth.api.getSession.mockResolvedValue(mockSession);

      const request: any = { headers: {} };
      mockReflector.getAllAndOverride = vi.fn().mockImplementation((key: string) => {
        if (key === "OPTIONAL") return true;
        return false;
      });

      const context = createMockExecutionContext(request, "http");
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
      expect(request.user).toEqual(mockSession.user);
      expect(request.session).toEqual(mockSession);
    });
  });

  describe("请求对象处理", () => {
    it("应该处理无 headers 的请求对象", async () => {
      const mockSession = createMockSession();
      mockAuth.api.getSession.mockResolvedValue(mockSession);

      const request = {};
      mockReflector.getAllAndOverride = vi.fn().mockReturnValue(false);

      const context = createMockExecutionContext(request, "http");
      const result = await guard.canActivate(context);

      expect(result).toBe(true);
    });
  });
});
