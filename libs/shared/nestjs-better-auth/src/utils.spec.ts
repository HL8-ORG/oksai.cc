import type { ExecutionContext } from "@nestjs/common";
import { afterEach, beforeEach, describe, expect, it } from "vitest";

let getRequestFromContext: typeof import("./utils").getRequestFromContext;

beforeEach(async () => {
  globalThis.__TEST_GQL_EXECUTION_CONTEXT__ = {
    create: (context: any) => ({
      getContext: () => ({
        req: { headers: { cookie: "session=abc" } },
      }),
    }),
  };
  getRequestFromContext = (await import("./utils")).getRequestFromContext;
});

afterEach(() => {
  globalThis.__TEST_GQL_EXECUTION_CONTEXT__ = undefined;
});

describe("getRequestFromContext", () => {
  describe("HTTP 上下文", () => {
    it("应该从 HTTP 上下文中获取请求", () => {
      const mockRequest = { headers: { cookie: "session=abc" } };

      const mockContext = {
        getType: () => "http",
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const request = getRequestFromContext(mockContext);
      expect(request).toBe(mockRequest);
    });
  });

  describe("WebSocket 上下文", () => {
    it("应该从 WebSocket 上下文中获取客户端", () => {
      const mockClient = {
        handshake: { headers: { cookie: "session=abc" } },
      };

      const mockContext = {
        getType: () => "ws",
        switchToWs: () => ({
          getClient: () => mockClient,
        }),
      } as ExecutionContext;

      const client = getRequestFromContext(mockContext);
      expect(client).toBe(mockClient);
    });
  });

  describe("GraphQL 上下文", () => {
    it("应该从 GraphQL 上下文中获取请求", () => {
      const mockContext = {
        getType: () => "graphql",
        switchToHttp: () => ({
          getRequest: () => ({ headers: { cookie: "session=abc" } }),
        }),
      } as ExecutionContext;

      const request = getRequestFromContext(mockContext);
      expect(request).toEqual({ headers: { cookie: "session=abc" } });
    });
  });

  describe("RPC 上下文", () => {
    it("应该将 RPC 作为 HTTP 处理", () => {
      const mockRequest = { headers: {} };

      const mockContext = {
        getType: () => "rpc",
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const request = getRequestFromContext(mockContext);
      expect(request).toBe(mockRequest);
    });
  });

  describe("类型推断", () => {
    it("应该正确处理 HTTP 和 WebSocket 上下文类型", () => {
      const contextTypes = ["http", "ws", "rpc"] as const;

      contextTypes.forEach((type) => {
        const mockContext = {
          getType: () => type,
          switchToHttp: () => ({
            getRequest: () => ({ type }),
          }),
          switchToWs: () => ({
            getClient: () => ({ type }),
          }),
        } as any;

        const result = getRequestFromContext(mockContext);
        expect(result).toBeDefined();
      });
    });
  });
});
