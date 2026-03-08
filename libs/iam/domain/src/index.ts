/**
 * @oksai/iam/domain - IAM 领域模型层
 *
 * 导出所有领域模型、值对象、领域事件和仓储接口
 *
 * @packageDocumentation
 */

export { TenantActivatedEvent } from "./events/tenant-activated.event.js";
// 领域事件
export { TenantCreatedEvent } from "./events/tenant-created.event.js";
export { TenantQuotaUpdatedEvent } from "./events/tenant-quota-updated.event.js";
export { TenantSuspendedEvent } from "./events/tenant-suspended.event.js";
// Tenant 聚合
export { Tenant } from "./tenant/tenant.aggregate.js";
export type { ITenantRepository } from "./tenant/tenant.repository.js";
export type { TenantPlanValue } from "./tenant/tenant-plan.vo.js";
// Tenant 值对象
export { TenantPlan } from "./tenant/tenant-plan.vo.js";
export { TenantQuota } from "./tenant/tenant-quota.vo.js";
export type { TenantStatusValue } from "./tenant/tenant-status.vo.js";
export { TenantStatus } from "./tenant/tenant-status.vo.js";
