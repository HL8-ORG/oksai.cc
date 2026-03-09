/**
 * @oksai/database - 数据库基础设施
 *
 * 职责：
 * - MikroORM 连接配置
 * - NestJS 数据库模块
 * - TenantFilter（数据库层过滤器）
 * - 数据库迁移
 *
 * 注意：
 * - 业务实体已迁移到各自的限界上下文
 * - IAM: @oksai/iam-identity
 * - OAuth: @oksai/iam-identity (临时，未来独立为 @oksai/oauth-infrastructure)
 * - Webhook: @oksai/iam-identity (临时，未来独立为 @oksai/webhook-infrastructure)
 */

// 过滤器
export * from "./filters/tenant.filter.js";
// 数据库配置和模块
export { default as mikroOrmConfig } from "./mikro-orm.config.js";
export { MikroOrmDatabaseModule } from "./mikro-orm.module.js";
