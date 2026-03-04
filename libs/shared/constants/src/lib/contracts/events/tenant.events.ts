/**
 * @description 租户事件契约
 *
 * @module @oksai/constants/contracts/events/tenant
 */

export const TENANT_EVENTS = {
  TENANT_CREATED: "tenant.created",
  TENANT_UPDATED: "tenant.updated",
  TENANT_DELETED: "tenant.deleted",
  TENANT_PLAN_CHANGED: "tenant.plan.changed",
  MEMBER_ADDED: "tenant.member.added",
  MEMBER_REMOVED: "tenant.member.removed",
  MEMBER_ROLE_CHANGED: "tenant.member.role.changed",
} as const;

export type TenantEventName = (typeof TENANT_EVENTS)[keyof typeof TENANT_EVENTS];

export interface TenantCreatedPayload {
  eventId: string;
  timestamp: string;
  version: "1.0";
  data: {
    tenantId: string;
    name: string;
    slug: string;
    plan: string;
    ownerId: string;
  };
}

export interface TenantPlanChangedPayload {
  eventId: string;
  timestamp: string;
  version: "1.0";
  data: {
    tenantId: string;
    oldPlan: string;
    newPlan: string;
    changedBy: string;
  };
}
