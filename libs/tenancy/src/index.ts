/**
 * @oksai/tenancy
 *
 * 多租户管理限界上下文
 *
 * 架构：
 * - 领域层：领域模型、领域事件、仓储接口
 * - 应用层：命令、查询、DTO、应用服务
 * - 基础设施层：持久化、适配器、投影器、消费者
 * - 表现层：NestJS 模块、控制器、守卫
 */

// 应用层
export * from "./application/index.js";
// 领域层
export * from "./domain/index.js";
// 基础设施层
export * from "./infrastructure/index.js";
// 表现层
export * from "./presentation/index.js";
