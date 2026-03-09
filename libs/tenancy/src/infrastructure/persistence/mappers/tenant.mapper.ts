import { UniqueEntityID } from "@oksai/domain-core";
import { Tenant, type TenantProps } from "../../../domain/model/tenant.aggregate.js";
import { TenantPlan } from "../../../domain/model/tenant-plan.vo.js";
import { TenantQuota, type TenantQuotaProps } from "../../../domain/model/tenant-quota.vo.js";
import { TenantStatus } from "../../../domain/model/tenant-status.vo.js";

export interface TenantPersistenceModel {
  id: string;
  name: string;
  slug: string;
  plan: string;
  status: string;
  ownerId: string;
  quota: TenantQuotaProps;
  settings: Record<string, unknown>;
  metadata: Record<string, unknown>;
  createdAt: Date;
  updatedAt: Date;
}

export class TenantMapper {
  public static toPersistence(tenant: Tenant): TenantPersistenceModel {
    return {
      id: tenant.id.toString(),
      name: tenant.name,
      slug: tenant.slug,
      plan: tenant.plan.value,
      status: tenant.status.value,
      ownerId: tenant.ownerId.toString(),
      quota: {
        maxOrganizations: tenant.quota.maxOrganizations,
        maxMembers: tenant.quota.maxMembers,
        maxStorage: tenant.quota.maxStorage,
      },
      settings: tenant.settings,
      metadata: tenant.metadata,
      createdAt: new Date(),
      updatedAt: new Date(),
    };
  }

  public static toDomain(persistence: TenantPersistenceModel): Tenant {
    const planResult = TenantPlan.create(persistence.plan as "FREE" | "STARTER" | "PRO" | "ENTERPRISE");
    if (planResult.isFail()) {
      throw new Error(`Invalid plan: ${persistence.plan}`);
    }
    const plan = planResult.value as TenantPlan;

    const statusFactory: Record<string, () => TenantStatus> = {
      PENDING: TenantStatus.pending,
      ACTIVE: TenantStatus.active,
      SUSPENDED: TenantStatus.suspended,
      DELETED: TenantStatus.deleted,
    };

    const createStatus = statusFactory[persistence.status];
    if (!createStatus) {
      throw new Error(`Invalid status: ${persistence.status}`);
    }

    const props: TenantProps = {
      name: persistence.name,
      slug: persistence.slug,
      plan,
      status: createStatus(),
      ownerId: new UniqueEntityID(persistence.ownerId),
      quota: new TenantQuota(persistence.quota),
      settings: persistence.settings,
      metadata: persistence.metadata,
    };

    return Tenant.reconstitute(props, new UniqueEntityID(persistence.id));
  }
}
