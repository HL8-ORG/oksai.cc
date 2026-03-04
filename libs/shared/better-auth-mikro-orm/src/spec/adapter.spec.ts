/**
 * mikroOrmAdapter 单元测试
 *
 * 测试 Mikro ORM 适配器的基本功能
 *
 * 注意：由于 Better Auth 的 createAdapterFactory 返回函数，
 * 实际的 CRUD 操作需要通过 Better Auth 的完整流程测试。
 * 此测试文件专注于适配器创建和配置的单元测试。
 */

import { ReferenceKind } from "@mikro-orm/core";
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

// Mock better-auth/adapters
vi.mock("better-auth/adapters", () => ({
  createAdapterFactory: vi.fn((config: any) => {
    // 返回一个模拟的适配器工厂函数
    return (options: any) => {
      const adapter = config.adapter();
      return adapter;
    };
  }),
}));

// Mock dset 模块
vi.mock("dset", () => ({
  dset: (obj: any, path: any, value: any) => {
    if (typeof path === "string") {
      (obj as any)[path] = value;
    } else if (Array.isArray(path)) {
      let current = obj;
      for (let i = 0; i < path.length - 1; i++) {
        if (!current[path[i]]) {
          current[path[i]] = {};
        }
        current = current[path[i]];
      }
      current[path[path.length - 1]] = value;
    }
  },
}));

/**
 * 创建 Mock MikroORM 实例
 */
function createMockOrm(): any {
  return {
    config: {
      getNamingStrategy: () => ({
        getEntityName: (name: string) => name,
        classToTableName: (name: string) => name.toLowerCase(),
        propertyToColumnName: (name: string) => name,
        joinColumnName: (name: string) => `${name}_id`,
        columnNameToProperty: (name: string) => name.replace("_id", ""),
        referenceColumnName: () => "id",
      }),
    },
    getMetadata: () => ({
      has: () => true,
      get: () => ({
        className: "User",
        tableName: "user",
        class: class User {},
        props: [
          {
            name: "id",
            kind: ReferenceKind.SCALAR,
            fieldNames: ["id"],
            persist: true,
            referencedPKs: [],
            targetMeta: null,
          },
          {
            name: "email",
            kind: ReferenceKind.SCALAR,
            fieldNames: ["email"],
            persist: true,
            referencedPKs: [],
            targetMeta: null,
          },
          {
            name: "name",
            kind: ReferenceKind.SCALAR,
            fieldNames: ["name"],
            persist: true,
            referencedPKs: [],
            targetMeta: null,
          },
        ],
      }),
      getAll: () => ({}),
    }),
    em: {
      fork: () => ({
        create: vi.fn((entity: any, data: any) => ({ ...data })),
        findOne: vi.fn(async () => null),
        find: vi.fn(async () => []),
        persistAndFlush: vi.fn(async () => {}),
        flush: vi.fn(async () => {}),
        assign: vi.fn((entity: any, data: any) => Object.assign(entity, data)),
        removeAndFlush: vi.fn(async () => {}),
        nativeUpdate: vi.fn(async () => 0),
        nativeDelete: vi.fn(async () => 0),
        count: vi.fn(async () => 0),
      }),
    },
  };
}

/**
 * 创建 Mock BetterAuthOptions
 */
function createMockOptions(): any {
  return {
    database: {},
    secret: "test-secret",
  };
}

describe("mikroOrmAdapter", () => {
  describe("适配器创建", () => {
    it("应该创建适配器工厂", async () => {
      const mockOrm = createMockOrm();
      const { mikroOrmAdapter } = await import("../adapter");

      const factory = mikroOrmAdapter(mockOrm);

      expect(factory).toBeDefined();
      expect(typeof factory).toBe("function");
    });

    it("应该使用默认配置", async () => {
      const mockOrm = createMockOrm();
      const { mikroOrmAdapter } = await import("../adapter");

      const factory = mikroOrmAdapter(mockOrm);

      expect(factory).toBeDefined();
    });

    it("应该接受自定义配置", async () => {
      const mockOrm = createMockOrm();
      const { mikroOrmAdapter } = await import("../adapter");

      const factory = mikroOrmAdapter(mockOrm, {
        debugLogs: true,
        supportsJSON: false,
      });

      expect(factory).toBeDefined();
    });
  });

  describe("适配器实例", () => {
    it("应该返回适配器实例", async () => {
      const mockOrm = createMockOrm();
      const mockOptions = createMockOptions();
      const { mikroOrmAdapter } = await import("../adapter");

      const factory = mikroOrmAdapter(mockOrm);
      const adapter = factory(mockOptions);

      expect(adapter).toBeDefined();
      expect(adapter.create).toBeDefined();
      expect(adapter.findOne).toBeDefined();
      expect(adapter.findMany).toBeDefined();
      expect(adapter.update).toBeDefined();
      expect(adapter.updateMany).toBeDefined();
      expect(adapter.delete).toBeDefined();
      expect(adapter.deleteMany).toBeDefined();
      expect(adapter.count).toBeDefined();
    });

    it("应该使用 fork 创建 EntityManager", async () => {
      const mockOrm = createMockOrm();
      const mockOptions = createMockOptions();
      const forkSpy = vi.spyOn(mockOrm.em, "fork");
      const { mikroOrmAdapter } = await import("../adapter");

      const factory = mikroOrmAdapter(mockOrm);
      const adapter = factory(mockOptions);

      // 调用 findOne 来验证 fork（这个方法不需要完整的 metadata）
      await adapter.findOne({ model: "user", where: [{ field: "id", value: "test" }] });

      expect(forkSpy).toHaveBeenCalled();
    });
  });

  describe("配置选项", () => {
    it("应该支持 debugLogs", async () => {
      const mockOrm = createMockOrm();
      const { mikroOrmAdapter } = await import("../adapter");

      const factory = mikroOrmAdapter(mockOrm, { debugLogs: true });

      expect(factory).toBeDefined();
    });

    it("应该支持 supportsJSON", async () => {
      const mockOrm = createMockOrm();
      const { mikroOrmAdapter } = await import("../adapter");

      const factory = mikroOrmAdapter(mockOrm, { supportsJSON: false });

      expect(factory).toBeDefined();
    });
  });
});
