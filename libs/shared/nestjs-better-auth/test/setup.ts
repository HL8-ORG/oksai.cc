/**
 * Vitest 测试环境设置
 */
import { vi } from "vitest";

// Mock @nestjs/graphql
vi.mock("@nestjs/graphql", () => ({
  GqlExecutionContext: {
    create: vi.fn((context) => ({
      getContext: vi.fn(() => ({
        req: context.switchToHttp().getRequest(),
      })),
    })),
  },
}));

// Mock @nestjs/websockets
vi.mock("@nestjs/websockets", () => ({
  WsException: class WsException extends Error {
    constructor(message: any) {
      super(typeof message === "string" ? message : JSON.stringify(message));
      this.name = "WsException";
    }
  },
}));
