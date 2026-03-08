/**
 * @oksai/database - 数据库连接管理
 *
 * 职责：
 * - MikroORM 连接配置
 * - NestJS 数据库模块
 * - OAuth 实体（保留）
 * - Webhook 实体（保留）
 * - TenantFilter（数据库层过滤器）
 * - 数据库迁移
 *
 * 注意：IAM 相关代码已迁移到：
 * - @oksai/iam-domain (领域模型)
 * - @oksai/iam-infrastructure (实体、仓储)
 */

// 实体（OAuth + Webhook）
export * from "./entities/index.js";
// 过滤器
export * from "./filters/tenant.filter.js";
// 数据库配置和模块
export { default as mikroOrmConfig } from "./mikro-orm.config.js";
export { MikroOrmDatabaseModule } from "./mikro-orm.module.js";
