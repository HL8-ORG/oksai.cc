import { apiKey } from "@better-auth/api-key";
import type { ConfigService } from "@oksai/config";
import { betterAuth } from "better-auth";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization, twoFactor } from "better-auth/plugins";
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
 * - 双因素认证 (2FA/TOTP)
 * - 会话管理（支持 Redis 缓存）
 * - 安全策略（CORS、CSRF、Rate Limiting）
 *
 * 环境变量（通过 ConfigService 读取）：
 * - DATABASE_URL: 数据库连接字符串（必需）
 * - BETTER_AUTH_SECRET: 认证密钥（可选，Better Auth 自动读取）
 * - BETTER_AUTH_URL: 应用基础 URL（可选，Better Auth 自动读取）
 * - GITHUB_CLIENT_ID/SECRET: GitHub OAuth（可选）
 * - GOOGLE_CLIENT_ID/SECRET: Google OAuth（可选）
 * - NODE_ENV: 环境（production/development）
 *
 * @see https://better-auth.com/docs/integrations/nestjs
 * @see https://better-auth.com/docs/reference/options
 * @see https://better-auth.com/docs/plugins/2fa
 */
// biome-ignore lint/suspicious/noExplicitAny: Better Auth 返回类型过于复杂，无法显式声明
export function createAuth(configService: ConfigService): any {
  const databaseUrl = configService.getRequired("DATABASE_URL");
  const nodeEnv = configService.get("NODE_ENV") || "development";

  const githubClientId = configService.get("GITHUB_CLIENT_ID");
  const githubClientSecret = configService.get("GITHUB_CLIENT_SECRET");
  const googleClientId = configService.get("GOOGLE_CLIENT_ID");
  const googleClientSecret = configService.get("GOOGLE_CLIENT_SECRET");

  const client = postgres(databaseUrl);
  const db = drizzle(client);

  return betterAuth({
    // Better Auth 基础路径
    // 注意：NestJS 全局前缀 /api 会自动添加到中间件路径
    // 所以这里设置为 /auth，最终路径为 /api/auth/*
    basePath: "/auth",

    database: drizzleAdapter(db, {
      provider: "pg",
    }),

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },

    // 邮箱验证配置
    emailVerification: {
      // 开发环境：将验证链接打印到控制台
      sendVerificationEmail: async ({ user, url }: { user: { email: string }; url: string }) => {
        if (nodeEnv === "development") {
          console.log("\n");
          console.log("=".repeat(60));
          console.log("📧 邮箱验证链接（开发环境）");
          console.log("=".repeat(60));
          console.log(`用户: ${user.email}`);
          console.log(`验证链接: ${url}`);
          console.log("=".repeat(60));
          console.log("\n");
        }
      },
      // 密码重置邮件
      sendResetPassword: async ({ user, url }: { user: { email: string }; url: string }) => {
        if (nodeEnv === "development") {
          console.log("\n");
          console.log("=".repeat(60));
          console.log("🔐 密码重置链接（开发环境）");
          console.log("=".repeat(60));
          console.log(`用户: ${user.email}`);
          console.log(`重置链接: ${url}`);
          console.log("=".repeat(60));
          console.log("\n");
        }
      },
    },

    socialProviders: {
      ...(githubClientId && githubClientSecret
        ? {
            github: {
              clientId: githubClientId,
              clientSecret: githubClientSecret,
            },
          }
        : {}),
      ...(googleClientId && googleClientSecret
        ? {
            google: {
              clientId: googleClientId,
              clientSecret: googleClientSecret,
            },
          }
        : {}),
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },

    plugins: [
      apiKey() as any,

      admin({
        defaultRole: "user",
        adminRole: "admin",
        allowImpersonatingAdmins: false,
        bannedUserMessage: "您的账号已被封禁，如有疑问请联系客服",
        defaultBanReason: "违反服务条款",
      }) as any,

      organization({
        allowUserToCreateOrganization: true,
        maximumMembers: 100,
      }),

      twoFactor({
        issuer: "oksai.cc",
        totpOptions: {
          digits: 6,
          period: 30,
        },
        backupCodesCount: 10,
      }),
    ],

    advanced: {
      generateId: false,
      useSecureCookies: nodeEnv === "production",
      ipAddress: {
        ipAddressHeaders: ["x-forwarded-for", "x-real-ip"],
      },
    },

    // Rate Limiting 配置
    // 注意：使用内存存储（默认），避免需要额外的数据库表
    // 生产环境建议使用 Redis 存储以支持分布式部署
    rateLimit: {
      enabled: true,
      window: 60, // 60秒时间窗口
      max: 100, // 每个 IP 最多 100 次请求
      // storage: "database", // 使用数据库存储需要创建 rateLimit 表
    },

    // CORS 配置：允许的前端来源
    trustedOrigins: [
      "http://localhost:3000",
      "http://localhost:3001",
      "http://localhost:5173",
    ],
  });
}
