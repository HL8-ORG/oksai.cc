import { createAuth } from './auth.config';

/**
 * Better Auth 实例
 *
 * @description
 * 导出配置好的 Better Auth 实例，供 AuthModule 使用。
 *
 * 环境变量（自动读取）：
 * - BETTER_AUTH_SECRET: 认证密钥（至少32字符）
 * - BETTER_AUTH_URL: 应用基础 URL
 * - DATABASE_URL: 数据库连接字符串
 * - GITHUB_CLIENT_ID/SECRET: GitHub OAuth（可选）
 * - GOOGLE_CLIENT_ID/SECRET: Google OAuth（可选）
 * - CORS_ORIGIN: 允许的 CORS 来源
 *
 * Better Auth 会自动读取 BETTER_AUTH_SECRET 和 BETTER_AUTH_URL 环境变量，
 * 无需在配置中显式设置。
 *
 * @see https://better-auth.com/docs/reference/options
 */
export const auth = createAuth(
  process.env.DATABASE_URL ||
    'postgresql://oksai:oksai_dev_password@localhost:5432/oksai',
);
