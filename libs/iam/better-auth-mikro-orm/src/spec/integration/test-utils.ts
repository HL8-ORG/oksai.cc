import process from "node:process";
import { MikroORM, type Options } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { TestAccount, TestOrganization, TestSession, TestUser } from "./test-entities/index.js";

/**
 * 创建测试 ORM 实例
 *
 * @param dbName - 数据库名称，默认为 better_auth_test
 * @returns MikroORM 实例
 */
export async function createTestOrm(dbName = "better_auth_test"): Promise<MikroORM> {
  const config: Options = {
    driver: PostgreSqlDriver,
    dbName,
    host: process.env.TEST_DB_HOST || "localhost",
    port: Number(process.env.TEST_DB_PORT) || 5433,
    user: process.env.TEST_DB_USER || "test",
    password: process.env.TEST_DB_PASSWORD || "test",
    entities: [TestUser, TestSession, TestAccount, TestOrganization],
    debug: process.env.TEST_DEBUG === "true",
  };

  const orm = await MikroORM.init(config);
  return orm;
}

/**
 * 创建数据库 Schema
 *
 * @param orm - MikroORM 实例
 */
export async function createSchema(orm: MikroORM): Promise<void> {
  const generator = orm.schema;
  await generator.createSchema();
}

/**
 * 清理测试数据库
 *
 * @param orm - MikroORM 实例
 */
export async function cleanDatabase(orm: MikroORM): Promise<void> {
  const em = orm.em.fork();

  // 清理所有测试表
  await em.nativeDelete(TestSession, {});
  await em.nativeDelete(TestAccount, {});
  await em.nativeDelete(TestOrganization, {});
  await em.nativeDelete(TestUser, {});

  await em.flush();
}

/**
 * 删除数据库 Schema
 *
 * @param orm - MikroORM 实例
 */
export async function dropSchema(orm: MikroORM): Promise<void> {
  const generator = orm.schema;
  await generator.dropSchema();
}

/**
 * 填充测试数据
 *
 * @param orm - MikroORM 实例
 * @returns 测试数据对象
 */
export async function seedTestData(orm: MikroORM): Promise<{
  user: TestUser;
  session: TestSession;
  account: TestAccount;
  organization: TestOrganization;
}> {
  const em = orm.em.fork();

  // 创建用户
  const user = new TestUser("test@example.com");
  user.name = "Test User";
  em.persist(user);

  // 创建会话
  const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 天后过期
  const session = new TestSession(user.id, "test-token-123", expiresAt);
  session.ipAddress = "127.0.0.1";
  session.userAgent = "Test Agent";
  em.persist(session);

  // 创建账户
  const account = new TestAccount(user.id, "google-123", "google");
  account.accessToken = "access-token-abc";
  em.persist(account);

  // 创建组织
  const organization = new TestOrganization("Test Organization");
  organization.slug = "test-org";
  organization.ownerId = user.id;
  em.persist(organization);

  await em.flush();

  return { user, session, account, organization };
}
