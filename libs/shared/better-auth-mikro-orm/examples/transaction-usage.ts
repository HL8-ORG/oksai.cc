/**
 * Better Auth MikroORM 适配器 - 事务使用示例
 *
 * 本示例展示如何使用 mikroOrmAdapter 的事务支持
 */

import process from "node:process";
import { MikroORM } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { mikroOrmAdapter } from "@oksai/better-auth-mikro-orm";
import { betterAuth } from "better-auth";
import { Organization, User } from "./entities";

// ============================================
// 1. 初始化 MikroORM 和 Better Auth
// ============================================

const orm = await MikroORM.init({
  driver: PostgreSqlDriver,
  dbName: "better_auth_example",
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "password",
  entities: [User, Organization],
  debug: true, // 启用调试以查看事务日志
});

export const auth = betterAuth({
  database: mikroOrmAdapter(orm, {
    debugLogs: true,
    supportsJSON: true,
  }),
  advanced: {
    database: {
      generateId: false,
    },
  },
  emailAndPassword: {
    enabled: true,
  },
});

// ============================================
// 2. Better Auth 自动事务
// ============================================

/**
 * Better Auth 在内部自动使用事务
 *
 * 例如：用户注册时会同时创建用户和会话
 * 如果会话创建失败，用户创建也会被回滚
 */
async function betterAuthAutoTransaction() {
  console.log("=== Better Auth 自动事务示例 ===\n");

  try {
    // Better Auth 会自动在事务中执行这些操作
    const result = await auth.api.signUpEmail({
      body: {
        email: "user@example.com",
        password: "secure-password-123",
        name: "John Doe",
      },
    });

    console.log("✅ 用户注册成功（事务已提交）:");
    console.log("  - 用户:", result.user.email);
    console.log("  - 会话:", result.session?.id);
    console.log("");

    return result;
  } catch (error) {
    console.error("❌ 用户注册失败（事务已回滚）:", error);
    throw error;
  }
}

// ============================================
// 3. 手动事务（高级用法）
// ============================================

/**
 * 如果需要在事务中执行自定义逻辑，可以直接使用 MikroORM 的 transactional
 */
async function manualTransaction() {
  console.log("=== 手动事务示例 ===\n");

  const em = orm.em.fork();

  try {
    // 手动事务：创建用户和组织
    const result = await em.transactional(async (em) => {
      // 1. 创建用户
      const user = em.create(User, {
        email: "org-admin@example.com",
        name: "Org Admin",
        emailVerified: false,
      });

      // 2. 创建组织
      const organization = em.create(Organization, {
        name: "Example Organization",
        slug: "example-org",
        ownerId: user.id,
      });

      // 3. 刷新到数据库
      await em.flush();

      return { user, organization };
    });

    console.log("✅ 事务提交成功:");
    console.log("  - 用户:", result.user.email);
    console.log("  - 组织:", result.organization.name);
    console.log("");

    return result;
  } catch (error) {
    console.error("❌ 事务回滚:", error);
    throw error;
  }
}

// ============================================
// 4. 事务回滚示例
// ============================================

/**
 * 演示事务失败时的自动回滚
 */
async function transactionRollback() {
  console.log("=== 事务回滚示例 ===\n");

  const em = orm.em.fork();

  try {
    await em.transactional(async (em) => {
      // 1. 创建用户
      const user = em.create(User, {
        email: "rollback-test@example.com",
        name: "Rollback Test",
        emailVerified: false,
      });

      await em.flush();

      console.log("✓ 用户已创建:", user.email);

      // 2. 模拟失败
      throw new Error("模拟的事务失败");
    });

    // 不应该到达这里
    console.log("❌ 错误：事务应该已回滚");
  } catch (error) {
    console.log("✅ 预期的错误:", (error as Error).message);

    // 验证数据已回滚
    const user = await em.findOne(User, {
      email: "rollback-test@example.com",
    });

    if (user) {
      console.log("❌ 错误：用户应该不存在（事务未回滚）");
    } else {
      console.log("✅ 验证成功：用户不存在（事务已回滚）");
    }
    console.log("");
  }
}

// ============================================
// 5. 嵌套事务（Savepoint）
// ============================================

/**
 * 演示嵌套事务（使用 savepoint）
 */
async function nestedTransaction() {
  console.log("=== 嵌套事务示例 ===\n");

  const em = orm.em.fork();

  try {
    await em.transactional(async (em) => {
      // 外层事务：创建用户
      const user = em.create(User, {
        email: "nested-transaction@example.com",
        name: "Nested Transaction",
        emailVerified: false,
      });

      await em.flush();
      console.log("✓ 外层事务：用户已创建");

      try {
        // 内层事务：创建组织
        await em.transactional(async (em) => {
          const organization = em.create(Organization, {
            name: "Nested Org",
            slug: "nested-org",
            ownerId: user.id,
          });

          await em.flush();
          console.log("✓ 内层事务：组织已创建");

          // 内层事务失败
          throw new Error("内层事务失败");
        });
      } catch (error) {
        console.log("✓ 内层事务已回滚:", (error as Error).message);
        // 内层事务回滚，但外层事务继续
      }

      // 外层事务继续执行
      console.log("✓ 外层事务继续执行");
    });

    console.log("✅ 外层事务提交成功");
    console.log("");
  } catch (error) {
    console.error("❌ 错误:", error);
  }
}

