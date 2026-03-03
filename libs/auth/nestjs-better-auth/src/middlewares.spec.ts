import type { NextFunction, Request, Response } from "express";
import { vi } from "vitest";
import { SkipBodyParsingMiddleware } from "./middlewares";

// Mock express module
vi.mock("express", () => ({
  json: vi.fn((options) => {
    return (req: any, res: any, next: any) => {
      // 如果有 verify 选项且是 Buffer，调用它
      if (options?.verify && Buffer.isBuffer(req.body)) {
        options.verify(req, res, req.body, () => true);
      }
      next();
    };
  }),
  urlencoded: vi.fn(() => {
    return (req: any, res: any, next: any) => {
      next();
    };
  }),
}));

describe("SkipBodyParsingMiddleware", () => {
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let mockNext: NextFunction;

  beforeEach(() => {
    mockReq = {
      baseUrl: "/api/users",
      headers: {},
    };
    mockRes = {};
    mockNext = vi.fn();
  });

  describe("基础功能", () => {
    it("应该创建中间件函数", () => {
      const middleware = SkipBodyParsingMiddleware();
      expect(typeof middleware).toBe("function");
    });

    it("应该使用默认的 basePath", () => {
      const middleware = SkipBodyParsingMiddleware();
      expect(middleware).toBeDefined();
    });
  });

  describe("跳过 body 解析", () => {
    it("应该跳过 Better Auth 路由的 body 解析", () => {
      mockReq.baseUrl = "/api/auth/sign-in";
      const middleware = SkipBodyParsingMiddleware({ basePath: "/api/auth" });

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
      expect(mockNext).toHaveBeenCalledTimes(1);
    });

    it("应该使用自定义 basePath", () => {
      mockReq.baseUrl = "/custom-auth/login";
      const middleware = SkipBodyParsingMiddleware({
        basePath: "/custom-auth",
      });

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });

    it("应该对非 Auth 路由继续解析 body", async () => {
      mockReq.baseUrl = "/api/users";
      const middleware = SkipBodyParsingMiddleware({ basePath: "/api/auth" });

      const jsonBody = { name: "test" };
      mockReq.body = jsonBody;

      await new Promise<void>((resolve, reject) => {
        middleware(mockReq as Request, mockRes as Response, (err?) => {
          if (err) {
            reject(err);
          } else {
            resolve();
          }
        });
      });
    });
  });

  describe("Raw Body Parser", () => {
    it("应该支持启用 rawBodyParser 并设置 rawBody", async () => {
      const middleware = SkipBodyParsingMiddleware({
        enableRawBodyParser: true,
      });

      // Mock 请求对象，带有 Buffer body
      const mockReq = {
        baseUrl: "/api/other",
        headers: { "content-type": "application/json" },
        body: Buffer.from('{"test":"data"}'),
      };
      const mockRes = {};

      await new Promise<void>((resolve) => {
        middleware(mockReq as any, mockRes as Response, () => {
          // 验证 rawBody 被设置
          expect((mockReq as any).rawBody).toBeDefined();
          expect((mockReq as any).rawBody.toString()).toBe('{"test":"data"}');
          resolve();
        });
      });
    });

    it("默认应该不启用 rawBodyParser", async () => {
      const middleware = SkipBodyParsingMiddleware({
        enableRawBodyParser: false,
      });

      const mockReq = {
        baseUrl: "/api/other",
        headers: { "content-type": "application/json" },
        body: {},
      };
      const mockRes = {};

      await new Promise<void>((resolve) => {
        middleware(mockReq as Request, mockRes as Response, () => {
          // 验证 rawBody 没有被设置
          expect((mockReq as any).rawBody).toBeUndefined();
          resolve();
        });
      });
    });
  });

  describe("错误处理", () => {
    it("应该处理 body 解析错误", async () => {
      // Mock express.json 抛出错误
      const express = await import("express");
      vi.mocked(express.json).mockReturnValueOnce((req: any, res: any, next: any) => {
        next(new Error("JSON parse error"));
      });

      const middleware = SkipBodyParsingMiddleware({
        basePath: "/api/auth",
      });
      const mockReq = {
        baseUrl: "/api/other",
        path: "/api/other",
        headers: { "content-type": "application/json" },
        body: {},
      };
      const mockRes = {};

      const errorPromise = new Promise<Error>((resolve) => {
        middleware(mockReq as Request, mockRes as Response, (err?: any) => {
          resolve(err);
        });
      });

      const error = await errorPromise;
      expect(error).toBeDefined();
      expect(error.message).toBe("JSON parse error");
    });
  });

  describe("URL 编码解析", () => {
    it("应该在 JSON 解析后继续解析 URL 编码数据", async () => {
      const middleware = SkipBodyParsingMiddleware({
        basePath: "/api/auth",
      });
      const mockReq = {
        baseUrl: "/api/other",
        path: "/api/other",
        headers: { "content-type": "application/x-www-form-urlencoded" },
        body: {},
      };
      const mockRes = {};

      await new Promise<void>((resolve) => {
        middleware(mockReq as Request, mockRes as Response, () => {
          resolve();
        });
      });
    });
  });

  describe("边界情况", () => {
    it("应该处理空选项", () => {
      const middleware = SkipBodyParsingMiddleware({});
      expect(typeof middleware).toBe("function");
    });

    it("应该处理 undefined 选项", () => {
      const middleware = SkipBodyParsingMiddleware(undefined as any);
      expect(typeof middleware).toBe("function");
    });

    it("应该处理根路径匹配", () => {
      mockReq.baseUrl = "/api/auth";
      const middleware = SkipBodyParsingMiddleware({ basePath: "/api/auth" });

      middleware(mockReq as Request, mockRes as Response, mockNext);

      expect(mockNext).toHaveBeenCalled();
    });
  });
});
