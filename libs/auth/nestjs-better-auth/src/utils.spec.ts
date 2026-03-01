import type { ExecutionContext } from "@nestjs/common";
import { getRequestFromContext } from "./utils";

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
      const mockRequest = { headers: { cookie: "session=abc" } };

      const mockContext = {
        getType: () => "graphql",
        switchToHttp: () => ({
          getRequest: () => mockRequest,
        }),
      } as ExecutionContext;

      const request = getRequestFromContext(mockContext);
      expect(request).toBe(mockRequest);
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
    it("应该正确处理所有上下文类型", () => {
      const contextTypes = ["http", "ws", "graphql", "rpc"] as const;

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