// ============================================
// 6. 并发事务（乐观锁）
// ============================================

/**
 * 演示并发事务的冲突处理
 */
async function concurrentTransaction() {
  console.log("=== 并发事务示例 ===\n");

  const em1 = orm.em.fork();
  const em2 = orm.em.fork();

  try {
    // 创建初始用户
    const user = em1.create(User, {
      email: "concurrent@example.com",
      name: "Initial Name",
      emailVerified: false,
    });
    await em1.flush();
    console.log("✓ 初始用户已创建:", user.name);

    // 并发场景：两个事务同时修改同一用户
    const [tx1, tx2] = await Promise.allSettled([
      // 事务 1：修改用户名
      em1.transactional(async (em) => {
        const u = await em.findOneOrFail(User, { id: user.id });
        await new Promise((resolve) => setTimeout(resolve, 100)); // 模拟延迟
        u.name = "Updated by Transaction 1";
        await em.flush();
        return u;
      }),

      // 事务 2：也修改用户名
      em2.transactional(async (em) => {
        await new Promise((resolve) => setTimeout(resolve, 50)); // 更短的延迟
        const u = await em.findOneOrFail(User, { id: user.id });
        u.name = "Updated by Transaction 2";
        await em.flush();
        return u;
      }),
    ]);

    console.log("事务 1 结果:", tx1.status);
    console.log("事务 2 结果:", tx2.status);

    // 查询最终结果
    const em3 = orm.em.fork();
    const finalUser = await em3.findOne(User, { id: user.id });
    console.log("✓ 最终用户名:", finalUser?.name);
    console.log("");
  } catch (error) {
    console.error("❌ 并发事务错误:", error);
  }
}

// ============================================
// 7. 事务超时
// ============================================

/**
 * 演示事务超时处理
 */
async function transactionTimeout() {
  console.log("=== 事务超时示例 ===\n");

  const em = orm.em.fork();

  try {
    // 注意：Better Auth 的 TransactionManager 支持超时配置
    // 这里展示 MikroORM 原生的事务超时
    await em.transactional(
      async (em) => {
        console.log("✓ 事务开始");

        // 模拟长时间操作
        await new Promise((resolve) => setTimeout(resolve, 5000));

        console.log("✓ 事务完成（不应该到达这里）");
      },
      { timeout: 1000 }
    ); // 1 秒超时

    console.log("❌ 错误：事务应该已超时");
  } catch (error) {
    console.log("✅ 预期的超时错误:", (error as Error).message);
    console.log("");
  }
}

// ============================================
// 8. 最佳实践
// ============================================

/**
 * 事务使用最佳实践
 */
function bestPractices() {
  console.log("=== 事务最佳实践 ===\n");

  console.log("✅ DO:");
  console.log("  1. 信任 Better Auth 的事务管理");
  console.log("  2. 使用 Better Auth 的高层 API（auth.api.*）");
  console.log("  3. 在需要自定义逻辑时使用 em.transactional()");
  console.log("  4. 为长时间运行的事务设置超时");
  console.log("  5. 使用 em.fork() 隔离并发请求");
  console.log("");

  console.log("❌ DON'T:");
  console.log("  1. 不要手动管理 EntityManager 事务");
  console.log("  2. 不要在事务内执行耗时操作（如 HTTP 请求）");
  console.log("  3. 不要忽略事务错误");
  console.log("  4. 不要在事务内使用全局 EntityManager");
  console.log("  5. 不要创建过深的嵌套事务");
  console.log("");
}

// ============================================
// 运行示例
// ============================================

async function main() {
  try {
    // 创建数据库 Schema
    const generator = orm.schema;
    await generator.updateSchema();

    console.log("╔═══════════════════════════════════════════╗");
    console.log("║  Better Auth MikroORM 适配器 - 事务示例  ║");
    console.log("╚═══════════════════════════════════════════╝\n");

    // 运行所有示例
    await betterAuthAutoTransaction();
    await manualTransaction();
    await transactionRollback();
    await nestedTransaction();
    await concurrentTransaction();
    await transactionTimeout();
    bestPractices();

    console.log("=== 所有示例运行完成 ===");
  } catch (error) {
    console.error("示例运行失败:", error);
  } finally {
    await orm.close();
  }
}

// 运行示例
if (import.meta.url === `file://${process.argv[1]}`) {
  main();
}

// ============================================
// 导出示例函数
// ============================================

export {
  betterAuthAutoTransaction,
  manualTransaction,
  transactionRollback,
  nestedTransaction,
  concurrentTransaction,
  transactionTimeout,
  bestPractices,
};
