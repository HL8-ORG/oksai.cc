/**
 * Better Auth MikroORM 适配器 - 基础使用示例
 *
 * 本示例展示如何使用 mikroOrmAdapter 进行基础的 CRUD 操作
 */

import process from "node:process";
import { MikroORM } from "@mikro-orm/core";
import { PostgreSqlDriver } from "@mikro-orm/postgresql";
import { mikroOrmAdapter } from "@oksai/better-auth-mikro-orm";
import { betterAuth } from "better-auth";
import { Account, Session, User } from "./entities";

// ============================================
// 1. 初始化 MikroORM
// ============================================

const orm = await MikroORM.init({
  driver: PostgreSqlDriver,
  dbName: "better_auth_example",
  host: "localhost",
  port: 5432,
  user: "postgres",
  password: "password",
  entities: [User, Session, Account],
  debug: process.env.NODE_ENV === "development",
});

// ============================================
// 2. 配置 Better Auth
// ============================================

export const auth = betterAuth({
  database: mikroOrmAdapter(orm, {
    debugLogs: process.env.NODE_ENV === "development",
    supportsJSON: true,
  }),

  // 禁用 Better Auth 的 ID 生成（使用 MikroORM 的 UUID）
  advanced: {
    database: {
      generateId: false,
    },
  },

  // 启用邮箱密码登录
  emailAndPassword: {
    enabled: true,
  },
});

// ============================================
// 3. 用户注册示例
// ============================================

async function signUpExample() {
  try {
    const result = await auth.api.signUpEmail({
      body: {
        email: "user@example.com",
        password: "secure-password-123",
        name: "John Doe",
      },
    });

    console.log("用户注册成功:", result);
    return result;
  } catch (error) {
    console.error("用户注册失败:", error);
    throw error;
  }
}

// ============================================
// 4. 用户登录示例
// ============================================

async function signInExample() {
  try {
    const result = await auth.api.signInEmail({
      body: {
        email: "user@example.com",
        password: "secure-password-123",
      },
    });

    console.log("用户登录成功:", result);
    return result;
  } catch (error) {
    console.error("用户登录失败:", error);
    throw error;
  }
}

// ============================================
// 5. 会话验证示例
// ============================================

async function getSessionExample(headers: Headers) {
  try {
    const session = await auth.api.getSession({
      headers,
    });

    if (session) {
      console.log("有效会话:", session);
      return session;
    } else {
      console.log("无效会话或已过期");
      return null;
    }
  } catch (error) {
    console.error("会话验证失败:", error);
    return null;
  }
}

// ============================================
// 6. 用户登出示例
// ============================================

async function signOutExample(headers: Headers) {
  try {
    await auth.api.signOut({
      headers,
    });

    console.log("用户已登出");
  } catch (error) {
    console.error("登出失败:", error);
    throw error;
  }
}

// ============================================
// 7. 直接使用 MikroORM 查询（高级用法）
// ============================================

async function advancedQueryExample() {
  const em = orm.em.fork();

  // 查询所有用户
  const users = await em.find(
    User,
    {},
    {
      limit: 10,
      orderBy: { createdAt: "DESC" },
    }
  );

  console.log("最近的 10 个用户:", users);

  // 根据 email 查询用户
  const user = await em.findOne(User, {
    email: "user@example.com",
  });

  if (user) {
    console.log("找到用户:", user);

    // 查询该用户的所有会话
    const sessions = await em.find(Session, {
      userId: user.id,
    });

    console.log("用户会话:", sessions);

    // 查询该用户的所有账户（第三方登录）
    const accounts = await em.find(Account, {
      userId: user.id,
    });

    console.log("用户账户:", accounts);
  }

  return { users, user };
}

// ============================================
// 8. 批量操作示例（性能优化）
// ============================================

async function batchOperationExample() {
  const em = orm.em.fork();

  // 批量创建用户（使用 nativeInsert 提升性能）
  const users = [
    { email: "user1@example.com", name: "User 1" },
    { email: "user2@example.com", name: "User 2" },
    { email: "user3@example.com", name: "User 3" },
  ];

  await em.nativeInsert(User, users);
  console.log("批量创建用户成功");

  // 批量删除过期会话
  const deletedCount = await em.nativeDelete(Session, {
    expiresAt: { $lt: new Date() },
  });

  console.log(`删除了 ${deletedCount} 个过期会话`);

  return { insertedCount: users.length, deletedCount };
}

// ============================================
// 9. 更新用户信息示例
// ============================================

async function updateUserExample(headers: Headers) {
  try {
    const session = await auth.api.getSession({ headers });

    if (!session) {
      throw new Error("未授权");
    }

    // 使用 MikroORM 更新用户
    const em = orm.em.fork();
    const user = await em.findOne(User, { id: session.user.id });

    if (user) {
      user.name = "Updated Name";
      user.image = "https://example.com/avatar.png";
      await em.flush();

      console.log("用户信息已更新:", user);
      return user;
    }

    return null;
  } catch (error) {
    console.error("更新用户信息失败:", error);
    throw error;
  }
}

// ============================================
// 10. 完整的 Express 服务器示例
// ============================================

/**
 * Express 服务器示例（伪代码）
 *
 * ```typescript
 * import express from "express";
 * import { auth } from "./auth";
 * import { toNodeHandler } from "better-auth/node";
 *
 * const app = express();
 *
 * // Better Auth 路由
 * app.all("/api/auth/*", toNodeHandler(auth));
 *
 * // 受保护的路由
 * app.get("/api/profile", async (req, res) => {
 *   const session = await auth.api.getSession({
 *     headers: req.headers,
 *   });
 *
 *   if (!session) {
 *     return res.status(401).json({ error: "未授权" });
 *   }
 *
 *   res.json({ user: session.user });
 * });
 *
 * app.listen(3000, () => {
 *   console.log("服务器运行在 http://localhost:3000");
 * });
 * ```
 */

// ============================================
// 运行示例
// ============================================

async function main() {
  try {
    // 创建数据库 Schema
    const generator = orm.schema;
    await generator.updateSchema();

    console.log("=== Better Auth MikroORM 适配器示例 ===\n");

    // 1. 用户注册
    console.log("1. 用户注册示例:");
    const signUpResult = await signUpExample();
    console.log("");

    // 2. 用户登录
    console.log("2. 用户登录示例:");
    const signInResult = await signInExample();
    console.log("");

    // 3. 会话验证
    console.log("3. 会话验证示例:");
    // 模拟 headers（实际应用中从请求获取）
    const headers = new Headers({
      authorization: `Bearer ${signInResult.token}`,
    });
    await getSessionExample(headers);
    console.log("");

    // 4. 高级查询
    console.log("4. 高级查询示例:");
    await advancedQueryExample();
    console.log("");

    // 5. 批量操作
    console.log("5. 批量操作示例:");
    await batchOperationExample();
    console.log("");

    // 6. 更新用户信息
    console.log("6. 更新用户信息示例:");
    await updateUserExample(headers);
    console.log("");

    // 7. 用户登出
    console.log("7. 用户登出示例:");
    await signOutExample(headers);
    console.log("");

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
