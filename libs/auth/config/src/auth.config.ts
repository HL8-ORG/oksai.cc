/**
 * Better Auth 核心配置
 *
 * 集成 Better Auth 认证框架，支持：
 * - 邮箱密码认证
 * - Magic Link 登录
 * - OAuth 登录（Google）
 * - 双因素认证（2FA/TOTP）
 * - 组织/团队管理
 * - 管理员角色
 */

import process from "node:process";
import type * as schema from "@oksai/database/schema";
import { betterAuth } from "better-auth/react";
import { drizzleAdapter } from "better-auth/adapters/drizzle";
import { admin, organization, twoFactor } from "better-auth/plugins";
import type { PostgresJsDatabase } from "drizzle-orm/postgres-js";

/**
 * 数据库类型
 */
export type Database = PostgresJsDatabase<typeof schema>;

/**
 * Better Auth 配置选项
 */
export interface BetterAuthConfig {
  /** 数据库实例 */
  db: Database;
  /** 应用基础 URL */
  baseURL: string;
  /** 认证密钥 */
  secret: string;
  /** 是否启用邮箱验证 */
  requireEmailVerification?: boolean;
  /** 是否启用 2FA */
  enable2FA?: boolean;
  /** 是否启用组织/团队管理 */
  enableOrganization?: boolean;
  /** 是否启用管理员功能 */
  enableAdmin?: boolean;
  /** Session 过期时间（秒），默认 7 天 */
  sessionExpiresIn?: number;
  /** 邮箱验证回调 */
  sendVerificationEmail?: (params: {
    user: { id: string; email: string; name?: string | null };
    token: string;
    url: string;
  }) => Promise<void>;
  /** 密码重置回调 */
  sendResetPasswordEmail?: (params: {
    user: { id: string; email: string; name?: string | null };
    token: string;
    url: string;
  }) => Promise<void>;
}

/**
 * 创建 Better Auth 实例
 */
export function createBetterAuth(config: BetterAuthConfig) {
  const {
    db,
    baseURL,
    secret,
    requireEmailVerification = true,
    enable2FA = false,
    enableOrganization = false,
    enableAdmin = false,
    sessionExpiresIn = 60 * 60 * 24 * 7, // 7 天
    sendVerificationEmail,
    sendResetPasswordEmail,
  } = config;

  // 插件列表
  const plugins = [];

  // 2FA 插件
  if (enable2FA) {
    plugins.push(
      twoFactor({
        issuer: "oksai.cc",
        totpOptions: {
          digits: 6,
          period: 30,
        },
        backupCodesCount: 10,
      })
    );
  }

  // 组织/团队插件
  if (enableOrganization) {
    plugins.push(
      organization({
        allowUserToCreateOrganization: true,
        membershipLimit: 100,
      })
    );
  }

  // 管理员插件
  if (enableAdmin) {
    plugins.push(
      admin({
        adminRole: "admin",
        defaultRole: "user",
      })
    );
  }

  return betterAuth({
    // 数据库适配器
    database: drizzleAdapter(db, {
      provider: "pg",
    }),

    // 基础 URL
    baseURL,

    // 邮箱密码认证
    emailAndPassword: {
      enabled: true,
      requireEmailVerification,
      minPasswordLength: 8,
      maxPasswordLength: 128,
    },

    // Session 配置
    session: {
      expiresIn: sessionExpiresIn,
      updateAge: 60 * 60 * 24, // 每天更新一次
      cookieCache: {
        enabled: true,
        maxAge: 60 * 5, // 5 分钟
      },
    },

    // 邮箱验证
    emailVerification: {
      sendOnSignUp: requireEmailVerification,
      autoSignInAfterVerification: true,
      expiresIn: 60 * 60, // 1 小时
      sendVerificationEmail: sendVerificationEmail
        ? async (params: { user: { id: string; email: string; name?: string | null }; token: string }) => {
            const url = `${baseURL}/verify-email?token=${params.token}`;
            await sendVerificationEmail({ user: params.user, token: params.token, url });
          }
        : undefined,
    },

    // 密码重置
    resetPassword: {
      expiresIn: 60 * 60, // 1 小时
      sendResetPasswordEmail: sendResetPasswordEmail
        ? async (params: { user: { id: string; email: string; name?: string | null }; token: string }) => {
            const url = `${baseURL}/reset-password?token=${params.token}`;
            await sendResetPasswordEmail({ user: params.user, token: params.token, url });
          }
        : undefined,
    },

    // 插件
    plugins,

    // 高级选项
    advanced: {
      cookiePrefix: "oksai",
      useSecureCookies: process.env.NODE_ENV === "production",
      generateId: () => crypto.randomUUID(),
    },

    // 日志
    logger: {
      disabled: process.env.NODE_ENV === "test",
      level: process.env.NODE_ENV === "development" ? "debug" : "info",
    },

    // 密钥
    secret,
  });
}

/**
 * Better Auth 实例类型
 */
export type Auth = ReturnType<typeof createBetterAuth>;
