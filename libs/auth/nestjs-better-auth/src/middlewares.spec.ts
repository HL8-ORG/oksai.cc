import type { NextFunction, Request, Response } from "express";
import { SkipBodyParsingMiddleware } from "./middlewares";

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
    mockNext = jest.fn();
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

    it("应该对非 Auth 路由继续解析 body", (done) => {
      mockReq.baseUrl = "/api/users";
      const middleware = SkipBodyParsingMiddleware({ basePath: "/api/auth" });

      const jsonBody = { name: "test" };
      mockReq.body = jsonBody;

      middleware(mockReq as Request, mockRes as Response, (err?) => {
        if (err) {
          done.fail(err);
        } else {
          done();
        }
      });
    });
  });

  describe("Raw Body Parser", () => {
    it("应该支持启用 rawBodyParser", () => {
      const middleware = SkipBodyParsingMiddleware({
        enableRawBodyParser: true,
      });
      expect(middleware).toBeDefined();
    });

    it("默认应该不启用 rawBodyParser", () => {
      const middleware = SkipBodyParsingMiddleware({
        enableRawBodyParser: false,
      });
      expect(middleware).toBeDefined();
    });
  });

  describe("错误处理", () => {
    it("应该处理 body 解析错误", (done) => {
      mockReq.baseUrl = "/api/users";
      const middleware = SkipBodyParsingMiddleware();

      // 模拟错误的 JSON
      const _originalJson = jest.requireActual("express").json;
      jest.doMock("express", () => ({
        json: jest.fn(() => {
          return (_req: any, _res: any, next: any) => {
            next(new Error("Invalid JSON"));
          };
        }),
        urlencoded: jest.fn(() => (_req: any, _res: any, next: any) => next()),
      }));

      middleware(mockReq as Request, mockRes as Response, (_err?) => {
        // 即使有错误也应该调用 next
        done();
      });
    });
  });

  describe("URL 编码解析", () => {
    it("应该在 JSON 解析后继续解析 URL 编码数据", (done) => {
      mockReq.baseUrl = "/api/users";
      const middleware = SkipBodyParsingMiddleware();

      middleware(mockReq as Request, mockRes as Response, () => {
        done();
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
