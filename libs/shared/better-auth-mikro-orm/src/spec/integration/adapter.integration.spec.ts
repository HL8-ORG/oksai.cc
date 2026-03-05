import type { MikroORM } from "@mikro-orm/core";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { mikroOrmAdapter } from "../../adapter.js";
import { cleanDatabase, createSchema, createTestOrm, dropSchema, seedTestData } from "./test-utils.js";

/**
 * 集成测试：mikroOrmAdapter 真实数据库 CRUD 操作
 *
 * 这些测试使用真实的 PostgreSQL 数据库，验证适配器与数据库的完整集成。
 * 运行测试前需要启动 Docker 容器：
 *   docker-compose -f docker-compose.test.yml up -d
 */
describe("mikroOrmAdapter (Integration)", () => {
  let orm: MikroORM;
  let adapter: any; // 使用 any 因为实际的 adapter 类型是从 createAdapterFactory 返回的

  // 在所有测试前启动 ORM 和创建 Schema
  beforeAll(async () => {
    orm = await createTestOrm();
    await createSchema(orm);

    // 创建适配器工厂
    const adapterFactory = mikroOrmAdapter(orm);

    // 从工厂获取实际的 adapter（传入空的 BetterAuthOptions）
    adapter = adapterFactory({});
  }, 30000);

  // 在所有测试后清理资源
  afterAll(async () => {
    await dropSchema(orm);
    await orm.close();
  }, 30000);

  // 每个测试前清理数据库
  beforeEach(async () => {
    await cleanDatabase(orm);
  });

  describe("create - 创建记录", () => {
    it("应该创建用户并返回", async () => {
      const user = await adapter.create({
        model: "user",
        data: {
          email: "new@example.com",
          name: "New User",
          emailVerified: false,
        },
      });

      expect(user).toBeDefined();
      expect(user.id).toBeDefined();
      expect(user.email).toBe("new@example.com");
      expect(user.name).toBe("New User");
      expect(user.emailVerified).toBe(false);
      expect(user.createdAt).toBeDefined();
      expect(user.updatedAt).toBeDefined();
    });

    it("应该创建会话并返回", async () => {
      // 先创建用户
      const user = await adapter.create({
        model: "user",
        data: {
          email: "session-test@example.com",
        },
      });

      const expiresAt = new Date(Date.now() + 3600000);
      const session = await adapter.create({
        model: "session",
        data: {
          userId: user.id,
          token: "test-token-456",
          expiresAt,
        },
      });

      expect(session).toBeDefined();
      expect(session.id).toBeDefined();
      expect(session.userId).toBe(user.id);
      expect(session.token).toBe("test-token-456");
      expect(new Date(session.expiresAt)).toEqual(expiresAt);
    });
  });

  describe("findOne - 查询单个记录", () => {
    it("应该根据 ID 查询用户", async () => {
      const { user } = await seedTestData(orm);

      const found = await adapter.findOne({
        model: "user",
        where: [{ field: "id", value: user.id }],
      });

      expect(found).toBeDefined();
      expect(found?.id).toBe(user.id);
      expect(found?.email).toBe("test@example.com");
    });

    it("应该根据 email 查询用户", async () => {
      const { user } = await seedTestData(orm);

      const found = await adapter.findOne({
        model: "user",
        where: [{ field: "email", value: "test@example.com" }],
      });

      expect(found).toBeDefined();
      expect(found?.id).toBe(user.id);
    });

    it("查询不存在的记录应该返回 null", async () => {
      const found = await adapter.findOne({
        model: "user",
        where: [{ field: "id", value: "non-existent-id" }],
      });

      expect(found).toBeNull();
    });
  });

  describe("findMany - 查询多个记录", () => {
    it("应该查询所有用户", async () => {
      await seedTestData(orm);

      // 创建另一个用户
      await adapter.create({
        model: "user",
        data: {
          email: "another@example.com",
          name: "Another User",
        },
      });

      const users = await adapter.findMany({
        model: "user",
      });

      expect(users).toBeDefined();
      expect(users.length).toBe(2);
      expect(users.map((u: any) => u.email)).toContain("test@example.com");
      expect(users.map((u: any) => u.email)).toContain("another@example.com");
    });

    it("应该根据条件过滤用户", async () => {
      await seedTestData(orm);

      // 创建另一个用户
      await adapter.create({
        model: "user",
        data: {
          email: "verified@example.com",
          name: "Verified User",
          emailVerified: true,
        },
      });

      const users = await adapter.findMany({
        model: "user",
        where: [{ field: "emailVerified", value: true }],
      });

      expect(users).toBeDefined();
      expect(users.length).toBe(1);
      expect(users[0].email).toBe("verified@example.com");
    });
  });

  describe("update - 更新记录", () => {
    it("应该更新用户并返回", async () => {
      const { user } = await seedTestData(orm);

      const updated = await adapter.update({
        model: "user",
        where: [{ field: "id", value: user.id }],
        update: {
          name: "Updated Name",
          emailVerified: true,
        },
      });

      expect(updated).toBeDefined();
      expect(updated.name).toBe("Updated Name");
      expect(updated.emailVerified).toBe(true);
      expect(updated.updatedAt.getTime()).toBeGreaterThanOrEqual(user.updatedAt.getTime());
    });

    it("更新不存在的记录应该返回 null", async () => {
      const updated = await adapter.update({
        model: "user",
        where: [{ field: "id", value: "non-existent-id" }],
        update: {
          name: "Updated Name",
        },
      });

      expect(updated).toBeNull();
    });
  });

  describe("delete - 删除记录", () => {
    it("应该删除用户", async () => {
      const { user } = await seedTestData(orm);

      await adapter.delete({
        model: "user",
        where: [{ field: "id", value: user.id }],
      });

      // 验证已被删除
      const found = await adapter.findOne({
        model: "user",
        where: [{ field: "id", value: user.id }],
      });

      expect(found).toBeNull();
    });
  });

  describe("count - 统计记录", () => {
    it("应该统计用户数量", async () => {
      await seedTestData(orm);

      // 创建更多用户
      await adapter.create({
        model: "user",
        data: { email: "user2@example.com" },
      });
      await adapter.create({
        model: "user",
        data: { email: "user3@example.com" },
      });

      const count = await adapter.count({
        model: "user",
      });

      expect(count).toBe(3);
    });

    it("应该根据条件统计", async () => {
      await seedTestData(orm);

      // 创建已验证的用户
      await adapter.create({
        model: "user",
        data: {
          email: "verified@example.com",
          emailVerified: true,
        },
      });

      const count = await adapter.count({
        model: "user",
        where: [{ field: "emailVerified", value: true }],
      });

      expect(count).toBe(1);
    });
  });
});
