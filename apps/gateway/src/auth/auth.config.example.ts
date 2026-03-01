/**
 * 认证配置示例
 *
 * @description
 * 展示如何配置 Better Auth 支持多种登录方式和插件
 */

import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

/**
 * 基础配置示例
 */
export function createBasicAuth(
  databaseUrl: string,
  secret: string,
  baseUrl: string,
  corsOrigin: string,
) {
  const client = postgres(databaseUrl);
  const db = drizzle(client);

  return betterAuth({
    secret,
    baseURL: baseUrl,
    trustedOrigins: [corsOrigin],
    database: drizzleAdapter(db, { provider: 'pg' }),

    emailAndPassword: {
      enabled: true,
      requireEmailVerification: false,
    },

    session: {
      expiresIn: 60 * 60 * 24 * 7,
      updateAge: 60 * 60 * 24,
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },
  });
}

/**
 * 完整配置示例（带 OAuth 和插件）
 *
 * 注意：需要安装相应的 Better Auth 插件
 */
export function createAdvancedAuth(
  databaseUrl: string,
  secret: string,
  baseUrl: string,
  corsOrigins: string[],
) {
  const client = postgres(databaseUrl);
  const db = drizzle(client);

  return betterAuth({
    secret,
    baseURL: baseUrl,
    trustedOrigins: corsOrigins,
    database: drizzleAdapter(db, { provider: 'pg' }),

    // 邮箱/密码登录
    emailAndPassword: {
      enabled: true,
      requireEmailVerification: true, // 生产环境建议启用
    },

    // OAuth 提供商
    socialProviders: {
      github: {
        clientId: process.env.GITHUB_CLIENT_ID!,
        clientSecret: process.env.GITHUB_CLIENT_SECRET!,
      },
      google: {
        clientId: process.env.GOOGLE_CLIENT_ID!,
        clientSecret: process.env.GOOGLE_CLIENT_SECRET!,
      },
    },

    // 会话配置
    session: {
      expiresIn: 60 * 60 * 24 * 7, // 7 天
      updateAge: 60 * 60 * 24, // 每天更新
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5,
      },
    },

    // 插件配置示例（需要安装相应插件）
    // plugins: {
    //   // 组织插件
    //   organization: {
    //     enabled: true,
    //   },
    //   // 管理员插件
    //   admin: {
    //     enabled: true,
    //   },
    // },

    // 高级配置
    // advanced: {
    //   // Add advanced options here if needed
    // },
  });
}

/**
 * 使用示例
 */
// import { auth } from './auth.config.example';
//
// @Module({
//   imports: [AuthModule.forRoot({ auth })],
// })
// export class AppModule {}
