/**
 * 适配器导出
 */

export * from "./primary/index.js";
export * from "./secondary/index.js";
// 旧适配器（向后兼容）
export { TenantContextService } from "./tenant-context.service.js";
export { TenantGuard } from "./tenant-guard.js";
