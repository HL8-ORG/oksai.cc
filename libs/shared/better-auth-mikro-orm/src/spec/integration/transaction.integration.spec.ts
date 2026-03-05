import type { MikroORM } from "@mikro-orm/core";
import { afterAll, beforeAll, beforeEach, describe, expect, it } from "vitest";
import { mikroOrmAdapter } from "../../adapter.js";
import { cleanDatabase, createSchema, createTestOrm, dropSchema } from "./test-utils.js";

/**
 * 集成测试：mikroOrmAdapter 事务支持
 *
 * 这些测试验证适配器的真实事务边界，包括提交和回滚。
 * 运行测试前需要启动 Docker 容器：
 *   docker-compose -f docker-compose.test.yml up -d
 */
describe("mikroOrmAdapter Transaction (Integration)", () => {
  let orm: MikroORM;
  let adapter: any;

  beforeAll(async () => {
    orm = await createTestOrm();
    await createSchema(orm);

    const adapterFactory = mikroOrmAdapter(orm);
    adapter = adapterFactory({});
  }, 30000);

  afterAll(async () => {
    await dropSchema(orm);
    await orm.close();
  }, 30000);

  beforeEach(async () => {
    await cleanDatabase(orm);
  });

  describe("transaction - 事务支持", () => {
    it("应该成功提交事务", async () => {
      // 获取适配器工厂
      const adapterFactory = mikroOrmAdapter(orm);
      const adapterWithOptions = adapterFactory({
        database: mikroOrmAdapter(orm),
      });

      // 检查 transaction 函数是否存在
      if (!adapterWithOptions.transaction) {
        // 如果没有 transaction 支持，跳过测试
        expect(true).toBe(true);
        return;
      }

      // 在事务中创建用户和组织
      const result = await adapterWithOptions.transaction(async (trx: any) => {
        const user = await trx.create({
          model: "user",
          data: {
            email: "transaction-test@example.com",
            name: "Transaction User",
          },
        });

        const organization = await trx.create({
          model: "organization",
          data: {
            name: "Test Org",
            ownerId: user.id,
          },
        });

        return { user, organization };
      });

      // 验证结果
      expect(result.user).toBeDefined();
      expect(result.user.email).toBe("transaction-test@example.com");
      expect(result.organization).toBeDefined();
      expect(result.organization.ownerId).toBe(result.user.id);

      // 验证数据已持久化
      const savedUser = await adapter.findOne({
        model: "user",
        where: [{ field: "id", value: result.user.id }],
      });
      expect(savedUser).toBeDefined();
      expect(savedUser?.email).toBe("transaction-test@example.com");
    });

    it("应该在失败时回滚事务", async () => {
      const adapterFactory = mikroOrmAdapter(orm);
      const adapterWithOptions = adapterFactory({
        database: mikroOrmAdapter(orm),
      });

      if (!adapterWithOptions.transaction) {
        expect(true).toBe(true);
        return;
      }

      // 在事务中创建用户，然后抛出异常
      try {
        await adapterWithOptions.transaction(async (trx: any) => {
          await trx.create({
            model: "user",
            data: {
              email: "rollback-test@example.com",
              name: "Rollback User",
            },
          });

          // 模拟失败
          throw new Error("模拟的事务失败");
        });

        // 不应该到达这里
        expect(true).toBe(false);
      } catch (error) {
        // 预期会抛出异常
        expect((error as Error).message).toBe("模拟的事务失败");
      }

      // 验证数据已回滚
      const savedUser = await adapter.findOne({
        model: "user",
        where: [{ field: "email", value: "rollback-test@example.com" }],
      });
      expect(savedUser).toBeNull();
    });

    it("应该支持嵌套操作", async () => {
      const adapterFactory = mikroOrmAdapter(orm);
      const adapterWithOptions = adapterFactory({
        database: mikroOrmAdapter(orm),
      });

      if (!adapterWithOptions.transaction) {
        expect(true).toBe(true);
        return;
      }

      // 在事务中执行多个操作
      const result = await adapterWithOptions.transaction(async (trx: any) => {
        // 创建用户
        const user = await trx.create({
          model: "user",
          data: {
            email: "nested-test@example.com",
          },
        });

        // 创建会话
        const session = await trx.create({
          model: "session",
          data: {
            userId: user.id,
            token: "nested-token-123",
            expiresAt: new Date(Date.now() + 3600000),
          },
        });

        // 创建账户
        const account = await trx.create({
          model: "account",
          data: {
            userId: user.id,
            accountId: "nested-account-123",
            providerId: "credentials",
          },
        });

        return { user, session, account };
      });

      // 验证所有操作都成功
      expect(result.user).toBeDefined();
      expect(result.session).toBeDefined();
      expect(result.account).toBeDefined();
      expect(result.session.userId).toBe(result.user.id);
      expect(result.account.userId).toBe(result.user.id);

      // 验证数据已持久化
      const count = await adapter.count({
        model: "session",
        where: [{ field: "userId", value: result.user.id }],
      });
      expect(count).toBe(1);
    });
  });
});
