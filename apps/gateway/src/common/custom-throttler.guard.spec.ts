/**
 * 速率限制守卫测试
 */

import { type ExecutionContext, HttpException } from "@nestjs/common";
import { Reflector } from "@nestjs/core";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { CustomThrottlerGuard } from "./custom-throttler.guard";
import type { RateLimitConfig } from "./rate-limit.decorator";

interface MockRequest {
  headers: Record<string, string | string[] | undefined>;
  ip: string;
  connection: { remoteAddress: string };
  user: { id: string } | null;
}

describe("CustomThrottlerGuard", () => {
  let guard: CustomThrottlerGuard;
  let reflector: Reflector;
  let mockExecutionContext: ExecutionContext;
  let mockRequest: MockRequest;

  beforeEach(() => {
    reflector = new Reflector();
    guard = new CustomThrottlerGuard(reflector);

    mockRequest = {
      headers: {},
      ip: "127.0.0.1",
      connection: { remoteAddress: "127.0.0.1" },
      user: null,
    };

    mockExecutionContext = {
      switchToHttp: () => ({
        getRequest: () => mockRequest,
      }),
      getHandler: () => vi.fn(),
      getClass: () => ({ name: "TestController" }),
    } as unknown as ExecutionContext;

    vi.useFakeTimers();
  });

  afterEach(() => {
    vi.useRealTimers();
  });

  describe("canActivate", () => {
    it("没有配置时应该允许请求通过", async () => {
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(undefined);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it("首次请求应该通过", async () => {
      const config: RateLimitConfig = { ttl: 60000, limit: 5 };
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(config);

      const result = await guard.canActivate(mockExecutionContext);

      expect(result).toBe(true);
    });

    it("未超过限制时应该允许请求", async () => {
      const config: RateLimitConfig = { ttl: 60000, limit: 5 };
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(config);

      for (let i = 0; i < 4; i++) {
        const result = await guard.canActivate(mockExecutionContext);
        expect(result).toBe(true);
      }
    });

    it("超过限制时应该抛出异常", async () => {
      const config: RateLimitConfig = { ttl: 60000, limit: 3 };
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(config);

      for (let i = 0; i < 3; i++) {
        await guard.canActivate(mockExecutionContext);
      }

      await expect(guard.canActivate(mockExecutionContext)).rejects.toThrow(HttpException);
    });

    it("超过限制时应该返回 429 状态码", async () => {
      const config: RateLimitConfig = { ttl: 60000, limit: 2 };
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(config);

      await guard.canActivate(mockExecutionContext);
      await guard.canActivate(mockExecutionContext);

      try {
        await guard.canActivate(mockExecutionContext);
        expect(true).toBe(false); // 不应该到达这里
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const httpError = error as HttpException;
        expect(httpError.getStatus()).toBe(429);
        expect(httpError.getResponse()).toMatchObject({
          message: "请求次数过多，请稍后再试",
        });
      }
    });

    it("使用自定义错误消息", async () => {
      const config: RateLimitConfig = {
        ttl: 60000,
        limit: 1,
        message: "自定义错误消息",
      };
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(config);

      await guard.canActivate(mockExecutionContext);

      try {
        await guard.canActivate(mockExecutionContext);
        expect(true).toBe(false); // 不应该到达这里
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        const httpError = error as HttpException;
        expect(httpError.getResponse()).toMatchObject({
          message: "自定义错误消息",
        });
      }
    });

    it("TTL 过期后应该重置计数器", async () => {
      const config: RateLimitConfig = { ttl: 60000, limit: 2 };
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(config);

      await guard.canActivate(mockExecutionContext);
      await guard.canActivate(mockExecutionContext);

      vi.advanceTimersByTime(61000);

      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it("应该使用 X-Forwarded-For 头作为客户端 IP", async () => {
      const config: RateLimitConfig = { ttl: 60000, limit: 1 };
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(config);

      mockRequest.headers["x-forwarded-for"] = "203.0.113.1";

      await guard.canActivate(mockExecutionContext);

      try {
        await guard.canActivate(mockExecutionContext);
        expect(true).toBe(false); // 不应该到达这里
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(429);
      }
    });

    it("应该使用 X-Real-IP 头作为客户端 IP", async () => {
      const config: RateLimitConfig = { ttl: 60000, limit: 1 };
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(config);

      mockRequest.headers["x-real-ip"] = "203.0.113.2";

      await guard.canActivate(mockExecutionContext);

      try {
        await guard.canActivate(mockExecutionContext);
        expect(true).toBe(false); // 不应该到达这里
      } catch (error) {
        expect(error).toBeInstanceOf(HttpException);
        expect((error as HttpException).getStatus()).toBe(429);
      }
    });

    it("应该为不同 IP 分开计数", async () => {
      const config: RateLimitConfig = { ttl: 60000, limit: 1 };
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(config);

      mockRequest.ip = "192.168.1.1";
      await guard.canActivate(mockExecutionContext);

      mockRequest.ip = "192.168.1.2";
      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });

    it("应该为认证用户和匿名用户分开计数", async () => {
      const config: RateLimitConfig = { ttl: 60000, limit: 1 };
      vi.spyOn(reflector, "getAllAndOverride").mockReturnValue(config);

      mockRequest.user = { id: "user1" };
      await guard.canActivate(mockExecutionContext);

      mockRequest.user = null;
      const result = await guard.canActivate(mockExecutionContext);
      expect(result).toBe(true);
    });
  });
});
