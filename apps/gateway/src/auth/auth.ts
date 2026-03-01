import { createAuth } from './auth.config';

/**
 * Better Auth 实例
 *
 * @description
 * 导出配置好的 Better Auth 实例，供 AuthModule 使用。
 * 从环境变量读取配置：
 * - DATABASE_URL: 数据库连接字符串
 * - BETTER_AUTH_SECRET: 认证密钥（至少32字符）
 * - BETTER_AUTH_URL: 应用基础 URL
 * - CORS_ORIGIN: 允许的 CORS 来源
 */
export const auth = createAuth(
	process.env.DATABASE_URL || 'postgresql://oksai:oksai_dev_password@localhost:5432/oksai',
	process.env.BETTER_AUTH_SECRET || 'oksai_better_auth_secret_key_for_development_minimum_32_chars',
	process.env.BETTER_AUTH_URL || 'http://localhost:3000',
	process.env.CORS_ORIGIN || 'http://localhost:5173'
);
