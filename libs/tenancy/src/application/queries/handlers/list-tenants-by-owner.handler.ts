import type { IQueryHandler } from "@oksai/cqrs";
import { Result } from "@oksai/domain-core";
import type { ITenantRepository, Tenant } from "../../../domain/index.js";
import { ListTenantsByOwnerQuery } from "../list-tenants-by-owner.query.js";

/**
 * ListTenantsByOwner 查询处理器
 */
export class ListTenantsByOwnerHandler
  implements IQueryHandler<ListTenantsByOwnerQuery, Result<Tenant[], Error>>
{
  constructor(private readonly tenantRepository: ITenantRepository) {}

  async execute(query: ListTenantsByOwnerQuery): Promise<Result<Tenant[], Error>> {
    return this.tenantRepository.findByOwnerId(query.ownerId);
  }
}
