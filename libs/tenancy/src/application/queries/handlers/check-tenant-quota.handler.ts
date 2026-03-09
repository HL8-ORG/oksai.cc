import type { IQueryHandler } from "@oksai/cqrs";
import { Result } from "@oksai/domain-core";
import type { ITenantRepository, Tenant } from "../../../domain/index.js";
import { CheckTenantQuotaQuery } from "../check-tenant-quota.query.js";

export interface QuotaCheckResult {
  resource: "organizations" | "members" | "storage";
  limit: number;
  current: number;
  available: number;
  exceeded: boolean;
}

/**
 * CheckTenantQuota 查询处理器
 */
export class CheckTenantQuotaHandler
  implements IQueryHandler<CheckTenantQuotaQuery, Result<QuotaCheckResult, Error>>
{
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(query: CheckTenantQuotaQuery): Promise<Result<QuotaCheckResult, Error>> {
    const tenantResult = await this.tenantRepository.findById(query.tenantId);

    if (tenantResult.isFail()) {
      return Result.fail(tenantResult.error!);
    }

    const tenant = tenantResult.value as Tenant | null;
    if (!tenant) {
      return Result.fail(new Error("租户不存在"));
    }

    const quotaMap = {
      organizations: tenant.quota.maxOrganizations,
      members: tenant.quota.maxMembers,
      storage: tenant.quota.maxStorage,
    };

    const limit = quotaMap[query.resource];
    const available = limit === -1 ? Infinity : limit - query.currentUsage;

    const result: QuotaCheckResult = {
      resource: query.resource,
      limit,
      current: query.currentUsage,
      available: limit === -1 ? -1 : Math.max(0, available),
      exceeded: limit !== -1 && query.currentUsage > limit,
    };

    return Result.ok(result);
  }
}
