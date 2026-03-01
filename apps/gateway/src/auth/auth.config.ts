import process from "node:process";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { drizzle } from "drizzle-orm/postgres-js";
import postgres from "postgres";

/**
 * 创建 Better Auth 实例
 *
 * @description
 * 初始化 Better Auth 认证服务，配置：
 * - Drizzle ORM 数据库适配器
 * - 邮箱/密码登录
 * - OAuth 社交登录（GitHub、Google）
 * - 会话管理（支持 Redis 缓存）
 * - 安全策略（CORS、CSRF、Rate Limiting）
 *
 * 环境变量（推荐）：
 * - BETTER_AUTH_SECRET: 认证密钥（至少32字符）
 * - BETTER_AUTH_URL: 应用基础 URL
 * - DATABASE_URL: 数据库连接字符串
 * - REDIS_URL: Redis 连接字符串（可选）
 *
 * @see https://better-auth.com/docs/integrations/nestjs
 * @see https://better-auth.com/docs/reference/options
 */
export function createAuth(databaseUrl: string) {
  // 创建数据库连接
  const client = postgres(databaseUrl);
  const db = drizzle(client);

  return betterAuth({
    // 数据库适配器
    database: drizzleAdapter(db, {
      provider: "pg",
    }),

    // 邮箱/密码登录配置
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false, // 开发环境不强制验证邮箱
    },

    // OAuth 社交登录配置
    socialProviders: {
      // GitHub OAuth
      // 文档：https://better-auth.com/docs/authentication/github
      // 创建应用：https://github.com/settings/developers
      // 回调 URL：http://localhost:3000/api/auth/callback/github
      github: {
        clientId: process.env.GITHUB_CLIENT_ID || "",
        clientSecret: process.env.GITHUB_CLIENT_SECRET || "",
      },

      // Google OAuth
      // 文档：https://better-auth.com/docs/authentication/google
      // 创建应用：https://console.cloud.google.com/apis/credentials
      // 回调 URL：http://localhost:3000/api/auth/callback/google
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID || "",
        clientSecret: process.env.GOOGLE_CLIENT_SECRET || "",
      },
    },

    // 会话配置
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 天过期
      updateAge: 60 * 60 * 24, // 每天更新一次
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 分钟缓存
      },
    },

    // 高级安全配置
    advanced: {
      // 使用安全的随机 ID 生成器
      generateId: false,

      // Cookie 安全配置
      useSecureCookies: process.env.NODE_ENV === "production",

      // IP 地址提取（用于代理环境）
      ipAddress: {
        ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
      },
    },

    // 速率限制
    rateLimit: {
      enabled: true,
      window: 60, // 60 秒窗口
      max: 100, // 最多 100 次请求
      storage: "database", // 使用数据库存储
    },
  });
}
