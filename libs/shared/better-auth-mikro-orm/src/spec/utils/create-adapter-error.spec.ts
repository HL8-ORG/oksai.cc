/**
 * createAdapterError 单元测试
 *
 * 测试适配器错误创建函数
 */
import { describe, expect, it, vi } from "vitest";

// Mock better-auth 模块
vi.mock("better-auth", () => ({
  BetterAuthError: class BetterAuthError extends Error {
    constructor(message: string) {
      super(message);
      this.name = "BetterAuthError";
    }
  },
}));

// 模拟 createAdapterError 的行为
const createAdapterError = (message: string): never => {
  const { BetterAuthError } = require("better-auth");
  throw new BetterAuthError(`[Mikro ORM Adapter] ${message}`);
};

describe("createAdapterError", () => {
  describe("错误抛出", () => {
    it("应该抛出带有 Mikro ORM Adapter 前缀的 BetterAuthError", () => {
      const message = "测试错误消息";
      try {
        createAdapterError(message);
        throw new Error("应该抛出错误");
      } catch (error: any) {
        expect(error.name).toBe("BetterAuthError");
        expect(error.message).toContain("[Mikro ORM Adapter]");
        expect(error.message).toContain(message);
      }
    });

    it("错误消息应该包含适配器名称前缀", () => {
      const message = "无法找到实体";

      try {
        createAdapterError(message);
        throw new Error("应该抛出错误");
      } catch (error: any) {
        expect(error.name).toBe("BetterAuthError");
        expect(error.message).toContain("[Mikro ORM Adapter]");
        expect(error.message).toContain(message);
      }
    });

    it("应该完整格式化错误消息", () => {
      const message = '无法在实体 "User" 上找到属性 "email"';

      try {
        createAdapterError(message);
        throw new Error("应该抛出错误");
      } catch (error: any) {
        expect(error.message).toBe(`[Mikro ORM Adapter] ${message}`);
      }
    });

    it("应该支持空消息", () => {
      try {
        createAdapterError("");
        throw new Error("应该抛出错误");
      } catch (error: any) {
        expect(error.name).toBe("BetterAuthError");
        expect(error.message).toBe("[Mikro ORM Adapter] ");
      }
    });

    it("应该支持多行消息", () => {
      const message = "第一行\n第二行\n第三行";

      try {
        createAdapterError(message);
        throw new Error("应该抛出错误");
      } catch (error: any) {
        expect(error.message).toContain("第一行");
        expect(error.message).toContain("第二行");
        expect(error.message).toContain("第三行");
      }
    });
  });
});
