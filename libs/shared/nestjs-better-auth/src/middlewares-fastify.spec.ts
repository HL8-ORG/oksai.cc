import { vi } from "vitest";
import { SkipBodyParsingMiddlewareFastify } from "./middlewares-fastify";

describe("SkipBodyParsingMiddlewareFastify", () => {
  it("应该创建中间件函数", () => {
    const middleware = SkipBodyParsingMiddlewareFastify();
    expect(typeof middleware).toBe("function");
  });

  it("应该使用默认的 basePath", () => {
    const middleware = SkipBodyParsingMiddlewareFastify();
    expect(middleware).toBeDefined();
  });

  it("应该跳过 better-auth 路由", () => {
    const middleware = SkipBodyParsingMiddlewareFastify({
      basePath: "/api/auth",
    });

    const req = {
      url: "/api/auth/sign-in",
    };
    const res = {};
    const next = vi.fn();

    middleware(req as any, res as any, next);

    expect(next).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("应该继续处理非 auth 路由", () => {
    const middleware = SkipBodyParsingMiddlewareFastify({
      basePath: "/api/auth",
    });

    const req = {
      url: "/api/users",
    };
    const res = {};
    const next = vi.fn();

    middleware(req as any, res as any, next);

    expect(next).toHaveBeenCalled();
    expect(next).toHaveBeenCalledTimes(1);
  });

  it("应该支持自定义 basePath", () => {
    const middleware = SkipBodyParsingMiddlewareFastify({
      basePath: "/custom/auth",
    });

    const req = {
      url: "/custom/auth/sign-in",
    };
    const res = {};
    const next = vi.fn();

    middleware(req as any, res as any, next);

    expect(next).toHaveBeenCalled();
  });

  it("应该处理根路径匹配", () => {
    const middleware = SkipBodyParsingMiddlewareFastify({
      basePath: "/api/auth",
    });

    const req = {
      url: "/api/auth",
    };
    const res = {};
    const next = vi.fn();

    middleware(req as any, res as any, next);

    expect(next).toHaveBeenCalled();
  });

  it("应该处理无 URL 的情况", () => {
    const middleware = SkipBodyParsingMiddlewareFastify();

    const req = {};
    const res = {};
    const next = vi.fn();

    middleware(req as any, res as any, next);

    expect(next).toHaveBeenCalled();
  });

  it("应该处理空 URL 的情况", () => {
    const middleware = SkipBodyParsingMiddlewareFastify();

    const req = {
      url: "",
    };
    const res = {};
    const next = vi.fn();

    middleware(req as any, res as any, next);

    expect(next).toHaveBeenCalled();
  });
});
