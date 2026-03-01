import { betterAuth } from 'better-auth';
import { drizzleAdapter } from 'better-auth/adapters/drizzle';
import { drizzle } from 'drizzle-orm/postgres-js';
import postgres from 'postgres';

/**
 * 创建 Better Auth 实例配置
 *
 * @description
 * 初始化 Better Auth 认证服务，配置数据库连接、会话管理和认证选项。
 * 使用 Drizzle ORM 作为数据库适配器，支持 PostgreSQL。
 *
 * @param databaseUrl - 数据库连接字符串
 * @param secret - Better Auth 密钥（至少32字符）
 * @param baseUrl - 应用基础 URL
 * @param corsOrigin - 允许的 CORS 来源
 *
 * @example
 * ```typescript
 * const auth = createAuth(
 *   'postgresql://user:pass@localhost:5432/db',
 *   'your-secret-key-min-32-chars',
 *   'http://localhost:3000',
 *   'http://localhost:5173'
 * );
 * ```
 */
export function createAuth(
	databaseUrl: string,
	secret: string,
	baseUrl: string,
	corsOrigin: string
) {
	const client = postgres(databaseUrl);
	const db = drizzle(client);

	return betterAuth({
		secret,
		baseURL: baseUrl,
		trustedOrigins: [corsOrigin],
		database: drizzleAdapter(db, {
			provider: 'pg',
		}),
		emailAndPassword: {
			enabled: true,
			requireEmailVerification: false,
		},
		session: {
			expiresIn: 60 * 60 * 24 * 7, // 7 天
			updateAge: 60 * 60 * 24, // 1 天
			cookieCache: {
				enabled: true,
				maxAge: 60 * 5, // 5 分钟
			},
		},
	});
}
