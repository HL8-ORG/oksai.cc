/**
 * Better Auth 使用示例
 *
 * 演示如何在 NestJS Gateway 中使用 Better Auth 配置
 */

import process from "node:process";
import { createBetterAuth } from "@oksai/auth-config";
import { db } from "@oksai/database";

// 创建 Better Auth 实例
export const auth = createBetterAuth({
  // 数据库实例
  db,

  // 应用基础 URL
  baseURL: process.env.NEXT_PUBLIC_URL || "http://localhost:3000",

  // 认证密钥（从环境变量读取）
  secret: process.env.BETTER_AUTH_SECRET || "your-secret-key-change-in-production",

  // 邮箱验证
  requireEmailVerification: true,

  // 企业级功能（Phase 2 启用）
  enable2FA: false, // Phase 2
  enableOrganization: false, // Phase 2
  enableAdmin: false, // Phase 2

  // Session 过期时间（7 天）
  sessionExpiresIn: 60 * 60 * 24 * 7,

  // 邮箱验证回调
  sendVerificationEmail: async ({ user, url }) => {
    console.log(`[Auth] 发送验证邮件到 ${user.email}: ${url}`);
    // TODO: 集成邮件服务（Phase 1 任务 3）
    // await emailService.send({
    //   to: user.email,
    //   subject: "验证您的邮箱",
    //   html: `<a href="${url}">点击验证邮箱</a>`,
    // });
  },

  // 密码重置回调
  sendResetPasswordEmail: async ({ user, url }) => {
    console.log(`[Auth] 发送密码重置邮件到 ${user.email}: ${url}`);
    // TODO: 集成邮件服务（Phase 1 任务 3）
    // await emailService.send({
    //   to: user.email,
    //   subject: "重置密码",
    //   html: `<a href="${url}">点击重置密码</a>`,
    // });
  },
});

// 导出 Auth 类型供其他模块使用
export type { Auth } from "@oksai/auth-config";
