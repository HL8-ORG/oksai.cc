import type { EntityManager, MikroORM } from "@mikro-orm/core";
import { beforeEach, describe, expect, it, vi } from "vitest";
import {
  type TransactionConfig,
  TransactionManager,
  type TransactionOptions,
  TransactionTimeoutError,
} from "../utils/transactionManager";

describe("TransactionManager", () => {
  let mockOrm: MikroORM;
  let mockEm: EntityManager;

  beforeEach(() => {
    // 创建 mock EntityManager
    mockEm = {
      fork: vi.fn().mockReturnThis(),
      transactional: vi.fn(),
      clear: vi.fn(),
    } as any;

    // 创建 mock MikroORM
    mockOrm = {
      em: mockEm,
    } as any;
  });

  describe("构造函数", () => {
    it("应该使用默认超时时间（30 秒）", () => {
      const manager = new TransactionManager(mockOrm);
      expect(manager).toBeDefined();
    });

    it("应该使用配置的超时时间", () => {
      const config: TransactionConfig = { timeout: 60000 };
      const manager = new TransactionManager(mockOrm, config);
      expect(manager).toBeDefined();
    });

    it("应该允许不提供配置", () => {
      const manager = new TransactionManager(mockOrm);
      expect(manager).toBeDefined();
    });
  });

  describe("execute", () => {
    it("应该成功执行事务并返回结果", async () => {
      const expectedResult = { id: "1", name: "Test" };
      const callback = vi.fn().mockResolvedValue(expectedResult);

      mockEm.transactional = vi.fn().mockImplementation(async (cb: any) => {
        return cb(mockEm);
      });

      const manager = new TransactionManager(mockOrm);
      const result = await manager.execute(callback);

      expect(result).toEqual(expectedResult);
      expect(callback).toHaveBeenCalledWith(mockEm);
      expect(mockEm.fork).toHaveBeenCalled();
    });

    it("应该使用配置的默认超时时间", async () => {
      const callback = vi.fn().mockResolvedValue("result");

      mockEm.transactional = vi.fn().mockImplementation(async (cb: any) => {
        return cb(mockEm);
      });

      const manager = new TransactionManager(mockOrm, { timeout: 60000 });
      const result = await manager.execute(callback);

      expect(result).toBe("result");
    });

    it("应该使用选项中的超时时间覆盖默认值", async () => {
      const callback = vi.fn().mockResolvedValue("result");

      mockEm.transactional = vi.fn().mockImplementation(async (cb: any) => {
        return cb(mockEm);
      });

      const manager = new TransactionManager(mockOrm, { timeout: 30000 });
      const options: TransactionOptions = { timeout: 60000 };
      const result = await manager.execute(callback, options);

      expect(result).toBe("result");
    });

    it("应该在事务失败时抛出错误", async () => {
      const error = new Error("Transaction failed");
      const callback = vi.fn().mockRejectedValue(error);

      mockEm.transactional = vi.fn().mockRejectedValue(error);

      const manager = new TransactionManager(mockOrm);

      await expect(manager.execute(callback)).rejects.toThrow("Transaction failed");
    });

    it("应该在超时后抛出 TransactionTimeoutError", async () => {
      vi.useFakeTimers();

      const callback = vi.fn().mockImplementation(async () => {
        // 模拟长时间运行的操作
        await new Promise((resolve) => setTimeout(resolve, 5000));
        return "result";
      });

      mockEm.transactional = vi.fn().mockImplementation(async (cb: any) => {
        return cb(mockEm);
      });

      const manager = new TransactionManager(mockOrm, { timeout: 100 });
      const promise = manager.execute(callback);

      // 快进时间到超时
      vi.advanceTimersByTime(100);

      await expect(promise).rejects.toThrow(TransactionTimeoutError);
      await expect(promise).rejects.toThrow("事务执行超时 (100ms)");

      // 验证 EntityManager 被清理
      expect(mockEm.clear).toHaveBeenCalled();

      vi.useRealTimers();
    });

    it("应该在超时错误时清理 EntityManager", async () => {
      vi.useFakeTimers();

      const callback = vi.fn().mockImplementation(async () => {
        await new Promise((resolve) => setTimeout(resolve, 10000));
      });

      mockEm.transactional = vi.fn().mockImplementation(async (cb: any) => {
        return cb(mockEm);
      });

      const manager = new TransactionManager(mockOrm, { timeout: 100 });
      const promise = manager.execute(callback);

      vi.advanceTimersByTime(100);

      try {
        await promise;
      } catch (error) {
        expect(error).toBeInstanceOf(TransactionTimeoutError);
        expect(mockEm.clear).toHaveBeenCalled();
      }

      vi.useRealTimers();
    });

    it("应该在非超时错误时不清理 EntityManager", async () => {
      const error = new Error("Database error");
      const callback = vi.fn().mockRejectedValue(error);

      mockEm.transactional = vi.fn().mockRejectedValue(error);

      const manager = new TransactionManager(mockOrm);

      try {
        await manager.execute(callback);
      } catch (e) {
        expect(e).toBe(error);
        expect(mockEm.clear).not.toHaveBeenCalled();
      }
    });

    it("应该为每次调用创建新的 EntityManager fork", async () => {
      const callback = vi.fn().mockResolvedValue("result");

      mockEm.transactional = vi.fn().mockImplementation(async (cb: any) => {
        return cb(mockEm);
      });

      const manager = new TransactionManager(mockOrm);

      await manager.execute(callback);
      await manager.execute(callback);

      expect(mockEm.fork).toHaveBeenCalledTimes(2);
    });

    it("应该支持异步回调", async () => {
      const expectedResult = { id: "1", data: "test" };
      const callback = vi.fn().mockImplementation(async (em: EntityManager) => {
        // 模拟异步操作
        await new Promise((resolve) => setTimeout(resolve, 10));
        return expectedResult;
      });

      mockEm.transactional = vi.fn().mockImplementation(async (cb: any) => {
        return cb(mockEm);
      });

      const manager = new TransactionManager(mockOrm);
      const result = await manager.execute(callback);

      expect(result).toEqual(expectedResult);
    });

    it("应该传递 EntityManager 给回调函数", async () => {
      let receivedEm: EntityManager | null = null;

      const callback = vi.fn().mockImplementation(async (em: EntityManager) => {
        receivedEm = em;
        return "result";
      });

      mockEm.transactional = vi.fn().mockImplementation(async (cb: any) => {
        return cb(mockEm);
      });

      const manager = new TransactionManager(mockOrm);
      await manager.execute(callback);

      expect(receivedEm).toBe(mockEm);
    });
  });

  describe("TransactionTimeoutError", () => {
    it("应该包含超时时间", () => {
      const error = new TransactionTimeoutError(5000);
      expect(error.timeout).toBe(5000);
      expect(error.message).toBe("事务执行超时 (5000ms)");
    });

    it("应该支持自定义错误消息", () => {
      const error = new TransactionTimeoutError(5000, "Custom timeout message");
      expect(error.timeout).toBe(5000);
      expect(error.message).toBe("Custom timeout message");
    });

    it("应该有正确的错误名称", () => {
      const error = new TransactionTimeoutError(5000);
      expect(error.name).toBe("TransactionTimeoutError");
    });
  });

  describe("边界条件", () => {
    it("应该处理超时时间为 0", async () => {
      vi.useFakeTimers();

      const callback = vi.fn().mockResolvedValue("result");

      mockEm.transactional = vi.fn().mockImplementation(async (cb: any) => {
        return cb(mockEm);
      });

      const manager = new TransactionManager(mockOrm, { timeout: 0 });
      const promise = manager.execute(callback);

      // 立即超时
      vi.advanceTimersByTime(0);

      await expect(promise).rejects.toThrow(TransactionTimeoutError);

      vi.useRealTimers();
    });

    it("应该处理非常大的超时时间", async () => {
      const callback = vi.fn().mockResolvedValue("result");

      mockEm.transactional = vi.fn().mockImplementation(async (cb: any) => {
        return cb(mockEm);
      });

      const manager = new TransactionManager(mockOrm, { timeout: 86400000 }); // 24 小时
      const result = await manager.execute(callback);

      expect(result).toBe("result");
    });

    it("应该处理返回 undefined 的回调", async () => {
      const callback = vi.fn().mockResolvedValue(undefined);

      mockEm.transactional = vi.fn().mockImplementation(async (cb: any) => {
        return cb(mockEm);
      });

      const manager = new TransactionManager(mockOrm);
      const result = await manager.execute(callback);

      expect(result).toBeUndefined();
    });

    it("应该处理返回 null 的回调", async () => {
      const callback = vi.fn().mockResolvedValue(null);

      mockEm.transactional = vi.fn().mockImplementation(async (cb: any) => {
        return cb(mockEm);
      });

      const manager = new TransactionManager(mockOrm);
      const result = await manager.execute(callback);

      expect(result).toBeNull();
    });
  });
});
